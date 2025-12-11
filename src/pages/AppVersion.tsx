import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Info, Smartphone, Calendar, Code, Shield, CheckCircle } from "lucide-react";
import logo from "@/assets/logo.jpg";

const APP_VERSION = "1.0.0";
const BUILD_NUMBER = "1";
const BUILD_DATE = "December 11, 2025";

export default function AppVersion() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background safe-area-inset">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="min-w-[44px] min-h-[44px]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">App Version</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Logo & Version */}
        <div className="flex flex-col items-center text-center space-y-4 py-6">
          <img 
            src={logo} 
            alt="dateBetter logo" 
            className="w-24 h-24 rounded-full shadow-lg ring-2 ring-primary/30 object-cover"
          />
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              dateBetter
            </h2>
            <p className="text-lg text-foreground font-medium mt-1">Version {APP_VERSION}</p>
            <p className="text-sm text-muted-foreground">Build {BUILD_NUMBER}</p>
          </div>
        </div>

        {/* Version Info */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              Version Information
            </h3>
            
            <div className="space-y-3">
              <InfoRow 
                icon={Smartphone}
                label="App Version"
                value={APP_VERSION}
              />
              <InfoRow 
                icon={Code}
                label="Build Number"
                value={BUILD_NUMBER}
              />
              <InfoRow 
                icon={Calendar}
                label="Release Date"
                value={BUILD_DATE}
              />
              <InfoRow 
                icon={Shield}
                label="Platform"
                value="iOS / iPadOS"
              />
            </div>
          </CardContent>
        </Card>

        {/* What's New */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-base font-semibold text-foreground">What's New in {APP_VERSION}</h3>
            <ul className="space-y-2">
              <UpdateItem text="Initial release" />
              <UpdateItem text="AI-powered compatibility scoring" />
              <UpdateItem text="Cycle-aware dating insights" />
              <UpdateItem text="Red flag detection" />
              <UpdateItem text="Interaction logging" />
              <UpdateItem text="No Contact mode support" />
            </ul>
          </CardContent>
        </Card>

        {/* System Requirements */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-base font-semibold text-foreground">System Requirements</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• iOS 14.0 or later</li>
              <li>• iPadOS 14.0 or later</li>
              <li>• Requires internet connection</li>
              <li>• 50 MB available storage</li>
            </ul>
          </CardContent>
        </Card>

        {/* Acknowledgments */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-base font-semibold text-foreground">Acknowledgments</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              dateBetter uses open-source software components. We're grateful to the developers and communities who make their work freely available.
            </p>
          </CardContent>
        </Card>

        {/* Copyright */}
        <div className="text-center space-y-1 pt-4">
          <p className="text-xs text-muted-foreground">
            © 2025 dateBetter. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with ❤️ for women everywhere
          </p>
        </div>
      </main>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function UpdateItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-foreground/80">
      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
      {text}
    </li>
  );
}
