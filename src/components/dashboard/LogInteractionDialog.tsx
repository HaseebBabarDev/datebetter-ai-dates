import React from "react";
import { useNavigate } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Candidate = Tables<"candidates">;

interface LogInteractionDialogProps {
  candidates: Candidate[];
}

export const LogInteractionDialog = ({ candidates }: LogInteractionDialogProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const activeCandidates = candidates.filter(
    (c) => c.status !== "archived" && c.status !== "no_contact"
  );

  const handleSelectCandidate = (candidateId: string) => {
    setOpen(false);
    navigate(`/candidate/${candidateId}`, { state: { tab: "interactions" } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Clock className="w-4 h-4 mr-2" />
          Log Interaction
        </Button>
      </DialogTrigger>
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
            {activeCandidates.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active candidates
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
