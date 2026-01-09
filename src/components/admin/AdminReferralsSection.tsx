import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Gift, 
  Loader2, 
  RefreshCw,
  CheckCircle2,
  Users,
  TrendingUp
} from "lucide-react";

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string | null;
  referral_code: string;
  status: string;
  trial_granted: boolean;
  created_at: string;
  converted_at: string | null;
  referrer_name?: string;
  referred_name?: string;
}

interface ReferralStats {
  total: number;
  pending: number;
  converted: number;
  trialsGranted: number;
}

export function AdminReferralsSection() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [grantingTrial, setGrantingTrial] = useState<string | null>(null);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get profiles for referrers and referred users
      const userIds = new Set<string>();
      data?.forEach(r => {
        userIds.add(r.referrer_id);
        if (r.referred_id) userIds.add(r.referred_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", Array.from(userIds));

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

      const enrichedReferrals = data?.map(r => ({
        ...r,
        referrer_name: profilesMap.get(r.referrer_id) || "Unknown",
        referred_name: r.referred_id ? profilesMap.get(r.referred_id) || "Unknown" : null
      })) || [];

      setReferrals(enrichedReferrals);

      // Calculate stats
      const pending = data?.filter(r => r.status === "pending").length || 0;
      const converted = data?.filter(r => r.status === "converted").length || 0;
      const trialsGranted = data?.filter(r => r.trial_granted).length || 0;

      setStats({
        total: data?.length || 0,
        pending,
        converted,
        trialsGranted
      });
    } catch (error) {
      console.error("Error fetching referrals:", error);
      toast.error("Failed to load referrals");
    } finally {
      setLoading(false);
    }
  };

  const handleGrantTrial = async (referralId: string, referrerId: string) => {
    setGrantingTrial(referralId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-manage-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ targetUserId: referrerId, trialDays: 30 }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to grant trial");
      }

      // Mark referral as trial granted
      await supabase
        .from("referrals")
        .update({ trial_granted: true })
        .eq("id", referralId);

      toast.success("1 month free trial granted to referrer!");
      fetchReferrals();
    } catch (error) {
      console.error("Error granting trial:", error);
      toast.error(error instanceof Error ? error.message : "Failed to grant trial");
    } finally {
      setGrantingTrial(null);
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
          <h2 className="text-2xl font-bold">Referral Program</h2>
          <p className="text-muted-foreground">Manage referrals and grant trial rewards</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchReferrals}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Total Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Converted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.converted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Trials Granted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.trialsGranted}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Referrals</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No referrals yet</p>
          ) : (
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {referrals.map((referral) => (
                <div key={referral.id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium text-sm">
                          {referral.referrer_name} → {referral.referred_name || "Pending"}
                        </p>
                        <Badge 
                          variant={referral.status === "converted" ? "default" : "secondary"}
                          className={`text-xs ${referral.status === "converted" ? "bg-green-500/10 text-green-600" : ""}`}
                        >
                          {referral.status}
                        </Badge>
                        {referral.trial_granted && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Trial Granted
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Code: {referral.referral_code}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(referral.created_at).toLocaleDateString()}
                        {referral.converted_at && ` • Converted: ${new Date(referral.converted_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    {referral.status === "converted" && !referral.trial_granted && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGrantTrial(referral.id, referral.referrer_id)}
                        disabled={grantingTrial === referral.id}
                        className="text-xs"
                      >
                        {grantingTrial === referral.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Gift className="w-3 h-3 mr-1" />
                            Grant Trial
                          </>
                        )}
                      </Button>
                    )}
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
