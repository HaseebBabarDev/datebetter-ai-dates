import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

interface ChatWithDeviBadgeProps {
  candidateName?: string;
  candidateId?: string;
  compact?: boolean;
}

export const ChatWithDeviBadge: React.FC<ChatWithDeviBadgeProps> = ({ 
  candidateName, 
  candidateId,
  compact = false 
}) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/devi", { state: { candidateName, candidateId } })}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors cursor-pointer"
    >
      <Sparkles className="w-3.5 h-3.5 text-primary" />
      <span className="text-xs font-medium text-primary">
        {compact ? "D.E.V.I." : "Chat with D.E.V.I."}
      </span>
    </button>
  );
};
