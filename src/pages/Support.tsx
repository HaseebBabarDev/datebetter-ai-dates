import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Mail, MessageCircle, HelpCircle, Bug, Lightbulb, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function Support() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.message || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setLoading(false);
    setSubmitted(true);
    toast.success("Your message has been sent!");
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background safe-area-inset">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="min-w-[44px] min-h-[44px]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Support</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center text-center">
          <div className="p-4 rounded-full bg-green-500/10 mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Message Sent!</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Thank you for reaching out. We'll get back to you within 24-48 hours.
          </p>
          <Button onClick={() => navigate("/dashboard")} className="min-h-[44px]">
            Back to App
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-area-inset">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="min-w-[44px] min-h-[44px]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Support</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Quick Help */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">How can we help?</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickHelpCard 
              icon={HelpCircle}
              title="FAQ"
              description="Common questions"
            />
            <QuickHelpCard 
              icon={Bug}
              title="Report Bug"
              description="Technical issues"
            />
            <QuickHelpCard 
              icon={Lightbulb}
              title="Suggestion"
              description="Feature requests"
            />
            <QuickHelpCard 
              icon={MessageCircle}
              title="General"
              description="Other inquiries"
            />
          </div>
        </section>

        {/* Contact Form */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Contact Us</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Question</SelectItem>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="account">Account Issue</SelectItem>
                    <SelectItem value="billing">Billing / Subscription</SelectItem>
                    <SelectItem value="privacy">Privacy Concern</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Describe your issue or question..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={5}
                  className="min-h-[100px]"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full gap-2 min-h-[44px]"
                disabled={loading}
              >
                {loading ? "Sending..." : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Direct Contact */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <h3 className="text-sm font-medium text-foreground">Prefer email?</h3>
            <p className="text-sm text-muted-foreground">
              Reach us directly at:
            </p>
            <a 
              href="mailto:support@datebetter.app" 
              className="text-sm text-primary font-medium"
            >
              support@datebetter.app
            </a>
          </CardContent>
        </Card>

        {/* Response Time */}
        <p className="text-xs text-center text-muted-foreground">
          We typically respond within 24-48 hours during business days.
        </p>
      </main>
    </div>
  );
}

function QuickHelpCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <Card className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
      <CardContent className="p-3 flex flex-col items-center text-center gap-2">
        <div className="p-2 rounded-full bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
