import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, getStripeWebhookSecret, isProductKey, type ProductKey } from "@/lib/stripe";
import { getServiceRoleSupabase } from "@/lib/supabase.server";

export const runtime = "nodejs";

type SubscriptionStatus = "active" | "canceled" | "past_due";

function normalizeStripeString(value: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  return typeof value === "string" ? value : value?.id ?? null;
}

function mapSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  if (status === "active" || status === "trialing") {
    return "active";
  }

  if (status === "canceled") {
    return "canceled";
  }

  return "past_due";
}

function toIsoDate(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds) {
    return null;
  }

  return new Date(unixSeconds * 1000).toISOString();
}

function resolveProductKey(metadata: Record<string, string> | null | undefined): ProductKey | null {
  const rawValue = metadata?.product_key;
  return isProductKey(rawValue) ? rawValue : null;
}

async function processCheckoutCompleted(event: Stripe.CheckoutSessionCompletedEvent) {
  const session = event.data.object;
  const userId = session.metadata?.user_id ?? session.client_reference_id;
  if (!userId) {
    throw new Error("Missing user_id on checkout session");
  }

  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (!subscriptionId) {
    throw new Error("Missing subscription id on checkout session");
  }

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const productKey = resolveProductKey(session.metadata) ?? resolveProductKey(subscription.metadata);
  if (!productKey) {
    throw new Error("Missing product_key on checkout session");
  }

  const supabase = getServiceRoleSupabase();
  const { error } = await supabase
    .from("subscriptions")
    .upsert({
      user_id: userId,
      stripe_customer_id: normalizeStripeString(session.customer),
      stripe_subscription_id: subscription.id,
      product_key: productKey,
      status: mapSubscriptionStatus(subscription.status),
      current_period_end: toIsoDate(subscription.current_period_end),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id",
    });

  if (error) {
    throw new Error(error.message);
  }
}

async function processSubscriptionChange(subscription: Stripe.Subscription) {
  const supabase = getServiceRoleSupabase();
  const { data: existingSubscription, error: lookupError } = await supabase
    .from("subscriptions")
    .select("user_id, product_key")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  const userId = existingSubscription?.user_id ?? subscription.metadata.user_id;
  if (!userId) {
    throw new Error(`Missing user_id for subscription ${subscription.id}`);
  }

  const productKey = existingSubscription?.product_key ?? resolveProductKey(subscription.metadata);
  if (!productKey) {
    throw new Error(`Missing product_key for subscription ${subscription.id}`);
  }

  const { error } = await supabase
    .from("subscriptions")
    .upsert({
      user_id: userId,
      stripe_customer_id: normalizeStripeString(subscription.customer),
      stripe_subscription_id: subscription.id,
      product_key: productKey,
      status: mapSubscriptionStatus(subscription.status),
      current_period_end: toIsoDate(subscription.current_period_end),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id",
    });

  if (error) {
    throw new Error(error.message);
  }
}

async function processStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await processCheckoutCompleted(event as Stripe.CheckoutSessionCompletedEvent);
      break;
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await processSubscriptionChange(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const payload = await request.text();
    event = getStripe().webhooks.constructEvent(payload, signature, getStripeWebhookSecret());
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Invalid Stripe webhook",
    }, { status: 400 });
  }

  const supabase = getServiceRoleSupabase();
  const { data: existingEvent, error: lookupError } = await supabase
    .from("stripe_webhook_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (lookupError) {
    console.error("[stripe webhook] Failed to look up event", lookupError);
    return NextResponse.json({ error: "Unable to process webhook" }, { status: 500 });
  }

  if (existingEvent) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    const { error: reserveError } = await supabase
      .from("stripe_webhook_events")
      .insert({
        id: event.id,
        event_type: event.type,
      });

    if (reserveError) {
      if (reserveError.code === "23505") {
        return NextResponse.json({ received: true, duplicate: true });
      }

      throw new Error(reserveError.message);
    }

    try {
      await processStripeEvent(event);
    } catch (processingError) {
      await supabase
        .from("stripe_webhook_events")
        .delete()
        .eq("id", event.id);
      throw processingError;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe webhook] Failed to process event", error);
    return NextResponse.json({ error: "Unable to process webhook" }, { status: 500 });
  }
}
