import React from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const HelpButton = () => {
  const handleClick = () => {
    window.location.href = "mailto:support@datebetterapp.com?subject=Help Request";
  };

  return (
    <Button
      onClick={handleClick}
      size="icon"
      variant="secondary"
      className="fixed bottom-24 right-4 z-50 rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-shadow"
      aria-label="Get help"
    >
      <HelpCircle className="w-6 h-6" />
    </Button>
  );
};

export default HelpButton;
