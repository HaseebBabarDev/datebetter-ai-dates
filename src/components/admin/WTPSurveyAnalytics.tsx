import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ClipboardList, DollarSign, Star, MessageSquare, Play, Send, Users } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface SurveyResponse {
  id: string;
  user_id: string;
  candidate_count_at_survey: number;
  preferred_plan: string | null;
  max_monthly_price: number | null;
  most_valued_features: string[] | null;
  feedback: string | null;
  completed_at: string;
  user_name?: string;
}

interface UserForSurvey {
  user_id: string;
  name: string | null;
  email?: string;
  candidate_count: number;
  has_completed_survey: boolean;
}

interface SurveyStats {
  totalResponses: number;
  avgPrice: number;
  planBreakdown: Record<string, number>;
  featureBreakdown: Record<string, number>;
}

const FEATURE_LABELS: Record<string, string> = {
  unlimited_candidates: "Unlimited candidates",
  ai_insights: "AI-powered insights",
  pattern_detection: "Red/green flag detection",
  compatibility: "Compatibility scoring",
  no_contact: "No-contact mode",
  community: "Community access",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  basic: "Basic ($5-10/mo)",
  standard: "Standard ($10-15/mo)",
  premium: "Premium ($15-25/mo)",
};

interface WTPSurveyAnalyticsProps {
  onInitiateSurvey?: () => void;
}

