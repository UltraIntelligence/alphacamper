#!/usr/bin/env node

const path = require("node:path");

async function main() {
  const [, , providerName, baseUrl, resourceLocationId, rootMapId, startDate, endDate] = process.argv;
  if (!providerName || !baseUrl || !resourceLocationId || !rootMapId || !startDate || !endDate) {
    console.error(
      "usage: camis_availability_session.cjs <provider_name> <base_url> <resource_location_id> <root_map_id> <start_date> <end_date>"
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
    await page.goto(`${baseUrl}/create-booking/results?resourceLocationId=${resourceLocationId}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(12000);

    const payload = await page.evaluate(
      async ({ rootMapId, startDate, endDate }) => {
        const fetchJson = async (path, params) => {
          const url = new URL(path, window.location.origin);
          for (const [key, value] of Object.entries(params || {})) {
            url.searchParams.set(key, String(value));
          }
          const res = await fetch(url.toString(), {
            headers: { Accept: "application/json, text/plain, */*" },
          });
          const text = await res.text();
          return {
            status: res.status,
            json: JSON.parse(text),
          };
        };

        const cartRes = await fetchJson("/api/cart");
        const cart = cartRes.json;
        const baseParams = {
          bookingCategoryId: 0,
          equipmentCategoryId: -32768,
          subEquipmentCategoryId: -32768,
          cartUid: cart.cartUid,
          cartTransactionUid: cart.createTransactionUid,
          bookingUid: "00000000-0000-0000-0000-000000000000",
          groupHoldUid: "",
          startDate,
          endDate,
          getDailyAvailability: "true",
          isReserving: "true",
          filterData: "[]",
          boatLength: 0,
          boatDraft: 0,
          boatWidth: 0,
          peopleCapacityCategoryCounts: "[]",
          numEquipment: 0,
          seed: `${startDate}T00:00:00Z`,
        };

        const rootRes = await fetchJson("/api/availability/map", {
          ...baseParams,
          mapId: rootMapId,
        });

        const root = rootRes.json;
        const subMapIds = Object.keys(root.mapLinkAvailabilities || {});
        const mapsToFetch =
          subMapIds.length > 0 ? subMapIds : Object.keys(root.resourceAvailabilities || {}).length > 0 ? [String(rootMapId)] : [];

        const sitePayloads = [];
        for (const mapId of mapsToFetch) {
          const siteRes = await fetchJson("/api/availability/map", {
            ...baseParams,
            mapId,
          });
          sitePayloads.push({ mapId: Number(mapId), payload: siteRes.json });
        }

        return { cart, root, sitePayloads };
      },
      {
        rootMapId: Number(rootMapId),
        startDate,
        endDate,
      }
    );

    process.stdout.write(JSON.stringify(payload));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(String(error));
  process.exit(1);
});

