import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Heart, PhoneOff, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface WinsStatsProps {
  totalWins: number;
  thisMonthWins: number;
  winsByType: {
    saved_time: number;
    avoided_crash_out: number;
    resisted_contact: number;
    other: number;
  };
  className?: string;
}

const WIN_TYPE_CONFIG = {
  saved_time: { icon: Clock, label: "Time saved", color: "text-blue-500" },
  avoided_crash_out: { icon: Heart, label: "Crash-outs avoided", color: "text-rose-500" },
  resisted_contact: { icon: PhoneOff, label: "Contacts resisted", color: "text-violet-500" },
  other: { icon: Sparkles, label: "Other wins", color: "text-amber-500" },
};

export const WinsStats: React.FC<WinsStatsProps> = ({
  totalWins,
  thisMonthWins,
  winsByType,
  className,
}) => {
  if (totalWins === 0) return null;

  return (
    <Card className={cn("bg-gradient-to-br from-primary/5 to-violet-500/5 border-primary/20", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Your Wins</h3>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{thisMonthWins}</p>
            <p className="text-xs text-muted-foreground">this month</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Object.entries(winsByType).map(([type, count]) => {
            if (count === 0) return null;
            const config = WIN_TYPE_CONFIG[type as keyof typeof WIN_TYPE_CONFIG];
            const Icon = config.icon;
            
            return (
              <div
                key={type}
                className="flex items-center gap-2 p-2 rounded-lg bg-background/50"
              >
                <Icon className={cn("w-4 h-4", config.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{count}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {config.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {totalWins > 0 && (
          <p className="text-xs text-center text-muted-foreground mt-3 pt-3 border-t border-border/50">
            {totalWins} total wins logged
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Hook to fetch wins data
export const useDeviWins = (userId: string | undefined) => {
  const [wins, setWins] = React.useState<{
    total: number;
    thisMonth: number;
    byType: {
      saved_time: number;
      avoided_crash_out: number;
      resisted_contact: number;
      other: number;
    };
  }>({
    total: 0,
    thisMonth: 0,
    byType: { saved_time: 0, avoided_crash_out: 0, resisted_contact: 0, other: 0 },
  });
  const [loading, setLoading] = React.useState(true);

  const fetchWins = React.useCallback(async () => {
    if (!userId) return;

    const { supabase } = await import("@/integrations/supabase/client");

    // Get start of current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("devi_wins")
      .select("win_type, created_at")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching wins:", error);
      setLoading(false);
      return;
    }

    const byType = {
      saved_time: 0,
      avoided_crash_out: 0,
      resisted_contact: 0,
      other: 0,
    };

    let thisMonth = 0;

    (data || []).forEach((win) => {
      const type = win.win_type as keyof typeof byType;
      if (byType[type] !== undefined) {
        byType[type]++;
      }

      const winDate = new Date(win.created_at);
      if (winDate >= startOfMonth) {
        thisMonth++;
      }
    });

    setWins({
      total: data?.length || 0,
      thisMonth,
      byType,
    });
    setLoading(false);
  }, [userId]);

  React.useEffect(() => {
    fetchWins();
  }, [fetchWins]);

  return { wins, loading, refetch: fetchWins };
};
