import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Send, 
  Loader2, 
  MessageSquare, 
  Search,
  RefreshCw,
  Trash2,
  Mail,
  MailOpen,
  Users
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminMessage {
  id: string;
  user_id: string;
  sender_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  recipient_name?: string;
  recipient_email?: string;
}

interface UserOption {
  user_id: string;
  name: string | null;
  email: string | null;
}

export function AdminMessaging() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // New message form
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [sendToAll, setSendToAll] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch recipient names
      const userIds = [...new Set(data?.map(m => m.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

      setMessages(data?.map(m => ({
        ...m,
        recipient_name: profileMap.get(m.user_id) || "Unknown"
      })) || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
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
            setUsers(result.users?.map((u: { user_id: string; name: string | null; email: string | null }) => ({
              user_id: u.user_id,
              name: u.name,
              email: u.email
            })) || []);
            return;
          }
        } catch (e) {
          console.error("Edge function failed:", e);
        }
      }

      // Fallback to profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .order("created_at", { ascending: false });

      setUsers(profiles?.map(p => ({ ...p, email: null })) || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageTitle.trim() || !messageContent.trim()) {
      toast.error("Please enter a title and message");
      return;
    }

    if (!sendToAll && !selectedUserId) {
      toast.error("Please select a recipient or send to all");
      return;
    }

    setSending(true);
    try {
      if (sendToAll) {
        // Send to all users
        const messagesToInsert = users.map(u => ({
          user_id: u.user_id,
          sender_id: user!.id,
          title: messageTitle.trim(),
          message: messageContent.trim(),
        }));

        const { error } = await supabase
          .from("admin_messages")
          .insert(messagesToInsert);

        if (error) throw error;
        toast.success(`Message sent to ${users.length} users`);
      } else {
        // Send to single user
        const { error } = await supabase
          .from("admin_messages")
          .insert({
            user_id: selectedUserId,
            sender_id: user!.id,
            title: messageTitle.trim(),
            message: messageContent.trim(),
          });

        if (error) throw error;
        toast.success("Message sent successfully");
      }

      // Reset form
      setMessageTitle("");
      setMessageContent("");
      setSelectedUserId("");
      setSendToAll(false);
      setDialogOpen(false);
      fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Delete this message?")) return;

    try {
      const { error } = await supabase
        .from("admin_messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;
      toast.success("Message deleted");
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  const filteredMessages = messages.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            In-App Messaging
          </h2>
          <p className="text-muted-foreground">{messages.length} messages sent</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchMessages} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send className="w-4 h-4 mr-2" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Send In-App Message</DialogTitle>
                <DialogDescription>
                  This message will appear on the user's dashboard.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recipient</label>
                  <div className="flex items-center gap-2">
                    <Select 
                      value={selectedUserId} 
                      onValueChange={setSelectedUserId}
                      disabled={sendToAll}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a user..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(u => (
                          <SelectItem key={u.user_id} value={u.user_id}>
                            {u.name || u.email || u.user_id.slice(0, 8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant={sendToAll ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSendToAll(!sendToAll);
                        if (!sendToAll) setSelectedUserId("");
                      }}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      All
                    </Button>
                  </div>
                  {sendToAll && (
                    <p className="text-xs text-muted-foreground">
                      Will send to {users.length} users
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Message title..."
                    value={messageTitle}
                    onChange={(e) => setMessageTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Your message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={sending}
                  className="w-full"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {sendToAll ? `Send to All (${users.length})` : "Send Message"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-sm text-muted-foreground">No messages sent yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredMessages.map((msg) => (
                <div 
                  key={msg.id}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        msg.is_read ? 'bg-muted' : 'bg-primary/10'
                      }`}>
                        {msg.is_read ? (
                          <MailOpen className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <Mail className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">{msg.title}</p>
                          {!msg.is_read && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                              Unread
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{msg.message}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>To: {msg.recipient_name}</span>
                          <span>•</span>
                          <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
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
