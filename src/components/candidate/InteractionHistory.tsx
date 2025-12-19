import React, { useState } from "react";
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
  Phone,
  Sparkles,
  User,
  ChevronDown,
} from "lucide-react";

type Interaction = Tables<"interactions">;
type DeviMessage = Tables<"devi_messages">;

interface InteractionHistoryProps {
  interactions: Interaction[];
  deviMessages?: DeviMessage[];
}

const INTERACTION_ICONS: Record<Enums<"interaction_type">, React.ReactNode> = {
  coffee: <Coffee className="w-4 h-4" />,
  dinner: <Utensils className="w-4 h-4" />,
  drinks: <Wine className="w-4 h-4" />,
  movie: <Film className="w-4 h-4" />,
  facetime: <Video className="w-4 h-4" />,
  texting: <MessageCircle className="w-4 h-4" />,
  phone_call: <Phone className="w-4 h-4" />,
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
  phone_call: "Phone Call",
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

type TimelineItem = 
  | { type: "interaction"; data: Interaction; date: Date }
  | { type: "devi_user"; data: DeviMessage; date: Date }
  | { type: "devi_assistant"; data: DeviMessage; date: Date };

export const InteractionHistory: React.FC<InteractionHistoryProps> = ({
  interactions,
  deviMessages = [],
}) => {
  const [showAll, setShowAll] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Combine interactions and D.E.V.I. messages into a unified timeline
  const timelineItems: TimelineItem[] = [
    ...interactions.map((interaction): TimelineItem => ({
      type: "interaction",
      data: interaction,
      date: interaction.interaction_date 
        ? new Date(interaction.interaction_date) 
        : new Date(interaction.created_at || Date.now()),
    })),
    ...deviMessages.map((msg): TimelineItem => ({
      type: msg.role === "user" ? "devi_user" : "devi_assistant",
      data: msg,
      date: new Date(msg.created_at),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const displayedItems = showAll ? timelineItems : timelineItems.slice(0, 5);
  const hasMore = timelineItems.length > 5;

  if (timelineItems.length === 0) {
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
      {displayedItems.map((item, index) => {
        if (item.type === "interaction") {
          const interaction = item.data as Interaction;
          return (
            <Card key={`interaction-${interaction.id}`}>
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
          );
        }

        // D.E.V.I. messages
        const msg = item.data as DeviMessage;
        const isUser = item.type === "devi_user";

        return (
          <Card 
            key={`devi-${msg.id}`} 
            className={isUser 
              ? "border-muted bg-muted/30" 
              : "border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10"
            }
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isUser 
                    ? "bg-muted text-muted-foreground" 
                    : "bg-primary/20 text-primary"
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium text-sm ${!isUser && "text-primary"}`}>
                      {isUser ? "Your question" : "D.E.V.I. AI Response"}
                    </span>
                    <Badge 
                      variant={isUser ? "secondary" : "default"} 
                      className={`text-xs ${!isUser && "bg-primary/20 text-primary hover:bg-primary/30"}`}
                    >
                      {isUser ? "Question" : "AI Advice"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {item.date.toLocaleDateString()} · {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {isUser ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {msg.content}
                    </p>
                  ) : (
                    <>
                      <p className={`text-sm whitespace-pre-wrap ${
                        expandedMessages.has(msg.id) ? "" : "line-clamp-4"
                      }`}>
                        {msg.content}
                      </p>
                      {msg.content.length > 200 && (
                        <button
                          onClick={() => toggleExpanded(msg.id)}
                          className="mt-2 text-xs font-medium text-primary hover:underline"
                        >
                          {expandedMessages.has(msg.id) ? "Show less" : "Read full response"}
                        </button>
                      )}
                    </>
                  )}
                  {msg.image_url && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        📷 Image attached
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* See More / See Less Button */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
          {showAll ? 'See Less' : `See ${timelineItems.length - 5} More`}
        </button>
      )}
    </div>
  );
};
