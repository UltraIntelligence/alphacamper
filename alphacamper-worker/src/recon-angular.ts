import { chromium } from "playwright";

/**
 * Use the Angular app's own HTTP interceptors by hooking fetch.
 * Also interact with Angular Material date picker and equipment dropdown.
 */

async function recon() {
  console.log("\n=== Angular Interceptor Recon ===\n");

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
  });
  const page = await context.newPage();

  // Listen for console messages from the page (our hooks log here)
  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("[HOOK]")) {
      console.log(`BROWSER: ${text}`);
    }
  });

  // Inject fetch interceptor BEFORE page loads
  await page.addInitScript(() => {
    const origFetch = window.fetch;
    // @ts-ignore
    window.fetch = async function (...args: Parameters<typeof fetch>) {
      const url = typeof args[0] === "string" ? args[0] : (args[0] as Request).url;
      if (url.includes("availability") || url.includes("resource")) {
        const opts = args[1] || {};
        console.log(`[HOOK] fetch: ${opts.method || "GET"} ${url}`);
        if (opts.body) console.log(`[HOOK] body: ${String(opts.body)}`);
      }
      const response = await origFetch.apply(window, args);
      if (url.includes("availability")) {
        const clone = response.clone();
        clone.text().then(text => {
          console.log(`[HOOK] response (${text.length} chars): ${text.substring(0, 500)}`);
        });
      }
      return response;
    };
  });

  // WAF
  console.log("1. WAF...");
  await page.goto("https://camping.bcparks.ca/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(6000);
  try { await page.click('button:has-text("I Consent")', { timeout: 3000 }); } catch {}

  // Campground page
  console.log("2. Campground...");
  await page.goto("https://camping.bcparks.ca/create-booking/results?resourceLocationId=-2504", {
    waitUntil: "domcontentloaded", timeout: 30000,
  });
  await page.waitForTimeout(10000);
  try { await page.click('button:has-text("I Consent")', { timeout: 3000 }); } catch {}

  // Take screenshot to see current state
  await page.screenshot({ path: "/tmp/bc-step1.png" });
  console.log("Screenshot: /tmp/bc-step1.png");

  // Interaction: click arrival date to open calendar
  console.log("\n3. Opening calendar...");
  await page.click("#arrival-date-field").catch(() => console.log("   Can't click arrival field"));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "/tmp/bc-step2-calendar.png" });
  console.log("Screenshot: /tmp/bc-step2-calendar.png");

  // Navigate forward in calendar
  console.log("   Navigating months forward...");
  for (let i = 0; i < 4; i++) {
    try {
      await page.click('[aria-label="Next month"]', { timeout: 1000 });
      await page.waitForTimeout(200);
    } catch {
      // Try alternative selector
      try {
        const btns = await page.$$(".mat-calendar-controls button");
        if (btns.length >= 2) {
          await btns[btns.length - 1].click();
          await page.waitForTimeout(200);
        }
      } catch { break; }
    }
  }

  await page.screenshot({ path: "/tmp/bc-step3-july.png" });
  console.log("Screenshot: /tmp/bc-step3-july.png");

  // Click a day
  try {
    const dayCells = await page.$$(".mat-calendar-body-cell");
    console.log(`   Found ${dayCells.length} calendar cells`);
    if (dayCells.length > 10) {
      await dayCells[9].click(); // 10th cell = day 10
      console.log("   Clicked day ~10");
    }
  } catch (e) {
    console.log(`   Day click failed: ${e}`);
  }
  await page.waitForTimeout(1000);

  // Departure — click field
  await page.click("#departure-date-field").catch(() => {});
  await page.waitForTimeout(1000);

  // Click day 12
  try {
    const dayCells = await page.$$(".mat-calendar-body-cell");
    if (dayCells.length > 12) {
      await dayCells[11].click();
      console.log("   Clicked departure day ~12");
    }
  } catch {}
  await page.waitForTimeout(500);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  // Equipment
  console.log("\n4. Equipment...");
  await page.screenshot({ path: "/tmp/bc-step4-before-equip.png" });
  try {
    // Click the mat-select
    await page.click("mat-select", { timeout: 3000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "/tmp/bc-step5-equip-open.png" });

    // Click first option
    const opts = await page.$$("mat-option");
    console.log(`   ${opts.length} options found`);
    if (opts.length > 0) {
      const firstText = await opts[0].textContent();
      console.log(`   First option: "${firstText?.trim()}"`);
      await opts[0].click();
      console.log("   Clicked first equipment option!");
    }
    await page.waitForTimeout(1000);
  } catch (e) {
    console.log(`   Equipment error: ${e}`);
  }

  await page.screenshot({ path: "/tmp/bc-step6-ready.png" });

  // SEARCH
  console.log("\n5. SEARCH...");
  try {
    await page.click("#actionSearch", { timeout: 5000 });
    console.log("   *** SEARCH CLICKED! Watching for availability API... ***\n");
  } catch {
    // Force click
    await page.dispatchEvent("#actionSearch", "click").catch(() => {
      console.log("   Force click also failed");
    });
  }

  // Wait and watch for API calls via our hook
  console.log("   Waiting 25s for results...\n");
  await page.waitForTimeout(25000);

  await page.screenshot({ path: "/tmp/bc-step7-results.png", fullPage: true });
  console.log("\nFinal screenshot: /tmp/bc-step7-results.png");

  console.log("\nWaiting 30s for exploration...");
  await page.waitForTimeout(30000);
  await browser.close();
}

recon().catch(console.error);
