import { chromium } from "playwright";

/**
 * Final recon: fill equipment, click search, capture availability API.
 */

const domain = process.argv[2] || "camping.bcparks.ca";
const campgroundId = process.argv[3] || "-2504";

async function recon() {
  console.log(`\n=== Final Recon: ${domain} | ${campgroundId} ===\n`);

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
  });

  const page = await context.newPage();

  // Capture EVERY API call
  page.on("response", async (response) => {
    const url = response.url();
    if (!url.includes("/api/")) return;
    // Skip known config endpoints
    if (url.match(/config|footer|carousel|photo|boat|golive|searchcriteriatabs|capacitycategory|bookingcategor|transactionlocation|parkalert|ratecategory|attribute|maps\/root|department|resourcecategory$/)) return;

    const request = response.request();
    const status = response.status();
    let body = "";
    try { body = await response.text(); } catch {}

    console.log(`\n${"#".repeat(70)}`);
    console.log(`${request.method()} ${url} → ${status}`);
    if (request.postData()) console.log(`REQ BODY: ${request.postData()}`);
    // Log ALL request headers for availability-related calls
    if (url.includes("availab") || url.includes("resource") || url.includes("search")) {
      console.log("REQ HEADERS:", JSON.stringify(request.headers(), null, 2));
    }
    if (body) console.log(`RESPONSE (${body.length} chars):\n${body.substring(0, 5000)}`);
  });

  // Step 1: Homepage WAF
  console.log("1. WAF solve...");
  await page.goto(`https://${domain}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(5000);

  // Accept cookies
  try {
    const consent = await page.$('button:has-text("I Consent")');
    if (consent) { await consent.click(); await page.waitForTimeout(1000); }
  } catch {}

  // Step 2: Campground page
  console.log("2. Loading campground...");
  await page.goto(`https://${domain}/create-booking/results?resourceLocationId=${campgroundId}`, {
    waitUntil: "domcontentloaded", timeout: 30000,
  });
  await page.waitForTimeout(8000);

  // Accept cookies again if needed
  try {
    const consent = await page.$('button:has-text("I Consent")');
    if (consent) { await consent.click(); await page.waitForTimeout(1000); }
  } catch {}

  // Step 3: Set arrival date to a future date (July 2026)
  console.log("3. Setting dates...");
  try {
    const arrivalInput = await page.$("#arrival-date-field");
    if (arrivalInput) {
      await arrivalInput.click();
      await page.waitForTimeout(1000);
      // Clear and type a date
      await arrivalInput.fill("");
      await arrivalInput.type("07/10/2026");
      await page.waitForTimeout(500);
      // Click elsewhere to close datepicker
      await page.click("body", { position: { x: 10, y: 10 } });
      await page.waitForTimeout(1000);
    }

    const departureInput = await page.$("#departure-date-field");
    if (departureInput) {
      await departureInput.click();
      await page.waitForTimeout(1000);
      await departureInput.fill("");
      await departureInput.type("07/12/2026");
      await page.waitForTimeout(500);
      await page.click("body", { position: { x: 10, y: 10 } });
      await page.waitForTimeout(1000);
    }
  } catch (e) {
    console.log(`   Date error: ${e}`);
  }

  // Step 4: Select equipment type (1 Tent)
  console.log("4. Selecting equipment...");
  try {
    // The equipment field is a mat-select or custom dropdown
    // Try clicking on the equipment dropdown
    const equipSelect = await page.$('mat-select, [formcontrolname="equipment"], select, .equipment-select');
    if (equipSelect) {
      await equipSelect.click();
      await page.waitForTimeout(1000);
      // Select "1 Tent" from the dropdown
      const tentOption = await page.$('mat-option:has-text("1 Tent"), option:has-text("1 Tent")');
      if (tentOption) {
        await tentOption.click();
        console.log("   Selected 1 Tent");
        await page.waitForTimeout(1000);
      }
    } else {
      // Try finding the dropdown by the Equipment label
      console.log("   Looking for equipment dropdown by label...");
      // Click the select element near the Equipment label
      const selects = await page.$$('mat-select');
      console.log(`   Found ${selects.length} mat-select elements`);
      for (const s of selects) {
        const text = await s.textContent();
        console.log(`   mat-select text: "${text?.trim()}"`);
      }

      // Try all select-like elements
      const allDropdowns = await page.$$('[role="combobox"], [role="listbox"], .mat-select, .ng-select, select');
      console.log(`   Found ${allDropdowns.length} dropdown-like elements`);
      if (allDropdowns.length > 0) {
        await allDropdowns[allDropdowns.length - 1].click(); // Equipment is usually last
        await page.waitForTimeout(1000);

        // Look for options
        const options = await page.$$('mat-option, [role="option"], option');
        console.log(`   Found ${options.length} options`);
        for (const opt of options.slice(0, 10)) {
          const text = await opt.textContent();
          console.log(`   option: "${text?.trim()}"`);
        }

        // Click first tent option
        if (options.length > 0) {
          await options[0].click();
          console.log("   Clicked first option");
          await page.waitForTimeout(1000);
        }
      }
    }
  } catch (e) {
    console.log(`   Equipment error: ${e}`);
  }

  // Step 5: Click Search
  console.log("5. Clicking Search...");
  try {
    const searchBtn = await page.$('button:has-text("Search")');
    if (searchBtn) {
      await searchBtn.click();
      console.log("   Clicked Search! Waiting 15s for availability API...\n");
      await page.waitForTimeout(15000);
    }
  } catch (e) {
    console.log(`   Search error: ${e}`);
  }

  // Take screenshot
  await page.screenshot({ path: "/tmp/bc-parks-final.png", fullPage: true });
  console.log("\nScreenshot: /tmp/bc-parks-final.png");

  console.log("\nWaiting 60s for manual exploration...");
  await page.waitForTimeout(60000);
  await browser.close();
}

recon().catch(console.error);
