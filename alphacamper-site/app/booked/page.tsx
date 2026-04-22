import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingSuccess } from "@/components/booking/BookingSuccess";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function pickString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export const metadata: Metadata = {
  title: "Booked — Alphacamper",
  description: "Alphacamper got you the site.",
  robots: { index: false, follow: false },
};

export default async function BookedPage({
  searchParams,
}: {
  searchParams: Promise<{
    park?: string | string[];
    site?: string | string[];
    arrival?: string | string[];
    departure?: string | string[];
    at?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const parkName = pickString(params.park)?.trim();
  const arrival = pickString(params.arrival);
  const departure = pickString(params.departure);
  const site = pickString(params.site);
  const bookedAt = pickString(params.at);

  if (!parkName || !arrival || !departure) {
    notFound();
  }
  if (!ISO_DATE.test(arrival) || !ISO_DATE.test(departure)) {
    notFound();
  }

  return (
    <BookingSuccess
      parkName={parkName}
      siteNumber={site?.trim() || null}
      arrivalDate={arrival}
      departureDate={departure}
      bookedAt={bookedAt}
    />
  );
}
