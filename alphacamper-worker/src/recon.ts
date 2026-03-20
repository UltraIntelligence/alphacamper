import { chromium } from "playwright";

/**
 * API Reconnaissance Script
 * Opens a Canadian park booking site in a real browser, navigates to availability,
 * and logs every API call the site makes.
 *
 * Usage:
 *   npx tsx src/recon.ts                                    # BC Parks (default)
 *   npx tsx src/recon.ts reservations.ontarioparks.ca -2740399  # Ontario Parks
 */

const domain = process.argv[2] || "camping.bcparks.ca";
const campgroundId = process.argv[3] || "-2504";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface ApiCall {
  method: string;
  url: string;
  postData?: string;
  status: number;
  responsePreview: string;
  headers: Record<string, string>;
}

async function recon() {
  console.log(`\n=== Recon: ${domain} | Campground: ${campgroundId} ===\n`);

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({
    userAgent: UA,
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
  });

  const page = await context.newPage();
  const apiCalls: ApiCall[] = [];

  // Intercept all responses
  page.on("response", async (response) => {
    const url = response.url();
    // Capture API calls and any JSON responses
    if (!url.includes("/api/") && !url.includes("availability") && !url.includes("resource")) return;

    const request = response.request();
    let responsePreview = "";
    try {
      const body = await response.text();
      responsePreview = body.substring(0, 2000);
    } catch { /* ignore */ }

    const entry: ApiCall = {
      method: request.method(),
      url,
      postData: request.postData() || undefined,
      status: response.status(),
      responsePreview,
      headers: Object.fromEntries(
        Object.entries(request.headers()).filter(([k]) =>
          ["content-type", "cookie", "accept", "referer", "x-xsrf-token", "x-requested-with"].includes(k.toLowerCase())
        )
      ),
    };
    apiCalls.push(entry);

    console.log(`\n--- ${entry.method} ${entry.url} (${entry.status}) ---`);
    if (entry.postData) console.log("  Body:", entry.postData.substring(0, 300));
    if (Object.keys(entry.headers).length) console.log("  Headers:", JSON.stringify(entry.headers));
    console.log("  Response:", responsePreview.substring(0, 300));
  });

  // Step 1: Navigate to homepage (solve WAF)
  console.log("1. Navigating to homepage to solve WAF...");
  await page.goto(`https://${domain}/`, { waitUntil: "networkidle", timeout: 60000 });
  const cookies = await context.cookies();
  console.log(`   Homepage loaded. ${cookies.length} cookies received.`);
  console.log("   Cookie names:", cookies.map(c => c.name).join(", "));

  // Step 2: Navigate to campground availability
  const availUrl = `https://${domain}/create-booking/results?resourceLocationId=${campgroundId}`;
  console.log(`\n2. Navigating to availability: ${availUrl}...`);
  await page.goto(availUrl, { waitUntil: "networkidle", timeout: 60000 });

  // Step 3: Wait for dynamic content
  console.log("\n3. Waiting 20s for availability data to load...");
  await page.waitForTimeout(20000);

  // Step 4: Print summary
  console.log("\n\n" + "=".repeat(60));
  console.log("API CALL SUMMARY");
  console.log("=".repeat(60) + "\n");

  for (const call of apiCalls) {
    console.log(`${call.method} ${call.url}`);
    console.log(`  Status: ${call.status}`);
    if (call.postData) console.log(`  Request Body: ${call.postData}`);
    if (Object.keys(call.headers).length) console.log(`  Request Headers: ${JSON.stringify(call.headers)}`);
    console.log(`  Response (first 500 chars): ${call.responsePreview.substring(0, 500)}`);
    console.log();
  }

  // Step 5: Print cookies
  console.log("\n" + "=".repeat(60));
  console.log("COOKIES");
  console.log("=".repeat(60) + "\n");
  const finalCookies = await context.cookies();
  for (const c of finalCookies) {
    console.log(`${c.name} = ${c.value.substring(0, 80)}${c.value.length > 80 ? "..." : ""}`);
    console.log(`  domain: ${c.domain} | path: ${c.path} | httpOnly: ${c.httpOnly} | secure: ${c.secure}`);
  }

  console.log(`\n\nTotal API calls captured: ${apiCalls.length}`);
  console.log("Close the browser window to exit (or wait 5 min).");

  await page.waitForTimeout(300000);
  await browser.close();
}

recon().catch(console.error);
