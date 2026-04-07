// Stripe product and price mappings
// New pricing: 15-day free trial → $15/mo unlimited app access
// Add-ons: $5/mo text simulator, $5 one-time detachment plan

export const STRIPE_PLANS = {
  unlimited: {
    product_id: "prod_U5Ba2gOJLLzLpj",
    price_id: "price_1T71DbCzzhGXp07lewyKASiz",
    name: "Unlimited",
    priceMonthly: 15,
    trialDays: 15,
  },
} as const;

export const STRIPE_ADDONS = {
  text_simulator: {
    product_id: "prod_U5BaepUGcVqsIg",
    price_id: "price_1T71D3CzzhGXp07lLETuuc6P",
    name: "Text Simulator",
    priceMonthly: 5,
    description: "5 message exchanges per month",
  },
  detachment_plan: {
    product_id: "prod_U5BbMHiR1wNAAm",
    price_id: "price_1T71E7CzzhGXp07lh3Iyg7nf",
    name: "Detachment Plan",
    price: 5,
    description: "One-time personalized detachment plan",
  },
} as const;

// Legacy mappings kept for backward compatibility
export const STRIPE_ONE_TIME = {
  day_pass: {
    product_id: "prod_U5Bbl0QcKZpiRt",
    price_id: "price_1T71DqCzzhGXp07lBIS2VUyc",
    name: "Day Pass",
    price: 5.99,
  },
  detachment_plan: STRIPE_ADDONS.detachment_plan,
} as const;

// Map Stripe product IDs back to internal plan names
export const PRODUCT_ID_TO_PLAN: Record<string, string> = {
  [STRIPE_PLANS.unlimited.product_id]: "unlimited",
};

// Free trial configuration
export const FREE_TRIAL = {
  durationDays: 15,
  features: [
    "Full D.E.V.I. chat access",
    "Unlimited candidates",
    "AI scoring & insights",
    "Pattern detection",
    "Community access",
  ],
} as const;

// Publishable key for client-side use
export const STRIPE_PUBLISHABLE_KEY = "pk_live_51SG2rgCzzhGXp07lsbr5JkFbn6E1OEo1DCkZw7TxYlQwBRkzBX0Qm13GslRbTI53YAJnoAFNGnfeUHy0OjoBnrga004G5gFKQq";
