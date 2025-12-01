import React, { useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Candidate = Tables<"candidates">;

interface FlagsSectionProps {
  candidate: Candidate;
  onUpdate: (updates: Partial<Candidate>) => Promise<void>;
}

export const FlagsSection: React.FC<FlagsSectionProps> = ({
  candidate,
  onUpdate,
}) => {
  const [analyzing, setAnalyzing] = useState(false);

  const redFlags = (candidate.red_flags as string[]) || [];
  const greenFlags = (candidate.green_flags as string[]) || [];

  const detectFlags = async () => {
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
      {/* D.E.V.I. Analyze Button */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium text-sm">D.E.V.I. Flag Detection</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Analyzes interactions to detect behavioral patterns
              </p>
            </div>
            <Button
              onClick={detectFlags}
              disabled={analyzing}
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
