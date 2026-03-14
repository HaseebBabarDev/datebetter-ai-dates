// Stripe product and price mappings
// These are LIVE Stripe IDs - do not modify unless products are recreated

export const STRIPE_PLANS = {
  basic: {
    product_id: "prod_U5BaepUGcVqsIg",
    price_id: "price_1T71D3CzzhGXp07lLETuuc6P",
    name: "Starter",
    priceMonthly: 9.99,
  },
  starter: {
    product_id: "prod_U5Ba3aovhb68xI",
    price_id: "price_1T71DJCzzhGXp07lK69zDge2",
    name: "Plus",
    priceMonthly: 15.99,
  },
  unlimited: {
    product_id: "prod_U5Ba2gOJLLzLpj",
    price_id: "price_1T71DbCzzhGXp07lewyKASiz",
    name: "Unlimited",
    priceMonthly: 29.99,
  },
} as const;

export const STRIPE_ONE_TIME = {
  day_pass: {
    product_id: "prod_U5Bbl0QcKZpiRt",
    price_id: "price_1T71DqCzzhGXp07lBIS2VUyc",
    name: "Day Pass",
    price: 5.99,
  },
  detachment_plan: {
    product_id: "prod_U5BbMHiR1wNAAm",
    price_id: "price_1T71E7CzzhGXp07lh3Iyg7nf",
    name: "Detachment Plan",
    price: 9.99,
  },
} as const;

// Map Stripe product IDs back to internal plan names
export const PRODUCT_ID_TO_PLAN: Record<string, string> = {
  [STRIPE_PLANS.basic.product_id]: "basic",
  [STRIPE_PLANS.starter.product_id]: "starter",
  [STRIPE_PLANS.unlimited.product_id]: "unlimited",
};

// Publishable key for client-side use
export const STRIPE_PUBLISHABLE_KEY = "pk_live_51SG2rgCzzhGXp07lsbr5JkFbn6E1OEo1DCkZw7TxYlQwBRkzBX0Qm13GslRbTI53YAJnoAFNGnfeUHy0OjoBnrga004G5gFKQq";
