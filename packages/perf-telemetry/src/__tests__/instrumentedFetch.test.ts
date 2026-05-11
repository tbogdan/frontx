import { describe, it, expect, beforeEach, vi } from 'vitest';

const startSpan = vi.fn(() => ({
  setAttribute: vi.fn(),
  setStatus: vi.fn(),
  end: vi.fn(),
  spanContext: () => ({ spanId: 's', traceId: 't' }),
}));

vi.mock('../otel-init', async () => {
  const actual = await vi.importActual<typeof import('../otel-init')>('../otel-init');
  return {
    ...actual,
    getTracer: () => ({ startSpan }),
  };
});

vi.mock('../action-scope', async () => {
  const actual = await vi.importActual<typeof import('../action-scope')>('../action-scope');
  return {
    ...actual,
    getTelemetryParentContext: vi.fn(() => undefined),
    findRelatedActionScope: vi.fn(() => undefined),
    getActionParentContext: vi.fn(() => undefined),
  };
});

import { instrumentedFetch } from '../hooks';

describe('instrumentedFetch (M4)', () => {
  beforeEach(() => {
    startSpan.mockClear();
    Object.defineProperty(globalThis, 'fetch', {
      value: vi.fn(async (_url: string) => new Response('ok', { status: 200 })),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: { location: { origin: 'http://app.example' } },
      writable: true,
      configurable: true,
    });
  });

  it('creates a span for same-origin absolute URLs', async () => {
    await instrumentedFetch('http://app.example/api/threads', { routeId: 'inbox' });
    expect(startSpan).toHaveBeenCalledTimes(1);
  });

  it('creates a span for relative URLs (resolved against app origin)', async () => {
    await instrumentedFetch('/api/threads', { routeId: 'inbox' });
    expect(startSpan).toHaveBeenCalledTimes(1);
  });

  it('does NOT create a span for cross-origin requests and invokes debugLogger', async () => {
    const debug = vi.fn();
    await instrumentedFetch(
      'http://other.example/api/threads',
      { routeId: 'inbox' },
      undefined,
      { debugLogger: debug },
    );
    expect(startSpan).not.toHaveBeenCalled();
    expect(debug).toHaveBeenCalledWith('fetch.cross_origin', expect.anything());
  });
});
