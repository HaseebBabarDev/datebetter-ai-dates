import { TourStep } from "./TourContext";

export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='add-candidate']",
    title: "Add New Candidates",
    description: "Start tracking someone you're dating. Add their info and D.E.V.I. will help you evaluate compatibility and spot patterns.",
    placement: "bottom",
  },
  {
    target: "[data-tour='log-interaction']",
    title: "Log Your Interactions",
    description: "Record dates, calls, and texts to build a clear picture. This helps identify red flags and green flags over time.",
    placement: "bottom",
  },
  {
    target: "[data-tour='view-patterns']",
    title: "View Your Patterns",
    description: "Discover trends in your dating behaviors. See what types you're drawn to and learn from your relationship history.",
    placement: "bottom",
  },
  {
    target: "[data-tour='cycle-status']",
    title: "Cycle Awareness",
    description: "Track your hormone cycle to understand how it affects your dating decisions. Make clearer choices at the right time.",
    placement: "bottom",
  },
  {
    target: "[data-tour='candidates-list']",
    title: "Your Dating Pool",
    description: "See everyone you're currently dating or considering. Tap any card for detailed insights and compatibility scores.",
    placement: "top",
  },
  {
    target: "[data-tour='settings']",
    title: "Personalize Your Experience",
    description: "Update your profile, dating preferences, and notification settings to get the most accurate insights.",
    placement: "bottom",
  },
];

export const CANDIDATE_DETAIL_TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='quick-log']",
    title: "Quick Logging",
    description: "Log dates, calls, texts, and more with one tap. Consistent logging helps D.E.V.I. give you better advice.",
    placement: "bottom",
  },
  {
    target: "[data-tour='ask-devi-cta']",
    title: "Ask D.E.V.I.",
    description: "Got questions about this person? Ask D.E.V.I. for personalized advice based on their profile and your interactions.",
    placement: "bottom",
  },
  {
    target: "[data-tour='insights-tab']",
    title: "Compatibility Insights",
    description: "See your compatibility score and get personalized advice based on your interactions and preferences.",
    placement: "bottom",
  },
  {
    target: "[data-tour='overview-tab']",
    title: "Profile Overview",
    description: "View and edit their profile details, notes, and key information you've gathered about them.",
    placement: "bottom",
  },
  {
    target: "[data-tour='history-tab']",
    title: "Interaction Timeline",
    description: "Review all your logged interactions to track the progression of your connection over time.",
    placement: "bottom",
  },
  {
    target: "[data-tour='flags-tab']",
    title: "Red & Green Flags",
    description: "D.E.V.I. automatically analyzes your notes to detect warning signs and positive indicators. Stay informed early.",
    placement: "bottom",
  },
  {
    target: "[data-tour='nc-tab']",
    title: "No Contact Mode",
    description: "Need space to heal? Activate No Contact to track your journey and get daily encouragement.",
    placement: "bottom",
  },
];

export const DEVI_TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='devi-input']",
    title: "Ask D.E.V.I. Anything",
    description: "Type your dating questions here. D.E.V.I. knows your preferences and can give personalized advice.",
    placement: "top",
  },
  {
    target: "[data-tour='devi-candidate-select']",
    title: "Select a Candidate",
    description: "Choose who you're asking about to get context-specific advice based on their profile and your interactions.",
    placement: "bottom",
  },
  {
    target: "[data-tour='devi-image-upload']",
    title: "Share Screenshots",
    description: "Upload text screenshots, dating profiles, or Instagram profiles for D.E.V.I. to analyze.",
    placement: "bottom",
  },
  {
    target: "[data-tour='devi-history']",
    title: "Conversation History",
    description: "Access your past conversations with D.E.V.I. Chats are saved for 30 days.",
    placement: "bottom",
  },
];

export const COMMUNITY_TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='community-post']",
    title: "Share Your Story",
    description: "Create posts to share experiences, ask for advice, or celebrate wins. Your screen name keeps you anonymous.",
    placement: "bottom",
  },
  {
    target: "[data-tour='community-forum']",
    title: "Browse the Forum",
    description: "Read posts from others going through similar experiences. Filter by category or city.",
    placement: "bottom",
  },
  {
    target: "[data-tour='community-messages']",
    title: "Direct Messages",
    description: "Connect privately with community members for support and advice.",
    placement: "bottom",
  },
];

export const SETTINGS_TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='settings-account']",
    title: "Your Account",
    description: "Update your personal information, photo, and identity details here.",
    placement: "bottom",
  },
  {
    target: "[data-tour='settings-preferences']",
    title: "Dating Preferences",
    description: "Fine-tune your dealbreakers, relationship goals, and what you're looking for in a partner.",
    placement: "bottom",
  },
  {
    target: "[data-tour='settings-billing']",
    title: "Subscription & Billing",
    description: "Manage your plan, see your limits, and upgrade for more features.",
    placement: "bottom",
  },
];