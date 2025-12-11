import React from "react";
import { Share2, Copy, MessageCircle, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ShareSheetProps {
  title?: string;
  text?: string;
  url?: string;
  children?: React.ReactNode;
}

export function ShareSheet({ 
  title = "Check out dateBetter!", 
  text = "I'm using dateBetter to make smarter dating decisions. You should try it!", 
  url = window.location.origin,
  children 
}: ShareSheetProps) {
  const [copied, setCopied] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        setOpen(false);
      } catch (error) {
        // User cancelled or error
        if ((error as Error).name !== "AbortError") {
          console.error("Share failed:", error);
        }
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleSMS = () => {
    const smsBody = encodeURIComponent(`${text}\n\n${url}`);
    window.location.href = `sms:?body=${smsBody}`;
    setOpen(false);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${text}\n\n${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setOpen(false);
  };

  // Use native share on supported devices
  const hasNativeShare = typeof navigator.share === "function";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share dateBetter</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {hasNativeShare && (
            <Button 
              onClick={handleNativeShare} 
              className="w-full justify-start gap-3 h-12"
              variant="outline"
            >
              <Share2 className="w-5 h-5 text-primary" />
              <span>Share via...</span>
            </Button>
          )}
          
          <Button 
            onClick={handleCopyLink} 
            className="w-full justify-start gap-3 h-12"
            variant="outline"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <Copy className="w-5 h-5 text-primary" />
            )}
            <span>{copied ? "Copied!" : "Copy Link"}</span>
          </Button>

          <Button 
            onClick={handleSMS} 
            className="w-full justify-start gap-3 h-12"
            variant="outline"
          >
            <MessageCircle className="w-5 h-5 text-primary" />
            <span>Send via Text</span>
          </Button>

          <Button 
            onClick={handleEmail} 
            className="w-full justify-start gap-3 h-12"
            variant="outline"
          >
            <Mail className="w-5 h-5 text-primary" />
            <span>Send via Email</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
