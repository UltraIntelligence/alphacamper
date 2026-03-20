import { describe, it, expect } from "vitest";
import { groupByCampground, shouldCreateAlert } from "../src/supabase.js";

describe("groupByCampground", () => {
  it("groups watches by platform:campground_id", () => {
    const watches = [
      { id: "1", platform: "bc_parks", campground_id: "-2504", campground_name: "Rathtrevor", user_id: "u1", site_number: null, arrival_date: "2026-07-10", departure_date: "2026-07-12", active: true, last_checked_at: null },
      { id: "2", platform: "bc_parks", campground_id: "-2504", campground_name: "Rathtrevor", user_id: "u2", site_number: "A5", arrival_date: "2026-07-11", departure_date: "2026-07-13", active: true, last_checked_at: null },
      { id: "3", platform: "ontario_parks", campground_id: "-2740399", campground_name: "Canisbay", user_id: "u1", site_number: null, arrival_date: "2026-08-01", departure_date: "2026-08-03", active: true, last_checked_at: null },
    ];

    const groups = groupByCampground(watches);
    expect(groups.size).toBe(2);
    expect(groups.get("bc_parks:-2504")).toHaveLength(2);
    expect(groups.get("ontario_parks:-2740399")).toHaveLength(1);
  });

  it("returns empty map for empty input", () => {
    expect(groupByCampground([]).size).toBe(0);
  });
});

describe("shouldCreateAlert", () => {
  it("returns true when sites are available", () => {
    expect(shouldCreateAlert([{ siteId: "-100", siteName: "A1" }])).toBe(true);
  });

  it("returns false when no sites", () => {
    expect(shouldCreateAlert([])).toBe(false);
  });
});
