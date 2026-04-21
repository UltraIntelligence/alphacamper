import { NextResponse } from "next/server";
import { getVerifiedIdentityFromRequest } from "@/lib/auth.server";
import { getTrustedOrigin } from "@/lib/site-url";
import { getStripe, resolveBillingProduct } from "@/lib/stripe";
import { getServiceRoleSupabase } from "@/lib/supabase.server";

export async function POST(request: Request) {
  try {
    const identity = await getVerifiedIdentityFromRequest(request);
    if (!identity || identity.authKind !== "supabase") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const billingProduct = resolveBillingProduct(body.product);
    if (!billingProduct) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }

    const supabase = getServiceRoleSupabase();
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", identity.userId)
      .maybeSingle();

    const origin = getTrustedOrigin();
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: billingProduct.priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/checkout?product=${billingProduct.product}&canceled=true`,
      client_reference_id: identity.userId,
      customer: existingSubscription?.stripe_customer_id ?? undefined,
      customer_email: existingSubscription?.stripe_customer_id ? undefined : identity.email,
      metadata: {
        user_id: identity.userId,
        product_key: billingProduct.productKey,
      },
      subscription_data: {
        metadata: {
          user_id: identity.userId,
          product_key: billingProduct.productKey,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Checkout session URL missing" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[checkout] Failed to create checkout session", error);
    return NextResponse.json({ error: "Unable to start checkout" }, { status: 500 });
  }
}
