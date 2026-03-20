/** A single available site found by a poller */
export interface AvailableSite {
  siteId: string;
  siteName: string;
}

/** Result of checking one watch against a platform API */
export interface AvailabilityResult {
  watchId: string;
  userId: string;
  sites: AvailableSite[];
}

/** A watched target row from the database */
export interface WatchedTarget {
  id: string;
  user_id: string;
  platform: string;
  campground_id: string;
  campground_name: string;
  site_number: string | null;
  arrival_date: string;
  departure_date: string;
  active: boolean;
}

/** Every platform poller implements this interface */
export interface PlatformPoller {
  checkCampground(
    watches: WatchedTarget[],
    signal?: AbortSignal,
  ): Promise<AvailabilityResult[]>;
}
