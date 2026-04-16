import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('extension popup', () => {
  beforeEach(async () => {
    vi.resetModules();
    document.body.innerHTML = '<button id="openBtn">Open</button>';

    globalThis.chrome = {
      tabs: {
        query: vi.fn(async () => [{ windowId: 99 }]),
      },
      sidePanel: {
        open: vi.fn(async () => undefined),
      },
    };
    Object.defineProperty(window, 'close', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });

    await import('../popup/popup.js');
  });

  it('opens the side panel for the active browser window', async () => {
    document.getElementById('openBtn').click();
    await Promise.resolve();
    await Promise.resolve();

    expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    expect(chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 99 });
    expect(window.close).toHaveBeenCalled();
  });
});
