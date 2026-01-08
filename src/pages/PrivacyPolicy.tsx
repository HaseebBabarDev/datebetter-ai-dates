import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, Database, Trash2, Mail, Bot, Users, Globe, FileText } from "lucide-react";

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
        <p className="text-sm text-muted-foreground">Last updated: January 8, 2026</p>

        {/* Introduction */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Your Privacy Matters</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            IdeaaHaus, a DBA of United Transport Consulting, Inc. ("Company", "we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the dateBetter application ("Service").
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">
            We understand that dating and relationship data is deeply personal. We have designed our Service with privacy as a core principle.
          </p>
        </section>

        {/* Information We Collect */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Information We Collect</h2>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Account Information</h3>
            <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
              <li>Email address for account creation and communication</li>
              <li>Authentication credentials (securely hashed)</li>
              <li>Optional PIN for quick login (stored encrypted)</li>
              <li>Screen name for community features (optional)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Profile Information</h3>
            <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
              <li>Name, age, location (city/country)</li>
              <li>Gender identity, pronouns, and sexual orientation</li>
              <li>Dating preferences and relationship goals</li>
              <li>Attachment style and communication preferences</li>
              <li>Values, beliefs, and lifestyle preferences</li>
              <li>Mental health awareness and therapy status (optional)</li>
              <li>Profile photo (stored securely)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Dating Activity Data</h3>
            <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
              <li>Candidate profiles you create (nicknames, attributes, notes)</li>
              <li>Interaction logs (dates, communication, feelings)</li>
              <li>Red and green flags you identify</li>
              <li>Compatibility assessments and AI-generated insights</li>
              <li>No-contact tracking data</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Health & Wellness Data (Optional)</h3>
            <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
              <li>Menstrual cycle tracking (last period date, cycle length)</li>
              <li>Cycle regularity and hormone profile indicators</li>
            </ul>
            <p className="text-xs text-foreground/60 ml-4 mt-1">
              This data is only collected if you opt-in to cycle tracking features.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">AI Conversation Data</h3>
            <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
              <li>Conversations with Devi AI coach</li>
              <li>Questions, concerns, and context you share</li>
              <li>AI-generated responses and recommendations</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Community Data</h3>
            <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
              <li>Forum posts, comments, and likes</li>
              <li>Direct messages with other users</li>
              <li>User reports and blocks</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Technical & Usage Data</h3>
            <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
              <li>Device type, operating system, and browser</li>
              <li>IP address and general location</li>
              <li>App usage patterns and feature interactions</li>
              <li>Crash reports and performance data</li>
              <li>Agreement acceptance timestamps</li>
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
            <li>To provide, maintain, and improve the Service</li>
            <li>To generate personalized AI-powered compatibility insights and recommendations</li>
            <li>To detect patterns, red flags, and behavioral trends in your dating life</li>
            <li>To provide hormone-aware insights based on cycle tracking (if enabled)</li>
            <li>To enable community features and user interactions</li>
            <li>To moderate content and enforce community guidelines</li>
            <li>To communicate with you about updates, support, and security</li>
            <li>To process subscriptions and payments</li>
            <li>To comply with legal obligations</li>
            <li>To analyze aggregate usage to improve the Service</li>
          </ul>
        </section>

        {/* AI Processing */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">AI Processing & Data Use</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            Your data is processed by AI systems to provide personalized insights. Specifically:
          </p>
          <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
            <li>Profile and preference data is used to calculate compatibility scores</li>
            <li>Interaction logs are analyzed to detect patterns and potential red/green flags</li>
            <li>Conversations with Devi are processed to provide contextual advice</li>
            <li>Forum content is processed for moderation purposes</li>
          </ul>
          <p className="text-sm text-foreground/80 leading-relaxed mt-2">
            AI processing is performed using secure cloud infrastructure. We do not use your personal data to train general AI models. Your conversations and data remain private to your account.
          </p>
        </section>

        {/* Data Sharing */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Data Sharing</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            We do not sell your personal data. We may share your information only in the following circumstances:
          </p>
          <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
            <li><strong>Service Providers:</strong> Trusted third parties that help us operate the Service (hosting, authentication, AI processing, payment processing)</li>
            <li><strong>Community Features:</strong> Screen names and forum posts are visible to other users (not your profile or dating data)</li>
            <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect rights and safety</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
          </ul>
        </section>

        {/* Third-Party Services */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Third-Party Services</h2>
          <p className="text-sm text-foreground leading-relaxed">
            The Service integrates with the following categories of third-party services:
          </p>
          <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
            <li><strong>Cloud Infrastructure:</strong> Secure cloud hosting and database services</li>
            <li><strong>Authentication:</strong> Secure login and session management</li>
            <li><strong>AI Services:</strong> Large language models for generating insights and recommendations</li>
            <li><strong>Payment Processing:</strong> Secure payment handling (we do not store credit card details)</li>
            <li><strong>Analytics:</strong> Aggregate usage analytics to improve the Service</li>
          </ul>
          <p className="text-sm text-foreground/80 leading-relaxed mt-2">
            All third-party services are vetted for security and privacy compliance.
          </p>
        </section>

        {/* Data Security */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Data Security</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            We implement industry-standard security measures to protect your data:
          </p>
          <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
            <li>All data transmitted over HTTPS encryption</li>
            <li>Data at rest encrypted in secure cloud infrastructure</li>
            <li>Row-level security ensuring users can only access their own data</li>
            <li>Authentication credentials securely hashed</li>
            <li>Optional PIN login with client-side encryption</li>
            <li>Regular security audits and monitoring</li>
          </ul>
          <p className="text-sm text-foreground/80 leading-relaxed mt-2">
            While we take extensive precautions, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security.
          </p>
        </section>

        {/* Data Retention & Deletion */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Data Retention & Deletion</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            We retain your data for as long as your account is active or as needed to provide the Service. You may:
          </p>
          <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
            <li>Delete individual candidates, interactions, or conversations at any time</li>
            <li>Request export of your data by contacting support</li>
            <li>Delete your entire account through Settings or by contacting support</li>
          </ul>
          <p className="text-sm text-foreground/80 leading-relaxed mt-2">
            Upon account deletion, all personal data will be permanently removed within 30 days, except where retention is required by law or for legitimate business purposes (e.g., fraud prevention, legal claims).
          </p>
        </section>

        {/* Your Rights */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Your Privacy Rights</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            Depending on your jurisdiction, you may have the following rights:
          </p>
          <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
            <li><strong>Correction:</strong> Request correction of inaccurate personal data</li>
            <li><strong>Deletion:</strong> Request deletion of your personal data</li>
            <li><strong>Portability:</strong> Request transfer of your data in a machine-readable format</li>
            <li><strong>Objection:</strong> Object to certain types of processing</li>
            <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
          </ul>
          <p className="text-sm text-foreground/80 leading-relaxed mt-2">
            To exercise these rights, contact us at privacy@datebetter.app. We will respond within 30 days.
          </p>
        </section>

        {/* California Privacy Rights */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">California Privacy Rights (CCPA)</h2>
          <p className="text-sm text-foreground leading-relaxed">
            California residents have additional rights under the California Consumer Privacy Act (CCPA):
          </p>
          <ul className="text-sm text-foreground/80 space-y-1 ml-4 list-disc">
            <li>Right to know what personal information is collected and how it's used</li>
            <li>Right to delete personal information</li>
            <li>Right to opt-out of the sale of personal information (we do not sell your data)</li>
            <li>Right to non-discrimination for exercising your rights</li>
          </ul>
        </section>

        {/* International Users */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">International Users</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            The Service is operated from the United States. If you are accessing the Service from outside the United States, your information will be transferred to and processed in the United States, which may have different data protection laws than your jurisdiction.
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed mt-2">
            For users in the European Economic Area (EEA), UK, or other jurisdictions with data protection laws, we rely on legitimate interests and contractual necessity as legal bases for processing. You may contact us about data transfer mechanisms.
          </p>
        </section>

        {/* No Tracking Without Consent */}
        <section className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
          <p className="text-sm text-foreground font-medium">
            ✓ We do not track you without your explicit consent.
          </p>
          <p className="text-sm text-foreground/80">
            We comply with Apple's App Tracking Transparency framework and similar regulations. We do not engage in cross-app tracking or share your data with advertisers.
          </p>
        </section>

        {/* Children's Privacy */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Children's Privacy</h2>
          <p className="text-sm text-foreground leading-relaxed">
            The Service is not intended for users under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child under 18, we will promptly delete such information.
          </p>
        </section>

        {/* Changes */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Changes to This Policy</h2>
          <p className="text-sm text-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of material changes through the app or via email at least 30 days before they take effect. The "Last updated" date at the top indicates when the policy was last revised.
          </p>
        </section>

        {/* Contact */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Contact Us</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us at:
          </p>
          <div className="text-sm space-y-1">
            <p className="text-primary font-medium">privacy@datebetter.app</p>
            <p className="text-foreground/80">IdeaaHaus (DBA of United Transport Consulting, Inc.)</p>
            <p className="text-foreground/80">Escondido, California, USA</p>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed mt-2">
            For general support inquiries, contact support@datebetter.app.
          </p>
        </section>
      </main>
    </div>
  );
}
