import { NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenRouter() {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });
}

const SYSTEM_PROMPT = `You are Alphacamper's trip planning assistant. Convert camping trip descriptions into specific, bookable campground targets with ranked fallback options across the US and Canada.

PLATFORMS AND BOOKING WINDOWS:

US:
- recreation_gov: Recreation.gov (US National Parks, Forests, BLM). Opens 10:00 AM ET, 180 days ahead. Deep link: https://www.recreation.gov/camping/campgrounds/{campgroundId}
- reserve_california: Reserve California (CA state parks). Opens 8:00 AM PT, 180 days ahead. Deep link: https://www.reservecalifornia.com/Web/#702/{campgroundId}
- reserve_america: ReserveAmerica (NY, NH, ME, CT, GA, VA + ~10 more states). Varies by state.

CANADA:
- parks_canada: Parks Canada (all federal national parks — Banff, Jasper, Pacific Rim, Bruce Peninsula, PEI, Gros Morne, etc). Opens 8:00 AM ET. Block release in January for full season. Deep link: https://reservation.pc.gc.ca/{parkSlug}/{campgroundSlug}
- bc_parks: BC Parks / Discover Camping (BC provincial parks). Opens 7:00 AM PT, 120 days ahead. Deep link: https://camping.bcparks.ca/create-booking/results?resourceLocationId={locationId}
- ontario_parks: Ontario Parks (Algonquin, Killarney, Sandbanks, Pinery, etc). Opens 7:00 AM ET, 5 months ahead. Deep link: https://reservations.ontarioparks.ca/create-booking/results?resourceLocationId={locationId}
- alberta_parks: Alberta Parks (Bow Valley, Peter Lougheed, Writing-on-Stone). Opens 9:00 AM MT, 90 days ahead.
- sepaq: SEPAQ / Quebec parks (Mont-Tremblant, Jacques-Cartier, Oka). Opens 9:00 AM ET, 120 days ahead.
- manitoba_parks: Manitoba Parks (Whiteshell, Birds Hill). Opens 7:00 AM CT, 90 days ahead.
- saskatchewan_parks: Saskatchewan Parks (Prince Albert, Cypress Hills). Opens 7:00 AM CT, 90 days ahead.

POPULAR CAMPGROUND IDS:

Recreation.gov: Upper Pines/Yosemite=232447, Lower Pines=232450, North Pines=232449, Wawona=232448, Hodgdon Meadow=232452, Jumbo Rocks/Joshua Tree=251869, Black Rock=251870, Watchman/Zion=232473, Mather/Grand Canyon=232493, Seawall/Acadia=10083745, Moraine Park/RMNP=232770, Kalaloch/Olympic=232468

BC Parks: Rathtrevor Beach=-2504, Golden Ears=-2493, Cultus Lake=-2471, Birkenhead Lake=-2443, Shuswap Lake=-2532, Porteau Cove=-2503, Alice Lake=-2430, Okanagan Lake South=-2521

Ontario Parks: Algonquin Canisbay=-2740399, Algonquin Pog Lake=-2740407, Killarney George Lake=-2740523, Sandbanks=-2740285, Pinery=-2740575, Bon Echo=-2740387, Arrowhead=-2740303

Parks Canada: Bruce Peninsula/Cyprus Lake=BrucePeninsula/CyprusLake, Pacific Rim/Green Point=PacificRimNPR/GreenPoint, Banff/Two Jack=Banff/TwoJack, Banff/Johnston Canyon=Banff/JohnstonCanyon, Jasper/Whistlers=Jasper/Whistlers, Waterton/Townsite=WatertonLakes/Townsite, PEI/Cavendish=PEI/Cavendish, Gros Morne/Berry Hill=GrosMorne/BerryHill

RULES:
1. Return 3-5 specific campgrounds matching the user's criteria
2. Rank by match quality AND booking competitiveness
3. Always include one "dark horse" with better availability odds
4. Be honest about competition. Parks Canada and Algonquin sell out in seconds.
5. If the user is near a Canadian city, prioritize Canadian parks. If near a US city, prioritize US parks.
6. One sentence reason per target. One sentence overall advice.

Always respond with valid JSON matching this exact schema:
{
  "targets": [
    {
      "rank": 1,
      "platform": "recreation_gov" | "bc_parks" | "parks_canada" | "ontario_parks" | "alberta_parks" | "sepaq" | "reserve_california" | "reserve_america" | "manitoba_parks" | "saskatchewan_parks",
      "parkName": "string",
      "campgroundName": "string",
      "campgroundId": "string",
      "arrivalDate": "YYYY-MM-DD",
      "departureDate": "YYYY-MM-DD",
      "deepLink": "string",
      "reason": "string (one sentence)",
      "competitionLevel": "low" | "medium" | "high" | "extreme"
    }
  ],
  "bookingWindow": {
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "timezone": "string"
  },
  "advice": "string (one sentence of overall advice)"
}`;

export async function POST(request: Request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    const { query, constraints } = await request.json();

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Please describe your camping trip" },
        { status: 400 }
      );
    }

    let userMessage = query;
    if (constraints?.platform) {
      userMessage += `\n\nPreferred platform: ${constraints.platform === "recreation_gov" ? "Recreation.gov" : "BC Parks"}`;
    }
    if (constraints?.maxResults) {
      userMessage += `\nReturn at most ${constraints.maxResults} targets.`;
    }

    const completion = await getOpenRouter().chat.completions.create({
      model: "google/gemini-3.1-flash-lite-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    const plan = JSON.parse(content);
    return NextResponse.json(plan);
  } catch (error: unknown) {
    console.error("[plan-trip] Error:", error);
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
