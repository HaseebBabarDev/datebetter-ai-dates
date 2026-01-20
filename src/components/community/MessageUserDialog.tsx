import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

interface MessageUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientScreenName: string;
}

export function MessageUserDialog({
  open,
  onOpenChange,
  recipientId,
  recipientScreenName,
}: MessageUserDialogProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!user) {
      toast.error("Session expired — please sign in again");
      return;
    }

    if (!recipientId) {
      toast.error("Missing recipient — please try again");
      return;
    }

    if (!message.trim()) return;

    setSending(true);
    try {
      // Check if blocked
      const { data: blockData } = await supabase
        .from("user_blocks")
        .select("id")
        .or(
          `and(blocker_id.eq.${user.id},blocked_id.eq.${recipientId}),and(blocker_id.eq.${recipientId},blocked_id.eq.${user.id})`
        )
        .limit(1);

      if (blockData && blockData.length > 0) {
        toast.error("Cannot send message to this user");
        return;
      }

      const { error } = await supabase.from("direct_messages").insert({
        sender_id: user.id,
        recipient_id: recipientId,
        content: message.trim(),
      });

      if (error) throw error;

      toast.success("Message sent!");
      setMessage("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Message @{recipientScreenName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message..."
            rows={4}
            maxLength={500}
          />

          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {message.length}/500
            </span>
            <Button
              onClick={handleSend}
              disabled={!user || !recipientId || !message.trim() || sending}
              className="gap-2"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}