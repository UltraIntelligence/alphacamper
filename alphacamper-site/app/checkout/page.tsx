import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";

type CheckoutProduct = "summer" | "year";

function isProduct(value: string | string[] | undefined): value is CheckoutProduct {
  return value === "summer" || value === "year";
}

export const metadata: Metadata = {
  title: "Confirm your pass — Alphacamper",
  description:
    "One step from letting Alphacamper get you the campsite. 30-day refund if we don't book you a site.",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string | string[]; canceled?: string | string[] }>;
}) {
  const params = await searchParams;
  const product: CheckoutProduct = isProduct(params.product) ? params.product : "summer";
  const canceled = params.canceled === "true";

  return <CheckoutView product={product} canceled={canceled} />;
}
