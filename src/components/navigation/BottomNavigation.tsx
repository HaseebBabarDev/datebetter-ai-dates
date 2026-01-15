import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Settings, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Home", icon: Home, description: "View your dashboard and candidates" },
  { path: "/devi", label: "D.E.V.I.", icon: Sparkles, description: "Chat with your AI dating coach" },
  { path: "/community", label: "Community", icon: Users, description: "Connect with other daters" },
  { path: "/settings", label: "Settings", icon: Settings, description: "Manage your account and preferences" },
];

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on auth, onboarding, splash, admin pages
  const hiddenPaths = ["/", "/auth", "/setup"];
  const hiddenPrefixes = ["/onboarding", "/admin"];
  if (hiddenPaths.includes(location.pathname) || hiddenPrefixes.some(prefix => location.pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-[image:var(--gradient-glass)] backdrop-blur-xl border-t border-border/50 pb-safe-bottom"
    >
      <div className="flex items-center justify-center gap-2 h-14 max-w-md mx-auto px-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path === "/dashboard" && location.pathname.startsWith("/candidate"));

          return (
            <Tooltip key={item.path}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-300 relative",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -top-px left-1/2 -translate-x-1/2 w-10 h-0.5 bg-[image:var(--gradient-hero)] rounded-full" />
                  )}
                  
                  <div className={cn(
                    "relative p-1 rounded-lg transition-all duration-300",
                    isActive && "bg-primary/10"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5 transition-all duration-300",
                      isActive && "scale-110"
                    )} />
                  </div>
                  
                  <span className={cn(
                    "text-[9px] font-medium transition-all leading-tight",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {item.description}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </nav>
  );
}