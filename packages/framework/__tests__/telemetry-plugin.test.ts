import { describe, it, expect, vi } from 'vitest';

vi.mock('@cyberfabric/perf-telemetry', () => ({
  initOtel: vi.fn(),
  isOtelInitialized: vi.fn(() => true),
  flushOtel: vi.fn(async () => undefined),
  shutdownOtel: vi.fn(async () => undefined),
}));

import { telemetry } from '../src/plugins/telemetry';

describe('telemetry plugin (m4, m6)', () => {
  it('skips init when serviceName missing', async () => {
    const plugin = telemetry({ enabled: true });
    await plugin.onInit?.({} as never);
    const mod = await import('@cyberfabric/perf-telemetry');
    expect(mod.initOtel).not.toHaveBeenCalled();
  });

  it('skips init when enabled defaults to false', async () => {
    const plugin = telemetry({ serviceName: 'x', collectorUrl: 'http://x' });
    await plugin.onInit?.({} as never);
    const mod = await import('@cyberfabric/perf-telemetry');
    expect(mod.initOtel).not.toHaveBeenCalled();
  });

  it('flushes before shutdown on destroy', async () => {
    const plugin = telemetry({ enabled: true, serviceName: 'x', collectorUrl: 'http://x' });
    await plugin.onInit?.({} as never);
    const mod = await import('@cyberfabric/perf-telemetry');
    plugin.onDestroy?.({} as never);
    await new Promise((r) => setTimeout(r, 5));
    expect(mod.flushOtel).toHaveBeenCalled();
    expect(mod.shutdownOtel).toHaveBeenCalled();
  });
});
