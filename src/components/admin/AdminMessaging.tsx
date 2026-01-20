import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Users,
  Reply,
  ChevronDown,
  ChevronUp,
  User,
  Shield
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
import { format } from "date-fns";

interface AdminMessage {
  id: string;
  user_id: string;
  sender_id: string;
  sender_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  reply_to: string | null;
  recipient_name?: string;
  recipient_email?: string;
  replies?: AdminMessage[];
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
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<AdminMessage | null>(null);
  const [replyContent, setReplyContent] = useState("");
  
  // New message form
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [sendToAll, setSendToAll] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  
  // Filter users for dropdown
  const filteredDropdownUsers = users.filter(u => {
    if (!userSearchQuery.trim()) return true;
    const query = userSearchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.user_id.toLowerCase().includes(query)
    );
  });

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
        .limit(200);

      if (error) throw error;

      // Fetch recipient names
      const userIds = [...new Set(data?.map(m => m.user_id) || [])];
      const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
      const allIds = [...new Set([...userIds, ...senderIds])];
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", allIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

      // Organize messages into threads (parent messages and their replies)
      const messagesWithNames = data?.map(m => ({
        ...m,
        recipient_name: profileMap.get(m.user_id) || "Unknown",
        sender_name: profileMap.get(m.sender_id) || "Admin"
      })) || [];

      // Group replies under parent messages
      const parentMessages: AdminMessage[] = [];
      const repliesMap = new Map<string, AdminMessage[]>();

      messagesWithNames.forEach(msg => {
        if (msg.reply_to) {
          const existing = repliesMap.get(msg.reply_to) || [];
          existing.push(msg);
          repliesMap.set(msg.reply_to, existing);
        } else {
          parentMessages.push(msg);
        }
      });

      // Attach replies to parent messages
      parentMessages.forEach(parent => {
        parent.replies = repliesMap.get(parent.id) || [];
        // Sort replies by date
        parent.replies.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      setMessages(parentMessages);
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
          sender_type: 'admin',
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
            sender_type: 'admin',
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

  const handleSendReply = async (parentMessage: AdminMessage) => {
    if (!replyContent.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from("admin_messages")
        .insert({
          user_id: parentMessage.user_id,
          sender_id: user!.id,
          sender_type: 'admin',
          title: `Re: ${parentMessage.title}`,
          message: replyContent.trim(),
          reply_to: parentMessage.id,
        });

      if (error) throw error;
      
      toast.success("Reply sent");
      setReplyContent("");
      setReplyingTo(null);
      fetchMessages();
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Delete this message and all its replies?")) return;

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

  const toggleThread = (messageId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const filteredMessages = messages.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUnreadCount = (msg: AdminMessage) => {
    let count = msg.is_read ? 0 : 1;
    msg.replies?.forEach(r => {
      if (!r.is_read) count++;
    });
    return count;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            In-App Messaging
          </h2>
          <p className="text-muted-foreground">{messages.length} conversations</p>
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
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Search users..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        disabled={sendToAll}
                        className="h-9"
                      />
                      <Select 
                        value={selectedUserId} 
                        onValueChange={setSelectedUserId}
                        disabled={sendToAll}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select a user (${filteredDropdownUsers.length} results)...`} />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {filteredDropdownUsers.length === 0 ? (
                            <div className="py-2 px-3 text-sm text-muted-foreground">
                              No users found
                            </div>
                          ) : (
                            filteredDropdownUsers.map(u => (
                              <SelectItem key={u.user_id} value={u.user_id}>
                                <div className="flex flex-col">
                                  <span>{u.name || "Unnamed User"}</span>
                                  {u.email && <span className="text-xs text-muted-foreground">{u.email}</span>}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
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
              {filteredMessages.map((msg) => {
                const isExpanded = expandedThreads.has(msg.id);
                const hasReplies = (msg.replies?.length || 0) > 0;
                const unreadCount = getUnreadCount(msg);
                
                return (
                  <div key={msg.id} className="transition-colors">
                    {/* Main message */}
                    <div 
                      className={`p-4 hover:bg-muted/50 ${hasReplies ? 'cursor-pointer' : ''}`}
                      onClick={() => hasReplies && toggleThread(msg.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            unreadCount > 0 ? 'bg-primary/10' : 'bg-muted'
                          }`}>
                            {unreadCount > 0 ? (
                              <Mail className="w-5 h-5 text-primary" />
                            ) : (
                              <MailOpen className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-medium text-sm truncate">{msg.title}</p>
                              {unreadCount > 0 && (
                                <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                                  {unreadCount} unread
                                </Badge>
                              )}
                              {hasReplies && (
                                <Badge variant="outline" className="text-xs">
                                  {msg.replies?.length} {msg.replies?.length === 1 ? 'reply' : 'replies'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mb-1">{msg.message}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                To: {msg.recipient_name}
                              </span>
                              <span>•</span>
                              <span>{format(new Date(msg.created_at), "MMM d, h:mm a")}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {hasReplies && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-muted-foreground"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyingTo(replyingTo?.id === msg.id ? null : msg);
                              setReplyContent("");
                            }}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Reply className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMessage(msg.id);
                            }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Reply input */}
                    {replyingTo?.id === msg.id && (
                      <div className="px-4 pb-4 bg-muted/30">
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Type your reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            rows={2}
                            className="flex-1"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendReply(msg);
                            }}
                            disabled={sending || !replyContent.trim()}
                            size="sm"
                          >
                            {sending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Thread replies */}
                    {isExpanded && hasReplies && (
                      <div className="pl-12 pr-4 pb-4 space-y-3 bg-muted/20">
                        {msg.replies?.map((reply) => (
                          <div 
                            key={reply.id}
                            className={`p-3 rounded-lg ${
                              reply.sender_type === 'user' 
                                ? 'bg-blue-500/10 border border-blue-500/20' 
                                : 'bg-card border border-border'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                reply.sender_type === 'user' ? 'bg-blue-500/20' : 'bg-primary/20'
                              }`}>
                                {reply.sender_type === 'user' ? (
                                  <User className="w-3 h-3 text-blue-600" />
                                ) : (
                                  <Shield className="w-3 h-3 text-primary" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-medium ${
                                    reply.sender_type === 'user' ? 'text-blue-600' : 'text-primary'
                                  }`}>
                                    {reply.sender_type === 'user' ? msg.recipient_name : 'Admin'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(reply.created_at), "MMM d, h:mm a")}
                                  </span>
                                  {!reply.is_read && (
                                    <span className="w-2 h-2 rounded-full bg-primary" />
                                  )}
                                </div>
                                <p className="text-sm text-foreground">{reply.message}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}