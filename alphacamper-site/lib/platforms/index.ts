import type { PlatformPoller } from "./types";
import { RecreationGovPoller } from "./recreation-gov";
import { GoingToCampPoller, GOING_TO_CAMP_DOMAINS } from "./going-to-camp";

export type { PlatformPoller, AvailabilityResult, WatchedTarget, AvailableSite } from "./types";

const recreationGov = new RecreationGovPoller();
const goingToCamp = new GoingToCampPoller();

export const SUPPORTED_PLATFORMS = [
  "recreation_gov",
  ...Object.keys(GOING_TO_CAMP_DOMAINS),
];

export function getPoller(platform: string): PlatformPoller | null {
  if (platform === "recreation_gov") return recreationGov;
  if (platform in GOING_TO_CAMP_DOMAINS) return goingToCamp;
  return null;
}
