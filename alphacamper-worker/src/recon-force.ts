import { chromium } from "playwright";

/**
 * Force-click approach: use {force: true} and keyboard input.
 * Also intercept at the HTTP layer (not fetch hook).
 */

async function recon() {
  console.log("\n=== Force Click Recon ===\n");

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
  });
  const page = await context.newPage();

  // Intercept at HTTP layer
  page.on("response", async (resp) => {
    const url = resp.url();
    if (!url.includes("/api/")) return;
    if (url.includes("config") || url.includes("footer") || url.includes("carousel") || url.includes("photo") || url.includes("golive") || url.includes("locales")) return;

    const req = resp.request();
    let body = "";
    try { body = await resp.text(); } catch {}

    // Only log if it's something new (not cart, equipment, etc we've seen)
    if (url.includes("avail") || url.includes("search") || (body.length > 500 && !url.includes("resourceLocation") && !url.includes("equipment") && !url.includes("cart") && !url.includes("maps") && !url.includes("bookingcategor") && !url.includes("searchcriteriatabs") && !url.includes("transactionlocation") && !url.includes("resourcecategory") && !url.includes("capacitycategory") && !url.includes("ratecategory") && !url.includes("parkalert") && !url.includes("attribute") && !url.includes("department") && !url.includes("boat"))) {
      console.log(`\n${"=".repeat(70)}`);
      console.log(`${req.method()} ${url} → ${resp.status()}`);
      if (req.postData()) console.log(`BODY: ${req.postData()!.substring(0, 500)}`);
      console.log(`RESP (${body.length}): ${body.substring(0, 2000)}`);
    }
  });

  // WAF
  console.log("1. WAF...");
  await page.goto("https://camping.bcparks.ca/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(6000);
  try { await page.click('button:has-text("I Consent")', { timeout: 3000 }); } catch {}

  // Campground
  console.log("2. Campground...");
  await page.goto("https://camping.bcparks.ca/create-booking/results?resourceLocationId=-2504", {
    waitUntil: "domcontentloaded", timeout: 30000,
  });
  await page.waitForTimeout(10000);
  try { await page.click('button:has-text("I Consent")', { timeout: 3000 }); } catch {}
  await page.waitForTimeout(2000);

  // Step 1: Equipment — use force click on the mat-select
  console.log("3. Equipment (force click)...");
  try {
    await page.locator("mat-select").first().click({ force: true });
    await page.waitForTimeout(1500);

    const options = await page.locator("mat-option").all();
    console.log(`   ${options.length} options`);
    if (options.length > 0) {
      await options[0].click(); // "1 Tent"
      console.log("   Selected first option (1 Tent)");
    }
    await page.waitForTimeout(1000);
  } catch (e) {
    console.log(`   Equipment error: ${e}`);
  }

  // Step 2: Check if search button is now valid
  const searchBtn = page.locator("#actionSearch");
  const isInvalid = await searchBtn.getAttribute("aria-invalid");
  console.log(`\n   Search button aria-invalid: ${isInvalid}`);

  // Step 3: Try clicking Search with force
  console.log("\n4. Search (force click)...");
  try {
    await searchBtn.click({ force: true });
    console.log("   Clicked! Waiting 20s...\n");
    await page.waitForTimeout(20000);
  } catch (e) {
    console.log(`   Error: ${e}`);
  }

  await page.screenshot({ path: "/tmp/bc-force-result.png", fullPage: true });
  console.log("\nScreenshot: /tmp/bc-force-result.png");

  console.log("\nDone. Closing in 10s...");
  await page.waitForTimeout(10000);
  await browser.close();
}

recon().catch(console.error);
