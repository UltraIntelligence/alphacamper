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
      funnelEventsCount: null,
      webhookEventsCount: null,
      error: null,
    };
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const [subscriptions, funnelEvents, webhookEvents] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id, product_key, status, checkout_mode, amount_total, currency", {
        count: "exact",
        head: true,
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

  let status: SmokeStatus = "green";
  if (supabase.error || stripe.error) {
    status = "red";
  } else if (
    !supabase.configured ||
    supabase.subscriptionsCount === null ||
    supabase.funnelEventsCount === null ||
    supabase.webhookEventsCount === null ||
    !vercel.configured ||
    missingVercelEnv.length > 0 ||
    !priceTypesKnown ||
    !priceTypesAreOneTime
  ) {
    status = "yellow";
  }

  printLine("Status", status);
  printLine("Supabase direct read", supabase.configured ? "configured" : "missing env");
  printLine("Subscriptions rows", supabase.subscriptionsCount);
  printLine("Funnel event rows", supabase.funnelEventsCount);
  printLine("Webhook event rows", supabase.webhookEventsCount);
  printLine("Supabase error", supabase.error);
  printLine("Vercel env readable", vercel.configured ? "yes" : "no");
  printLine("Missing Vercel Stripe env", missingVercelEnv.length ? missingVercelEnv.join(", ") : "none");
  printLine("Vercel env error", vercel.error);
  printLine("Local Stripe price check", stripe.configured ? "configured" : "missing local Stripe env");
  printLine("Summer price type", stripe.summerType);
  printLine("Year price type", stripe.yearType);
  printLine("Stripe error", stripe.error);

  if (status === "green") {
    console.log("\nNext action: prove one checkout/webhook path and add the operator revenue view.");
    process.exit(0);
  }

  console.log("\nNext action: configure production Stripe env vars, verify one-time price ids, then rerun billing smoke.");
  process.exit(status === "yellow" && options.allowYellow ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
