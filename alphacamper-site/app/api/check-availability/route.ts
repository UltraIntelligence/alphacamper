import { NextResponse } from "next/server";

function retiredAvailabilityRoute() {
  return NextResponse.json(
    {
      status: "retired",
      engine: "railway-worker",
      alertCreationEnabled: false,
      message: "Availability polling now runs in the Railway worker.",
    },
    { status: 410 },
  );
}

export async function GET() {
  return retiredAvailabilityRoute();
}

export async function POST() {
  return retiredAvailabilityRoute();
}
