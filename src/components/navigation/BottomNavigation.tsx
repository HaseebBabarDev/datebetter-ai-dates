import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users, BarChart2, Settings, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Home", icon: Home },
  { path: "/patterns", label: "Patterns", icon: BarChart2 },
  { path: "/devi", label: "D.E.V.I.", icon: Heart },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path === "/dashboard" && location.pathname.startsWith("/candidate"));

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-[64px] transition-all duration-200 active:scale-95",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
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
