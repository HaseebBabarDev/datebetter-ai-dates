import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, BarChart2, Settings, Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Home", icon: Home },
  { path: "/patterns", label: "Patterns", icon: BarChart2 },
  { path: "/devi", label: "D.E.V.I.", icon: Sparkles },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on auth, onboarding, splash pages
  const hiddenPaths = ["/", "/auth", "/onboarding", "/setup", "/admin"];
  if (hiddenPaths.some(path => location.pathname === path || location.pathname.startsWith("/onboarding"))) {
    return null;
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-[image:var(--gradient-glass)] backdrop-blur-xl border-t border-border/50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path === "/dashboard" && location.pathname.startsWith("/candidate"));

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-[60px] transition-all duration-300 relative",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[image:var(--gradient-hero)] rounded-full" />
              )}
              
              <div className={cn(
                "relative p-1.5 rounded-xl transition-all duration-300",
                isActive && "bg-primary/10"
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-all duration-300",
                  isActive && "scale-110"
                )} />
              </div>
              
              <span className={cn(
                "text-[10px] font-medium transition-all",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
