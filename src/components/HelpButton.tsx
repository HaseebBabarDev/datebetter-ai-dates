import React from "react";
import { HelpCircle } from "lucide-react";

const HelpButton = () => {
  return (
    <a
      href="mailto:support@datebetterapp.com?subject=Help Request"
      className="fixed bottom-24 right-4 z-50 rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-shadow bg-secondary text-secondary-foreground flex items-center justify-center"
      aria-label="Get help"
    >
      <HelpCircle className="w-6 h-6" />
    </a>
  );
};

export default HelpButton;
