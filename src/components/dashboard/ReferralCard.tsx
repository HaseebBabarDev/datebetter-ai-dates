import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Gift, Copy, Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function ReferralCard() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Generate a simple referral code based on user id
  const referralCode = user?.id ? `DEVI-${user.id.slice(0, 6).toUpperCase()}` : "DEVI-FRIEND";
  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Date Better with D.E.V.I.",
          text: "I'm using D.E.V.I. to date smarter. Sign up for a paid plan and we both get 1 month free!",
          url: referralLink,
        });
      } catch (err) {
        // User cancelled or share failed
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
      <div className="flex items-center gap-2 min-w-0">
        <Gift className="w-4 h-4 text-muted-foreground shrink-0" />
        <p className="text-xs text-muted-foreground truncate">
          Refer a friend, get 1 month free
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={handleCopy}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={handleShare}
        >
          <Share2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
