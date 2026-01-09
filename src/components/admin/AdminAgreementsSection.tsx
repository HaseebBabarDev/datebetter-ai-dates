import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  ScrollText, 
  Loader2, 
  RefreshCw,
  CheckCircle2,
  FileText,
  Users
} from "lucide-react";

interface Agreement {
  id: string;
  user_id: string;
  agreement_type: string;
  agreement_version: string;
  accepted_at: string;
  ip_address: string | null;
  user_name?: string;
}

interface AgreementStats {
  total: number;
  byType: Record<string, number>;
  todayCount: number;
}

export function AdminAgreementsSection() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [stats, setStats] = useState<AgreementStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("user_agreements")
        .select("*")
        .order("accepted_at", { ascending: false });

      if (error) throw error;

      // Get profiles for users
      const userIds = new Set<string>();
      data?.forEach(a => userIds.add(a.user_id));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", Array.from(userIds));

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

      const enrichedAgreements = data?.map(a => ({
        ...a,
        user_name: profilesMap.get(a.user_id) || "Unknown"
      })) || [];

      setAgreements(enrichedAgreements);

      // Calculate stats
      const byType: Record<string, number> = {};
      let todayCount = 0;

      data?.forEach(a => {
        byType[a.agreement_type] = (byType[a.agreement_type] || 0) + 1;
        if (new Date(a.accepted_at) >= today) {
          todayCount++;
        }
      });

      setStats({
        total: data?.length || 0,
        byType,
        todayCount
      });
    } catch (error) {
      console.error("Error fetching agreements:", error);
      toast.error("Failed to load agreements");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Legal Agreements</h2>
          <p className="text-muted-foreground">Track NDA and terms acceptance</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchAgreements}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <ScrollText className="w-4 h-4" />
                Total Agreements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.todayCount}</p>
            </CardContent>
          </Card>
          {Object.entries(stats.byType).map(([type, count]) => (
            <Card key={type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {type.replace(/_/g, " ")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{count}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Agreements List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Agreements ({agreements.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {agreements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No agreements yet</p>
          ) : (
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {agreements.map((agreement) => (
                <div key={agreement.id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium text-sm">{agreement.user_name}</p>
                        <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {agreement.agreement_type.replace(/_/g, ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          v{agreement.agreement_version}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Accepted: {new Date(agreement.accepted_at).toLocaleString()}
                        {agreement.ip_address && ` • IP: ${agreement.ip_address}`}
                      </p>
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
