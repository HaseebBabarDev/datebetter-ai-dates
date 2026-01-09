import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Heart, 
  MessageSquare, 
  Brain, 
  TrendingUp, 
  Calendar,
  Activity,
  Shield,
  Loader2
} from "lucide-react";

interface OverviewStats {
  totalUsers: number;
  adminUsers: number;
  totalCandidates: number;
  totalInteractions: number;
  totalConversations: number;
  totalMessages: number;
  totalPosts: number;
  totalComments: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  activeUsersToday: number;
}

export function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Fetch all stats in parallel
      const [
        usersResult,
        adminRolesResult,
        candidatesResult,
        interactionsResult,
        conversationsResult,
        messagesResult,
        postsResult,
        commentsResult,
        newUsersTodayResult,
        newUsersWeekResult
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin"),
        supabase.from("candidates").select("*", { count: "exact", head: true }),
        supabase.from("interactions").select("*", { count: "exact", head: true }),
        supabase.from("devi_conversations").select("*", { count: "exact", head: true }),
        supabase.from("devi_messages").select("*", { count: "exact", head: true }),
        supabase.from("forum_posts").select("*", { count: "exact", head: true }),
        supabase.from("forum_comments").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString())
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        adminUsers: adminRolesResult.count || 0,
        totalCandidates: candidatesResult.count || 0,
        totalInteractions: interactionsResult.count || 0,
        totalConversations: conversationsResult.count || 0,
        totalMessages: messagesResult.count || 0,
        totalPosts: postsResult.count || 0,
        totalComments: commentsResult.count || 0,
        newUsersToday: newUsersTodayResult.count || 0,
        newUsersThisWeek: newUsersWeekResult.count || 0,
        activeUsersToday: 0 // Would need activity tracking
      });
    } catch (error) {
      console.error("Error fetching overview stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { 
      title: "Total Users", 
      value: stats.totalUsers, 
      icon: Users, 
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    { 
      title: "Admin Users", 
      value: stats.adminUsers, 
      icon: Shield, 
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    { 
      title: "New Users Today", 
      value: stats.newUsersToday, 
      icon: TrendingUp, 
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    { 
      title: "New Users This Week", 
      value: stats.newUsersThisWeek, 
      icon: Calendar, 
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    { 
      title: "Total Candidates", 
      value: stats.totalCandidates, 
      icon: Heart, 
      color: "text-pink-500",
      bgColor: "bg-pink-500/10"
    },
    { 
      title: "Total Interactions", 
      value: stats.totalInteractions, 
      icon: Activity, 
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10"
    },
    { 
      title: "D.E.V.I. Conversations", 
      value: stats.totalConversations, 
      icon: Brain, 
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10"
    },
    { 
      title: "D.E.V.I. Messages", 
      value: stats.totalMessages, 
      icon: MessageSquare, 
      color: "text-violet-500",
      bgColor: "bg-violet-500/10"
    },
    { 
      title: "Forum Posts", 
      value: stats.totalPosts, 
      icon: MessageSquare, 
      color: "text-rose-500",
      bgColor: "bg-rose-500/10"
    },
    { 
      title: "Forum Comments", 
      value: stats.totalComments, 
      icon: MessageSquare, 
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard Overview</h2>
        <p className="text-muted-foreground">
          Real-time statistics across all dateBetter systems
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <span className="truncate">{stat.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
