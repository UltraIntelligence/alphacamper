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

function buildUrl(baseUrl, requestPath, paramsJson) {
  const url = new URL(requestPath, baseUrl);
  const params = paramsJson ? JSON.parse(paramsJson) : {};
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function main() {
  const [, , providerName, baseUrl, method, requestPath, paramsJson = "{}", bodyJson = "null"] = process.argv;
  if (!providerName || !baseUrl || !method || !requestPath) {
    console.error(
      "usage: camis_browser_fetch.cjs <provider_name> <base_url> <method> <request_path> [params_json] [body_json]"
    );
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

    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(5000);

    const warmUrl = getWarmUrl(providerName, baseUrl);
    if (warmUrl) {
      await page.goto(warmUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(12000);
    }

    const fullUrl = buildUrl(baseUrl, requestPath, paramsJson);
    const body = bodyJson && bodyJson !== "null" ? JSON.parse(bodyJson) : null;

    const result = await page.evaluate(
      async ({ fullUrl, method, body }) => {
        const headers = { Accept: "application/json, text/plain, */*" };
        if (body) {
          headers["Content-Type"] = "application/json";
        }
        const response = await fetch(fullUrl, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });
        const text = await response.text();
        return {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: text,
        };
      },
      { fullUrl, method, body }
    );

    process.stdout.write(JSON.stringify(result));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(String(error));
  process.exit(1);
});
