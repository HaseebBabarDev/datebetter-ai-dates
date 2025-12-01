import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, ChevronRight } from "lucide-react";

export function DeviCard() {
  const navigate = useNavigate();

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-primary/20 border border-primary/30">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">D.E.V.I.</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">AI</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dating Evaluation & Vetting Intelligence
            </p>
            <p className="text-sm text-foreground/80 mt-2">
              Your personal AI dating coach — get insights, spot red flags, and make better decisions.
            </p>
            <Button
              size="sm"
              className="mt-3 gap-1.5"
              onClick={() => navigate("/devi")}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Talk to D.E.V.I.
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
