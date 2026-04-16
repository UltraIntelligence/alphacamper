const API_BASE = 'https://alphacamper.com';
const CAMIS_LINK_CACHE = new Map();
const PLATFORMS = globalThis.PLATFORMS || {};
const Storage = globalThis.Storage;

function normalizeLookupValue(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findPopularCampground(platform, campgroundId, campgroundName) {
  const p = PLATFORMS[platform];
  if (!p) return null;
  const id = String(campgroundId || '');
  const name = normalizeLookupValue(campgroundName);
  return p.popularCampgrounds?.find((entry) => {
    if (String(entry.id) === id) return true;
    if (campgroundName && normalizeLookupValue(entry.name) === name) return true;
    return false;
  }) || null;
}

function shouldUseLiveCamisLookup(platform) {
  return platform === 'bc_parks' || platform === 'ontario_parks';
}

async function resolveLiveCamisCampground(platform, campgroundId, campgroundName) {
  const fallback = findPopularCampground(platform, campgroundId, campgroundName);
  const rawQuery = String(campgroundName || fallback?.name || campgroundId || '').trim();
  const query = normalizeLookupValue(rawQuery);
  const exactId = String(campgroundId || fallback?.id || '').trim();
  const cacheKey = `${platform}:${exactId || query}`;
  if (CAMIS_LINK_CACHE.has(cacheKey)) {
    return CAMIS_LINK_CACHE.get(cacheKey);
  }

  const result = {
    resourceLocationId: '',
    mapId: fallback?.mapId || '',
  };

  if (exactId) {
    try {
      const res = await fetch(
        `${API_BASE}/api/campgrounds?id=${encodeURIComponent(exactId)}&platform=${encodeURIComponent(platform)}&limit=1`,
        { headers: { Accept: 'application/json' } }
      );
      if (res.ok) {
        const data = await res.json();
        const campgrounds = Array.isArray(data?.campgrounds) ? data.campgrounds : [];
        const liveMatch = campgrounds[0];
        if (liveMatch?.id) {
          result.resourceLocationId = String(liveMatch.id);
        }
        if (liveMatch?.root_map_id) {
          result.mapId = String(liveMatch.root_map_id);
        }
      }
    } catch (error) {
      console.warn(`[missions] ${platform} campground exact lookup failed:`, error);
    }
  }

  const needsMapId = platform === 'bc_parks';
  const siteQuery = rawQuery.length >= 2 ? rawQuery : exactId;
  if ((!result.resourceLocationId || (needsMapId && !result.mapId)) && siteQuery) {
    try {
      const res = await fetch(
        `${API_BASE}/api/campgrounds?q=${encodeURIComponent(siteQuery)}&platform=${encodeURIComponent(platform)}&limit=20`,
        { headers: { Accept: 'application/json' } }
      );
      if (res.ok) {
        const data = await res.json();
        const campgrounds = Array.isArray(data?.campgrounds) ? data.campgrounds : [];
        const exactName = normalizeLookupValue(campgroundName || fallback?.name || siteQuery);
        const liveMatch = campgrounds.find((entry) => {
          if (exactId && String(entry.id) === exactId) return true;
          if (normalizeLookupValue(entry.name) === exactName) return true;
          if (normalizeLookupValue(entry.short_name) === exactName) return true;
          return false;
        }) || campgrounds[0];
        if (!result.resourceLocationId && liveMatch?.id) {
          result.resourceLocationId = String(liveMatch.id);
        }
        if (!result.mapId && liveMatch?.root_map_id) {
          result.mapId = String(liveMatch.root_map_id);
        }
      }
    } catch (error) {
      console.warn(`[missions] ${platform} campground search lookup failed:`, error);
    }
  }

  if (!result.resourceLocationId) {
    result.resourceLocationId = exactId;
  }

  CAMIS_LINK_CACHE.set(cacheKey, result);
  return result;
}

const Missions = {
  async create(name) {
    const mission = {
      id: crypto.randomUUID(),
      name: name || 'New Mission',
      status: 'planning',
      targets: [],
      bookingWindow: {
        date: '',
        time: '',
        timezone: 'America/Los_Angeles'
      },
      rehearsalResults: {
        bestTime: null,
        attempts: 0,
        lastAttempt: null
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await Storage.saveMission(mission);
    return mission;
  },

  async update(id, updates) {
    const mission = await Storage.getMission(id);
    if (!mission) return null;
    Object.assign(mission, updates);
    mission.updatedAt = new Date().toISOString();
    await Storage.saveMission(mission);
    return mission;
  },

  async delete(id) {
    await Storage.deleteMission(id);
  },

  async addTarget(missionId, targetData) {
    const mission = await Storage.getMission(missionId);
    if (!mission) return null;
    const maxRank = mission.targets.reduce((max, t) => Math.max(max, t.rank), 0);
    const target = {
      id: crypto.randomUUID(),
      rank: maxRank + 1,
      platform: targetData.platform || 'recreation_gov',
      campgroundId: targetData.campgroundId || '',
      parkName: targetData.parkName || '',
      campgroundName: targetData.campgroundName || '',
      siteNumber: targetData.siteNumber || null,
      arrivalDate: targetData.arrivalDate || '',
      departureDate: targetData.departureDate || '',
      deepLink: targetData.deepLink || '',
      notes: targetData.notes || ''
    };
    mission.targets.push(target);
    mission.updatedAt = new Date().toISOString();
    await Storage.saveMission(mission);
    return target;
  },

  async removeTarget(missionId, targetId) {
    const mission = await Storage.getMission(missionId);
    if (!mission) return;
    mission.targets = mission.targets.filter(t => t.id !== targetId);
    mission.targets.forEach((t, i) => { t.rank = i + 1; });
    mission.updatedAt = new Date().toISOString();
    await Storage.saveMission(mission);
  },

  async reorderTargets(missionId, orderedIds) {
    const mission = await Storage.getMission(missionId);
    if (!mission) return;
    const reordered = [];
    orderedIds.forEach((id, i) => {
      const target = mission.targets.find(t => t.id === id);
      if (target) {
        target.rank = i + 1;
        reordered.push(target);
      }
    });
    mission.targets = reordered;
    mission.updatedAt = new Date().toISOString();
    await Storage.saveMission(mission);
  },

  async updateRehearsalResults(missionId, results) {
    const mission = await Storage.getMission(missionId);
    if (!mission) return;
    const current = mission.rehearsalResults;
    current.attempts += 1;
    current.lastAttempt = new Date().toISOString();
    if (current.bestTime === null || results.totalTime < current.bestTime) {
      current.bestTime = results.totalTime;
    }
    mission.updatedAt = new Date().toISOString();
    await Storage.saveMission(mission);
    return current;
  },

  async generateDeepLink(platform, campgroundId, campgroundName = '') {
    const p = PLATFORMS[platform];
    if (!p || !p.deepLinkTemplate) return '';
    if (shouldUseLiveCamisLookup(platform)) {
      const fallback = findPopularCampground(platform, campgroundId, campgroundName);
      const resolved = await resolveLiveCamisCampground(platform, campgroundId, campgroundName || fallback?.name || '');
      const resourceLocationId = resolved.resourceLocationId || String(campgroundId || fallback?.id || '');
      if (!resourceLocationId) return '';
      if (platform === 'bc_parks' && resolved.mapId) {
        return `https://camping.bcparks.ca/create-booking/results?resourceLocationId=${encodeURIComponent(resourceLocationId)}&mapId=${encodeURIComponent(resolved.mapId)}&searchTabGroupId=0`;
      }
      return p.deepLinkTemplate
        .replace('{campgroundId}', resourceLocationId)
        .replace('{locationId}', resourceLocationId)
        .replace('{parkSlug}', resourceLocationId)
        .replace('{campgroundSlug}', resourceLocationId);
    }
    return p.deepLinkTemplate
      .replace('{campgroundId}', campgroundId)
      .replace('{locationId}', campgroundId)
      .replace('{parkSlug}', campgroundId.split('/')[0] || campgroundId)
      .replace('{campgroundSlug}', campgroundId.split('/')[1] || campgroundId);
  }
};

globalThis.Missions = Missions;
