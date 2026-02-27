import React from "react";
import { motion } from "framer-motion";

interface IPhoneMockupProps {
  children: React.ReactNode;
  className?: string;
}

export const IPhoneMockup: React.FC<IPhoneMockupProps> = ({ children, className = "" }) => (
  <div className={`relative mx-auto ${className}`} style={{ width: 280 }}>
    {/* Phone frame */}
    <div className="relative rounded-[2.5rem] border-[6px] border-foreground/80 bg-foreground/5 shadow-[var(--shadow-elegant)] overflow-hidden">
      {/* Notch / Dynamic Island */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-foreground/80 rounded-full z-20" />
      
      {/* Screen content */}
      <div className="relative bg-background rounded-[2rem] overflow-hidden" style={{ aspectRatio: "9/19.5" }}>
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[9px] font-semibold text-foreground z-10 relative">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <div className="flex gap-[2px]">
              {[4, 6, 8, 10].map((h, i) => (
                <div key={i} className="w-[3px] rounded-sm bg-foreground" style={{ height: h }} />
              ))}
            </div>
            <div className="w-5 h-2.5 rounded-sm border border-foreground/60 relative">
              <div className="absolute inset-[1px] rounded-[1px] bg-success" style={{ width: "70%" }} />
            </div>
          </div>
        </div>
        
        {/* App content */}
        <div className="px-3 pb-4 overflow-hidden flex-1">
          {children}
        </div>
      </div>
    </div>
    
    {/* Reflection glare */}
    <div className="absolute inset-0 rounded-[2.5rem] pointer-events-none bg-gradient-to-br from-white/10 via-transparent to-transparent" />
  </div>
);
