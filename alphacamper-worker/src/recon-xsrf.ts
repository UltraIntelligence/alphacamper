import { chromium } from "playwright";

/**
 * Test with XSRF token header — Angular's HttpClient adds this automatically
 * via its XSRF interceptor. The API likely requires it.
 */

async function recon() {
  console.log("\n=== XSRF Token Recon ===\n");

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
  });
  const page = await context.newPage();

  // WAF + get cookies
  await page.goto("https://camping.bcparks.ca/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(6000);
  try { await page.click('button:has-text("I Consent")', { timeout: 3000 }); } catch {}

  await page.goto("https://camping.bcparks.ca/create-booking/results?resourceLocationId=-2504", {
    waitUntil: "domcontentloaded", timeout: 30000,
  });
  await page.waitForTimeout(8000);

  // Get cart info and XSRF token
  const result = await page.evaluate(async () => {
    // Get cart
    const cartRes = await fetch("/api/cart", { headers: { Accept: "application/json" } });
    const cart = await cartRes.json();

    // Get XSRF token from cookies
    const cookies = document.cookie.split(";").map(c => c.trim());
    const xsrf = cookies.find(c => c.startsWith("XSRF-TOKEN="));
    const xsrfValue = xsrf ? decodeURIComponent(xsrf.split("=").slice(1).join("=")) : "";

    return { cartUid: cart.cartUid, cartTransactionUid: cart.createTransactionUid, xsrfToken: xsrfValue };
  });

  console.log(`Cart: ${result.cartUid}`);
  console.log(`Transaction: ${result.cartTransactionUid}`);
  console.log(`XSRF: ${result.xsrfToken.substring(0, 50)}...\n`);

  // Now try /api/availability/map WITH the XSRF token header
  const attempts = [
    {
      name: "availability/map with XSRF + cart",
      url: `/api/availability/map?resourceLocationId=-2504&bookingCategoryId=0&startDate=2026-07-10&endDate=2026-07-12&nights=2&isReserving=true&equipmentId=-32768&subEquipmentId=-32768&getDailyAvailability=true&cartUid=${result.cartUid}&cartTransactionUid=${result.cartTransactionUid}`,
    },
    {
      name: "availability/map with XSRF minimal",
      url: "/api/availability/map?resourceLocationId=-2504&bookingCategoryId=0&startDate=2026-07-10&endDate=2026-07-12&nights=2&isReserving=true&equipmentId=-32768&subEquipmentId=-32768",
    },
    {
      name: "resourcedailyavailability with XSRF + cart",
      url: `/api/availability/resourcedailyavailability?resourceLocationId=-2504&bookingCategoryId=0&startDate=2026-07-10&endDate=2026-07-12&getDailyAvailability=true&isReserving=false&partySize=1&cartUid=${result.cartUid}&cartTransactionUid=${result.cartTransactionUid}`,
    },
  ];

  for (const attempt of attempts) {
    console.log(`--- ${attempt.name} ---`);

    const resp = await page.evaluate(async ({ url, xsrf }: { url: string; xsrf: string }) => {
      const res = await fetch(url, {
        headers: {
          "Accept": "application/json, text/plain, */*",
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": xsrf,
          "app-language": "en-CA",
          "app-version": "5.106.226",
          "cache-control": "no-cache",
          "pragma": "no-cache",
          "expires": "0",
        }
      });
      const text = await res.text();
      return { status: res.status, body: text.substring(0, 5000), length: text.length };
    }, { url: attempt.url, xsrf: result.xsrfToken });

    console.log(`Status: ${resp.status} | Length: ${resp.length}`);
    if (resp.status === 200 && resp.length > 10) {
      console.log(`\n*** SUCCESS! ***\n${resp.body}\n`);
    } else {
      console.log(`Body: ${resp.body.substring(0, 300)}\n`);
    }
  }

  console.log("Closing in 10s...");
  await page.waitForTimeout(10000);
  await browser.close();
}

recon().catch(console.error);
