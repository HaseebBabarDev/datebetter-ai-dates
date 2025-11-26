import React, { useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Plus, X } from "lucide-react";
import { toast } from "sonner";

type Candidate = Tables<"candidates">;

interface FlagsSectionProps {
  candidate: Candidate;
  onUpdate: (updates: Partial<Candidate>) => Promise<void>;
}

const COMMON_RED_FLAGS = [
  "Love bombing",
  "Inconsistent communication",
  "Avoids commitment talk",
  "Bad-mouths exes",
  "Controlling behavior",
  "Gaslighting",
  "Future faking",
  "Breadcrumbing",
  "Hot and cold",
  "Dismissive of feelings",
];

const COMMON_GREEN_FLAGS = [
  "Consistent communication",
  "Plans dates in advance",
  "Remembers details",
  "Introduces to friends",
  "Respects boundaries",
  "Emotionally available",
  "Takes accountability",
  "Shows genuine interest",
  "Follows through",
  "Open and honest",
];

export const FlagsSection: React.FC<FlagsSectionProps> = ({
  candidate,
  onUpdate,
}) => {
  const [newRedFlag, setNewRedFlag] = useState("");
  const [newGreenFlag, setNewGreenFlag] = useState("");
  const [saving, setSaving] = useState(false);

  const redFlags = (candidate.red_flags as string[]) || [];
  const greenFlags = (candidate.green_flags as string[]) || [];

  const addFlag = async (type: "red" | "green", flag: string) => {
    if (!flag.trim()) return;

    setSaving(true);
    try {
      const currentFlags = type === "red" ? redFlags : greenFlags;
      const key = type === "red" ? "red_flags" : "green_flags";

      if (currentFlags.includes(flag.trim())) {
        toast.error("This flag already exists");
        return;
      }

      await onUpdate({
        [key]: [...currentFlags, flag.trim()],
      });

      if (type === "red") {
        setNewRedFlag("");
      } else {
        setNewGreenFlag("");
      }
      toast.success("Flag added");
    } catch (error) {
      toast.error("Failed to add flag");
    } finally {
      setSaving(false);
    }
  };

  const removeFlag = async (type: "red" | "green", flag: string) => {
    setSaving(true);
    try {
      const currentFlags = type === "red" ? redFlags : greenFlags;
      const key = type === "red" ? "red_flags" : "green_flags";

      await onUpdate({
        [key]: currentFlags.filter((f) => f !== flag),
      });
      toast.success("Flag removed");
    } catch (error) {
      toast.error("Failed to remove flag");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Red Flags */}
      <Card className="border-destructive/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Red Flags ({redFlags.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a red flag..."
              value={newRedFlag}
              onChange={(e) => setNewRedFlag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFlag("red", newRedFlag)}
            />
            <Button
              size="icon"
              variant="destructive"
              onClick={() => addFlag("red", newRedFlag)}
              disabled={saving || !newRedFlag.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {redFlags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {redFlags.map((flag) => (
                <Badge
                  key={flag}
                  variant="destructive"
                  className="gap-1 pr-1"
                >
                  {flag}
                  <button
                    onClick={() => removeFlag("red", flag)}
                    className="ml-1 hover:bg-destructive-foreground/20 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-2">Quick add:</p>
            <div className="flex flex-wrap gap-1">
              {COMMON_RED_FLAGS.filter((f) => !redFlags.includes(f)).map((flag) => (
                <Badge
                  key={flag}
                  variant="outline"
                  className="cursor-pointer hover:bg-destructive/10 text-xs"
                  onClick={() => addFlag("red", flag)}
                >
                  + {flag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Green Flags */}
      <Card className="border-green-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            Green Flags ({greenFlags.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a green flag..."
              value={newGreenFlag}
              onChange={(e) => setNewGreenFlag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFlag("green", newGreenFlag)}
            />
            <Button
              size="icon"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => addFlag("green", newGreenFlag)}
              disabled={saving || !newGreenFlag.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {greenFlags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {greenFlags.map((flag) => (
                <Badge
                  key={flag}
                  className="gap-1 pr-1 bg-green-600"
                >
                  {flag}
                  <button
                    onClick={() => removeFlag("green", flag)}
                    className="ml-1 hover:bg-green-700/50 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-2">Quick add:</p>
            <div className="flex flex-wrap gap-1">
              {COMMON_GREEN_FLAGS.filter((f) => !greenFlags.includes(f)).map((flag) => (
                <Badge
                  key={flag}
                  variant="outline"
                  className="cursor-pointer hover:bg-green-500/10 text-xs"
                  onClick={() => addFlag("green", flag)}
                >
                  + {flag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
