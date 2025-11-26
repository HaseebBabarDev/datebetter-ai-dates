import React, { useState } from "react";
import { Tables, Enums } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SliderInput } from "@/components/onboarding/SliderInput";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, X, Calendar, MapPin, User } from "lucide-react";
import { toast } from "sonner";

type Candidate = Tables<"candidates">;

interface CandidateProfileProps {
  candidate: Candidate;
  onUpdate: (updates: Partial<Candidate>) => Promise<void>;
}

const STATUS_OPTIONS: { value: Enums<"candidate_status">; label: string }[] = [
  { value: "just_matched", label: "Just Matched" },
  { value: "texting", label: "Texting" },
  { value: "planning_date", label: "Planning Date" },
  { value: "dating", label: "Dating" },
  { value: "getting_serious", label: "Getting Serious" },
  { value: "no_contact", label: "No Contact" },
  { value: "archived", label: "Archived" },
];

export const CandidateProfile: React.FC<CandidateProfileProps> = ({
  candidate,
  onUpdate,
}) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nickname, setNickname] = useState(candidate.nickname);
  const [age, setAge] = useState(candidate.age?.toString() || "");
  const [status, setStatus] = useState<Enums<"candidate_status">>(
    candidate.status || "just_matched"
  );
  const [notes, setNotes] = useState(candidate.notes || "");

  const [overallChemistry, setOverallChemistry] = useState(candidate.overall_chemistry || 3);
  const [physicalAttraction, setPhysicalAttraction] = useState(candidate.physical_attraction || 3);
  const [intellectualConnection, setIntellectualConnection] = useState(candidate.intellectual_connection || 3);
  const [humorCompatibility, setHumorCompatibility] = useState(candidate.humor_compatibility || 3);
  const [energyMatch, setEnergyMatch] = useState(candidate.energy_match || 3);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        nickname,
        age: age ? parseInt(age) : null,
        status,
        notes: notes || null,
        overall_chemistry: overallChemistry,
        physical_attraction: physicalAttraction,
        intellectual_connection: intellectualConnection,
        humor_compatibility: humorCompatibility,
        energy_match: energyMatch,
      });
      toast.success("Profile updated");
      setEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNickname(candidate.nickname);
    setAge(candidate.age?.toString() || "");
    setStatus(candidate.status || "just_matched");
    setNotes(candidate.notes || "");
    setOverallChemistry(candidate.overall_chemistry || 3);
    setPhysicalAttraction(candidate.physical_attraction || 3);
    setIntellectualConnection(candidate.intellectual_connection || 3);
    setHumorCompatibility(candidate.humor_compatibility || 3);
    setEnergyMatch(candidate.energy_match || 3);
    setEditing(false);
  };

  const chemistryAvg = Math.round(
    (overallChemistry + physicalAttraction + intellectualConnection + humorCompatibility + energyMatch) / 5
  );

  return (
    <div className="space-y-4">
      {/* Quick Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Basic Info</CardTitle>
          {!editing ? (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="space-y-2">
                <Label>Nickname</Label>
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min={18}
                    max={99}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as Enums<"candidate_status">)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Personal notes about this person..."
                  rows={3}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {candidate.age && (
                  <Badge variant="secondary" className="gap-1">
                    <User className="w-3 h-3" />
                    {candidate.age} years old
                  </Badge>
                )}
                {candidate.met_via && (
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="w-3 h-3" />
                    {candidate.met_app || candidate.met_via.replace("_", " ")}
                  </Badge>
                )}
                {candidate.first_contact_date && (
                  <Badge variant="secondary" className="gap-1">
                    <Calendar className="w-3 h-3" />
                    Since {new Date(candidate.first_contact_date).toLocaleDateString()}
                  </Badge>
                )}
              </div>
              {candidate.notes && (
                <p className="text-sm text-muted-foreground">{candidate.notes}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Chemistry Ratings */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Chemistry Ratings</CardTitle>
            <Badge variant="outline" className="text-lg font-semibold">
              {chemistryAvg}/5
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <SliderInput
                label="Overall Chemistry"
                value={overallChemistry}
                onChange={setOverallChemistry}
                leftLabel="Low"
                rightLabel="Electric"
              />
              <SliderInput
                label="Physical Attraction"
                value={physicalAttraction}
                onChange={setPhysicalAttraction}
                leftLabel="Neutral"
                rightLabel="Very Attracted"
              />
              <SliderInput
                label="Intellectual Connection"
                value={intellectualConnection}
                onChange={setIntellectualConnection}
                leftLabel="Surface"
                rightLabel="Deep"
              />
              <SliderInput
                label="Humor Compatibility"
                value={humorCompatibility}
                onChange={setHumorCompatibility}
                leftLabel="Different"
                rightLabel="Same Wavelength"
              />
              <SliderInput
                label="Energy Match"
                value={energyMatch}
                onChange={setEnergyMatch}
                leftLabel="Draining"
                rightLabel="Energizing"
              />
            </>
          ) : (
            <div className="space-y-3">
              <ChemistryBar label="Overall Chemistry" value={candidate.overall_chemistry || 3} />
              <ChemistryBar label="Physical Attraction" value={candidate.physical_attraction || 3} />
              <ChemistryBar label="Intellectual Connection" value={candidate.intellectual_connection || 3} />
              <ChemistryBar label="Humor Compatibility" value={candidate.humor_compatibility || 3} />
              <ChemistryBar label="Energy Match" value={candidate.energy_match || 3} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ChemistryBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}/5</span>
    </div>
    <div className="h-2 bg-secondary rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all"
        style={{ width: `${(value / 5) * 100}%` }}
      />
    </div>
  </div>
);
