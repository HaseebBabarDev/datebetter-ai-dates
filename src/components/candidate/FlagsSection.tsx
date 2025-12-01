import React, { useState, useEffect } from "react";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Sparkles, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Candidate = Tables<"candidates">;

interface FlagsSectionProps {
  candidate: Candidate;
  onUpdate: (updates: Partial<Candidate>) => Promise<void>;
}

export const FlagsSection: React.FC<FlagsSectionProps> = ({
  candidate,
  onUpdate,
}) => {
  const { getRemainingUpdates, incrementUsage, canUseUpdate, refetch } = useSubscription();
  const remainingUpdates = getRemainingUpdates(candidate.id);
  const [hooverCount, setHooverCount] = useState(0);

  useEffect(() => {
    const fetchHooverCount = async () => {
      const { data } = await supabase
        .from("no_contact_progress")
        .select("hoover_attempt")
        .eq("candidate_id", candidate.id)
        .eq("hoover_attempt", true);
      
      setHooverCount(data?.length || 0);
    };
    fetchHooverCount();
  }, [candidate.id]);
  const [analyzing, setAnalyzing] = useState(false);

  const redFlags = (candidate.red_flags as string[]) || [];
  const greenFlags = (candidate.green_flags as string[]) || [];

  const detectFlags = async () => {
    if (!canUseUpdate(candidate.id)) {
      toast.error("No updates remaining for this candidate");
      return;
    }

    setAnalyzing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to analyze flags");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-flags`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ candidateId: candidate.id }),
        }
      );

      if (response.status === 429) {
        toast.error("Rate limit exceeded. Please try again later.");
        return;
      }
      if (response.status === 402) {
        toast.error("D.E.V.I. credits exhausted. Please add funds.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to analyze flags");
      }

      const flags = await response.json();
      
      // Increment usage count
      await incrementUsage(candidate.id);
      await refetch();
      
      // Update local state through parent
      await onUpdate({
        red_flags: flags.red_flags || [],
        green_flags: flags.green_flags || [],
      });

      toast.success("Flags analyzed successfully");
    } catch (error) {
      console.error("Error detecting flags:", error);
      toast.error("Failed to analyze flags");
    } finally {
      setAnalyzing(false);
    }
  };

  const hasNoFlags = redFlags.length === 0 && greenFlags.length === 0;

  return (
    <div className="space-y-4">
      {/* Hoover attempts tracker */}
      {hooverCount > 0 && (
        <Card className="border-amber-500/20 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-400">
                  {hooverCount} Hoover{hooverCount !== 1 ? 's' : ''} Survived
                </p>
                <p className="text-xs text-muted-foreground">
                  Times they tried to contact you during NC
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* D.E.V.I. Analyze Button */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-medium text-sm">D.E.V.I. Flag Detection</p>
                {remainingUpdates > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="secondary" 
                          className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border-primary/20 cursor-help animate-fade-in"
                        >
                          {remainingUpdates} left
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Analyze uses 1 update from your plan</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Analyzes interactions to detect behavioral patterns
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={detectFlags}
                    disabled={analyzing || !canUseUpdate(candidate.id)}
                    size="sm"
                    className="gap-2"
                  >
                    {analyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {analyzing ? "Analyzing..." : "Analyze"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Uses 1 update from your plan</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {hasNoFlags && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              No flags detected yet. Log some interactions and click "Analyze" to auto-detect patterns.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Red Flags */}
      {redFlags.length > 0 && (
        <Card className="border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Red Flags ({redFlags.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {redFlags.map((flag, idx) => (
                <Badge
                  key={idx}
                  variant="destructive"
                >
                  {flag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Green Flags */}
      {greenFlags.length > 0 && (
        <Card className="border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Green Flags ({greenFlags.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {greenFlags.map((flag, idx) => (
                <Badge
                  key={idx}
                  className="bg-green-600"
                >
                  {flag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
