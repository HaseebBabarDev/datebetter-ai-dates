import React from "react";
import { Heart, Shield, Lock } from "lucide-react";

export const PersonalSectionWarning: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-primary/10 border border-amber-500/20 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Heart className="w-5 h-5 text-amber-500" />
        <h4 className="font-semibold text-sm">Personal Section</h4>
      </div>
      <p className="text-xs text-muted-foreground">
        The following sections cover your family background and past relationship experiences. 
        This information helps D.E.V.I. provide more personalized guidance, but sharing is completely optional.
      </p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Lock className="w-3 h-3" />
          <span>Encrypted</span>
        </div>
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          <span>Never shared</span>
        </div>
      </div>
    </div>
  );
};
