import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Heart, 
  Loader2, 
  RefreshCw,
  Users,
  Activity,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

interface CandidateStats {
  total: number;
  byStatus: Record<string, number>;
  withScores: number;
  avgScore: number;
  totalInteractions: number;
  interactionsThisWeek: number;
}

interface CandidateData {
  id: string;
  nickname: string;
  status: string;
  compatibility_score: number | null;
  created_at: string;
  user_name?: string;
  red_flags_count: number;
  green_flags_count: number;
  interactions_count: number;
}

export function AdminCandidatesSection() {
  const [stats, setStats] = useState<CandidateStats | null>(null);
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidatesData();
  }, []);

  const fetchCandidatesData = async () => {
    setLoading(true);
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Fetch all candidates
      const { data: candidatesData, error } = await supabase
        .from("candidates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch interactions count
      const { data: interactionsData } = await supabase
        .from("interactions")
        .select("candidate_id");

      const interactionCounts = new Map<string, number>();
      interactionsData?.forEach(i => {
        interactionCounts.set(i.candidate_id, (interactionCounts.get(i.candidate_id) || 0) + 1);
      });

      // Fetch user names
      const userIds = [...new Set(candidatesData?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", userIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

      // Calculate stats
      const byStatus: Record<string, number> = {};
      let withScores = 0;
      let totalScore = 0;

      candidatesData?.forEach(c => {
        byStatus[c.status || "unknown"] = (byStatus[c.status || "unknown"] || 0) + 1;
        if (c.compatibility_score !== null) {
          withScores++;
          totalScore += c.compatibility_score;
        }
      });

      // Recent interactions
      const { count: recentInteractions } = await supabase
        .from("interactions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString());

      setStats({
        total: candidatesData?.length || 0,
        byStatus,
        withScores,
        avgScore: withScores > 0 ? Math.round(totalScore / withScores) : 0,
        totalInteractions: interactionsData?.length || 0,
        interactionsThisWeek: recentInteractions || 0
      });

      // Enrich candidates data
      const enrichedCandidates = candidatesData?.slice(0, 50).map(c => ({
        id: c.id,
        nickname: c.nickname,
        status: c.status || "unknown",
        compatibility_score: c.compatibility_score,
        created_at: c.created_at,
        user_name: profilesMap.get(c.user_id) || "Unknown",
        red_flags_count: Array.isArray(c.red_flags) ? c.red_flags.length : 0,
        green_flags_count: Array.isArray(c.green_flags) ? c.green_flags.length : 0,
        interactions_count: interactionCounts.get(c.id) || 0
      })) || [];

      setCandidates(enrichedCandidates);
    } catch (error) {
      console.error("Error fetching candidates data:", error);
      toast.error("Failed to load candidates data");
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      just_matched: "bg-blue-500/10 text-blue-600",
      chatting: "bg-purple-500/10 text-purple-600",
      first_date: "bg-pink-500/10 text-pink-600",
      dating: "bg-rose-500/10 text-rose-600",
      exclusive: "bg-red-500/10 text-red-600",
      serious: "bg-orange-500/10 text-orange-600",
      archived: "bg-gray-500/10 text-gray-600",
      no_contact: "bg-slate-500/10 text-slate-600"
    };
    return colors[status] || "bg-gray-500/10 text-gray-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Candidates Analytics</h2>
          <p className="text-muted-foreground">Overview of all candidates across the platform</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchCandidatesData}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Avg Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.avgScore}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Interactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalInteractions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.interactionsThisWeek}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                With Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.withScores}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Active Dating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {(stats.byStatus.dating || 0) + (stats.byStatus.exclusive || 0) + (stats.byStatus.serious || 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Breakdown */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <Badge 
                  key={status} 
                  variant="secondary" 
                  className={`${getStatusColor(status)} text-sm py-1 px-3`}
                >
                  {status.replace(/_/g, " ")}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Candidates List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Candidates</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No candidates found</p>
          ) : (
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {candidates.map((candidate) => (
                <div key={candidate.id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium text-sm">{candidate.nickname}</p>
                        <Badge variant="secondary" className={getStatusColor(candidate.status)}>
                          {candidate.status.replace(/_/g, " ")}
                        </Badge>
                        {candidate.compatibility_score !== null && (
                          <Badge variant="outline">
                            {candidate.compatibility_score}% match
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>User: {candidate.user_name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          {candidate.red_flags_count} red flags
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          {candidate.green_flags_count} green flags
                        </span>
                        <span>•</span>
                        <span>{candidate.interactions_count} interactions</span>
                        <span>•</span>
                        <span>Added {new Date(candidate.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
