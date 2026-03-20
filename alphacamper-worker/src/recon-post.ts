import { chromium } from "playwright";

/**
 * Try POST to the availability endpoints with various body formats.
 */

async function recon() {
  console.log("\n=== POST Recon ===\n");

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
  });
  const page = await context.newPage();

  // WAF
  await page.goto("https://camping.bcparks.ca/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(5000);
  try { await page.click('button:has-text("I Consent")', { timeout: 3000 }); } catch {}

  // Get cart
  await page.goto("https://camping.bcparks.ca/create-booking/results?resourceLocationId=-2504", {
    waitUntil: "domcontentloaded", timeout: 30000,
  });
  await page.waitForTimeout(8000);
  try { await page.click('button:has-text("I Consent")', { timeout: 3000 }); } catch {}

  console.log("Trying POST endpoints from browser context...\n");

  // Try various POST body formats for the availability endpoint
  const attempts = [
    {
      name: "resourcedailyavailability POST with full body",
      url: "/api/availability/resourcedailyavailability",
      body: {
        resourceLocationId: -2504,
        bookingCategoryId: 0,
        startDate: "2026-07-10",
        endDate: "2026-07-12",
        nights: 2,
        isReserving: false,
        getDailyAvailability: true,
        partySize: 1,
        equipmentCategoryId: -32768,
        subEquipmentCategoryId: -32768,
        cartUid: "00000000-0000-0000-0000-000000000000",
        filterData: {},
      },
    },
    {
      name: "resourcedailyavailability POST minimal",
      url: "/api/availability/resourcedailyavailability",
      body: {
        resourceLocationId: -2504,
        bookingCategoryId: 0,
        startDate: "2026-07-10",
        endDate: "2026-07-12",
        getDailyAvailability: true,
        isReserving: false,
        partySize: 1,
      },
    },
    {
      name: "resourceavailability POST",
      url: "/api/availability/resourceavailability",
      body: {
        resourceLocationId: -2504,
        bookingCategoryId: 0,
        startDate: "2026-07-10",
        endDate: "2026-07-12",
        nights: 2,
        isReserving: false,
        partySize: 1,
        equipmentCategoryId: -32768,
        subEquipmentCategoryId: -32768,
      },
    },
    {
      name: "resource/details POST",
      url: "/api/resource/details",
      body: {
        resourceLocationId: -2504,
        bookingCategoryId: 0,
        startDate: "2026-07-10",
        endDate: "2026-07-12",
        nights: 2,
        partySize: 1,
        equipmentCategoryId: -32768,
        subEquipmentCategoryId: -32768,
      },
    },
    {
      name: "resourcelocation/resources POST",
      url: "/api/resourcelocation/resources",
      body: {
        resourceLocationId: -2504,
        bookingCategoryId: 0,
        startDate: "2026-07-10",
        endDate: "2026-07-12",
        nights: 2,
        partySize: 1,
        equipmentCategoryId: -32768,
        subEquipmentCategoryId: -32768,
        filterData: {},
      },
    },
  ];

  for (const attempt of attempts) {
    console.log(`\n--- ${attempt.name} ---`);
    console.log(`POST ${attempt.url}`);
    console.log(`Body: ${JSON.stringify(attempt.body)}`);

    try {
      const result = await page.evaluate(async ({ url, body }) => {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json",
            "app-language": "en-CA",
            "app-version": "5.106.226",
          },
          body: JSON.stringify(body),
        });
        const text = await res.text();
        return { status: res.status, body: text.substring(0, 3000) };
      }, { url: attempt.url, body: attempt.body });

      console.log(`Status: ${result.status}`);
      console.log(`Response: ${result.body.substring(0, 1000)}`);

      if (result.status === 200 && result.body.length > 10) {
        console.log("\n*** SUCCESS! This is the availability endpoint! ***\n");
        console.log(`Full response (${result.body.length} chars):`);
        console.log(result.body);
      }
    } catch (e) {
      console.log(`Error: ${e}`);
    }
  }

  console.log("\nDone. Closing in 30s...");
  await page.waitForTimeout(30000);
  await browser.close();
}

recon().catch(console.error);
