import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('extension missions', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn()
        .mockReturnValueOnce('mission-1')
        .mockReturnValueOnce('target-1')
        .mockReturnValueOnce('target-2'),
    });

    const missions = [];
    globalThis.Storage = {
      saveMission: vi.fn(async (mission) => {
        const index = missions.findIndex((entry) => entry.id === mission.id);
        if (index >= 0) missions[index] = structuredClone(mission);
        else missions.push(structuredClone(mission));
        return mission;
      }),
      getMission: vi.fn(async (id) => missions.find((entry) => entry.id === id) || null),
      deleteMission: vi.fn(async (id) => {
        const index = missions.findIndex((entry) => entry.id === id);
        if (index >= 0) missions.splice(index, 1);
      }),
    };

    await import('../lib/platforms.js');
    await import('../lib/missions.js');
  });

  it('creates a booking mission and keeps exact site choices on targets', async () => {
    const mission = await globalThis.Missions.create('Banff summer trip');
    const target = await globalThis.Missions.addTarget(mission.id, {
      platform: 'bc_parks',
      campgroundId: '-2147483647',
      campgroundName: 'Alice Lake',
      siteNumber: 'A12',
      arrivalDate: '2026-07-10',
      departureDate: '2026-07-12',
    });

    expect(mission.name).toBe('Banff summer trip');
    expect(target.siteNumber).toBe('A12');
    expect(target.rank).toBe(1);
  });

  it('builds and caches live BC Parks booking links', async () => {
    fetch
      .mockResolvedValueOnce(new Response(JSON.stringify({
        campgrounds: [{
          id: '-2147483647',
          root_map_id: '-2147483000',
          name: 'Alice Lake',
        }],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        campgrounds: [{
          id: '-2147483647',
          root_map_id: '-2147483000',
          name: 'Alice Lake',
        }],
      }), { status: 200 }));

    const first = await globalThis.Missions.generateDeepLink('bc_parks', '-2147483647', 'Alice Lake');
    const second = await globalThis.Missions.generateDeepLink('bc_parks', '-2147483647', 'Alice Lake');

    expect(first).toBe('https://camping.bcparks.ca/create-booking/results?resourceLocationId=-2147483647&mapId=-2147483000&searchTabGroupId=0');
    expect(second).toBe(first);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
