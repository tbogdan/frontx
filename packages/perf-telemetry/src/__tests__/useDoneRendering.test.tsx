import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('../otel-init', async () => {
  const actual = await vi.importActual<typeof import('../otel-init')>('../otel-init');
  return {
    ...actual,
    getTracer: () => ({
      startSpan: () => ({
        setAttribute: vi.fn(),
        setStatus: vi.fn(),
        end: vi.fn(),
        spanContext: () => ({ spanId: 's', traceId: 't' }),
      }),
    }),
  };
});

vi.mock('../action-scope', async () => {
  const actual = await vi.importActual<typeof import('../action-scope')>('../action-scope');
  return {
    ...actual,
    beginRouteUiScope: vi.fn(),
    getActiveRouteUiScope: vi.fn(() => undefined),
    findRelatedActionScope: vi.fn(() => undefined),
    getTelemetryParentContext: vi.fn(() => undefined),
    getActionParentContext: vi.fn(() => undefined),
    endRouteUiScope: vi.fn(() => undefined),
  };
});

import { useDoneRendering } from '../hooks';

describe('useDoneRendering — routeId override (m2)', () => {
  it('accepts opts.routeId without throwing', () => {
    const { result } = renderHook(() =>
      useDoneRendering('inbox.ready', { dataReady: false }, { routeId: 'explicit-route' })
    );
    expect(result.current).toBeUndefined();
  });
});
