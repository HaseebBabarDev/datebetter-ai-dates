import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Bot, Sparkles, Lock, Home } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const Devi = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  
  const isFree = subscription?.plan === "free";

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border safe-area-top">
        <div className="container mx-auto px-4 py-4 max-w-lg">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <Home className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold">D.E.V.I.</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Hero Section */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 mb-6">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-1">Dating Evaluation & Vetting Intelligence</h2>
            <p className="text-sm text-muted-foreground">
              Your AI-powered dating coach helping you make better decisions
            </p>
          </CardContent>
        </Card>

        {isFree ? (
          /* Locked State for Free Users */
          <Card className="border-border bg-muted/30">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Unlock D.E.V.I.</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upgrade to get personalized AI coaching, red flag detection, and dating insights tailored to your situation.
              </p>
              <div className="space-y-2 text-left mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Personalized dating advice</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Red flag analysis</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Pattern recognition insights</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Conversation coaching</span>
                </div>
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => navigate("/settings?tab=billing")}
              >
                <Sparkles className="w-4 h-4" />
                Upgrade to Unlock
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Chat Interface for Paid Users */
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">D.E.V.I. Chat Coming Soon</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We're building your personal AI dating coach. Stay tuned for personalized insights and advice!
              </p>
              <Button
                variant="outline"
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
