import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardCheck, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { isToday } from "date-fns";

type Interaction = Tables<"interactions">;
type Candidate = Tables<"candidates">;

interface DailyLoggingCTAProps {
  interactions: Interaction[];
  candidates: Candidate[];
}

export function DailyLoggingCTA({ interactions, candidates }: DailyLoggingCTAProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const todayCount = useMemo(() => {
    return interactions.filter(i => 
      i.interaction_date && isToday(new Date(i.interaction_date))
    ).length;
  }, [interactions]);

  const activeCandidates = candidates.filter(
    (c) => c.status !== "archived" && c.status !== "no_contact"
  );

  const goal = 2;
  const progress = Math.min(todayCount, goal);
  const completed = todayCount >= goal;

  const handleSelectCandidate = (candidateId: string) => {
    setOpen(false);
    navigate(`/candidate/${candidateId}`, { state: { tab: "interactions" } });
  };

  const handleLogClick = () => {
    if (activeCandidates.length === 1) {
      navigate(`/candidate/${activeCandidates[0].id}`, { state: { tab: "interactions" } });
    } else if (activeCandidates.length > 1) {
      setOpen(true);
    }
  };

  // Don't show if no active candidates
  if (activeCandidates.length === 0) return null;

  return (
    <>
      <Card className={`border ${completed ? 'border-green-500/30 bg-green-500/5' : 'border-accent/30 bg-accent/5'}`}>
        <CardContent className="px-3 py-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-full shrink-0 ${completed ? 'bg-green-500/20' : 'bg-accent/20'}`}>
              {completed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <ClipboardCheck className="w-3.5 h-3.5 text-accent-foreground" />
              )}
            </div>
            <p className="text-xs font-medium text-foreground flex-1">
              {completed ? "Daily goal reached!" : "Log interactions"}
            </p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${completed ? 'bg-green-500/20 text-green-600' : 'bg-accent/20 text-accent-foreground'}`}>
              {progress}/{goal}
            </span>
            {!completed && (
              <Button
                size="sm"
                variant="secondary"
                className="shrink-0 gap-1 text-[10px] h-6 px-2"
                onClick={handleLogClick}
              >
                <Sparkles className="w-2.5 h-2.5" />
                Log
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Select Candidate</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-1">
              {activeCandidates.map((candidate) => (
                <button
                  key={candidate.id}
                  onClick={() => handleSelectCandidate(candidate.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <Avatar className="w-10 h-10 border border-border">
                    <AvatarImage src={candidate.photo_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {candidate.nickname.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{candidate.nickname}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {candidate.status?.replace("_", " ")}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
