import { chromium } from "playwright";

/**
 * Automated recon: navigate to campground, fill in dates, trigger search,
 * and capture the availability API call.
 */

const domain = process.argv[2] || "camping.bcparks.ca";
const campgroundId = process.argv[3] || "-2504";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

async function recon() {
  console.log(`\n=== Search Recon: ${domain} | Campground: ${campgroundId} ===\n`);

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({
    userAgent: UA,
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
  });

  const page = await context.newPage();

  // Capture API calls — focus on anything with availability/resource/search
  page.on("response", async (response) => {
    const url = response.url();
    if (!url.includes("/api/")) return;
    // Skip known non-availability endpoints
    if (url.match(/config|footer|carousel|photo|boat|golive|cart\/|department|locales|searchcriteriatabs|capacitycategory|bookingcategor|transactionlocation\/(?:server|timezone)|attribute|parkalert|ratecategory/)) return;

    const request = response.request();
    const status = response.status();
    const contentType = response.headers()["content-type"] || "";

    let responsePreview = "";
    if (contentType.includes("json")) {
      try {
        const body = await response.text();
        responsePreview = body.substring(0, 3000);
      } catch {}
    }

    console.log(`\n${"=".repeat(70)}`);
    console.log(`${request.method()} ${url} → ${status}`);
    if (request.postData()) console.log(`REQUEST BODY:\n${request.postData()}`);

    // Log request headers that matter
    const headers = request.headers();
    const important = ["cookie", "x-xsrf-token", "content-type", "accept"];
    for (const h of important) {
      if (headers[h]) console.log(`  ${h}: ${headers[h].substring(0, 200)}`);
    }

    if (responsePreview) {
      console.log(`RESPONSE (${responsePreview.length} chars):`);
      console.log(responsePreview);
    }
  });

  // Step 1: Homepage — solve WAF
  console.log("1. Solving WAF...");
  await page.goto(`https://${domain}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(5000);
  console.log("   WAF solved.\n");

  // Step 2: Go to campground page
  const url = `https://${domain}/create-booking/results?resourceLocationId=${campgroundId}`;
  console.log(`2. Loading campground: ${url}`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(10000);

  // Step 3: Try to accept cookies consent if present
  try {
    const acceptBtn = await page.$('button:has-text("Accept"), button:has-text("I Accept"), button:has-text("OK"), button:has-text("Agree")');
    if (acceptBtn) {
      await acceptBtn.click();
      console.log("   Accepted cookie consent\n");
      await page.waitForTimeout(2000);
    }
  } catch {}

  // Step 4: Look for and interact with date pickers / search form
  console.log("3. Looking for search form elements...\n");

  // Try to find date input fields
  const allInputs = await page.$$("input");
  console.log(`   Found ${allInputs.length} input elements`);

  for (const input of allInputs) {
    const type = await input.getAttribute("type");
    const placeholder = await input.getAttribute("placeholder");
    const id = await input.getAttribute("id");
    const ariaLabel = await input.getAttribute("aria-label");
    const name = await input.getAttribute("name");
    if (type || placeholder || id || ariaLabel || name) {
      console.log(`   INPUT: type=${type} id=${id} name=${name} placeholder=${placeholder} aria-label=${ariaLabel}`);
    }
  }

  // Try to find buttons
  const allButtons = await page.$$("button");
  console.log(`\n   Found ${allButtons.length} button elements`);
  for (const btn of allButtons) {
    const text = await btn.textContent();
    const ariaLabel = await btn.getAttribute("aria-label");
    if (text?.trim()) console.log(`   BUTTON: "${text.trim().substring(0, 60)}" aria-label="${ariaLabel}"`);
  }

  // Try to find select elements
  const allSelects = await page.$$("select");
  console.log(`\n   Found ${allSelects.length} select elements`);

  // Step 5: Try clicking on a date or triggering search
  console.log("\n4. Attempting to interact with date picker...\n");

  // Try common date picker patterns
  try {
    // Look for arrival date field
    const arrivalField = await page.$('[data-testid*="arrival"], [data-testid*="checkin"], [aria-label*="arrival"], [aria-label*="check-in"], [placeholder*="Arrival"], [placeholder*="Check-in"], input[formcontrolname*="date"], mat-datepicker-toggle, .mat-datepicker-toggle');
    if (arrivalField) {
      console.log("   Found arrival date field — clicking...");
      await arrivalField.click();
      await page.waitForTimeout(3000);

      // Look for calendar
      const calendarDays = await page.$$('.mat-calendar-body-cell, .calendar-day, [role="gridcell"]');
      console.log(`   Found ${calendarDays.length} calendar cells`);

      // Click a future date
      if (calendarDays.length > 15) {
        await calendarDays[15].click();
        console.log("   Clicked day 15");
        await page.waitForTimeout(2000);

        // Try clicking another date for checkout
        if (calendarDays.length > 17) {
          await calendarDays[17].click();
          console.log("   Clicked day 17");
          await page.waitForTimeout(2000);
        }
      }
    } else {
      console.log("   No standard date field found. Trying alternative selectors...");

      // Angular Material datepicker toggle
      const toggles = await page.$$('button.mat-datepicker-toggle-default-icon, mat-datepicker-toggle, .datepicker-toggle');
      console.log(`   Found ${toggles.length} datepicker toggles`);
      if (toggles.length > 0) {
        await toggles[0].click();
        await page.waitForTimeout(3000);
      }
    }
  } catch (e) {
    console.log(`   Date interaction error: ${e}`);
  }

  // Step 6: Try clicking Search/Apply button
  console.log("\n5. Looking for Search/Apply button...\n");
  try {
    const searchBtn = await page.$('button:has-text("Search"), button:has-text("Apply"), button:has-text("Check Availability"), button:has-text("Find"), button[type="submit"]');
    if (searchBtn) {
      console.log("   Found search button — clicking...");
      await searchBtn.click();
      await page.waitForTimeout(10000);
      console.log("   Waited 10s for availability results");
    } else {
      console.log("   No search button found");
    }
  } catch (e) {
    console.log(`   Search button error: ${e}`);
  }

  // Step 7: Take a screenshot for reference
  await page.screenshot({ path: "/tmp/bc-parks-recon.png", fullPage: true });
  console.log("\n   Screenshot saved to /tmp/bc-parks-recon.png");

  console.log("\n6. Waiting 60s for any remaining API calls...");
  await page.waitForTimeout(60000);

  await browser.close();
  console.log("\nDone.");
}

recon().catch(console.error);