export function WTPSurveyAnalytics({ onInitiateSurvey }: WTPSurveyAnalyticsProps) {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserForSurvey[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [sendingToUsers, setSendingToUsers] = useState(false);
  const [showUserSelector, setShowUserSelector] = useState(false);

  useEffect(() => {
    fetchSurveyData();
  }, []);

  const fetchSurveyData = async () => {
    try {
      const { data, error } = await supabase
        .from("willingness_to_pay_surveys")
        .select("*")
        .order("completed_at", { ascending: false });

      if (error) throw error;

      // Get user names
      const userIds = new Set(data?.map((r) => r.user_id) || []);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", Array.from(userIds));

      const profilesMap = new Map(profiles?.map((p) => [p.user_id, p.name]) || []);

      const enrichedResponses = data?.map((r) => ({
        ...r,
        user_name: profilesMap.get(r.user_id) || "Unknown",
      })) || [];

      setResponses(enrichedResponses);

      // Calculate stats
      if (data && data.length > 0) {
        const pricesWithValues = data.filter((r) => r.max_monthly_price !== null);
        const avgPrice = pricesWithValues.length > 0
          ? pricesWithValues.reduce((sum, r) => sum + (r.max_monthly_price || 0), 0) / pricesWithValues.length
          : 0;

        const planBreakdown: Record<string, number> = {};
        const featureBreakdown: Record<string, number> = {};

        data.forEach((r) => {
          if (r.preferred_plan) {
            planBreakdown[r.preferred_plan] = (planBreakdown[r.preferred_plan] || 0) + 1;
          }
          if (r.most_valued_features) {
            r.most_valued_features.forEach((f: string) => {
              featureBreakdown[f] = (featureBreakdown[f] || 0) + 1;
            });
          }
        });

        setStats({
          totalResponses: data.length,
          avgPrice,
          planBreakdown,
          featureBreakdown,
        });
      }
    } catch (error) {
      console.error("Error fetching survey data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersForSurvey = async () => {
    try {
      // Get all profiles with candidate counts
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, name");

      if (profilesError) throw profilesError;

      // Get candidate counts per user
      const { data: candidates, error: candidatesError } = await supabase
        .from("candidates")
        .select("user_id");

      if (candidatesError) throw candidatesError;

      // Get completed surveys
      const { data: completedSurveys, error: surveysError } = await supabase
        .from("willingness_to_pay_surveys")
        .select("user_id");

      if (surveysError) throw surveysError;

      // Get pending survey requests
      const { data: pendingRequests, error: requestsError } = await supabase
        .from("survey_requests")
        .select("user_id")
        .eq("status", "pending");

      if (requestsError) throw requestsError;

      const completedSet = new Set(completedSurveys?.map(s => s.user_id) || []);
      const pendingSet = new Set(pendingRequests?.map(r => r.user_id) || []);
      
      // Count candidates per user
      const candidateCounts: Record<string, number> = {};
      candidates?.forEach(c => {
        candidateCounts[c.user_id] = (candidateCounts[c.user_id] || 0) + 1;
      });

      const usersData: UserForSurvey[] = (profiles || [])
        .map(p => ({
          user_id: p.user_id,
          name: p.name,
          candidate_count: candidateCounts[p.user_id] || 0,
          has_completed_survey: completedSet.has(p.user_id) || pendingSet.has(p.user_id),
        }))
        .sort((a, b) => b.candidate_count - a.candidate_count);

      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    }
  };

  const handleToggleUserSelector = () => {
    if (!showUserSelector) {
      fetchUsersForSurvey();
    }
    setShowUserSelector(!showUserSelector);
    setSelectedUsers(new Set());
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const eligibleUsers = users.filter(u => !u.has_completed_survey).map(u => u.user_id);
      setSelectedUsers(new Set(eligibleUsers));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSendSurvey = async () => {
    if (selectedUsers.size === 0) {
      toast.error("Please select at least one user");
      return;
    }

    setSendingToUsers(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const requests = Array.from(selectedUsers).map(userId => ({
        user_id: userId,
        requested_by: user.id,
        survey_type: "wtp",
        status: "pending",
      }));

      const { error } = await supabase
        .from("survey_requests")
        .insert(requests);

      if (error) throw error;

      toast.success(`Survey sent to ${selectedUsers.size} user(s)`);
      setSelectedUsers(new Set());
      setShowUserSelector(false);
      fetchUsersForSurvey();
    } catch (error) {
      console.error("Error sending surveys:", error);
      toast.error("Failed to send surveys");
    } finally {
      setSendingToUsers(false);
    }
  };

  const handleSendToAll = async () => {
    const eligibleUsers = users.filter(u => !u.has_completed_survey);
    if (eligibleUsers.length === 0) {
      toast.error("No eligible users to send survey to");
      return;
    }

    setSendingToUsers(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const requests = eligibleUsers.map(u => ({
        user_id: u.user_id,
        requested_by: user.id,
        survey_type: "wtp",
        status: "pending",
      }));

      const { error } = await supabase
        .from("survey_requests")
        .insert(requests);

      if (error) throw error;

      toast.success(`Survey sent to all ${eligibleUsers.length} eligible user(s)`);
      setShowUserSelector(false);
      fetchUsersForSurvey();
    } catch (error) {
      console.error("Error sending surveys:", error);
      toast.error("Failed to send surveys");
    } finally {
      setSendingToUsers(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const eligibleCount = users.filter(u => !u.has_completed_survey).length;

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 justify-end">
        {onInitiateSurvey && (
          <Button onClick={onInitiateSurvey} variant="outline" className="gap-2">
            <Play className="w-4 h-4" />
            Test Survey
          </Button>
        )}
        <Button onClick={handleToggleUserSelector} variant={showUserSelector ? "secondary" : "default"} className="gap-2">
          <Users className="w-4 h-4" />
          {showUserSelector ? "Hide User Selector" : "Send Survey to Users"}
        </Button>
      </div>

      {/* User Selector Panel */}
      {showUserSelector && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="w-5 h-5" />
                Send Survey to Users
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSendToAll()}
                  disabled={sendingToUsers || eligibleCount === 0}
                >
                  Send to All ({eligibleCount})
                </Button>
                <Button
                  size="sm"
                  onClick={handleSendSurvey}
                  disabled={sendingToUsers || selectedUsers.size === 0}
                  className="gap-2"
                >
                  {sendingToUsers && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send to Selected ({selectedUsers.size})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              <div className="flex items-center gap-3 p-2 border-b sticky top-0 bg-card">
                <Checkbox
                  checked={eligibleCount > 0 && selectedUsers.size === eligibleCount}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">Select All Eligible</span>
              </div>
              {users.map((user) => (
                <div
                  key={user.user_id}
                  className={`flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 ${
                    user.has_completed_survey ? "opacity-50" : ""
                  }`}
                >
                  <Checkbox
                    checked={selectedUsers.has(user.user_id)}
                    onCheckedChange={(checked) => handleSelectUser(user.user_id, checked as boolean)}
                    disabled={user.has_completed_survey}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name || "Unnamed User"}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.candidate_count} candidates
                    </p>
                  </div>
                  {user.has_completed_survey && (
                    <Badge variant="secondary" className="text-xs">
                      Already sent/completed
                    </Badge>
                  )}
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Loading users...</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Total Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{stats?.totalResponses || 0}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Avg. Max Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">
              ${stats?.avgPrice.toFixed(2) || "0.00"}
            </span>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="w-4 h-4" />
              Top Valued Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats && Object.entries(stats.featureBreakdown)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([feature, count]) => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {FEATURE_LABELS[feature] || feature} ({count})
                  </Badge>
                ))}
              {(!stats || Object.keys(stats.featureBreakdown).length === 0) && (
                <span className="text-sm text-muted-foreground">No data yet</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Preference Breakdown */}
      {stats && Object.keys(stats.planBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plan Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.planBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([plan, count]) => {
                  const percentage = Math.round((count / stats.totalResponses) * 100);
                  return (
                    <div key={plan} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{PLAN_LABELS[plan] || plan}</span>
                        <span className="text-muted-foreground">{count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Responses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            All Survey Responses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No survey responses yet</p>
          ) : (
            <div className="space-y-4">
              {responses.map((response) => (
                <div
                  key={response.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-medium text-sm">{response.user_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(response.completed_at), "MMM d, yyyy h:mm a")}
                        {" • "}
                        {response.candidate_count_at_survey} candidates at time of survey
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {response.preferred_plan && (
                        <Badge variant="secondary" className="text-xs">
                          {PLAN_LABELS[response.preferred_plan] || response.preferred_plan}
                        </Badge>
                      )}
                      {response.max_monthly_price !== null && (
                        <Badge variant="outline" className="text-xs">
                          ${response.max_monthly_price}/mo
                        </Badge>
                      )}
                    </div>
                  </div>

                  {response.most_valued_features && response.most_valued_features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {response.most_valued_features.map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-xs bg-primary/10 text-primary">
                          {FEATURE_LABELS[feature] || feature}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {response.feedback && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      "{response.feedback}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
