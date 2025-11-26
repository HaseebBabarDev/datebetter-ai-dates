import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, Coffee, Heart, Video, Users } from "lucide-react";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type InteractionType = Database["public"]["Enums"]["interaction_type"];

interface QuickLogInteractionProps {
  candidateId: string;
  onSuccess: () => void;
  onRescore?: () => void;
}

const QUICK_ACTIONS: { type: InteractionType; icon: React.ReactNode; label: string }[] = [
  { type: "texting", icon: <MessageSquare className="h-4 w-4" />, label: "Text" },
  { type: "phone_call", icon: <Phone className="h-4 w-4" />, label: "Call" },
  { type: "facetime", icon: <Video className="h-4 w-4" />, label: "Video" },
  { type: "coffee", icon: <Coffee className="h-4 w-4" />, label: "Date" },
  { type: "group_hang", icon: <Users className="h-4 w-4" />, label: "Hangout" },
  { type: "intimate", icon: <Heart className="h-4 w-4" />, label: "Intimate" },
];

export const QuickLogInteraction: React.FC<QuickLogInteractionProps> = ({
  candidateId,
  onSuccess,
  onRescore,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<InteractionType | null>(null);

  const handleQuickLog = async (type: InteractionType) => {
    if (!user) {
      toast.error("Please sign in to log interactions");
      return;
    }

    setLoading(type);

    try {
      const { error } = await supabase.from("interactions").insert({
        candidate_id: candidateId,
        user_id: user.id,
        interaction_type: type,
        interaction_date: new Date().toISOString().split("T")[0],
        overall_feeling: 3,
      });

      if (error) throw error;

      const actionLabel = QUICK_ACTIONS.find(a => a.type === type)?.label || type;
      toast.success(`${actionLabel} logged!`);
      onSuccess();
      
      if (onRescore) {
        onRescore();
      }
    } catch (error) {
      console.error("Error logging interaction:", error);
      toast.error("Failed to log interaction");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <p className="text-xs text-muted-foreground mb-2 font-medium">Quick Log</p>
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <Button
            key={action.type}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8 flex items-center justify-center"
            onClick={() => handleQuickLog(action.type)}
            disabled={loading !== null}
          >
            {loading === action.type ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              action.icon
            )}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
