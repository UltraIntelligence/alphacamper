import { NextResponse } from "next/server";
import { getVerifiedEmailFromRequest } from "@/lib/auth.server";
import { getServiceRoleSupabase } from "@/lib/supabase.server";

const CACHE_HEADERS = { "Cache-Control": "no-store" };
const TARGET_REVENUE_CENTS = 1_000_000;
const TARGET_REVENUE_CURRENCY = "usd";

const REQUIRED_STRIPE_ENV = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_SUMMER",
  "STRIPE_PRICE_YEAR",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
];

type SubscriptionRow = {
  id: string;
  product_key: string | null;
  status: string | null;
  checkout_mode: string | null;
  amount_total: number | null;
  currency: string | null;
  current_period_end: string | null;
};

type FunnelEventRow = {
  id: string;
  event_name: string | null;
};

type StripeWebhookEventRow = {
  id: string;
  event_type: string | null;
};

type WatchedTargetRow = {
  id: string;
  active: boolean | null;
};

type AvailabilityAlertRow = {
  id: string;
  claimed: boolean | null;
  notified_at: string | null;
};

type TableError = {
  message?: string;
};

type QueryResult<T> = {
  data: T[] | null;
  error: TableError | null;
};

export interface RevenueQualityResponse {
  available: boolean;
  canView: boolean;
  reason: string | null;
  operatorEmail: string | null;
  fetchedFrom: "live_supabase" | null;
  target: {
    revenue_cents: number;
    currency: string;
  };
  billing: {
    paid_passes: number;
    active_passes: number;
    summer_passes: number;
    year_passes: number;
    payment_mode_passes: number;
    subscription_mode_passes: number;
    past_due_passes: number;
    canceled_passes: number;
    gross_revenue_by_currency: Record<string, number>;
    net_revenue_by_currency: Record<string, number> | null;
    net_revenue_verified: boolean;
    webhook_events: number;
    webhook_events_by_type: Record<string, number>;
  };
  funnel: {
    total_events: number;
    sms_tapped: number;
    autofill_started: number;
    autofill_field_not_found: number;
    booking_submitted: number;
    booking_confirmed: number;
    booking_failed: number;
  };
  productOutcome: {
    total_watches: number;
    active_watches: number;
    total_alerts: number;
    delivered_alerts: number;
    claimed_alerts: number;
    unclaimed_alerts: number;
  };
  runtime: {
    stripe_env_ready: boolean;
    missing_stripe_env: string[];
  };
  blockers: string[];
}

function emptyResponse(overrides: Partial<RevenueQualityResponse> = {}): RevenueQualityResponse {
  return {
    available: false,
    canView: false,
    reason: null,
    operatorEmail: null,
    fetchedFrom: null,
    target: {
      revenue_cents: TARGET_REVENUE_CENTS,
      currency: TARGET_REVENUE_CURRENCY,
    },
    billing: {
      paid_passes: 0,
      active_passes: 0,
      summer_passes: 0,
      year_passes: 0,
      payment_mode_passes: 0,
      subscription_mode_passes: 0,
      past_due_passes: 0,
      canceled_passes: 0,
      gross_revenue_by_currency: {},
      net_revenue_by_currency: null,
      net_revenue_verified: false,
      webhook_events: 0,
      webhook_events_by_type: {},
    },
    funnel: {
      total_events: 0,
      sms_tapped: 0,
      autofill_started: 0,
      autofill_field_not_found: 0,
      booking_submitted: 0,
      booking_confirmed: 0,
      booking_failed: 0,
    },
    productOutcome: {
      total_watches: 0,
      active_watches: 0,
      total_alerts: 0,
      delivered_alerts: 0,
      claimed_alerts: 0,
      unclaimed_alerts: 0,
    },
    runtime: {
      stripe_env_ready: false,
      missing_stripe_env: REQUIRED_STRIPE_ENV,
    },
    blockers: [],
    ...overrides,
  };
}

function json(body: RevenueQualityResponse, status = 200) {
  return NextResponse.json(body, { status, headers: CACHE_HEADERS });
}

