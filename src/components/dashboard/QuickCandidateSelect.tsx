import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tables } from "@/integrations/supabase/types";

type Candidate = Tables<"candidates">;

interface QuickCandidateSelectProps {
  candidates: Candidate[];
}

export const QuickCandidateSelect: React.FC<QuickCandidateSelectProps> = ({
  candidates,
}) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSelect = (candidateId: string) => {
    setOpen(false);
    navigate(`/candidate/${candidateId}`);
  };

  const getStatusLabel = (status: string | null) => {
    const labels: Record<string, string> = {
      just_matched: "Just Matched",
      texting: "Texting",
      planning_date: "Planning Date",
      dating: "Dating",
      dating_casually: "Dating Casually",
      getting_serious: "Getting Serious",
      serious_relationship: "Serious",
      no_contact: "No Contact",
      archived: "Archived",
    };
    return labels[status || ""] || status || "Unknown";
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-foreground hover:bg-primary/10 rounded-xl h-9 w-9"
        onClick={() => setOpen(true)}
      >
        <Search className="w-5 h-5" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search candidates..." />
        <CommandList>
          <CommandEmpty>No candidates found.</CommandEmpty>
          <CommandGroup heading="Candidates">
            {candidates.map((candidate) => (
              <CommandItem
                key={candidate.id}
                value={candidate.nickname}
                onSelect={() => handleSelect(candidate.id)}
                className="flex items-center gap-3 py-3 cursor-pointer"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={candidate.photo_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {candidate.nickname.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{candidate.nickname}</p>
                  <p className="text-xs text-muted-foreground">
                    {getStatusLabel(candidate.status)}
                    {candidate.compatibility_score && (
                      <span className="ml-2">• {candidate.compatibility_score}% match</span>
                    )}
                  </p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};
