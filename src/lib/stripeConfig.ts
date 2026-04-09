// Stripe product and price mappings
// Pricing: 15-day free trial → $15/mo unlimited app access
// Add-ons: $5/mo text simulator, $5/mo detachment plan

export const STRIPE_PLANS = {
  unlimited: {
    product_id: "prod_UIMZ5IauGEL3oH",
    price_id: "price_1TJlqkCzzhGXp07l4rcCtkRB",
    name: "Unlimited",
    priceMonthly: 15,
    trialDays: 15,
  },
} as const;

export const STRIPE_ADDONS = {
  text_simulator: {
    product_id: "prod_UIMa82sEzF3PA4",
    price_id: "price_1TJlr5CzzhGXp07lQRAFpglG",
    name: "Text Simulator",
    priceMonthly: 5,
    description: "5 message exchanges per month",
  },
  detachment_plan: {
    product_id: "prod_UIPURomBJJucEc",
    price_id: "price_1TJofBCzzhGXp07lV9ove4cG",
    name: "Detachment Plan",
    priceMonthly: 5,
    description: "Monthly personalized detachment plan access",
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
  // Legacy product IDs for existing subscribers
  "prod_U5Ba2gOJLLzLpj": "unlimited",
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
