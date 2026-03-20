import { chromium } from "playwright";

/**
 * Intercept ALL outgoing requests by hooking fetch/XHR before page loads.
 * Then use Playwright to properly interact with Angular Material UI.
 */

async function recon() {
  console.log("\n=== Intercept Recon ===\n");

  const browser = await chromium.launch({ headless: false, slowMo: 150 });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
  });
  const page = await context.newPage();

  // Use route interception to log ALL API calls
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = request.url();

    // Skip known non-availability endpoints
    if (url.match(/config|footer|carousel|photo|boat|golive|searchcriteriatabs|capacitycategory|bookingcategor|transactionlocation|parkalert|ratecategory|attribute|maps\/root|department|resourcecategory$|equipment$/)) {
      await route.continue();
      return;
    }

    console.log(`\n${"*".repeat(70)}`);
    console.log(`INTERCEPTED: ${request.method()} ${url}`);
    console.log(`Headers: ${JSON.stringify(Object.fromEntries(Object.entries(request.headers()).filter(([k]) => !k.startsWith("sec-") && k !== "user-agent")), null, 2)}`);
    if (request.postData()) console.log(`Post Data: ${request.postData()}`);

    // Let the request through and capture response
    const response = await route.fetch();
    const body = await response.text();
    console.log(`Response Status: ${response.status()}`);
    console.log(`Response (${body.length} chars): ${body.substring(0, 5000)}`);

    await route.fulfill({ response });
  });

  // WAF
  console.log("1. WAF...");
  await page.goto("https://camping.bcparks.ca/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(6000);
  try { await page.click('button:has-text("I Consent")', { timeout: 3000 }); } catch {}

  // Campground
  console.log("\n2. Campground...");
  await page.goto("https://camping.bcparks.ca/create-booking/results?resourceLocationId=-2504", {
    waitUntil: "domcontentloaded", timeout: 30000,
  });
  await page.waitForTimeout(10000);
  try { await page.click('button:has-text("I Consent")', { timeout: 3000 }); } catch {}

  // Interact with the Angular form properly
  console.log("\n3. Interacting with search form...\n");

  // Click the arrival date field
  try {
    await page.click("#arrival-date-field", { timeout: 5000 });
    await page.waitForTimeout(1000);

    // A calendar popup should appear. Navigate to July 2026.
    // Click the forward arrow to go to future months
    for (let i = 0; i < 4; i++) {
      try {
        await page.click('.mat-calendar-next-button, button[aria-label="Next month"]', { timeout: 2000 });
        await page.waitForTimeout(300);
      } catch { break; }
    }

    // Click day 10
    try {
      const cells = await page.$$('.mat-calendar-body-cell');
      for (const cell of cells) {
        const text = await cell.textContent();
        if (text?.trim() === "10") {
          await cell.click();
          console.log("   Clicked July 10");
          break;
        }
      }
    } catch (e) {
      console.log(`   Day click error: ${e}`);
    }
    await page.waitForTimeout(1000);
  } catch (e) {
    console.log(`   Arrival date error: ${e}`);
  }

  // Click departure date
  try {
    await page.click("#departure-date-field", { timeout: 5000 });
    await page.waitForTimeout(1000);

    // Click day 12
    const cells = await page.$$('.mat-calendar-body-cell');
    for (const cell of cells) {
      const text = await cell.textContent();
      if (text?.trim() === "12") {
        await cell.click();
        console.log("   Clicked July 12");
        break;
      }
    }
    await page.waitForTimeout(1000);

    // Close calendar by pressing Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  } catch (e) {
    console.log(`   Departure date error: ${e}`);
  }

  // Select equipment - find and click the mat-select for equipment
  console.log("   Selecting equipment...");
  try {
    // The equipment dropdown is the last mat-select on the page
    const matSelects = await page.$$('mat-select');
    console.log(`   Found ${matSelects.length} mat-select elements`);

    if (matSelects.length > 0) {
      // Equipment is typically the last select
      const equipSelect = matSelects[matSelects.length - 1];
      await equipSelect.click();
      await page.waitForTimeout(1000);

      // Select "1 Tent" from the overlay
      const options = await page.$$('mat-option');
      console.log(`   Found ${options.length} options`);
      for (const opt of options) {
        const text = await opt.textContent();
        console.log(`   Option: "${text?.trim()}"`);
        if (text?.includes("1 Tent")) {
          await opt.click();
          console.log("   Selected 1 Tent!");
          break;
        }
      }
      await page.waitForTimeout(1000);
    }
  } catch (e) {
    console.log(`   Equipment error: ${e}`);
  }

  // Click Search
  console.log("\n4. Clicking Search...\n");
  try {
    await page.click('button:has-text("Search")', { timeout: 5000 });
    console.log("   Search clicked! Waiting 20s for availability API...\n");
    await page.waitForTimeout(20000);
  } catch (e) {
    console.log(`   Search error: ${e}`);
  }

  await page.screenshot({ path: "/tmp/bc-parks-intercept.png", fullPage: true });
  console.log("\nScreenshot: /tmp/bc-parks-intercept.png");

  console.log("\nWaiting 30s...");
  await page.waitForTimeout(30000);
  await browser.close();
}

recon().catch(console.error);
