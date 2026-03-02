import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Presentation, Eye, MapPin, Clock, ExternalLink, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PitchView {
  id: string;
  viewer_ip: string | null;
  viewer_email: string | null;
  user_agent: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  viewed_at: string;
  session_id: string | null;
  slides_viewed: number | null;
}

export const PitchDeckAnalytics = () => {
  const [views, setViews] = useState<PitchView[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchViews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pitch_deck_views")
      .select("*")
      .order("viewed_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setViews(data as unknown as PitchView[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchViews(); }, []);

  const uniqueIPs = new Set(views.map(v => v.viewer_ip)).size;
  const todayViews = views.filter(v => {
    const d = new Date(v.viewed_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const getDeviceType = (ua: string | null) => {
    if (!ua) return "Unknown";
    if (/mobile|android|iphone/i.test(ua)) return "Mobile";
    if (/tablet|ipad/i.test(ua)) return "Tablet";
    return "Desktop";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Presentation className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Pitch Deck Analytics</h2>
            <p className="text-xs text-muted-foreground">Track investor engagement</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchViews} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open("/pitch-deck", "_blank")}>
            <ExternalLink className="w-4 h-4 mr-1" />
            Open Deck
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-primary">{views.length}</p>
            <p className="text-xs text-muted-foreground">Total Views</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-foreground">{uniqueIPs}</p>
            <p className="text-xs text-muted-foreground">Unique Visitors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-foreground">{todayViews}</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Recent Views
          </CardTitle>
        </CardHeader>
        <CardContent>
          {views.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No views yet. Share the pitch deck link with investors!</p>
          ) : (
            <div className="space-y-3">
              {views.map((view) => (
                <div key={view.id} className="flex items-center justify-between rounded-xl border border-border/40 p-3 bg-card/60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Eye className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {view.viewer_email || view.viewer_ip || "Anonymous"}
                        </p>
                        <Badge variant="secondary" className="text-[10px]">
                          {getDeviceType(view.user_agent)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        {(view.city || view.country) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {[view.city, view.country].filter(Boolean).join(", ")}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(view.viewed_at), { addSuffix: true })}
                        </span>
                        {view.slides_viewed && view.slides_viewed > 1 && (
                          <span>{view.slides_viewed} slides viewed</span>
                        )}
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
};
