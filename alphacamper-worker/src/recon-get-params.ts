import { chromium } from "playwright";

/**
 * Brute-force GET param combinations on /api/availability/resourcedailyavailability
 */

async function recon() {
  console.log("\n=== GET Params Recon ===\n");

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
  });
  const page = await context.newPage();

  // WAF + campground page
  await page.goto("https://camping.bcparks.ca/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(5000);
  try { await page.click('button:has-text("I Consent")', { timeout: 3000 }); } catch {}

  await page.goto("https://camping.bcparks.ca/create-booking/results?resourceLocationId=-2504", {
    waitUntil: "domcontentloaded", timeout: 30000,
  });
  await page.waitForTimeout(8000);
  try { await page.click('button:has-text("I Consent")', { timeout: 3000 }); } catch {}

  // Get cart UID from the page's Angular state
  const cartInfo = await page.evaluate(async () => {
    const res = await fetch("/api/cart", { headers: { Accept: "application/json" } });
    return res.json();
  });
  console.log(`Cart UID: ${cartInfo.cartUid}`);
  console.log(`Transaction UID: ${cartInfo.createTransactionUid}\n`);

  const base = "/api/availability/resourcedailyavailability";

  // Try different param combos
  const attempts = [
    // Attempt 1: Camis V5 format (from newer Camis documentation)
    `${base}?resourceLocationId=-2504&bookingCategoryId=0&startDate=2026-07-10T00:00:00.000Z&endDate=2026-07-12T00:00:00.000Z&getDailyAvailability=true&isReserving=false&filterData=%7B%7D&cartUid=${cartInfo.cartUid}&cartTransactionUid=${cartInfo.createTransactionUid}&partySize=1`,

    // Attempt 2: ISO dates without time
    `${base}?resourceLocationId=-2504&bookingCategoryId=0&startDate=2026-07-10&endDate=2026-07-12&getDailyAvailability=true&isReserving=false&filterData=%7B%7D&cartUid=${cartInfo.cartUid}&cartTransactionUid=${cartInfo.createTransactionUid}&partySize=1`,

    // Attempt 3: With equipment params
    `${base}?resourceLocationId=-2504&bookingCategoryId=0&startDate=2026-07-10T00:00:00.000Z&endDate=2026-07-12T00:00:00.000Z&getDailyAvailability=true&isReserving=false&filterData=%7B%7D&cartUid=${cartInfo.cartUid}&cartTransactionUid=${cartInfo.createTransactionUid}&partySize=1&equipmentCategoryId=-32768&subEquipmentCategoryId=-32768`,

    // Attempt 4: Nights param
    `${base}?resourceLocationId=-2504&bookingCategoryId=0&startDate=2026-07-10T00:00:00.000Z&endDate=2026-07-12T00:00:00.000Z&getDailyAvailability=true&isReserving=false&filterData=%7B%7D&cartUid=${cartInfo.cartUid}&cartTransactionUid=${cartInfo.createTransactionUid}&partySize=1&equipmentCategoryId=-32768&subEquipmentCategoryId=-32768&nights=2`,

    // Attempt 5: With is498 flag
    `${base}?resourceLocationId=-2504&bookingCategoryId=0&startDate=2026-07-10T00:00:00.000Z&endDate=2026-07-12T00:00:00.000Z&getDailyAvailability=true&isReserving=false&filterData=%7B%7D&cartUid=${cartInfo.cartUid}&cartTransactionUid=${cartInfo.createTransactionUid}&partySize=1&equipmentCategoryId=-32768&subEquipmentCategoryId=-32768&nights=2&is498=false`,

    // Attempt 6: Minimal — just required-looking params
    `${base}?resourceLocationId=-2504&startDate=2026-07-10T00:00:00.000Z&endDate=2026-07-12T00:00:00.000Z`,

    // Attempt 7: With bookingCategoryId only
    `${base}?resourceLocationId=-2504&bookingCategoryId=0&startDate=2026-07-10T00:00:00.000Z&endDate=2026-07-12T00:00:00.000Z`,

    // Attempt 8: cartUid from URL
    `${base}?resourceLocationId=-2504&bookingCategoryId=0&startDate=2026-07-10T07:00:00.000Z&endDate=2026-07-12T07:00:00.000Z&getDailyAvailability=true&isReserving=false&filterData=%7B%7D&cartUid=${cartInfo.cartUid}&cartTransactionUid=${cartInfo.createTransactionUid}&partySize=1&equipmentCategoryId=-32768&subEquipmentCategoryId=-32768&nights=2&is498=false&searchTabGroupId=0`,
  ];

  for (let i = 0; i < attempts.length; i++) {
    const url = attempts[i];
    console.log(`\n--- Attempt ${i + 1} ---`);
    console.log(`GET ${url.substring(0, 120)}...`);

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
        return { status: res.status, body: text.substring(0, 3000), length: text.length };
      }, url);

      console.log(`Status: ${result.status} | Length: ${result.length}`);
      if (result.status === 200 && result.length > 10) {
        console.log(`\n🎯 SUCCESS! Response (${result.length} chars):`);
        console.log(result.body);
        break; // Found it!
      } else if (result.status === 400) {
        console.log(`Body: ${result.body}`);
      }
    } catch (e) {
      console.log(`Error: ${e}`);
    }
  }

  console.log("\nClosing in 15s...");
  await page.waitForTimeout(15000);
  await browser.close();
}

recon().catch(console.error);
