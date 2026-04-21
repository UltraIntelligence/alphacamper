import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('extension events', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    globalThis.chrome = {
      storage: {
        local: {
          get: vi.fn(async () => ({ extensionAuthToken: 'ext_token_123' })),
        },
      },
    };

    await import('../lib/events.js');
  });

  it('catches network errors silently when sending an event', async () => {
    await expect(globalThis.emitEvent('sms_tapped', {
      watchId: 'watch-1',
      source: 'watch_alert',
    })).resolves.toBe(false);

    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
