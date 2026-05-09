// @vitest-environment node

import { describe, expect, it } from "vitest";
import { evaluateBillingSmokeStatus, summarizeBillingRows } from "@/scripts/smoke-billing";

describe("billing smoke diagnostics", () => {
  it("summarizes active paid passes and ignores expired or unpaid rows", () => {
    const summary = summarizeBillingRows([
      {
        product_key: "summer_pass_2026",
        status: "active",
        checkout_mode: "payment",
        amount_total: 2900,
        currency: "usd",
        current_period_end: "2026-11-01T00:00:00.000Z",
      },
      {
        product_key: "year_pass_2026",
        status: "active",
        checkout_mode: "payment",
        amount_total: 4900,
        currency: "usd",
        current_period_end: "2027-01-01T00:00:00.000Z",
      },
      {
        product_key: "summer_pass_2026",
        status: "active",
        checkout_mode: "payment",
        amount_total: 2900,
        currency: "usd",
        current_period_end: "2026-01-01T00:00:00.000Z",
      },
      {
        product_key: "summer_pass_2026",
        status: "past_due",
        checkout_mode: "payment",
        amount_total: 2900,
        currency: "usd",
        current_period_end: null,
      },
      {
        product_key: "year_pass_2026",
        status: "canceled",
        checkout_mode: "subscription",
        amount_total: 4900,
        currency: "usd",
        current_period_end: null,
      },
    ], Date.parse("2026-05-09T00:00:00.000Z"));

    expect(summary).toEqual({
      paidPasses: 2,
      summerPasses: 1,
      yearPasses: 1,
      paymentModePasses: 2,
      subscriptionModePasses: 0,
      pastDuePasses: 1,
      canceledPasses: 1,
      grossRevenueByCurrency: {
        usd: 7800,
      },
    });
  });

  it("keeps billing yellow until paid checkout, webhook, and net reporting proof exist", () => {
    const readyRuntime = {
      supabaseError: null,
      stripeError: null,
      supabaseConfigured: true,
      subscriptionsCount: 0,
      funnelEventsCount: 0,
      webhookEventsCount: 0,
      vercelConfigured: true,
      missingVercelEnvCount: 0,
      priceTypesKnown: true,
      priceTypesAreOneTime: true,
      paidPasses: 0,
      netRefundReportingVerified: false,
    };

    expect(evaluateBillingSmokeStatus(readyRuntime)).toBe("yellow");
    expect(
      evaluateBillingSmokeStatus({
        ...readyRuntime,
        subscriptionsCount: 1,
        webhookEventsCount: 1,
        paidPasses: 1,
      }),
    ).toBe("yellow");
    expect(
      evaluateBillingSmokeStatus({
        ...readyRuntime,
        subscriptionsCount: 1,
        webhookEventsCount: 1,
        paidPasses: 1,
        netRefundReportingVerified: true,
      }),
    ).toBe("green");
  });
});
