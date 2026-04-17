#!/usr/bin/env node

const path = require("node:path");

const warmUrlsByHost = {
  "reservation.pc.gc.ca": "https://reservation.pc.gc.ca/create-booking/results?resourceLocationId=-2147483643",
  "camping.bcparks.ca": "https://camping.bcparks.ca/create-booking/results?resourceLocationId=-2504",
  "reservations.ontarioparks.ca":
    "https://reservations.ontarioparks.ca/create-booking/results?resourceLocationId=-2740399",
  "longpoint.goingtocamp.com":
    "https://longpoint.goingtocamp.com/create-booking/results?resourceLocationId=-2147483648",
  "maitlandvalley.goingtocamp.com":
    "https://maitlandvalley.goingtocamp.com/create-booking/results?resourceLocationId=-2147483648",
  "stclair.goingtocamp.com":
    "https://stclair.goingtocamp.com/create-booking/results?resourceLocationId=-2147483648",
};

function getWarmUrl(providerName, baseUrl) {
  const host = new URL(baseUrl).host;
  const legacyWarmUrls = {
    parks_canada: warmUrlsByHost["reservation.pc.gc.ca"],
    bc_parks: warmUrlsByHost["camping.bcparks.ca"],
    ontario_parks: warmUrlsByHost["reservations.ontarioparks.ca"],
  };
  return warmUrlsByHost[host] || legacyWarmUrls[providerName];
}

async function main() {
  const [, , providerName, baseUrl] = process.argv;
  if (!providerName || !baseUrl) {
    console.error("usage: session_bootstrap.cjs <provider_name> <base_url>");
    process.exit(1);
  }

  const playwrightPath = path.resolve(
    __dirname,
    "..",
    "..",
    "alphacamper-worker",
    "node_modules",
    "playwright",
    "index.js"
  );
  const { chromium } = require(playwrightPath);

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      locale: "en-US",
    });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(5000);

    const consentButton = page.getByRole("button", { name: /i consent/i }).first();
    try {
      if (await consentButton.isVisible({ timeout: 1000 })) {
        await consentButton.click();
        await page.waitForTimeout(1000);
      }
    } catch {}

    const warmUrl = getWarmUrl(providerName, baseUrl);
    if (warmUrl) {
      await page.goto(warmUrl, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(15000);
      try {
        if (await consentButton.isVisible({ timeout: 1000 })) {
          await consentButton.click();
          await page.waitForTimeout(1000);
        }
      } catch {}

      await page.evaluate(async () => {
        try {
          await fetch("/api/cart", { headers: { Accept: "application/json" } });
        } catch {}
        try {
          await fetch("/api/resourceLocation", {
            headers: { Accept: "application/json, text/plain, */*" },
          });
        } catch {}
      });
      await page.waitForTimeout(3000);
    }

    const cookies = await context.cookies();
    const cookieMap = Object.fromEntries(cookies.map((cookie) => [cookie.name, cookie.value]));
    const headers = {};
    if (cookieMap["XSRF-TOKEN"]) {
      headers["X-XSRF-TOKEN"] = cookieMap["XSRF-TOKEN"];
    }

    process.stdout.write(
      JSON.stringify({
        cookies: cookieMap,
        headers,
      })
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(String(error));
  process.exit(1);
});
