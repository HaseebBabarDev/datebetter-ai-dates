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
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-1.5 rounded-full bg-primary/20">
          <Gift className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Refer a friend</p>
          <p className="text-xs text-muted-foreground">Get 1 month free when they upgrade</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          size="sm"
          variant="secondary"
          className="h-8 px-3 text-xs gap-1.5"
          onClick={handleCopy}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={handleShare}
        >
          <Share2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
