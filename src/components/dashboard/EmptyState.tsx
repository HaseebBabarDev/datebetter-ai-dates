import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Heart, Plus, Sparkles } from "lucide-react";

export const EmptyState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center py-12 px-6">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
        <Heart className="w-10 h-10 text-primary" />
      </div>
      
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Your dating roster is empty
      </h2>
      
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Start tracking your dating life by adding your first candidate. 
        We'll help you spot patterns and make better decisions.
      </p>

      <div className="space-y-3">
        <Button 
          onClick={() => navigate("/add-candidate")} 
          className="w-full max-w-xs"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Your First Candidate
        </Button>
        
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" />
          AI-powered compatibility scoring included
        </p>
      </div>
    </div>
  );
};
