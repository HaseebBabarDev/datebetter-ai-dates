import { Bot, Info } from "lucide-react";

interface AIDisclosureProps {
  variant?: "inline" | "banner" | "compact";
  className?: string;
}

export function AIDisclosure({ variant = "inline", className = "" }: AIDisclosureProps) {
  const disclosureText = "This app uses artificial intelligence to provide personalized insights and recommendations. AI-generated content is for informational purposes only and should not replace professional advice.";
  
  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}>
        <Bot className="w-3 h-3 shrink-0" />
        <span>AI-powered features</span>
      </div>
    );
  }
  
  if (variant === "banner") {
    return (
      <div className={`flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50 ${className}`}>
        <Bot className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          {disclosureText}
        </p>
      </div>
    );
  }
  
  // Default inline variant
  return (
    <div className={`flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}>
      <Info className="w-3 h-3 shrink-0" />
      <span>
        Uses AI to provide personalized insights. Not a substitute for professional advice.
      </span>
    </div>
  );
}
