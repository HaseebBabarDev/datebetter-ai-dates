import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CandidateCard } from "@/components/thread/CandidateCard";
import { cn } from "@/lib/utils";

type Candidate = Tables<"candidates">;

type SortKey = "score" | "recent" | "status";

const STATUS_PRIORITY: Record<string, number> = {
  getting_serious: 1,
  exclusive: 2,
  official: 3,
  dating: 4,
  first_date: 5,
  talking: 6,
  just_matched: 7,
  complicated: 8,
  on_hold: 9,
  ghosted: 10,
  ended: 11,
};

const CandidatesView = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("recent");

  useEffect(() => {
    if (!user?.id) return;

    const fetchCandidates = async () => {
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (!error && data) setCandidates(data);
      setLoading(false);
    };

    fetchCandidates();

    // Realtime updates
    const channel = supabase
      .channel("candidates-view")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "candidates", filter: `user_id=eq.${user.id}` },
        () => { fetchCandidates(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const filtered = useMemo(() => {
    let list = candidates;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.nickname.toLowerCase().includes(q));
    }

    return [...list].sort((a, b) => {
      if (sortBy === "score") {
        return (b.compatibility_score ?? 0) - (a.compatibility_score ?? 0);
      }
      if (sortBy === "status") {
        const pa = STATUS_PRIORITY[a.status || ""] ?? 99;
        const pb = STATUS_PRIORITY[b.status || ""] ?? 99;
        return pa - pb;
      }
      // recent
      return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
    });
  }, [candidates, search, sortBy]);

  if (!authLoading && !user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background pb-[calc(env(safe-area-inset-bottom)+7rem)]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 pt-safe-top">
        <div className="flex items-center justify-between py-3">
          <h1 className="text-xl font-bold">Candidates</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => navigate("/devi")}
            >
              <Sparkles className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              className="h-9 gap-1.5 rounded-xl bg-[image:var(--gradient-hero)]"
              onClick={() => navigate("/add-candidate")}
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        </div>

        {/* Search + Sort */}
        <div className="flex items-center gap-2 pb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search candidates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl bg-muted/50 border-border/50"
            />
          </div>
          <div className="flex border border-border/60 rounded-lg overflow-hidden">
            {(["recent", "score", "status"] as SortKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={cn(
                  "px-2.5 py-1.5 text-[10px] font-medium capitalize transition-colors",
                  sortBy === key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">No candidates yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Add your first candidate to get AI-powered dating insights and compatibility scores
              </p>
            </div>
            <Button
              className="gap-2 rounded-xl bg-[image:var(--gradient-hero)]"
              onClick={() => navigate("/add-candidate")}
            >
              <Plus className="w-4 h-4" />
              Add Your First Candidate
            </Button>
          </div>
        ) : (
          filtered.map((c) => (
            <CandidateCard
              key={c.id}
              id={c.id}
              nickname={c.nickname}
              photoUrl={c.photo_url}
              compatibilityScore={c.compatibility_score}
              status={c.status}
              updatedAt={c.updated_at}
              latestInsight={c.ai_description}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CandidatesView;
