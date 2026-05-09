import { describe, expect, it } from "vitest";

import {
  DEFAULT_PLATFORMS,
  isCountableRootMapId,
  splitCountableCampgroundRows,
} from "../scripts/count-campsite-inventory.js";

describe("campsite inventory row filtering", () => {
  it("counts only provider rows with a real root map ID", () => {
    const { countableRows, excludedRows } = splitCountableCampgroundRows([
      { id: "-1", name: "Real campground", root_map_id: -100 },
      { id: "-2", name: "Provider admin row", root_map_id: null },
      { id: "-3", name: "Missing map row", root_map_id: undefined },
    ]);

    expect(countableRows).toEqual([
      { id: "-1", name: "Real campground", root_map_id: -100 },
    ]);
    expect(excludedRows).toEqual([
      {
        id: "-2",
        name: "Provider admin row",
        reason: "missing provider root map ID (null)",
      },
      {
        id: "-3",
        name: "Missing map row",
        reason: "missing provider root map ID (undefined)",
      },
    ]);
  });

  it("treats finite numeric map IDs as countable", () => {
    expect(isCountableRootMapId(0)).toBe(true);
    expect(isCountableRootMapId(-2147483648)).toBe(true);
    expect(isCountableRootMapId(Number.NaN)).toBe(false);
    expect(isCountableRootMapId("123")).toBe(false);
  });

  it("defaults to verified live-polling provider profiles only", () => {
    expect(DEFAULT_PLATFORMS).toEqual([
      "bc_parks",
      "ontario_parks",
      "parks_canada",
      "gtc_manitoba",
      "gtc_novascotia",
      "gtc_new_brunswick",
    ]);
  });
});
