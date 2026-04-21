import Stripe from "stripe";

export type CheckoutProduct = "summer" | "year";
export type ProductKey = "summer_pass_2026" | "year_pass_2026";

interface BillingProductConfig {
  priceEnvVar: "STRIPE_PRICE_SUMMER" | "STRIPE_PRICE_YEAR";
  productKey: ProductKey;
}

const BILLING_PRODUCTS: Record<CheckoutProduct, BillingProductConfig> = {
  summer: {
    priceEnvVar: "STRIPE_PRICE_SUMMER",
    productKey: "summer_pass_2026",
  },
  year: {
    priceEnvVar: "STRIPE_PRICE_YEAR",
    productKey: "year_pass_2026",
  },
};

const PRODUCT_KEYS = new Set<ProductKey>([
  "summer_pass_2026",
  "year_pass_2026",
]);

let stripeClient: Stripe | null = null;

function getStripeSecretKey(): string {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return secretKey;
}

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey());
  }

  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  }

  return secret;
}

export function resolveBillingProduct(product: unknown) {
  if (product !== "summer" && product !== "year") {
    return null;
  }

  const config = BILLING_PRODUCTS[product];
  const priceId = process.env[config.priceEnvVar]?.trim();

  if (!priceId) {
    throw new Error(`Missing ${config.priceEnvVar}`);
  }

  return {
    product,
    productKey: config.productKey,
    priceId,
  };
}

export function isProductKey(value: unknown): value is ProductKey {
  return typeof value === "string" && PRODUCT_KEYS.has(value as ProductKey);
}
