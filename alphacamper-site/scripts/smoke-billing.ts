/// <reference types="node" />
/**
 * Secret-safe billing smoke checker.
 *
 * It checks the live billing/conversion tables, whether production Vercel has
 * the required Stripe variable names, and whether locally available Stripe
 * price ids are one-time prices. It never prints secret values.
 *
 * Usage:
 *   npm run smoke:billing
 *   npm run smoke:billing -- --allow-yellow
 */

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const REQUIRED_VERCEL_STRIPE_ENV = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_SUMMER",
  "STRIPE_PRICE_YEAR",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
];

type SmokeStatus = "green" | "yellow" | "red";

type Options = {
  allowYellow: boolean;
  skipVercel: boolean;
};

type SubscriptionRow = {
  product_key: string | null;
  status: string | null;
  checkout_mode: string | null;
  amount_total: number | null;
  currency: string | null;
  current_period_end: string | null;
};

export type BillingSummary = {
  paidPasses: number;
  summerPasses: number;
  yearPasses: number;
  paymentModePasses: number;
  subscriptionModePasses: number;
  pastDuePasses: number;
  canceledPasses: number;
  grossRevenueByCurrency: Record<string, number>;
};

export type BillingSmokeStatusInput = {
  supabaseError: string | null;
  stripeError: string | null;
  supabaseConfigured: boolean;
  subscriptionsCount: number | null;
  funnelEventsCount: number | null;
  webhookEventsCount: number | null;
  vercelConfigured: boolean;
  missingVercelEnvCount: number;
  priceTypesKnown: boolean;
  priceTypesAreOneTime: boolean;
  paidPasses: number | null;
  netRefundReportingVerified: boolean;
};

function parseArgs(argv: string[]): Options {
  const options: Options = {
    allowYellow: false,
    skipVercel: false,
  };

  for (const arg of argv) {
    if (arg === "--allow-yellow") {
      options.allowYellow = true;
      continue;
    }
    if (arg === "--skip-vercel") {
      options.skipVercel = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function loadLocalEnv() {
  if (existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
  }
  if (!process.env.SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  }
}

function printLine(label: string, value: string | number | boolean | null | undefined) {
  console.log(`${label.padEnd(28)} ${value ?? "none"}`);
}

function formatCentsByCurrency(totals: Record<string, number>) {
  const entries = Object.entries(totals);
  if (entries.length === 0) return "none";

  return entries
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([currency, cents]) => `${currency.toUpperCase()} ${(cents / 100).toFixed(2)}`)
    .join(", ");
}

function addCents(total: Record<string, number>, currency: string | null, amount: number | null) {
  if (typeof amount !== "number" || amount <= 0) return;
  const normalizedCurrency = currency?.trim().toLowerCase() || "unknown";
  total[normalizedCurrency] = (total[normalizedCurrency] ?? 0) + amount;
}

function isActivePass(row: SubscriptionRow, now = Date.now()) {
  if (row.status !== "active") return false;
  if (!row.current_period_end) return true;
  const endTime = new Date(row.current_period_end).getTime();
  return !Number.isNaN(endTime) && endTime > now;
}

export function summarizeBillingRows(rows: SubscriptionRow[], now = Date.now()): BillingSummary {
  const activePasses = rows.filter((row) => isActivePass(row, now));
  const grossRevenueByCurrency: Record<string, number> = {};

  for (const row of activePasses) {
    addCents(grossRevenueByCurrency, row.currency, row.amount_total);
  }

  return {
    paidPasses: activePasses.length,
    summerPasses: activePasses.filter((row) => row.product_key === "summer_pass_2026").length,
    yearPasses: activePasses.filter((row) => row.product_key === "year_pass_2026").length,
    paymentModePasses: activePasses.filter((row) => row.checkout_mode === "payment").length,
    subscriptionModePasses: activePasses.filter((row) => row.checkout_mode === "subscription").length,
    pastDuePasses: rows.filter((row) => row.status === "past_due").length,
    canceledPasses: rows.filter((row) => row.status === "canceled").length,
    grossRevenueByCurrency,
  };
}

export function evaluateBillingSmokeStatus(input: BillingSmokeStatusInput): SmokeStatus {
  if (input.supabaseError || input.stripeError) {
    return "red";
  }

  const checkoutWebhookProof =
    (input.paidPasses ?? 0) > 0 && (input.webhookEventsCount ?? 0) > 0;

  if (
    !input.supabaseConfigured ||
    input.subscriptionsCount === null ||
    input.funnelEventsCount === null ||
    input.webhookEventsCount === null ||
    !input.vercelConfigured ||
    input.missingVercelEnvCount > 0 ||
    !input.priceTypesKnown ||
    !input.priceTypesAreOneTime ||
    !checkoutWebhookProof ||
    !input.netRefundReportingVerified
  ) {
    return "yellow";
  }

  return "green";
}

function runVercelEnvList(): {
  configured: boolean;
  error: string | null;
  names: Set<string>;
} {
  const result = spawnSync("vercel", ["env", "ls", "production"], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 2,
  });

  if (result.status !== 0) {
    return {
      configured: false,
      error: `${result.stdout}\n${result.stderr}`.trim() || "vercel env ls failed",
      names: new Set(),
    };
  }

  const names = new Set<string>();
  for (const line of result.stdout.split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Z0-9_]+)\s+/);
    if (match) names.add(match[1]);
  }

  return {
    configured: true,
    error: null,
    names,
  };
}

