import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Shield, 
  Key, 
  Loader2, 
  Users, 
  UserPlus,
  Trash2,
  Calendar,
  MessageSquareOff,
  Search,
  RefreshCw,
  Heart,
  MessageSquare,
  Brain,
  Activity,
  FlaskConical,
  UserCheck,
  MapPin
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTesterFilter } from "@/hooks/useTesterFilter";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserUsage {
  candidates: number;
  interactions: number;
  ai_conversations: number;
  ai_messages: number;
  last_ai_message: string | null;
}

interface LoginLocation {
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
}

interface UserProfile {
  user_id: string;
  name: string | null;
  email: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
  last_login_location?: LoginLocation;
  isAdmin: boolean;
  testerType: 'internal' | 'external';
  usage?: UserUsage;
  subscription?: {
    plan: string;
    trial_ends_at: string | null;
  };
}

export function AdminUserManagement() {
  const { user } = useAuth();
  const { filter: testerFilter, setFilter: setTesterFilter } = useTesterFilter();
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);
  const [togglingRole, setTogglingRole] = useState<string | null>(null);
  const [togglingTesterType, setTogglingTesterType] = useState<string | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [managingSubscription, setManagingSubscription] = useState<string | null>(null);
  const [removingFromCommunity, setRemovingFromCommunity] = useState<string | null>(null);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    let filtered = [...allUsers];
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.user_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply tester type filter
    if (testerFilter !== 'all') {
      filtered = filtered.filter(u => u.testerType === testerFilter);
    }
    
    setFilteredUsers(filtered);
  }, [searchQuery, allUsers, testerFilter]);

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      // Use edge function to get users with emails and usage data
      const { data: { session } } = await supabase.auth.getSession();
      
        let usersFromApi: Array<{
        user_id: string;
        name: string | null;
        email: string | null;
        created_at: string;
        last_sign_in_at?: string | null;
        last_login_location?: LoginLocation;
        usage?: UserUsage;
      }> = [];
      
      if (session) {
        // Try to get users with emails via edge function
        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-list-users`,
            {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${session.access_token}`,
              },
            }
          );
          
          if (response.ok) {
            const result = await response.json();
            usersFromApi = result.users || [];
          }
        } catch (e) {
          console.error("Edge function failed, falling back to profiles:", e);
        }
      }
      
      // Fallback to profiles table if edge function fails
      if (usersFromApi.length === 0) {
        const { data: profilesData, error } = await supabase
          .from("profiles")
          .select("user_id, name, created_at")
          .order("created_at", { ascending: false });

        if (error) throw error;
        usersFromApi = profilesData?.map(p => ({ ...p, email: null })) || [];
      }

      // Fetch admin roles for all users
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("role", "admin");

      const adminUserIds = new Set(roles?.map(r => r.user_id) || []);
      
      // Fetch subscriptions
      const { data: subscriptions } = await supabase
        .from("user_subscriptions")
        .select("user_id, plan, trial_ends_at");

      const subscriptionsMap = new Map(subscriptions?.map(s => [s.user_id, s]) || []);
      
      // Fetch tester statuses
      const { data: testerStatuses } = await supabase
        .from("user_tester_status")
        .select("user_id, tester_type");

      const testerStatusMap = new Map(testerStatuses?.map(s => [s.user_id, s.tester_type as 'internal' | 'external']) || []);
      
      const usersWithRoles: UserProfile[] = usersFromApi.map(p => ({
        ...p,
        isAdmin: adminUserIds.has(p.user_id),
        testerType: testerStatusMap.get(p.user_id) || 'external',
        subscription: subscriptionsMap.get(p.user_id)
      }));

      setAllUsers(usersWithRoles);
      setFilteredUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleAdminRole = async (userId: string, currentlyAdmin: boolean) => {
    if (userId === user?.id) {
      toast.error("Cannot modify your own admin role");
      return;
    }

    const action = currentlyAdmin ? "remove" : "add";
    const confirmMessage = currentlyAdmin 
      ? "Are you sure you want to remove admin access from this user?"
      : "Are you sure you want to grant admin access to this user?";

    if (!confirm(confirmMessage)) return;

    setTogglingRole(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user-role`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ targetUserId: userId, action }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update role");
      }

      toast.success(result.message);
      fetchAllUsers();
    } catch (error) {
      console.error("Error toggling admin role:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setTogglingRole(null);
    }
  };

  const handleCreateUser = async () => {
    const email = prompt("Enter user email:");
    if (!email) return;
    
    const password = prompt("Enter password for this user (minimum 6 characters):");
    if (!password) return;
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    const name = prompt("Enter user name (optional):");

    setCreatingUser(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ email, password, name: name || null }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create user");
      }

      toast.success(`User created successfully: ${email}`);
      fetchAllUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt("Enter new password for this user (minimum 6 characters):");
    
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setResettingPassword(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId, newPassword }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password");
      }

      toast.success("Password reset successfully");
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setResettingPassword(null);
    }
  };

  const handleSetTrial = async (userId: string, days: number, plan?: string) => {
    setManagingSubscription(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const body: any = { targetUserId: userId, trialDays: days };
      if (plan) body.plan = plan;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-manage-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to set trial");
      }

      toast.success(result.message);
      fetchAllUsers();
    } catch (error) {
      console.error("Error setting trial:", error);
      toast.error(error instanceof Error ? error.message : "Failed to set trial");
    } finally {
      setManagingSubscription(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === user?.id) {
      toast.error("Cannot delete your own account");
      return;
    }

    const confirmed = confirm(`Are you sure you want to permanently delete ${userName || 'this user'}? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingUser(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ targetUserId: userId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete user");
      }

      toast.success("User deleted successfully");
      fetchAllUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setDeletingUser(null);
    }
  };

  const handleRemoveFromCommunity = async (userId: string, userName: string) => {
    if (userId === user?.id) {
      toast.error("Cannot remove yourself from community");
      return;
    }

    const confirmed = confirm(`Remove ${userName || 'this user'} from community? This will delete all their posts, comments, and messages.`);
    if (!confirmed) return;

    setRemovingFromCommunity(userId);
    try {
      await supabase.from("forum_posts").delete().eq("user_id", userId);
      await supabase.from("forum_comments").delete().eq("user_id", userId);
      await supabase.from("direct_messages").delete().eq("sender_id", userId);
      await supabase.from("profiles").update({ screen_name: null, screen_name_set_at: null }).eq("user_id", userId);

      toast.success(`${userName || 'User'} removed from community`);
    } catch (error) {
      console.error("Error removing from community:", error);
      toast.error("Failed to remove user from community");
    } finally {
      setRemovingFromCommunity(null);
    }
  };

  const handleToggleTesterType = async (userId: string, currentType: 'internal' | 'external') => {
    const newType = currentType === 'internal' ? 'external' : 'internal';
    
    setTogglingTesterType(userId);
    try {
      // Upsert the tester status
      const { error } = await supabase
        .from("user_tester_status")
        .upsert({ 
          user_id: userId, 
          tester_type: newType,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id' 
        });
      
      if (error) throw error;
      
      // Update local state
      setAllUsers(prev => prev.map(u => 
        u.user_id === userId ? { ...u, testerType: newType } : u
      ));
      
      toast.success(`User marked as ${newType} tester`);
    } catch (error) {
      console.error("Error toggling tester type:", error);
      toast.error("Failed to update tester type");
    } finally {
      setTogglingTesterType(null);
    }
  };

  // Count users by tester type
  const internalCount = allUsers.filter(u => u.testerType === 'internal').length;
  const externalCount = allUsers.filter(u => u.testerType === 'external').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">User Management</h2>
            <p className="text-muted-foreground">
              {allUsers.length} total • {internalCount} internal • {externalCount} external
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchAllUsers} disabled={loadingUsers}>
              <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={handleCreateUser} disabled={creatingUser}>
              {creatingUser ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Tester Type Filter */}
        <Tabs value={testerFilter} onValueChange={(v) => setTesterFilter(v as 'all' | 'internal' | 'external')} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all" className="gap-1.5">
              <Users className="w-3.5 h-3.5" />
              All ({allUsers.length})
            </TabsTrigger>
            <TabsTrigger value="internal" className="gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" />
              Internal ({internalCount})
            </TabsTrigger>
            <TabsTrigger value="external" className="gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              External ({externalCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardContent className="p-0">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No users found</p>
          ) : (
            <div className="divide-y">
              {filteredUsers.map((userProfile) => (
                <div 
                  key={userProfile.user_id}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium text-sm">
                          {userProfile.name || "Unnamed User"}
                        </p>
                        {userProfile.testerType === 'internal' && (
                          <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs">
                            <FlaskConical className="w-3 h-3 mr-1" />
                            Internal
                          </Badge>
                        )}
                        {userProfile.isAdmin && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        {userProfile.user_id === user?.id && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                      {userProfile.email && (
                        <p className="text-xs text-muted-foreground">
                          {userProfile.email}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        {userProfile.subscription && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {userProfile.subscription.plan}
                          </Badge>
                        )}
                        {userProfile.subscription?.trial_ends_at && new Date(userProfile.subscription.trial_ends_at) > new Date() && (
                          <Badge variant="secondary" className="bg-accent/10 text-accent-foreground text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {Math.ceil((new Date(userProfile.subscription.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d trial
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
                        <span>Joined: {new Date(userProfile.created_at).toLocaleDateString()}</span>
                        {userProfile.last_sign_in_at && (
                          <span>• Last login: {new Date(userProfile.last_sign_in_at).toLocaleDateString()}</span>
                        )}
                        {userProfile.last_login_location?.city && userProfile.last_login_location?.country && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {userProfile.last_login_location.city}, {userProfile.last_login_location.countryCode || userProfile.last_login_location.country}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Usage Stats */}
                  {userProfile.usage && (
                    <div className="grid grid-cols-4 gap-2 mb-3 p-2 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Heart className="w-3 h-3 text-pink-500" />
                        <span className="font-medium">{userProfile.usage.candidates}</span>
                        <span className="text-muted-foreground">candidates</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Activity className="w-3 h-3 text-cyan-500" />
                        <span className="font-medium">{userProfile.usage.interactions}</span>
                        <span className="text-muted-foreground">interactions</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Brain className="w-3 h-3 text-purple-500" />
                        <span className="font-medium">{userProfile.usage.ai_conversations}</span>
                        <span className="text-muted-foreground">AI chats</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <MessageSquare className="w-3 h-3 text-blue-500" />
                        <span className="font-medium">{userProfile.usage.ai_messages}</span>
                        <span className="text-muted-foreground">AI msgs</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    <Button
                      size="sm"
                      variant={userProfile.testerType === 'internal' ? "secondary" : "outline"}
                      onClick={() => handleToggleTesterType(userProfile.user_id, userProfile.testerType)}
                      disabled={togglingTesterType === userProfile.user_id}
                      className={`h-9 text-xs ${userProfile.testerType === 'internal' ? 'bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-indigo-200' : ''}`}
                    >
                      {togglingTesterType === userProfile.user_id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <FlaskConical className="w-3 h-3 mr-1" />
                          {userProfile.testerType === 'internal' ? "Internal" : "External"}
                        </>
                      )}
                    </Button>
                    
                    <Select
                      disabled={managingSubscription === userProfile.user_id}
                      onValueChange={(value) => handleSetTrial(userProfile.user_id, parseInt(value))}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Trial" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 Days</SelectItem>
                        <SelectItem value="60">60 Days</SelectItem>
                        <SelectItem value="90">90 Days</SelectItem>
                        <SelectItem value="0">Remove</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      size="sm"
                      variant={userProfile.isAdmin ? "destructive" : "default"}
                      onClick={() => handleToggleAdminRole(userProfile.user_id, userProfile.isAdmin)}
                      disabled={togglingRole === userProfile.user_id || userProfile.user_id === user?.id}
                      className="h-9 text-xs"
                    >
                      {togglingRole === userProfile.user_id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Shield className="w-3 h-3 mr-1" />
                          {userProfile.isAdmin ? "Revoke" : "Admin"}
                        </>
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResetPassword(userProfile.user_id)}
                      disabled={resettingPassword === userProfile.user_id}
                      className="h-9 text-xs"
                    >
                      {resettingPassword === userProfile.user_id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Key className="w-3 h-3 mr-1" />
                          Password
                        </>
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveFromCommunity(userProfile.user_id, userProfile.name || "")}
                      disabled={removingFromCommunity === userProfile.user_id || userProfile.user_id === user?.id}
                      className="h-9 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                    >
                      {removingFromCommunity === userProfile.user_id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <MessageSquareOff className="w-3 h-3 mr-1" />
                          Ban
                        </>
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteUser(userProfile.user_id, userProfile.name || "")}
                      disabled={deletingUser === userProfile.user_id || userProfile.user_id === user?.id}
                      className="h-9 text-xs"
                    >
                      {deletingUser === userProfile.user_id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
