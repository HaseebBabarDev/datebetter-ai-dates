import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SliderInput } from "@/components/onboarding/SliderInput";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AddCandidateFormProps {
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

const MET_VIA_OPTIONS = [
  { value: "dating_app", label: "Dating App" },
  { value: "friends", label: "Through Friends" },
  { value: "work", label: "Work/Professional" },
  { value: "school", label: "School/University" },
  { value: "social_event", label: "Social Event" },
  { value: "gym", label: "Gym/Fitness" },
  { value: "online_other", label: "Online (Other)" },
  { value: "in_person", label: "In Person (Random)" },
];

const DATING_APPS = [
  "Hinge",
  "Bumble",
  "Tinder",
  "Coffee Meets Bagel",
  "The League",
  "Feeld",
  "HER",
  "OkCupid",
  "Other",
];

export const AddCandidateForm: React.FC<AddCandidateFormProps> = ({
  onSuccess,
  trigger,
}) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [nickname, setNickname] = useState("");
  const [metVia, setMetVia] = useState("");
  const [metApp, setMetApp] = useState("");
  const [age, setAge] = useState("");

  const [overallChemistry, setOverallChemistry] = useState(3);
  const [physicalAttraction, setPhysicalAttraction] = useState(3);
  const [intellectualConnection, setIntellectualConnection] = useState(3);
  const [humorCompatibility, setHumorCompatibility] = useState(3);
  const [energyMatch, setEnergyMatch] = useState(3);

  const resetForm = () => {
    setNickname("");
    setMetVia("");
    setMetApp("");
    setAge("");
    setOverallChemistry(3);
    setPhysicalAttraction(3);
    setIntellectualConnection(3);
    setHumorCompatibility(3);
    setEnergyMatch(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      toast.error("Please enter a nickname");
      return;
    }

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("candidates").insert({
        user_id: user.id,
        nickname: nickname.trim(),
        met_via: metVia || null,
        met_app: metVia === "dating_app" ? metApp : null,
        age: age ? parseInt(age) : null,
        overall_chemistry: overallChemistry,
        physical_attraction: physicalAttraction,
        intellectual_connection: intellectualConnection,
        humor_compatibility: humorCompatibility,
        energy_match: energyMatch,
        first_contact_date: new Date().toISOString().split("T")[0],
      });

      if (error) throw error;

      toast.success(`${nickname} added to your candidates!`);
      resetForm();
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error adding candidate:", error);
      toast.error("Failed to add candidate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Candidate
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add New Candidate</SheetTitle>
          <SheetDescription>
            Add someone you're talking to or dating
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname *</Label>
              <Input
                id="nickname"
                placeholder="Give them a memorable nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="Their age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min={18}
                max={99}
              />
            </div>

            <div className="space-y-2">
              <Label>Where did you meet?</Label>
              <Select value={metVia} onValueChange={setMetVia}>
                <SelectTrigger>
                  <SelectValue placeholder="Select how you met" />
                </SelectTrigger>
                <SelectContent>
                  {MET_VIA_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {metVia === "dating_app" && (
              <div className="space-y-2">
                <Label>Which app?</Label>
                <Select value={metApp} onValueChange={setMetApp}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the app" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATING_APPS.map((app) => (
                      <SelectItem key={app} value={app}>
                        {app}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Chemistry Ratings */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Initial Chemistry</h3>
            <p className="text-sm text-muted-foreground">
              Rate your initial impressions (you can update these later)
            </p>

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
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Candidate"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};
