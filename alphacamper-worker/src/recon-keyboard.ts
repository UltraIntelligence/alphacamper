import { chromium } from "playwright";

/**
 * Recon using keyboard navigation to handle Angular Material overlays.
 * Escape closes datepicker, Tab moves between fields.
 */

async function recon() {
  console.log("\n=== Keyboard Recon ===\n");

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
  });

  const page = await context.newPage();

  // Capture availability API calls
  page.on("response", async (response) => {
    const url = response.url();
    if (!url.includes("/api/")) return;
    if (url.match(/config|footer|carousel|photo|boat|golive|searchcriteriatabs|capacitycategory|bookingcategor|transactionlocation|parkalert|ratecategory|attribute|maps\/root|department|resourcecategory$|locales|equipment$|resourceLocation$/)) return;

    const request = response.request();
    let body = "";
    try { body = await response.text(); } catch {}

    console.log(`\n${"#".repeat(70)}`);
    console.log(`${request.method()} ${url} → ${response.status()}`);
    if (request.postData()) console.log(`REQ: ${request.postData()!.substring(0, 1000)}`);
    if (body) console.log(`RESP (${body.length} chars): ${body.substring(0, 3000)}`);
  });

  // WAF solve
  console.log("1. WAF...");
  await page.goto("https://camping.bcparks.ca/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(5000);

  // Accept cookies
  try { await page.click('button:has-text("I Consent")', { timeout: 3000 }); } catch {}

  // Campground page
  console.log("2. Campground...");
  await page.goto("https://camping.bcparks.ca/create-booking/results?resourceLocationId=-2504", {
    waitUntil: "domcontentloaded", timeout: 30000,
  });
  await page.waitForTimeout(8000);

  // Accept cookies again
  try { await page.click('button:has-text("I Consent")', { timeout: 3000 }); } catch {}
  await page.waitForTimeout(1000);

  // Close any open datepicker by pressing Escape
  console.log("3. Closing any open overlays...");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1000);

  // Navigate to equipment dropdown using page.evaluate to set values
  console.log("4. Setting search params via JavaScript...");

  // Try to directly call the Angular component's search via the URL
  // The search URL pattern on Camis sites often includes query params
  const searchUrl = "https://camping.bcparks.ca/create-booking/results?" + new URLSearchParams({
    resourceLocationId: "-2504",
    mapId: "-2504",
    searchTabGroupId: "0",
    bookingCategoryId: "0",
    startDate: "2026-07-10",
    endDate: "2026-07-12",
    nights: "2",
    is498: "false",
    partySize: "1",
    equipmentId: "-32768",
    subEquipmentId: "-32768",
    filterData: JSON.stringify({})
  }).toString();

  console.log(`   Trying URL-based search: ${searchUrl}`);
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(15000);

  // Also try the direct API endpoint that Camis apps typically use
  console.log("\n5. Trying direct API calls with cookies...\n");
  const cookies = await context.cookies();
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join("; ");

  // Try various availability endpoint patterns
  const endpoints = [
    `/api/availability/resourcedailyavailability?resourceLocationId=-2504&bookingCategoryId=0&startDate=2026-07-10&endDate=2026-07-12&getDailyAvailability=true&isReserving=false&filterData=%7B%7D&cartUid=00000000-0000-0000-0000-000000000000&partySize=1`,
    `/api/availability/resourceavailability?resourceLocationId=-2504&bookingCategoryId=0&startDate=2026-07-10&endDate=2026-07-12&nights=2&partySize=1&equipmentCategoryId=-32768&subEquipmentCategoryId=-32768`,
    `/api/resource/search?resourceLocationId=-2504&bookingCategoryId=0&startDate=2026-07-10&endDate=2026-07-12&nights=2&partySize=1&equipmentCategoryId=-32768&subEquipmentCategoryId=-32768`,
    `/api/resourcelocation/resources?resourceLocationId=-2504&bookingCategoryId=0&startDate=2026-07-10&endDate=2026-07-12&nights=2&partySize=1&equipmentCategoryId=-32768&subEquipmentCategoryId=-32768`,
  ];

  for (const endpoint of endpoints) {
    const url = `https://camping.bcparks.ca${endpoint}`;
    console.log(`\nTrying: ${endpoint.substring(0, 80)}...`);
    try {
      const resp = await page.evaluate(async (fetchUrl) => {
        const res = await fetch(fetchUrl, {
          headers: {
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json",
            "app-language": "en-CA",
            "app-version": "5.106.226",
          }
        });
        const text = await res.text();
        return { status: res.status, body: text.substring(0, 2000) };
      }, url);
      console.log(`   Status: ${resp.status}`);
      if (resp.body) console.log(`   Body: ${resp.body.substring(0, 500)}`);
    } catch (e) {
      console.log(`   Error: ${e}`);
    }
  }

  await page.screenshot({ path: "/tmp/bc-parks-keyboard.png", fullPage: true });
  console.log("\nScreenshot: /tmp/bc-parks-keyboard.png");
  console.log("\nKeeping browser open 60s...");
  await page.waitForTimeout(60000);
  await browser.close();
}

recon().catch(console.error);
