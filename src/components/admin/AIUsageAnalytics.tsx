import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  MessageSquare, 
  Trophy, 
  Flag, 
  Shield, 
  TrendingUp,
  Loader2,
  Users
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useTesterFilter } from "@/hooks/useTesterFilter";

interface AIStats {
  totalConversations: number;
  totalMessages: number;
  totalWins: number;
  totalAdvice: number;
  moderatedPosts: number;
  moderatedComments: number;
  moderatedDMs: number;
  activeUsers: number;
}

interface DailyUsage {
  date: string;
  messages: number;
  conversations: number;
}

interface WinTypeBreakdown {
  type: string;
  count: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export const AIUsageAnalytics = () => {
  const [stats, setStats] = useState<AIStats | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [winBreakdown, setWinBreakdown] = useState<WinTypeBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const { filter: testerFilter } = useTesterFilter();

  useEffect(() => {
    fetchAIStats();
  }, [testerFilter]);

  const fetchAIStats = async () => {
    setLoading(true);
    try {
      // If filtering, first get the list of user IDs for that tester type
      let filteredUserIds: string[] | null = null;
      
      if (testerFilter !== 'all') {
        const { data: internalStatuses } = await supabase
          .from("user_tester_status")
          .select("user_id")
          .eq("tester_type", "internal");
        
        const internalIds = new Set(internalStatuses?.map(s => s.user_id) || []);
        
        if (testerFilter === 'internal') {
          filteredUserIds = Array.from(internalIds);
        } else {
          const { data: allProfiles } = await supabase.from("profiles").select("user_id");
          filteredUserIds = (allProfiles || [])
            .filter(p => !internalIds.has(p.user_id))
            .map(p => p.user_id);
        }
      }

      // Fetch base stats
      let conversationsQuery = supabase.from("devi_conversations").select("id, user_id", { count: "exact" });
      let messagesQuery = supabase.from("devi_messages").select("id, user_id, created_at", { count: "exact" });
      let winsQuery = supabase.from("devi_wins").select("id, user_id, win_type", { count: "exact" });
      let adviceQuery = supabase.from("advice_tracking").select("id, user_id", { count: "exact" });
      let postsQuery = supabase.from("forum_posts").select("id, user_id", { count: "exact" }).not("moderation_status", "is", null);
      let commentsQuery = supabase.from("forum_comments").select("id, user_id", { count: "exact" }).not("moderation_status", "is", null);
      let dmsQuery = supabase.from("direct_messages").select("id, sender_id", { count: "exact" }).not("moderation_status", "is", null);

      if (filteredUserIds !== null && filteredUserIds.length > 0) {
        conversationsQuery = conversationsQuery.in("user_id", filteredUserIds);
        messagesQuery = messagesQuery.in("user_id", filteredUserIds);
        winsQuery = winsQuery.in("user_id", filteredUserIds);
        adviceQuery = adviceQuery.in("user_id", filteredUserIds);
        postsQuery = postsQuery.in("user_id", filteredUserIds);
        commentsQuery = commentsQuery.in("user_id", filteredUserIds);
        dmsQuery = dmsQuery.in("sender_id", filteredUserIds);
      } else if (filteredUserIds !== null && filteredUserIds.length === 0) {
        // No users match filter - set empty stats
        setStats({
          totalConversations: 0, totalMessages: 0, totalWins: 0, totalAdvice: 0,
          moderatedPosts: 0, moderatedComments: 0, moderatedDMs: 0, activeUsers: 0
        });
        setDailyUsage([]);
        setWinBreakdown([]);
        setLoading(false);
        return;
      }

      const [
        conversationsResult, messagesResult, winsResult, adviceResult,
        postsResult, commentsResult, dmsResult
      ] = await Promise.all([
        conversationsQuery, messagesQuery, winsQuery, adviceQuery,
        postsQuery, commentsQuery, dmsQuery
      ]);

      const uniqueUsers = new Set(conversationsResult.data?.map(c => c.user_id) || []);

      setStats({
        totalConversations: conversationsResult.count || 0,
        totalMessages: messagesResult.count || 0,
        totalWins: winsResult.count || 0,
        totalAdvice: adviceResult.count || 0,
        moderatedPosts: postsResult.count || 0,
        moderatedComments: commentsResult.count || 0,
        moderatedDMs: dmsResult.count || 0,
        activeUsers: uniqueUsers.size
      });

      // Process daily usage (last 14 days)
      const dailyMap = new Map<string, { messages: number; conversations: number }>();
      const last14Days: string[] = [];
      for (let i = 13; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        last14Days.push(dateStr);
        dailyMap.set(dateStr, { messages: 0, conversations: 0 });
      }

      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      messagesResult.data?.filter(m => m.created_at >= twoWeeksAgo).forEach(msg => {
        const dateStr = msg.created_at.split('T')[0];
        if (dailyMap.has(dateStr)) {
          dailyMap.get(dateStr)!.messages++;
        }
      });

      setDailyUsage(last14Days.map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        messages: dailyMap.get(date)?.messages || 0,
        conversations: dailyMap.get(date)?.conversations || 0
      })));

      // Process win types
      const winTypeCounts = new Map<string, number>();
      winsResult.data?.forEach(win => {
        const type = win.win_type;
        winTypeCounts.set(type, (winTypeCounts.get(type) || 0) + 1);
      });

      setWinBreakdown(Array.from(winTypeCounts.entries()).map(([type, count]) => ({
        type: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count
      })));

    } catch (error) {
      console.error("Error fetching AI stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">AI Usage Analytics</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              D.E.V.I. Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalConversations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.totalMessages.toLocaleString()} total messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              Active AI Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Users with D.E.V.I. chats
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Wins Logged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalWins.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              User achievements tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Flag className="w-3 h-3" />
              Advice Given
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAdvice.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              AI recommendations tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Moderation Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Content Moderation (AI)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-xl font-bold">{stats?.moderatedPosts}</div>
              <div className="text-xs text-muted-foreground">Posts Reviewed</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-xl font-bold">{stats?.moderatedComments}</div>
              <div className="text-xs text-muted-foreground">Comments Reviewed</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-xl font-bold">{stats?.moderatedDMs}</div>
              <div className="text-xs text-muted-foreground">DMs Reviewed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Usage Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Daily AI Messages (14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyUsage}>
                  <defs>
                    <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="messages" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorMessages)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Win Types Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              Win Types Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {winBreakdown.length > 0 ? (
              <div className="h-[200px] flex items-center">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie
                      data={winBreakdown}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={40}
                    >
                      {winBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {winBreakdown.map((item, index) => (
                    <div key={item.type} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-muted-foreground flex-1 truncate">{item.type}</span>
                      <Badge variant="secondary" className="text-xs">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No wins logged yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
