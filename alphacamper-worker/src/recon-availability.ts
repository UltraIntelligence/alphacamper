import { chromium } from "playwright";

/**
 * Focused recon: navigate to campground availability and capture the specific
 * API call that loads site-level availability data.
 */

const domain = process.argv[2] || "camping.bcparks.ca";
const campgroundId = process.argv[3] || "-2504";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

async function recon() {
  console.log(`\n=== Availability Recon: ${domain} | Campground: ${campgroundId} ===\n`);

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({
    userAgent: UA,
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
  });

  const page = await context.newPage();

  // Capture ALL network requests (not just /api/)
  page.on("response", async (response) => {
    const url = response.url();
    // Skip static assets
    if (url.match(/\.(js|css|png|jpg|svg|woff|ico|gif|avif)(\?|$)/)) return;
    if (url.includes("google") || url.includes("analytics") || url.includes("clarity")) return;

    const request = response.request();
    const status = response.status();

    // Only log non-redirect, non-304 responses
    if (status === 301 || status === 302 || status === 304) return;

    let responsePreview = "";
    const contentType = response.headers()["content-type"] || "";
    if (contentType.includes("json") || contentType.includes("text")) {
      try {
        const body = await response.text();
        responsePreview = body.substring(0, 1000);
      } catch { /* ignore */ }
    }

    console.log(`${request.method()} ${url} → ${status}`);
    if (request.postData()) console.log(`  BODY: ${request.postData()!.substring(0, 500)}`);
    if (responsePreview) console.log(`  RESP: ${responsePreview.substring(0, 400)}`);
    console.log();
  });

  // Step 1: Go to homepage, wait for WAF to solve (don't wait for networkidle)
  console.log("1. Solving WAF on homepage...");
  await page.goto(`https://${domain}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  // Wait a bit for WAF JS challenge
  await page.waitForTimeout(8000);

  const cookies = await context.cookies();
  console.log(`   ${cookies.length} cookies. Names: ${cookies.map(c => c.name).join(", ")}\n`);

  // Step 2: Go to campground availability page
  const availUrl = `https://${domain}/create-booking/results?resourceLocationId=${campgroundId}`;
  console.log(`2. Navigating to: ${availUrl}`);
  await page.goto(availUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

  // Wait for availability data to load
  console.log("3. Waiting 30s for availability API calls...\n");
  await page.waitForTimeout(30000);

  // Step 3: Try to interact — select dates to trigger more API calls
  console.log("4. Looking for date pickers or search buttons...");
  try {
    // Try clicking on a date or search element to trigger availability API
    const dateElements = await page.$$('[data-testid*="date"], [class*="calendar"], [class*="date"], input[type="date"]');
    console.log(`   Found ${dateElements.length} date-related elements`);
  } catch (e) {
    console.log(`   Error looking for elements: ${e}`);
  }

  console.log("\n5. Keeping browser open for 3 minutes. Interact manually if needed.");
  console.log("   Watch the console for API calls as you click around.\n");
  await page.waitForTimeout(180000);

  await browser.close();
}

recon().catch(console.error);
