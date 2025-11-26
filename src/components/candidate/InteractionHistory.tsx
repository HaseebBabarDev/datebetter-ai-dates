import React from "react";
import { Tables, Enums } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Coffee,
  Utensils,
  Wine,
  Film,
  Video,
  MessageCircle,
  Dumbbell,
  Home,
  Users,
  Plane,
  Calendar,
  Heart,
} from "lucide-react";

type Interaction = Tables<"interactions">;

interface InteractionHistoryProps {
  interactions: Interaction[];
}

const INTERACTION_ICONS: Record<Enums<"interaction_type">, React.ReactNode> = {
  coffee: <Coffee className="w-4 h-4" />,
  dinner: <Utensils className="w-4 h-4" />,
  drinks: <Wine className="w-4 h-4" />,
  movie: <Film className="w-4 h-4" />,
  facetime: <Video className="w-4 h-4" />,
  texting: <MessageCircle className="w-4 h-4" />,
  activity: <Dumbbell className="w-4 h-4" />,
  home_hangout: <Home className="w-4 h-4" />,
  group_hang: <Users className="w-4 h-4" />,
  trip: <Plane className="w-4 h-4" />,
  event: <Calendar className="w-4 h-4" />,
  intimate: <Heart className="w-4 h-4" />,
};

const INTERACTION_LABELS: Record<Enums<"interaction_type">, string> = {
  coffee: "Coffee Date",
  dinner: "Dinner",
  drinks: "Drinks",
  movie: "Movie",
  facetime: "Video Call",
  texting: "Texting",
  activity: "Activity",
  home_hangout: "Home Hangout",
  group_hang: "Group Hang",
  trip: "Trip",
  event: "Event",
  intimate: "Intimate",
};

const getFeelingEmoji = (feeling: number | null) => {
  if (!feeling) return "😐";
  if (feeling >= 5) return "😍";
  if (feeling >= 4) return "😊";
  if (feeling >= 3) return "😐";
  if (feeling >= 2) return "😕";
  return "😞";
};

export const InteractionHistory: React.FC<InteractionHistoryProps> = ({
  interactions,
}) => {
  if (interactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No interactions logged yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add your first interaction above
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {interactions.map((interaction) => (
        <Card key={interaction.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {INTERACTION_ICONS[interaction.interaction_type]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {INTERACTION_LABELS[interaction.interaction_type]}
                    </span>
                    <span className="text-lg">
                      {getFeelingEmoji(interaction.overall_feeling)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {interaction.interaction_date
                      ? new Date(interaction.interaction_date).toLocaleDateString()
                      : "No date"}
                    {interaction.duration && ` · ${interaction.duration}`}
                  </p>
                </div>
              </div>
              {interaction.who_initiated && (
                <Badge variant="outline" className="text-xs">
                  {interaction.who_initiated === "me" ? "I initiated" : "They initiated"}
                </Badge>
              )}
            </div>

            {interaction.notes && (
              <p className="text-sm text-muted-foreground mt-3 pl-13">
                {interaction.notes}
              </p>
            )}

            {interaction.gut_feeling && (
              <div className="mt-3 pl-13">
                <Badge variant="secondary" className="text-xs">
                  Gut: {interaction.gut_feeling}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
