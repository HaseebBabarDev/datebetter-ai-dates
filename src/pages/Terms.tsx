import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, AlertCircle, Scale, Ban, CreditCard, Shield, Bot, Users, Globe } from "lucide-react";

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
          <h1 className="text-lg font-semibold text-foreground">Terms of Service</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Last Updated */}
        <p className="text-sm text-muted-foreground">Last updated: January 8, 2026</p>

        {/* Introduction */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Agreement to Terms</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            These Terms of Service ("Terms") constitute a legally binding agreement between you and IdeaaHaus, a DBA of United Transport Consulting, Inc. ("Company", "we", "our", or "us"), regarding your access to and use of the dateBetter application ("Service"). By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of these terms, you may not access the Service.
          </p>
        </section>

        {/* Beta Notice */}
        <section className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Beta Program Notice</h3>
          <p className="text-sm text-foreground/80 leading-relaxed">
            The Service is currently in beta testing. By using the Service, you acknowledge that it may contain bugs, errors, or incomplete features. You have agreed to the Beta Tester Non-Disclosure Agreement as a condition of access.
          </p>
        </section>

        {/* Eligibility */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Eligibility</h2>
          <p className="text-sm text-foreground leading-relaxed">To use the Service, you must:</p>
          <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
            <li>Be at least 18 years of age</li>
            <li>Have the legal capacity to enter into a binding agreement</li>
            <li>Provide accurate, current, and complete registration information</li>
            <li>Maintain the security and confidentiality of your account credentials</li>
            <li>Accept responsibility for all activities under your account</li>
          </ul>
        </section>

        {/* Description of Service */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Description of Service</h2>
          <p className="text-sm text-foreground leading-relaxed">
            dateBetter is an AI-powered dating companion application that provides:
          </p>
          <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
            <li>Candidate tracking and management for your dating life</li>
            <li>AI-generated compatibility analysis and insights via "Devi" AI coach</li>
            <li>Pattern recognition and behavioral analysis</li>
            <li>Red and green flag detection</li>
            <li>Menstrual cycle tracking with hormone-aware insights (optional)</li>
            <li>Community forum for anonymous peer support</li>
            <li>Interaction logging and dating history tracking</li>
          </ul>
        </section>

        {/* AI Usage */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">AI Features & Limitations</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            The Service utilizes artificial intelligence to provide personalized insights and recommendations. You acknowledge and agree that:
          </p>
          <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
            <li>AI-generated content is for informational purposes only and does not constitute professional relationship, psychological, or medical advice</li>
            <li>Compatibility scores, pattern analysis, and flag detection are algorithmic assessments and may not be accurate</li>
            <li>AI responses are generated based on the information you provide and may contain errors or biases</li>
            <li>You should exercise your own judgment in all dating and relationship decisions</li>
            <li>The Company is not responsible for decisions you make based on AI-generated content</li>
          </ul>
        </section>

        {/* Acceptable Use */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Acceptable Use</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
          </p>
          <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
            <li>Use the Service for any unlawful or fraudulent purpose</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Interfere with or disrupt the Service or its servers</li>
            <li>Upload malicious code, viruses, or harmful content</li>
            <li>Impersonate others or provide false information</li>
            <li>Use the Service to stalk, harass, or harm any person</li>
          </ul>
        </section>

        {/* Community Guidelines */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Community Guidelines</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            When using the community forum and direct messaging features, you agree to:
          </p>
          <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
            <li>Treat all users with respect and kindness</li>
            <li>Not post content that is hateful, discriminatory, or harassing</li>
            <li>Not share personal information about yourself or others that could identify dating candidates</li>
            <li>Not solicit or advertise products or services</li>
            <li>Report violations and concerning behavior</li>
          </ul>
          <p className="text-sm text-foreground/80 leading-relaxed mt-2">
            All community content is subject to AI moderation. Violations may result in content removal, account warnings, or termination.
          </p>
        </section>

        {/* Prohibited Activities */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Prohibited Activities</h2>
          </div>
          <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
            <li>Harassment, abuse, threats, or harm to other users</li>
            <li>Collecting or storing personal data about other users without consent</li>
            <li>Commercial use of the Service without express authorization</li>
            <li>Reverse engineering, decompiling, or attempting to extract source code</li>
            <li>Circumventing any access controls or usage limits</li>
            <li>Creating multiple accounts to evade restrictions</li>
            <li>Sharing account credentials with third parties</li>
          </ul>
        </section>

        {/* Subscriptions & Payments */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Subscriptions & Payments</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            The Service offers tiered subscription plans with varying features:
          </p>
          <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
            <li><strong>Free:</strong> 1 candidate, 1 interaction log per candidate</li>
            <li><strong>New to Dating:</strong> $9.99/month - 3 candidates, 5 logs each</li>
            <li><strong>Dating Often:</strong> $19.99/month - 7 candidates, 12 logs each</li>
            <li><strong>Dating More:</strong> $29.99/month - 12 candidates, 20 logs each</li>
            <li><strong>Unlimited:</strong> $39.99/month - Unlimited candidates and logs</li>
          </ul>
          <p className="text-sm text-foreground leading-relaxed mt-2">
            Annual billing is available at a 20% discount. By subscribing, you agree to:
          </p>
          <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
            <li>Pay all applicable fees as described at time of purchase</li>
            <li>Automatic renewal unless cancelled before the renewal date</li>
            <li>Price changes with 30 days advance notice</li>
          </ul>
          <p className="text-sm text-foreground/80 leading-relaxed mt-2">
            Refunds are handled according to applicable platform policies (Apple App Store, Google Play) or directly by contacting support within 7 days of purchase.
          </p>
        </section>

        {/* AI Usage Billing */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">AI Usage & Fair Use</h2>
          <p className="text-sm text-foreground leading-relaxed">
            AI features, including the Devi AI coach, are included in your subscription tier. While we do not impose hard limits on AI usage, excessive or abusive use may result in temporary rate limiting. We reserve the right to modify AI feature availability based on system capacity.
          </p>
        </section>

        {/* User Content */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">User Content</h2>
          <p className="text-sm text-foreground leading-relaxed">
            You retain ownership of content you submit to the Service, including interaction logs, notes, and forum posts. By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, process, and store such content to provide and improve the Service.
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed mt-2">
            You are solely responsible for the content you submit and represent that it does not violate any third-party rights or applicable laws.
          </p>
        </section>

        {/* Intellectual Property */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Intellectual Property</h2>
          <p className="text-sm text-foreground leading-relaxed">
            The Service, including its original content, features, functionality, branding, and AI algorithms, is owned by the Company and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. "dateBetter", "Devi", and associated logos are trademarks of IdeaaHaus.
          </p>
        </section>

        {/* Disclaimer */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Disclaimer</h2>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm text-foreground leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              dateBetter provides AI-powered insights and recommendations for informational and entertainment purposes only. We do not guarantee relationship outcomes, and our compatibility scores, pattern analysis, and flag detection are not substitutes for professional relationship counseling, therapy, or medical advice.
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              Users should exercise their own judgment in all dating and relationship decisions. The Company is not responsible for any relationship outcomes, emotional distress, or other consequences arising from use of the Service.
            </p>
          </div>
        </section>

        {/* Limitation of Liability */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Limitation of Liability</h2>
          <p className="text-sm text-foreground leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE COMPANY, ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed mt-2">
            Our total liability shall not exceed the amount you paid for the Service in the twelve (12) months preceding the claim.
          </p>
        </section>

        {/* Indemnification */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Indemnification</h2>
          <p className="text-sm text-foreground leading-relaxed">
            You agree to defend, indemnify, and hold harmless the Company from any claims, liabilities, damages, losses, or expenses, including reasonable attorneys' fees, arising from: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any third-party rights; or (d) content you submit to the Service.
          </p>
        </section>

        {/* Termination */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Termination</h2>
          <p className="text-sm text-foreground leading-relaxed">
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including but not limited to breach of these Terms. Upon termination, your right to use the Service ceases immediately.
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed mt-2">
            You may terminate your account at any time by contacting support or using the account deletion feature in Settings. Data deletion will be processed according to our Privacy Policy.
          </p>
        </section>

        {/* Governing Law */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Governing Law & Disputes</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to conflict of law provisions.
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed mt-2">
            Any disputes arising from these Terms or use of the Service shall be resolved through binding arbitration in San Diego County, California, except where prohibited by law. You waive any right to participate in class action lawsuits against the Company.
          </p>
        </section>

        {/* Severability */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Severability</h2>
          <p className="text-sm text-foreground leading-relaxed">
            If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
          </p>
        </section>

        {/* Changes */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Changes to Terms</h2>
          <p className="text-sm text-foreground leading-relaxed">
            We reserve the right to modify these Terms at any time. We will provide notice of material changes through the app or via email at least 30 days before they take effect. Your continued use of the Service after changes become effective constitutes acceptance of the revised Terms.
          </p>
        </section>

        {/* Contact */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Contact Us</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            If you have questions about these Terms, please contact us at:
          </p>
          <div className="text-sm space-y-1">
            <p className="text-primary font-medium">legal@datebetter.app</p>
            <p className="text-foreground/80">IdeaaHaus (DBA of United Transport Consulting, Inc.)</p>
            <p className="text-foreground/80">Escondido, California, USA</p>
          </div>
        </section>
      </main>
    </div>
  );
}
