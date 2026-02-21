import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Settings, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Home", icon: Home, description: "View your dashboard and candidates" },
  { path: "/devi", label: "D.E.V.I.", icon: Sparkles, description: "Chat with your AI dating coach" },
  { path: "/community", label: "Community", icon: Users, description: "Connect with other daters" },
  { path: "/settings", label: "Settings", icon: Settings, description: "Manage your account and preferences" },
];

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [unreadDmCount, setUnreadDmCount] = useState(0);

  const hiddenPaths = ["/", "/auth", "/setup", "/website"];
  const hiddenPrefixes = ["/onboarding", "/admin"];
  const isHidden =
    hiddenPaths.includes(location.pathname) ||
    hiddenPrefixes.some((prefix) => location.pathname.startsWith(prefix));

  const fetchUnreadDmCount = useMemo(() => {
    return async (uid: string) => {
      const { count, error } = await supabase
        .from("direct_messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", uid)
        .eq("is_read", false);

      if (!error) setUnreadDmCount(count ?? 0);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setUnreadDmCount(0);
      return;
    }

    let isMounted = true;

    // Initial count
    fetchUnreadDmCount(user.id).catch(() => {
      // no-op: keep UI stable if this fails
    });

    // Realtime updates
    const channel = supabase
      .channel(`direct-messages-nav-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
          if (!isMounted) return;

          setUnreadDmCount((prev) => prev + 1);

          // Avoid noisy toasts while already inside community
          if (location.pathname.startsWith("/community")) return;

          try {
            const senderId = (payload.new as any)?.sender_id as string | undefined;
            if (!senderId) {
              toast.info("New message", { description: "You received a new community DM" });
              return;
            }

            const { data } = await supabase
              .from("profiles")
              .select("screen_name")
              .eq("user_id", senderId)
              .maybeSingle();

            const senderName = data?.screen_name ? `@${data.screen_name}` : "Someone";
            toast.info("New message", { description: `From ${senderName}` });
          } catch {
            toast.info("New message", { description: "You received a new community DM" });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "direct_messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadDmCount(user.id).catch(() => {
            // no-op
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchUnreadDmCount, location.pathname]);

  if (isHidden) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[image:var(--gradient-glass)] backdrop-blur-xl border-t border-border/50 pb-safe-bottom">
      <div className="flex items-center justify-center gap-2 h-14 max-w-md mx-auto px-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path === "/dashboard" && location.pathname.startsWith("/candidate"));

          const showCommunityBadge = item.path === "/community" && unreadDmCount > 0;
          const badgeText = unreadDmCount > 99 ? "99+" : String(unreadDmCount);

          return (
            <Tooltip key={item.path}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-300 relative",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -top-px left-1/2 -translate-x-1/2 w-10 h-0.5 bg-[image:var(--gradient-hero)] rounded-full" />
                  )}

                  <div
                    className={cn(
                      "relative p-1 rounded-lg transition-all duration-300",
                      isActive && "bg-primary/10"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-all duration-300",
                        isActive && "scale-110"
                      )}
                    />

                    {showCommunityBadge && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-5 min-w-5 px-1 text-[10px] leading-none flex items-center justify-center"
                      >
                        {badgeText}
                      </Badge>
                    )}
                  </div>

                  <span
                    className={cn(
                      "text-[9px] font-medium transition-all leading-tight",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
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