async function checkSupabaseBillingTables(): Promise<{
  configured: boolean;
  subscriptionsCount: number | null;
  billingSummary: BillingSummary | null;
  funnelEventsCount: number | null;
  webhookEventsCount: number | null;
  error: string | null;
}> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return {
      configured: false,
      subscriptionsCount: null,
      billingSummary: null,
      funnelEventsCount: null,
      webhookEventsCount: null,
      error: null,
    };
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const [subscriptions, funnelEvents, webhookEvents] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id, product_key, status, checkout_mode, amount_total, currency, current_period_end", {
        count: "exact",
      }),
    supabase
      .from("funnel_events")
      .select("id, event_name", { count: "exact", head: true }),
    supabase
      .from("stripe_webhook_events")
      .select("id, event_type", { count: "exact", head: true }),
  ]);

  const error =
    subscriptions.error?.message ??
    funnelEvents.error?.message ??
    webhookEvents.error?.message ??
    null;

  return {
    configured: true,
    subscriptionsCount: subscriptions.count ?? null,
    billingSummary: subscriptions.data
      ? summarizeBillingRows(subscriptions.data as SubscriptionRow[])
      : null,
    funnelEventsCount: funnelEvents.count ?? null,
    webhookEventsCount: webhookEvents.count ?? null,
    error,
  };
}

async function checkLocalStripePrices(): Promise<{
  configured: boolean;
  summerType: string | null;
  yearType: string | null;
  error: string | null;
}> {
  const secret = process.env.STRIPE_SECRET_KEY;
  const summerPriceId = process.env.STRIPE_PRICE_SUMMER;
  const yearPriceId = process.env.STRIPE_PRICE_YEAR;

  if (!secret || !summerPriceId || !yearPriceId) {
    return {
      configured: false,
      summerType: null,
      yearType: null,
      error: null,
    };
  }

  try {
    const stripe = new Stripe(secret);
    const [summer, year] = await Promise.all([
      stripe.prices.retrieve(summerPriceId),
      stripe.prices.retrieve(yearPriceId),
    ]);

    return {
      configured: true,
      summerType: summer.type,
      yearType: year.type,
      error: null,
    };
  } catch (error) {
    return {
      configured: true,
      summerType: null,
      yearType: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  loadLocalEnv();

  console.log("Billing Smoke");

  const supabase = await checkSupabaseBillingTables();
  const vercel = options.skipVercel
    ? { configured: false, error: "skipped", names: new Set<string>() }
    : runVercelEnvList();
  const stripe = await checkLocalStripePrices();

  const missingVercelEnv = options.skipVercel
    ? []
    : REQUIRED_VERCEL_STRIPE_ENV.filter((name) => !vercel.names.has(name));
  const priceTypesKnown = stripe.configured && !stripe.error;
  const priceTypesAreOneTime =
    priceTypesKnown && stripe.summerType === "one_time" && stripe.yearType === "one_time";
  const checkoutWebhookProof =
    (supabase.billingSummary?.paidPasses ?? 0) > 0 &&
    (supabase.webhookEventsCount ?? 0) > 0;
  const netRefundReportingVerified = false;
  const status = evaluateBillingSmokeStatus({
    supabaseError: supabase.error,
    stripeError: stripe.error,
    supabaseConfigured: supabase.configured,
    subscriptionsCount: supabase.subscriptionsCount,
    funnelEventsCount: supabase.funnelEventsCount,
    webhookEventsCount: supabase.webhookEventsCount,
    vercelConfigured: vercel.configured,
    missingVercelEnvCount: missingVercelEnv.length,
    priceTypesKnown,
    priceTypesAreOneTime,
    paidPasses: supabase.billingSummary?.paidPasses ?? null,
    netRefundReportingVerified,
  });

  printLine("Status", status);
  printLine("Supabase direct read", supabase.configured ? "configured" : "missing env");
  printLine("Subscriptions rows", supabase.subscriptionsCount);
  printLine("Paid active passes", supabase.billingSummary?.paidPasses);
  printLine("Summer passes", supabase.billingSummary?.summerPasses);
  printLine("Year passes", supabase.billingSummary?.yearPasses);
  printLine("Payment-mode passes", supabase.billingSummary?.paymentModePasses);
  printLine("Gross app revenue", supabase.billingSummary ? formatCentsByCurrency(supabase.billingSummary.grossRevenueByCurrency) : null);
  printLine("Funnel event rows", supabase.funnelEventsCount);
  printLine("Webhook event rows", supabase.webhookEventsCount);
  printLine("Checkout/webhook proof", checkoutWebhookProof ? "yes" : "no");
  printLine("Net/refund reporting", netRefundReportingVerified ? "verified" : "not verified");
  printLine("Supabase error", supabase.error);
  printLine("Vercel env readable", vercel.configured ? "yes" : "no");
  printLine("Missing Vercel Stripe env", missingVercelEnv.length ? missingVercelEnv.join(", ") : "none");
  printLine("Vercel env error", vercel.error);
  printLine("Local Stripe price check", stripe.configured ? "configured" : "missing local Stripe env");
  printLine("Summer price type", stripe.summerType);
  printLine("Year price type", stripe.yearType);
  printLine("Stripe error", stripe.error);

  if (status === "green") {
    console.log("\nNext action: revenue proof is green; keep monitoring weekly gross/net revenue.");
    process.exit(0);
  }

  if (missingVercelEnv.length > 0 || !priceTypesKnown || !priceTypesAreOneTime) {
    console.log("\nNext action: configure production Stripe env vars, verify one-time price ids, then rerun billing smoke.");
  } else if (!checkoutWebhookProof) {
    console.log("\nNext action: prove one real checkout/webhook path, then rerun billing smoke.");
  } else {
    console.log("\nNext action: wire Stripe-side net/refund reporting before calling the $10k scoreboard green.");
  }
  process.exit(status === "yellow" && options.allowYellow ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
