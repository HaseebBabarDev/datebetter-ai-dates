import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="border-accent/30 bg-accent/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-accent/20">
            <Gift className="w-5 h-5 text-accent-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">Refer a Friend</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Get 1 month free when they sign up for a paid plan
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5 text-xs"
                onClick={handleCopy}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={handleShare}
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