function getOperatorEmailAllowlist() {
  return (process.env.OPERATOR_EMAIL_ALLOWLIST ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

async function getOperatorEmail(request: Request) {
  try {
    return await getVerifiedEmailFromRequest(request);
  } catch {
    return null;
  }
}

function isAllowedOperator(email: string | null) {
  if (!email) return false;
  const allowlist = getOperatorEmailAllowlist();
  if (allowlist.length === 0) return false;
  return allowlist.includes(email.toLowerCase());
}

function getMissingStripeEnv() {
  return REQUIRED_STRIPE_ENV.filter((name) => !process.env[name]?.trim());
}

function incrementCount(counts: Record<string, number>, key: string | null | undefined) {
  const normalized = key?.trim() || "unknown";
  counts[normalized] = (counts[normalized] ?? 0) + 1;
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

function firstError(errors: Array<[string, TableError | null]>) {
  const failed = errors.find(([, error]) => error);
  if (!failed) return null;
  return `${failed[0]}: ${failed[1]?.message ?? "Unable to read table"}`;
}

function countFunnelEvents(events: FunnelEventRow[]): RevenueQualityResponse["funnel"] {
  return {
    total_events: events.length,
    sms_tapped: events.filter((event) => event.event_name === "sms_tapped").length,
    autofill_started: events.filter((event) => event.event_name === "autofill_started").length,
    autofill_field_not_found: events.filter((event) => event.event_name === "autofill_field_not_found").length,
    booking_submitted: events.filter((event) => event.event_name === "booking_submitted").length,
    booking_confirmed: events.filter((event) => event.event_name === "booking_confirmed").length,
    booking_failed: events.filter((event) => event.event_name === "booking_failed").length,
  };
}

export async function GET(request: Request) {
  const operatorEmail = await getOperatorEmail(request);

  if (!operatorEmail) {
    return json(emptyResponse({
      available: false,
      canView: false,
      reason: "Sign in with an approved operator account to view revenue quality.",
      operatorEmail: null,
    }), 401);
  }

  if (!isAllowedOperator(operatorEmail)) {
    return json(emptyResponse({
      available: false,
      canView: false,
      reason: "This dashboard account is not approved for operator revenue reporting.",
      operatorEmail,
    }), 403);
  }

  const missingStripeEnv = getMissingStripeEnv();

  try {
    const supabase = getServiceRoleSupabase();
    const [
      subscriptionsResult,
      funnelEventsResult,
      webhookEventsResult,
      watchesResult,
      alertsResult,
    ] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("id, product_key, status, checkout_mode, amount_total, currency, current_period_end"),
      supabase
        .from("funnel_events")
        .select("id, event_name"),
      supabase
        .from("stripe_webhook_events")
        .select("id, event_type"),
      supabase
        .from("watched_targets")
        .select("id, active"),
      supabase
        .from("availability_alerts")
        .select("id, claimed, notified_at"),
    ]) as [
      QueryResult<SubscriptionRow>,
      QueryResult<FunnelEventRow>,
      QueryResult<StripeWebhookEventRow>,
      QueryResult<WatchedTargetRow>,
      QueryResult<AvailabilityAlertRow>,
    ];

    const readError = firstError([
      ["subscriptions", subscriptionsResult.error],
      ["funnel_events", funnelEventsResult.error],
      ["stripe_webhook_events", webhookEventsResult.error],
      ["watched_targets", watchesResult.error],
      ["availability_alerts", alertsResult.error],
    ]);

    if (readError) {
      return json(emptyResponse({
        available: false,
        canView: true,
        reason: readError,
        operatorEmail,
        fetchedFrom: "live_supabase",
        runtime: {
          stripe_env_ready: missingStripeEnv.length === 0,
          missing_stripe_env: missingStripeEnv,
        },
        blockers: [readError],
      }));
    }

    const subscriptions = subscriptionsResult.data ?? [];
    const funnelEvents = funnelEventsResult.data ?? [];
    const webhookEvents = webhookEventsResult.data ?? [];
    const watches = watchesResult.data ?? [];
    const alerts = alertsResult.data ?? [];
    const activePasses = subscriptions.filter((row) => isActivePass(row));
    const grossRevenueByCurrency: Record<string, number> = {};
    const webhookEventsByType: Record<string, number> = {};

    for (const row of activePasses) {
      addCents(grossRevenueByCurrency, row.currency, row.amount_total);
    }

    for (const row of webhookEvents) {
      incrementCount(webhookEventsByType, row.event_type);
    }

    const billing: RevenueQualityResponse["billing"] = {
      paid_passes: activePasses.length,
      active_passes: activePasses.length,
      summer_passes: activePasses.filter((row) => row.product_key === "summer_pass_2026").length,
      year_passes: activePasses.filter((row) => row.product_key === "year_pass_2026").length,
      payment_mode_passes: activePasses.filter((row) => row.checkout_mode === "payment").length,
      subscription_mode_passes: activePasses.filter((row) => row.checkout_mode === "subscription").length,
      past_due_passes: subscriptions.filter((row) => row.status === "past_due").length,
      canceled_passes: subscriptions.filter((row) => row.status === "canceled").length,
      gross_revenue_by_currency: grossRevenueByCurrency,
      net_revenue_by_currency: null,
      net_revenue_verified: false,
      webhook_events: webhookEvents.length,
      webhook_events_by_type: webhookEventsByType,
    };

    const productOutcome: RevenueQualityResponse["productOutcome"] = {
      total_watches: watches.length,
      active_watches: watches.filter((row) => row.active).length,
      total_alerts: alerts.length,
      delivered_alerts: alerts.filter((row) => row.notified_at).length,
      claimed_alerts: alerts.filter((row) => row.claimed).length,
      unclaimed_alerts: alerts.filter((row) => !row.claimed).length,
    };

    const funnel = countFunnelEvents(funnelEvents);
    const blockers = [
      missingStripeEnv.length
        ? `Missing runtime Stripe env vars: ${missingStripeEnv.join(", ")}`
        : null,
      billing.paid_passes === 0 ? "No paid pass rows recorded yet." : null,
      funnel.total_events === 0 ? "No funnel events recorded yet." : null,
      productOutcome.delivered_alerts === 0 ? "No delivered availability alerts recorded yet." : null,
      "Net revenue after refunds is not verified from Stripe yet.",
    ].filter((value): value is string => Boolean(value));

    return json({
      available: true,
      canView: true,
      reason: blockers[0] ?? null,
      operatorEmail,
      fetchedFrom: "live_supabase",
      target: {
        revenue_cents: TARGET_REVENUE_CENTS,
        currency: TARGET_REVENUE_CURRENCY,
      },
      billing,
      funnel,
      productOutcome,
      runtime: {
        stripe_env_ready: missingStripeEnv.length === 0,
        missing_stripe_env: missingStripeEnv,
      },
      blockers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read revenue quality.";
    return json(emptyResponse({
      available: false,
      canView: true,
      reason: message,
      operatorEmail,
      fetchedFrom: "live_supabase",
      runtime: {
        stripe_env_ready: missingStripeEnv.length === 0,
        missing_stripe_env: missingStripeEnv,
      },
      blockers: [message],
    }));
  }
}
