import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, Database, Trash2, Mail } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background safe-area-inset">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="min-w-[44px] min-h-[44px]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Privacy Policy</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Last Updated */}
        <p className="text-sm text-muted-foreground">Last updated: December 11, 2025</p>

        {/* Introduction */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Your Privacy Matters</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            dateBetter ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
          </p>
        </section>

        {/* Information We Collect */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Information We Collect</h2>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Personal Information</h3>
            <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
              <li>Email address and account credentials</li>
              <li>Profile information you provide (name, preferences, dating goals)</li>
              <li>Dating history and interaction logs you enter</li>
              <li>Menstrual cycle data (if you choose to track)</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Usage Information</h3>
            <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
              <li>App usage patterns and feature interactions</li>
              <li>Device information and operating system</li>
              <li>Crash reports and performance data</li>
            </ul>
          </div>
        </section>

        {/* How We Use Your Information */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">How We Use Your Information</h2>
          </div>
          <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
            <li>To provide and maintain our service</li>
            <li>To generate personalized compatibility insights and recommendations</li>
            <li>To detect patterns and potential red flags in your dating life</li>
            <li>To improve and optimize our app</li>
            <li>To communicate with you about updates and support</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        {/* Data Security */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Data Security</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            We implement industry-standard security measures including encryption, secure HTTPS connections, and access controls. Your sensitive data is stored securely and never shared with third parties for marketing purposes.
          </p>
        </section>

        {/* Data Retention & Deletion */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Data Retention & Deletion</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            You can request deletion of your data at any time through the app's Settings page. Upon account deletion, all personal data will be permanently removed within 30 days.
          </p>
        </section>

        {/* No Tracking Without Consent */}
        <section className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm text-foreground font-medium">
            ✓ We do not track you without your explicit consent.
          </p>
          <p className="text-sm text-foreground/80 mt-1">
            We comply with Apple's App Tracking Transparency framework. You will always be asked before any tracking occurs.
          </p>
        </section>

        {/* Third-Party Services */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Third-Party Services</h2>
          <p className="text-sm text-foreground leading-relaxed">
            We use secure third-party services for authentication, data storage, and payment processing. These services have their own privacy policies and are GDPR/CCPA compliant.
          </p>
        </section>

        {/* Children's Privacy */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Children's Privacy</h2>
          <p className="text-sm text-foreground leading-relaxed">
            Our service is not intended for users under the age of 18. We do not knowingly collect personal information from children.
          </p>
        </section>

        {/* Contact */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Contact Us</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            If you have questions about this Privacy Policy, please contact us at:
          </p>
          <p className="text-sm text-primary font-medium">privacy@datebetter.app</p>
        </section>

        {/* Changes */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Changes to This Policy</h2>
          <p className="text-sm text-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>
      </main>
    </div>
  );
}
