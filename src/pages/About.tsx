import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Heart, Shield, Sparkles, Users, Target, Award } from "lucide-react";
import logo from "@/assets/logo.jpg";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background safe-area-inset">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="min-w-[44px] min-h-[44px]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">About dateBetter</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Logo & Intro */}
        <div className="flex flex-col items-center text-center space-y-4">
          <img 
            src={logo} 
            alt="dateBetter logo" 
            className="w-24 h-24 rounded-full shadow-lg ring-2 ring-primary/30 object-cover"
          />
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              dateBetter
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Data for Dating</p>
          </div>
        </div>

        {/* Mission */}
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Our Mission</h3>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              dateBetter is an AI-powered dating companion designed to help women make smarter, safer dating decisions. We combine cutting-edge artificial intelligence with research-backed relationship insights to give you clarity in your dating life.
            </p>
          </CardContent>
        </Card>

        {/* Core Values */}
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">What We Believe</h3>
          
          <div className="grid gap-3">
            <ValueCard 
              icon={Heart}
              title="Built for Women, By Women"
              description="We understand the unique challenges women face in dating. Our app prioritizes your safety, time, and emotional well-being."
            />
            <ValueCard 
              icon={Shield}
              title="Privacy First"
              description="Your dating data is deeply personal. We use industry-leading encryption and never sell your information to third parties."
            />
            <ValueCard 
              icon={Sparkles}
              title="AI That Empowers"
              description="Our D.E.V.I. (Dating Evaluation & Vetting Intelligence) provides insights, not judgments. You're always in control of your decisions."
            />
            <ValueCard 
              icon={Users}
              title="Community Support"
              description="We're more than an app – we're building a community of women who support each other in their dating journeys."
            />
          </div>
        </section>

        {/* Features */}
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">Key Features</h3>
          <ul className="space-y-2">
            <FeatureItem text="AI-powered compatibility scoring" />
            <FeatureItem text="Red flag and pattern detection" />
            <FeatureItem text="Cycle-aware dating insights" />
            <FeatureItem text="Interaction logging and analysis" />
            <FeatureItem text="Personalized relationship advice" />
            <FeatureItem text="No Contact mode support" />
          </ul>
        </section>

        {/* Team */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Our Team</h3>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              dateBetter was created by a team of relationship researchers, AI engineers, and women who were tired of the same old dating app experience. We're committed to continuously improving based on your feedback.
            </p>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="space-y-3 pt-4">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 min-h-[44px]"
            onClick={() => navigate("/privacy-policy")}
          >
            <Shield className="w-4 h-4" />
            Privacy Policy
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 min-h-[44px]"
            onClick={() => navigate("/terms")}
          >
            <Shield className="w-4 h-4" />
            Terms & Conditions
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 min-h-[44px]"
            onClick={() => navigate("/support")}
          >
            <Users className="w-4 h-4" />
            Contact Support
          </Button>
        </div>
      </main>
    </div>
  );
}

function ValueCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4 flex gap-3">
        <div className="p-2 rounded-full bg-primary/10 h-fit">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-foreground/80">
      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
      {text}
    </li>
  );
}
