import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Heart, 
  MessageSquare, 
  Brain, 
  TrendingUp, 
  Calendar,
  Activity,
  Shield,
  Loader2,
  FlaskConical,
  UserCheck
} from "lucide-react";
import { useTesterFilter } from "@/hooks/useTesterFilter";

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
  internalUsers: number;
  externalUsers: number;
}

export function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { filter: testerFilter, setFilter: setTesterFilter } = useTesterFilter();

  useEffect(() => {
    fetchStats();
  }, [testerFilter]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        console.error("No auth token available");
        setLoading(false);
        return;
      }

      const response = await supabase.functions.invoke("admin-overview-stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: { testerFilter },
      });

      if (response.error) {
        console.error("Error fetching overview stats:", response.error);
        return;
      }

      const data = response.data;
      if (data?.stats) {
        setStats({
          totalUsers: data.stats.totalUsers || 0,
          adminUsers: data.stats.adminUsers || 0,
          totalCandidates: data.stats.totalCandidates || 0,
          totalInteractions: data.stats.totalInteractions || 0,
          totalConversations: data.stats.totalConversations || 0,
          totalMessages: data.stats.totalMessages || 0,
          totalPosts: data.stats.totalPosts || 0,
          totalComments: data.stats.totalComments || 0,
          newUsersToday: data.stats.newUsersToday || 0,
          newUsersThisWeek: data.stats.newUsersThisWeek || 0,
          activeUsersToday: 0,
          internalUsers: data.stats.internalUsers || 0,
          externalUsers: data.stats.externalUsers || 0,
        });
      }
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
      title: "Internal Testers", 
      value: stats.internalUsers, 
      icon: FlaskConical, 
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10"
    },
    { 
      title: "External Testers", 
      value: stats.externalUsers, 
      icon: UserCheck, 
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Dashboard Overview</h2>
          <p className="text-muted-foreground">
            {testerFilter === 'all' ? 'All users' : testerFilter === 'internal' ? 'Internal testers only' : 'External testers only'}
          </p>
        </div>
        
        {/* Tester Type Filter */}
        <Tabs value={testerFilter} onValueChange={(v) => setTesterFilter(v as 'all' | 'internal' | 'external')}>
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5">
              <Users className="w-3.5 h-3.5" />
              All
            </TabsTrigger>
            <TabsTrigger value="internal" className="gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" />
              Internal
            </TabsTrigger>
            <TabsTrigger value="external" className="gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              External
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
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
