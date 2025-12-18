import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Bot, Sparkles, Lock, Home, Heart, MessageCircle, Brain, Shield } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const Devi = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  
  const isFree = subscription?.plan === "free";

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[image:var(--gradient-page)]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-[image:var(--gradient-page)] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[image:var(--gradient-header)] backdrop-blur-xl border-b border-border/50 safe-area-top">
        <div className="container mx-auto px-4 py-4 max-w-lg">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="rounded-xl hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/dashboard")}
              className="rounded-xl hover:bg-primary/10"
            >
              <Home className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[image:var(--gradient-hero)] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
                D.E.V.I.
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        {/* Hero Section */}
        <Card className="border-primary/20 bg-[image:var(--gradient-glass)] backdrop-blur-sm overflow-hidden">
          <CardContent className="p-6 text-center relative">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-secondary/10 rounded-full blur-2xl" />
            
            <div className="relative">
              <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-[image:var(--gradient-hero)] flex items-center justify-center shadow-[var(--shadow-glow)]">
                <Sparkles className="w-10 h-10 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-foreground">
                Dating Evaluation & Vetting Intelligence
              </h2>
              <p className="text-sm text-muted-foreground">
                Your AI-powered dating coach helping you make better decisions
              </p>
            </div>
          </CardContent>
        </Card>

        {isFree ? (
          /* Locked State for Free Users */
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                  <Lock className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Unlock D.E.V.I.</h3>
                <p className="text-sm text-muted-foreground">
                  Upgrade for personalized AI coaching and red flag detection
                </p>
              </div>
              
              <div className="space-y-3 mb-6">
                {[
                  { icon: MessageCircle, label: "Personalized dating advice" },
                  { icon: Shield, label: "Red flag analysis" },
                  { icon: Brain, label: "Pattern recognition insights" },
                  { icon: Heart, label: "Compatibility coaching" },
                ].map((feature, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <feature.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{feature.label}</span>
                  </div>
                ))}
              </div>
              
              <Button
                className="w-full h-12 rounded-xl bg-[image:var(--gradient-hero)] hover:opacity-90 transition-all shadow-[var(--shadow-soft)]"
                onClick={() => navigate("/settings?tab=billing")}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade to Unlock
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Chat Interface for Paid Users */
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">D.E.V.I. Chat Coming Soon</h3>
              <p className="text-sm text-muted-foreground mb-6">
                We're building your personal AI dating coach. Stay tuned for personalized insights!
              </p>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Devi;
