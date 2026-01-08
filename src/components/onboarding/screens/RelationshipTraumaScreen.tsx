import React, { useState } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingLayout } from "../OnboardingLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelectOption } from "../MultiSelectOption";
import { Heart, Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PastRelationship {
  id: string;
  label: string;
  duration: string;
  traumas: string[];
  notes: string;
  endReason: string;
}

const RELATIONSHIP_DURATION_OPTIONS = [
  { value: "less_than_3_months", label: "Less than 3 months" },
  { value: "3_to_6_months", label: "3-6 months" },
  { value: "6_months_to_1_year", label: "6 months - 1 year" },
  { value: "1_to_2_years", label: "1-2 years" },
  { value: "2_to_5_years", label: "2-5 years" },
  { value: "5_plus_years", label: "5+ years" },
];

const END_REASON_OPTIONS = [
  { value: "mutual", label: "Mutual decision" },
  { value: "i_ended", label: "I ended it" },
  { value: "they_ended", label: "They ended it" },
  { value: "ghosted", label: "Ghosted/disappeared" },
  { value: "cheating_them", label: "They cheated" },
  { value: "cheating_me", label: "I cheated" },
  { value: "abuse", label: "Abuse/safety concerns" },
  { value: "grew_apart", label: "Grew apart" },
  { value: "long_distance", label: "Long distance" },
  { value: "other", label: "Other" },
];

const TRAUMA_OPTIONS = [
  "Cheating/infidelity",
  "Emotional abuse",
  "Physical abuse",
  "Verbal abuse",
  "Gaslighting/manipulation",
  "Love bombing then withdrawal",
  "Ghosting/abandonment",
  "Controlling behavior",
  "Financial abuse",
  "Isolation from friends/family",
  "Constant criticism",
  "Silent treatment",
  "Betrayal of trust",
  "Addiction issues",
  "Mental health challenges",
  "Codependency patterns",
  "Jealousy/possessiveness",
  "Dishonesty",
  "None of these apply",
];

const createEmptyRelationship = (): PastRelationship => ({
  id: Date.now().toString(),
  label: "",
  duration: "",
  traumas: [],
  notes: "",
  endReason: "",
});

const RelationshipTraumaScreen = () => {
  const { data, updateData, nextStep } = useOnboarding();
  const [relationships, setRelationships] = useState<PastRelationship[]>(
    (data.pastRelationshipTraumas as PastRelationship[]) || []
  );
  const [generalNotes, setGeneralNotes] = useState(data.relationshipTraumaNotes || "");

  const addRelationship = () => {
    const newRel = createEmptyRelationship();
    const updated = [...relationships, newRel];
    setRelationships(updated);
    updateData({ pastRelationshipTraumas: updated });
  };

  const removeRelationship = (id: string) => {
    const updated = relationships.filter(r => r.id !== id);
    setRelationships(updated);
    updateData({ pastRelationshipTraumas: updated });
  };

  const updateRelationship = (id: string, field: keyof PastRelationship, value: any) => {
    const updated = relationships.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    );
    setRelationships(updated);
    updateData({ pastRelationshipTraumas: updated });
  };

  const toggleTrauma = (relId: string, trauma: string) => {
    const rel = relationships.find(r => r.id === relId);
    if (!rel) return;
    
    let newTraumas: string[];
    if (trauma === "None of these apply") {
      newTraumas = rel.traumas.includes(trauma) ? [] : [trauma];
    } else {
      const filtered = rel.traumas.filter(t => t !== "None of these apply");
      newTraumas = filtered.includes(trauma)
        ? filtered.filter(t => t !== trauma)
        : [...filtered, trauma];
    }
    updateRelationship(relId, "traumas", newTraumas);
  };

  const handleGeneralNotesChange = (notes: string) => {
    setGeneralNotes(notes);
    updateData({ relationshipTraumaNotes: notes });
  };

  const handleContinue = () => {
    updateData({ 
      pastRelationshipTraumas: relationships,
      relationshipTraumaNotes: generalNotes 
    });
    nextStep();
  };

  return (
    <OnboardingLayout
      title="Past Relationships"
      subtitle="Understanding your relationship history helps D.E.V.I. support you better"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Info notice */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            This section is optional but helps D.E.V.I. understand patterns that may affect your dating life. 
            Skip entirely or add only what feels comfortable.
          </p>
        </div>

        {/* Relationships list */}
        {relationships.length > 0 && (
          <Accordion type="single" collapsible className="space-y-2">
            {relationships.map((rel, index) => (
              <AccordionItem
                key={rel.id}
                value={rel.id}
                className="border rounded-lg px-4 bg-card"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2 flex-1">
                    <Heart className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">
                      {rel.label || `Relationship ${index + 1}`}
                    </span>
                    {rel.traumas.length > 0 && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                        {rel.traumas.length} item{rel.traumas.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  {/* Label */}
                  <div className="space-y-2">
                    <Label className="text-xs">Name/Nickname (private)</Label>
                    <Input
                      placeholder="e.g., 'College Ex' or initials"
                      value={rel.label}
                      onChange={(e) => updateRelationship(rel.id, "label", e.target.value)}
                    />
                  </div>

                  {/* Duration & End Reason */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Duration</Label>
                      <Select
                        value={rel.duration}
                        onValueChange={(v) => updateRelationship(rel.id, "duration", v)}
                      >
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {RELATIONSHIP_DURATION_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">How it ended</Label>
                      <Select
                        value={rel.endReason}
                        onValueChange={(v) => updateRelationship(rel.id, "endReason", v)}
                      >
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {END_REASON_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Traumas */}
                  <div className="space-y-2">
                    <Label className="text-xs">Difficult experiences in this relationship</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {TRAUMA_OPTIONS.map(trauma => (
                        <button
                          key={trauma}
                          type="button"
                          onClick={() => toggleTrauma(rel.id, trauma)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                            rel.traumas.includes(trauma)
                              ? "bg-amber-500 text-white border-amber-500"
                              : "bg-muted/50 text-muted-foreground border-border hover:border-amber-500/50"
                          }`}
                        >
                          {trauma}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Freeform notes */}
                  <div className="space-y-2">
                    <Label className="text-xs">Additional notes (optional)</Label>
                    <Textarea
                      placeholder="Anything else D.E.V.I. should know about this relationship..."
                      value={rel.notes}
                      onChange={(e) => updateRelationship(rel.id, "notes", e.target.value)}
                      className="min-h-[80px] text-sm"
                    />
                  </div>

                  {/* Remove button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRelationship(rel.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove this relationship
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {/* Add relationship button */}
        <Button
          type="button"
          variant="outline"
          onClick={addRelationship}
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          {relationships.length === 0 ? "Add a Past Relationship" : "Add Another Relationship"}
        </Button>

        {/* General notes */}
        <div className="space-y-2">
          <Label className="text-sm">General reflections on past relationships (optional)</Label>
          <Textarea
            placeholder="Any patterns you've noticed, lessons learned, or things you want D.E.V.I. to understand about your relationship history..."
            value={generalNotes}
            onChange={(e) => handleGeneralNotesChange(e.target.value)}
            className="min-h-[100px] text-sm"
          />
        </div>

        {/* Continue button */}
        <Button onClick={handleContinue} className="w-full" size="lg">
          Continue
        </Button>
      </div>
    </OnboardingLayout>
  );
};

export default RelationshipTraumaScreen;
