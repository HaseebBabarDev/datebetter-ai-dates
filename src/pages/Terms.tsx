import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, AlertCircle, Scale, Ban, CreditCard, Shield } from "lucide-react";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background safe-area-inset">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="min-w-[44px] min-h-[44px]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Terms & Conditions</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Last Updated */}
        <p className="text-sm text-muted-foreground">Last updated: December 11, 2025</p>

        {/* Introduction */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Agreement to Terms</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            By accessing or using dateBetter, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access the service.
          </p>
        </section>

        {/* Eligibility */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Eligibility</h2>
          <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
            <li>You must be at least 18 years old to use this service</li>
            <li>You must provide accurate and complete information</li>
            <li>You are responsible for maintaining account security</li>
          </ul>
        </section>

        {/* Use of Service */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Acceptable Use</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            You agree to use dateBetter only for lawful purposes and in accordance with these Terms. You agree not to:
          </p>
          <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
            <li>Use the service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to any part of the service</li>
            <li>Interfere with or disrupt the service</li>
            <li>Upload malicious code or content</li>
            <li>Impersonate others or provide false information</li>
          </ul>
        </section>

        {/* Prohibited Activities */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Prohibited Activities</h2>
          </div>
          <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
            <li>Harassment, abuse, or harm to other users</li>
            <li>Collecting or storing personal data about other users</li>
            <li>Commercial use without authorization</li>
            <li>Reverse engineering or attempting to extract source code</li>
          </ul>
        </section>

        {/* Subscription & Payments */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Subscriptions & Payments</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            Some features require a paid subscription. By subscribing, you agree to:
          </p>
          <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
            <li>Pay all applicable fees as described at time of purchase</li>
            <li>Automatic renewal unless cancelled before the renewal date</li>
            <li>Manage subscriptions through your Apple App Store account</li>
          </ul>
          <p className="text-sm text-foreground/80 leading-relaxed mt-2">
            Refunds are handled according to Apple's App Store refund policies.
          </p>
        </section>

        {/* Intellectual Property */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Intellectual Property</h2>
          <p className="text-sm text-foreground leading-relaxed">
            The service, including its original content, features, and functionality, is owned by dateBetter and is protected by international copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        {/* Disclaimer */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Disclaimer</h2>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-foreground leading-relaxed">
              dateBetter provides AI-powered insights and recommendations for informational purposes only. We do not guarantee relationship outcomes, and our compatibility scores are not professional advice. Users should exercise their own judgment in dating decisions.
            </p>
          </div>
        </section>

        {/* Limitation of Liability */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Limitation of Liability</h2>
          <p className="text-sm text-foreground leading-relaxed">
            To the maximum extent permitted by law, dateBetter shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
          </p>
        </section>

        {/* Indemnification */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Indemnification</h2>
          <p className="text-sm text-foreground leading-relaxed">
            You agree to defend, indemnify, and hold harmless dateBetter from any claims, liabilities, damages, or expenses arising from your use of the service or violation of these Terms.
          </p>
        </section>

        {/* Termination */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Termination</h2>
          <p className="text-sm text-foreground leading-relaxed">
            We may terminate or suspend your account immediately, without prior notice, for conduct that violates these Terms or is harmful to other users or the service.
          </p>
        </section>

        {/* Governing Law */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Governing Law</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law provisions.
          </p>
        </section>

        {/* Changes */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Changes to Terms</h2>
          <p className="text-sm text-foreground leading-relaxed">
            We reserve the right to modify these Terms at any time. We will provide notice of significant changes through the app or via email.
          </p>
        </section>

        {/* Contact */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Contact Us</h2>
          <p className="text-sm text-foreground leading-relaxed">
            Questions about these Terms? Contact us at:
          </p>
          <p className="text-sm text-primary font-medium">legal@datebetter.app</p>
        </section>
      </main>
    </div>
  );
}
