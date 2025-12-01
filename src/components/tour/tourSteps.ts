import { TourStep } from "./TourContext";

export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='add-candidate']",
    title: "Add New Candidates",
    description: "Start tracking someone new you're dating. Add their basic info and we'll help you evaluate compatibility.",
    placement: "bottom",
  },
  {
    target: "[data-tour='log-interaction']",
    title: "Log Interactions",
    description: "Keep track of your dates, calls, and texts. This helps identify patterns and red flags over time.",
    placement: "bottom",
  },
  {
    target: "[data-tour='cycle-status']",
    title: "Cycle Awareness",
    description: "If enabled, we'll show your cycle phase to help you make decisions at the right time.",
    placement: "bottom",
  },
  {
    target: "[data-tour='candidates-list']",
    title: "Your Candidates",
    description: "All the people you're currently dating or considering. Tap any card to see detailed insights.",
    placement: "top",
  },
  {
    target: "[data-tour='settings']",
    title: "Settings & Preferences",
    description: "Customize your profile, dating preferences, and app settings here.",
    placement: "bottom",
  },
];

export const CANDIDATE_DETAIL_TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='quick-log']",
    title: "Log Interactions",
    description: "Track your dates, calls, texts, and more. Logging helps identify patterns over time.",
    placement: "bottom",
  },
  {
    target: "[data-tour='insights-tab']",
    title: "D.E.V.I. Insights",
    description: "Get personalized compatibility scores and advice based on your interactions and preferences.",
    placement: "bottom",
  },
  {
    target: "[data-tour='history-tab']",
    title: "Interaction History",
    description: "View all your logged interactions and track the progression of your connection.",
    placement: "bottom",
  },
  {
    target: "[data-tour='flags-tab']",
    title: "Red & Green Flags",
    description: "D.E.V.I. analyzes your interactions and notes to automatically detect red flags (warning signs) and green flags (positive indicators). Stay informed about potential issues early.",
    placement: "bottom",
  },
  {
    target: "[data-tour='nc-tab']",
    title: "No Contact Mode",
    description: "If you need space, activate No Contact to track your healing journey.",
    placement: "bottom",
  },
];
