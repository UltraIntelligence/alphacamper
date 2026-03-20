import { describe, it, expect } from "vitest";
import { resolveCampground } from "../src/id-resolver.js";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeMap() {
  return new Map([
    [
      "12345",
      {
        resourceLocationId: 12345,
        rootMapId: -2147483545,
        shortName: "Rathtrevor",
        fullName: "Rathtrevor Beach Provincial Park",
      },
    ],
    [
      "rathtrevor",
      {
        resourceLocationId: 12345,
        rootMapId: -2147483545,
        shortName: "Rathtrevor",
        fullName: "Rathtrevor Beach Provincial Park",
      },
    ],
    [
      "rathtrevor beach provincial park",
      {
        resourceLocationId: 12345,
        rootMapId: -2147483545,
        shortName: "Rathtrevor",
        fullName: "Rathtrevor Beach Provincial Park",
      },
    ],
    [
      "67890",
      {
        resourceLocationId: 67890,
        rootMapId: -2147483437,
        shortName: "Canisbay",
        fullName: "Canisbay Lake Campground",
      },
    ],
    [
      "canisbay",
      {
        resourceLocationId: 67890,
        rootMapId: -2147483437,
        shortName: "Canisbay",
        fullName: "Canisbay Lake Campground",
      },
    ],
    [
      "canisbay lake campground",
      {
        resourceLocationId: 67890,
        rootMapId: -2147483437,
        shortName: "Canisbay",
        fullName: "Canisbay Lake Campground",
      },
    ],
  ]);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("resolveCampground", () => {
  it("resolves by exact resourceLocationId string", () => {
    const map = makeMap();
    const result = resolveCampground(map, "12345", "");
    expect(result).not.toBeNull();
    expect(result!.resourceLocationId).toBe(12345);
    expect(result!.rootMapId).toBe(-2147483545);
  });

  it("resolves by shortName (case-insensitive)", () => {
    const map = makeMap();
    const result = resolveCampground(map, "unknown-id", "RATHTREVOR");
    expect(result).not.toBeNull();
    expect(result!.resourceLocationId).toBe(12345);
  });

  it("resolves by partial name match", () => {
    const map = makeMap();
    // "canisbay lake" is a partial match against "canisbay lake campground"
    const result = resolveCampground(map, "bad-id", "canisbay lake");
    expect(result).not.toBeNull();
    expect(result!.resourceLocationId).toBe(67890);
    expect(result!.rootMapId).toBe(-2147483437);
  });

  it("returns null for an unknown campground", () => {
    const map = makeMap();
    const result = resolveCampground(map, "999", "Nowhere Special");
    expect(result).toBeNull();
  });

  it("prefers ID lookup over name lookup when both match different entries", () => {
    const map = makeMap();
    // ID "67890" maps to Canisbay, but name "Rathtrevor" maps to Rathtrevor
    const result = resolveCampground(map, "67890", "Rathtrevor");
    expect(result!.resourceLocationId).toBe(67890); // ID wins
  });
});
