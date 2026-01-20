import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, MoreVertical, Ban } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  participant_id: string;
  participant_screen_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface DirectMessagesProps {
  currentScreenName: string;
  onUnreadCountChange: (count: number) => void;
}

export function DirectMessages({ currentScreenName, onUnreadCountChange }: DirectMessagesProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`direct-messages-realtime-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;

          // If the thread is open, append immediately for snappy UX
          if (selectedConversation?.participant_id === newMsg.sender_id) {
            setMessages((prev) => [...prev, newMsg]);
            markMessagesAsRead(newMsg.sender_id);
          }

          // Always refresh conversation list + badges
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, selectedConversation?.participant_id]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.participant_id);
      markMessagesAsRead(selectedConversation.participant_id);
    }
  }, [selectedConversation?.participant_id]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Get all messages involving this user
      const { data: messagesData, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!messagesData || messagesData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Group by conversation partner
      const conversationMap = new Map<string, {
        participant_id: string;
        last_message: string;
        last_message_at: string;
        unread_count: number;
      }>();

      messagesData.forEach((msg) => {
        const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            participant_id: partnerId,
            last_message: msg.content,
            last_message_at: msg.created_at,
            unread_count: 0,
          });
        }

        // Count unread
        if (msg.recipient_id === user.id && !msg.is_read) {
          const conv = conversationMap.get(partnerId)!;
          conv.unread_count++;
        }
      });

      // Get screen names
      const participantIds = Array.from(conversationMap.keys());
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, screen_name")
        .in("user_id", participantIds);

      const screenNameMap = new Map(
        profilesData?.map((p) => [p.user_id, p.screen_name]) || []
      );

      const conversationsList: Conversation[] = Array.from(conversationMap.entries()).map(
        ([id, conv]) => ({
          id,
          participant_id: conv.participant_id,
          participant_screen_name: screenNameMap.get(conv.participant_id) || "anonymous",
          last_message: conv.last_message,
          last_message_at: conv.last_message_at,
          unread_count: conv.unread_count,
        })
      );

      // Sort by most recent
      conversationsList.sort(
        (a, b) =>
          new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );

      setConversations(conversationsList);

      // Update total unread count
      const totalUnread = conversationsList.reduce((sum, c) => sum + c.unread_count, 0);
      onUnreadCountChange(totalUnread);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (partnerId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const markMessagesAsRead = async (partnerId: string) => {
    if (!user) return;

    try {
      await supabase
        .from("direct_messages")
        .update({ is_read: true })
        .eq("sender_id", partnerId)
        .eq("recipient_id", user.id)
        .eq("is_read", false);

      // Update conversation unread count
      setConversations((prev) =>
        prev.map((c) =>
          c.participant_id === partnerId ? { ...c, unread_count: 0 } : c
        )
      );

      // Recalculate total
      const newTotal = conversations.reduce(
        (sum, c) => sum + (c.participant_id === partnerId ? 0 : c.unread_count),
        0
      );
      onUnreadCountChange(newTotal);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const sendMessage = async () => {
    if (!user) {
      toast.error("Session expired — please sign in again");
      return;
    }

    if (!selectedConversation || !newMessage.trim()) return;

    setSending(true);

    try {
      // Check if blocked
      const { data: blockData } = await supabase
        .from("user_blocks")
        .select("id")
        .or(
          `and(blocker_id.eq.${user.id},blocked_id.eq.${selectedConversation.participant_id}),and(blocker_id.eq.${selectedConversation.participant_id},blocked_id.eq.${user.id})`
        )
        .limit(1);

      if (blockData && blockData.length > 0) {
        toast.error("Cannot send message to this user");
        return;
      }

      const { data, error } = await supabase
        .from("direct_messages")
        .insert({
          sender_id: user.id,
          recipient_id: selectedConversation.participant_id,
          content: newMessage.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) => [...prev, data]);
      setNewMessage("");

      // Update conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.participant_id === selectedConversation.participant_id
            ? { ...c, last_message: data.content, last_message_at: data.created_at }
            : c
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const blockUser = async (participantId: string) => {
    if (!user) return;

    try {
      await supabase.from("user_blocks").insert({
        blocker_id: user.id,
        blocked_id: participantId,
      });

      toast.success("User blocked");
      setSelectedConversation(null);
      fetchConversations();
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error("Failed to block user");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-3 w-40 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Conversation thread view
  if (selectedConversation) {
    return (
      <div className="flex flex-col h-[calc(100vh-200px)]">
        {/* Thread Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedConversation(null)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="font-medium">
              @{selectedConversation.participant_screen_name}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => blockUser(selectedConversation.participant_id)}
                className="text-destructive"
              >
                <Ban className="h-4 w-4 mr-2" />
                Block user
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 py-4">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.sender_id === user?.id ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2",
                    msg.sender_id === user?.id
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  )}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-[10px] opacity-70 mt-1">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="flex items-center gap-2 pt-4 border-t border-border">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Conversations list
  if (conversations.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground">
            No messages yet. Start a conversation from someone's post!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((conv) => (
        <Card
          key={conv.id}
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setSelectedConversation(conv)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
              {conv.participant_screen_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">
                  @{conv.participant_screen_name}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {conv.last_message}
              </p>
            </div>
            {conv.unread_count > 0 && (
              <Badge variant="default" className="shrink-0">
                {conv.unread_count}
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}