import { chromium } from "playwright";

/**
 * Test the discovered /api/availability/map endpoint directly.
 */

async function recon() {
  console.log("\n=== Testing /api/availability/map ===\n");

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
  });
  const page = await context.newPage();

  // WAF
  await page.goto("https://camping.bcparks.ca/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(6000);
  try { await page.click('button:has-text("I Consent")', { timeout: 3000 }); } catch {}

  // Get a valid cart
  await page.goto("https://camping.bcparks.ca/create-booking/results?resourceLocationId=-2504", {
    waitUntil: "domcontentloaded", timeout: 30000,
  });
  await page.waitForTimeout(8000);

  console.log("Testing /api/availability/map endpoint...\n");

  // Try the availability/map endpoint with various param combos
  const resourceLocationId = -2504; // Rathtrevor Beach
  const startDate = "2026-07-10";
  const endDate = "2026-07-12";

  const attempts = [
    // From the GA tracking: the app uses these params
    {
      name: "Full params from GA tracking",
      params: `resourceLocationId=${resourceLocationId}&mapId=${resourceLocationId}&searchTabGroupId=0&bookingCategoryId=0&startDate=${startDate}&endDate=${endDate}&nights=2&isReserving=true&equipmentId=-32768&subEquipmentId=-32768&searchTime=${new Date().toISOString()}`,
    },
    {
      name: "Without searchTime",
      params: `resourceLocationId=${resourceLocationId}&mapId=${resourceLocationId}&bookingCategoryId=0&startDate=${startDate}&endDate=${endDate}&nights=2&isReserving=true&equipmentId=-32768&subEquipmentId=-32768`,
    },
    {
      name: "Minimal",
      params: `resourceLocationId=${resourceLocationId}&bookingCategoryId=0&startDate=${startDate}&endDate=${endDate}&nights=2&equipmentId=-32768&subEquipmentId=-32768`,
    },
    {
      name: "With getDailyAvailability",
      params: `resourceLocationId=${resourceLocationId}&bookingCategoryId=0&startDate=${startDate}&endDate=${endDate}&nights=2&equipmentId=-32768&subEquipmentId=-32768&getDailyAvailability=true&isReserving=false`,
    },
  ];

  for (const attempt of attempts) {
    const url = `/api/availability/map?${attempt.params}`;
    console.log(`--- ${attempt.name} ---`);

    try {
      const result = await page.evaluate(async (fetchUrl: string) => {
        const res = await fetch(fetchUrl, {
          headers: {
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json",
            "app-language": "en-CA",
            "app-version": "5.106.226",
            "cache-control": "no-cache",
            "pragma": "no-cache",
            "expires": "0",
          }
        });
        const text = await res.text();
        return { status: res.status, body: text.substring(0, 5000), length: text.length };
      }, url);

      console.log(`Status: ${result.status} | Response length: ${result.length}`);

      if (result.status === 200 && result.length > 10) {
        console.log(`\n*** SUCCESS! ***`);
        console.log(`Response:\n${result.body}\n`);
      } else {
        console.log(`Response: ${result.body.substring(0, 200)}\n`);
      }
    } catch (e) {
      console.log(`Error: ${e}\n`);
    }
  }

  // Also try the endpoint that GA showed: /api/availability/map with the specific resourceLocationId=0 and mapId
  console.log("--- GA-exact: resourceLocationId=0 with mapId ---");
  try {
    // The GA tracking showed resourceLocationId=0 because it was searching "All Parks"
    // For a specific park, we need the right resourceLocationId
    const result = await page.evaluate(async () => {
      // First get the root map ID for this campground
      const mapsRes = await fetch("/api/maps?resourceLocationId=-2504");
      const mapsData = await mapsRes.text();

      // Then try availability/map with the campground's resource location
      const availRes = await fetch(`/api/availability/map?resourceLocationId=-2504&bookingCategoryId=0&startDate=2026-07-10&endDate=2026-07-12&nights=2&isReserving=true&equipmentId=-32768&subEquipmentId=-32768&getDailyAvailability=true`);
      const availText = await availRes.text();

      return {
        mapsStatus: mapsRes.status,
        mapsBody: mapsData.substring(0, 500),
        availStatus: availRes.status,
        availLength: availText.length,
        availBody: availText.substring(0, 5000),
      };
    });

    console.log(`Maps: ${result.mapsStatus} | ${result.mapsBody}`);
    console.log(`Availability: ${result.availStatus} | Length: ${result.availLength}`);
    if (result.availLength > 10) {
      console.log(`Response:\n${result.availBody}\n`);
    }
  } catch (e) {
    console.log(`Error: ${e}`);
  }

  console.log("\nClosing in 15s...");
  await page.waitForTimeout(15000);
  await browser.close();
}

recon().catch(console.error);
