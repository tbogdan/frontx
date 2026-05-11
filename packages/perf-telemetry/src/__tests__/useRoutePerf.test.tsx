import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StrictMode } from 'react';
import { renderHook, cleanup } from '@testing-library/react';

const startSpan = vi.fn(() => ({
  setAttribute: vi.fn(),
  end: vi.fn(),
  spanContext: () => ({ spanId: 's', traceId: 't' }),
}));

vi.mock('../otel-init', async () => {
  const actual = await vi.importActual<typeof import('../otel-init')>('../otel-init');
  return {
    ...actual,
    getTracer: () => ({ startSpan }),
    setCurrentRouteId: vi.fn(),
  };
});

// Mock action-scope so getActionParentContext does not throw when
// _ambientTracer is unset (OTel is not initialized in unit tests).
vi.mock('../action-scope', async () => {
  const actual = await vi.importActual<typeof import('../action-scope')>('../action-scope');
  return {
    ...actual,
    getActionParentContext: vi.fn(() => undefined),
  };
});

// Import AFTER the mock so the hook resolves the mocked tracer.
import { useRoutePerf } from '../hooks';

describe('useRoutePerf (M2)', () => {
  beforeEach(() => {
    startSpan.mockClear();
    cleanup();
  });

  it('emits exactly once under StrictMode double-mount', () => {
    renderHook(() => useRoutePerf('home', 100), { wrapper: StrictMode });
    expect(startSpan).toHaveBeenCalledTimes(1);
  });

  it('re-emits when routeId changes', () => {
    const { rerender } = renderHook(({ id }) => useRoutePerf(id, 100), {
      initialProps: { id: 'home' },
    });
    expect(startSpan).toHaveBeenCalledTimes(1);
    rerender({ id: 'inbox' });
    expect(startSpan).toHaveBeenCalledTimes(2);
  });

  it('re-emits when navigationStartMs changes', () => {
    const { rerender } = renderHook(({ ts }) => useRoutePerf('home', ts), {
      initialProps: { ts: 100 },
    });
    expect(startSpan).toHaveBeenCalledTimes(1);
    rerender({ ts: 200 });
    expect(startSpan).toHaveBeenCalledTimes(2);
  });
});
