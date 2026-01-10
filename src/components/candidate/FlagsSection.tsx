import React, { useState, useEffect } from "react";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertTriangle, CheckCircle, Sparkles, Loader2, Phone, ThumbsUp, ThumbsDown, Plus, X } from "lucide-react";
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
  const [contactAttemptCount, setContactAttemptCount] = useState(0);

  useEffect(() => {
    const fetchContactAttemptCount = async () => {
      const { data } = await supabase
        .from("no_contact_progress")
        .select("hoover_attempt")
        .eq("candidate_id", candidate.id)
        .eq("hoover_attempt", true);
      
      setContactAttemptCount(data?.length || 0);
    };
    fetchContactAttemptCount();
  }, [candidate.id]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingProsCons, setAnalyzingProsCons] = useState(false);
  const redFlags = (candidate.red_flags as string[]) || [];
  const greenFlags = (candidate.green_flags as string[]) || [];
  const pros = (candidate.pros as string[]) || [];
  const cons = (candidate.cons as string[]) || [];
  
  const [newPro, setNewPro] = useState("");
  const [newCon, setNewCon] = useState("");
  const [addingPro, setAddingPro] = useState(false);
  const [addingCon, setAddingCon] = useState(false);

  const handleAddPro = async () => {
    if (!newPro.trim()) return;
    const updatedPros = [...pros, newPro.trim()];
    await onUpdate({ pros: updatedPros });
    setNewPro("");
    setAddingPro(false);
    toast.success("Pro added");
  };

  const handleAddCon = async () => {
    if (!newCon.trim()) return;
    const updatedCons = [...cons, newCon.trim()];
    await onUpdate({ cons: updatedCons });
    setNewCon("");
    setAddingCon(false);
    toast.success("Con added");
  };

  const handleRemovePro = async (index: number) => {
    const updatedPros = pros.filter((_, i) => i !== index);
    await onUpdate({ pros: updatedPros });
    toast.success("Pro removed");
  };

  const handleRemoveCon = async (index: number) => {
    const updatedCons = cons.filter((_, i) => i !== index);
    await onUpdate({ cons: updatedCons });
    toast.success("Con removed");
  };

  const detectProsCons = async () => {
    if (!canUseUpdate(candidate.id)) {
      toast.error("No updates remaining for this candidate");
      return;
    }

    setAnalyzingProsCons(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to analyze pros/cons");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-pros-cons`,
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
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400 && errorData.error) {
          toast.error(errorData.error);
          return;
        }
        throw new Error("Failed to analyze pros/cons");
      }

      const result = await response.json();
      
      // Increment usage count
      await incrementUsage(candidate.id);
      await refetch();
      
      // Update local state through parent
      await onUpdate({
        pros: result.pros || [],
        cons: result.cons || [],
      });

      toast.success("Pros & cons analyzed successfully");
    } catch (error) {
      console.error("Error detecting pros/cons:", error);
      toast.error("Failed to analyze pros/cons");
    } finally {
      setAnalyzingProsCons(false);
    }
  };

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
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400 && errorData.error) {
          toast.error(errorData.error);
          return;
        }
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
      {/* Contact attempts rejected tracker */}
      {contactAttemptCount > 0 && (
        <Card className="border-amber-500/20 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-400">
                  {contactAttemptCount} Contact Attempt{contactAttemptCount !== 1 ? 's' : ''} Rejected
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
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">D.E.V.I. Flag Detection</p>
                {remainingUpdates > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="secondary" 
                          className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border-primary/20 cursor-help shrink-0"
                        >
                          {remainingUpdates} Updates Left
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Analyze uses 1 update from your plan</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
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
                    className="gap-2 shrink-0"
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

      {/* D.E.V.I. Pros/Cons Analysis */}
      <Card className="border-purple-500/20 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">D.E.V.I. Pros & Cons</p>
                {remainingUpdates > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="secondary" 
                          className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 cursor-help shrink-0"
                        >
                          {remainingUpdates} Updates Left
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Analyze uses 1 update from your plan</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                AI-generates pros & cons from interactions and D.E.V.I. chats
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={detectProsCons}
                    disabled={analyzingProsCons || !canUseUpdate(candidate.id)}
                    size="sm"
                    className="gap-2 shrink-0 bg-purple-600 hover:bg-purple-700"
                  >
                    {analyzingProsCons ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {analyzingProsCons ? "Analyzing..." : "Generate"}
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

      {/* Pros */}
      <Card className="border-blue-500/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-600">
              <ThumbsUp className="w-5 h-5" />
              Pros ({pros.length})
            </CardTitle>
            {!addingPro && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAddingPro(true)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {addingPro && (
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Enter a pro..."
                value={newPro}
                onChange={(e) => setNewPro(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddPro()}
                className="flex-1"
                autoFocus
              />
              <Button size="sm" onClick={handleAddPro} className="bg-blue-600 hover:bg-blue-700">
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setAddingPro(false); setNewPro(""); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          {pros.length === 0 && !addingPro ? (
            <p className="text-muted-foreground text-sm text-center py-2">
              No pros added yet. Click "Add" to list positives about this person.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {pros.map((pro, idx) => (
                <Badge
                  key={idx}
                  className="bg-blue-600 hover:bg-blue-700 cursor-pointer group pr-1"
                  onClick={() => handleRemovePro(idx)}
                >
                  {pro}
                  <X className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cons */}
      <Card className="border-orange-500/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
              <ThumbsDown className="w-5 h-5" />
              Cons ({cons.length})
            </CardTitle>
            {!addingCon && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAddingCon(true)}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {addingCon && (
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Enter a con..."
                value={newCon}
                onChange={(e) => setNewCon(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCon()}
                className="flex-1"
                autoFocus
              />
              <Button size="sm" onClick={handleAddCon} className="bg-orange-600 hover:bg-orange-700">
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setAddingCon(false); setNewCon(""); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          {cons.length === 0 && !addingCon ? (
            <p className="text-muted-foreground text-sm text-center py-2">
              No cons added yet. Click "Add" to note concerns about this person.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {cons.map((con, idx) => (
                <Badge
                  key={idx}
                  className="bg-orange-600 hover:bg-orange-700 cursor-pointer group pr-1"
                  onClick={() => handleRemoveCon(idx)}
                >
                  {con}
                  <X className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
