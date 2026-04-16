import { beforeEach, describe, expect, it, vi } from 'vitest';

function createStorageArea() {
  const state = {};

  return {
    state,
    async get(key) {
      if (Array.isArray(key)) {
        return Object.fromEntries(key.map((entry) => [entry, state[entry]]));
      }
      if (typeof key === 'string') {
        return { [key]: state[key] };
      }
      return { ...state };
    },
    async set(values) {
      Object.assign(state, values);
    },
    async remove(key) {
      delete state[key];
    },
    async clear() {
      for (const key of Object.keys(state)) delete state[key];
    },
  };
}

describe('extension storage', () => {
  beforeEach(async () => {
    vi.resetModules();
    const local = createStorageArea();
    globalThis.chrome = {
      storage: { local },
    };
    await import('../lib/storage.js');
  });

  it('returns sensible defaults for a new customer profile', async () => {
    const profile = await globalThis.Storage.getProfile();
    const settings = await globalThis.Storage.getSettings();

    expect(profile.email).toBe('');
    expect(profile.country).toBe('CA');
    expect(settings.notifyBefore).toBe(5);
    expect(settings.aggressiveAssist).toBe(true);
  });

  it('saves and retrieves missions through chrome storage', async () => {
    await globalThis.Storage.saveMission({
      id: 'mission-1',
      name: 'Yosemite opener',
      status: 'planning',
      targets: [],
      bookingWindow: {
        date: '',
        time: '',
        timezone: 'America/Los_Angeles',
      },
      rehearsalResults: {
        bestTime: null,
        attempts: 0,
        lastAttempt: null,
      },
    });

    const mission = await globalThis.Storage.getMission('mission-1');
    expect(mission.name).toBe('Yosemite opener');
    expect(mission.updatedAt).toBeTruthy();
  });
});
