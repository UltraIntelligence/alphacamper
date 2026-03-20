import { chromium } from "playwright";

/**
 * Complete the search by navigating via URL params (which the Angular router accepts),
 * then watch all network traffic for the availability API call.
 *
 * Key insight: the GA tracking showed the app navigates to a URL like:
 * /create-booking/results?resourceLocationId=0&mapId=-2147483552&...
 *
 * But for a SPECIFIC park (not "All Parks"), the URL should have the park's resourceLocationId.
 * Let's use the URL the app would build and watch what API calls it makes.
 */

async function recon() {
  console.log("\n=== Watch XHR Recon ===\n");

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
  });
  const page = await context.newPage();

  // Route-intercept ALL API calls to capture the availability one
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = request.url();

    // Skip known non-availability endpoints
    if (url.match(/config|footer|carousel|photo|boat|golive|searchcriteriatabs|capacitycategory|bookingcategor|transactionlocation|parkalert|ratecategory|attribute|maps\/root|department|resourcecategory$|equipment$/)) {
      await route.continue();
      return;
    }

    // Let request through and capture response
    const response = await route.fetch();
    const body = await response.text();
    const status = response.status();

    // Log everything that looks availability-related
    if (url.includes("avail") || url.includes("resource") || body.length > 200) {
      console.log(`\n${"!".repeat(70)}`);
      console.log(`${request.method()} ${url}`);
      console.log(`Status: ${status} | Body length: ${body.length}`);
      console.log(`Headers: ${JSON.stringify(Object.fromEntries(
        Object.entries(request.headers()).filter(([k]) =>
          ["x-xsrf-token", "content-type", "accept", "app-version", "app-language"].includes(k)
        )
      ))}`);
      if (request.postData()) console.log(`Post data: ${request.postData()!.substring(0, 1000)}`);
      console.log(`Response: ${body.substring(0, 3000)}`);
    }

    await route.fulfill({ response, body });
  });

  // WAF solve
  console.log("1. WAF...");
  await page.goto("https://camping.bcparks.ca/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(6000);
  try { await page.click('button:has-text("I Consent")', { timeout: 3000 }); } catch {}

  // Navigate directly to the search results URL with all params
  // This is what the Angular router does after you click Search
  const searchUrl = "https://camping.bcparks.ca/create-booking/results?" + [
    "resourceLocationId=-2504",
    "mapId=-2504",
    "searchTabGroupId=0",
    "bookingCategoryId=0",
    "startDate=2026-07-10",
    "endDate=2026-07-12",
    "nights=2",
    "isReserving=true",
    "equipmentId=-32768",
    "subEquipmentId=-32768",
    `searchTime=${new Date().toISOString()}`,
    'flexibleSearch=[false,false,"2026-07-01",2]',
  ].join("&");

  console.log(`\n2. Navigating to search URL:\n${searchUrl}\n`);
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

  console.log("3. Waiting 30s for availability API calls...\n");
  await page.waitForTimeout(30000);

  await page.screenshot({ path: "/tmp/bc-watch-xhr.png", fullPage: true });
  console.log("Screenshot: /tmp/bc-watch-xhr.png\n");

  console.log("Closing in 10s...");
  await page.waitForTimeout(10000);
  await browser.close();
}

recon().catch(console.error);
