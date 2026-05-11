import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  wasNavigationTimingEmitted,
  markNavigationTimingEmitted,
  shutdownOtel,
  initOtel,
  isOtelInitialized,
} from '../otel-init';

describe('nav-timing emission flag (M3)', () => {
  afterEach(async () => {
    await shutdownOtel();
  });

  it('starts as not emitted', () => {
    expect(wasNavigationTimingEmitted()).toBe(false);
  });

  it('mark sets the flag', () => {
    markNavigationTimingEmitted();
    expect(wasNavigationTimingEmitted()).toBe(true);
  });

  it('shutdown resets the flag', async () => {
    markNavigationTimingEmitted();
    await shutdownOtel();
    expect(wasNavigationTimingEmitted()).toBe(false);
  });
});

describe('initOtel config validation (M1)', () => {
  afterEach(async () => {
    await shutdownOtel();
  });

  it('skips init when serviceName is empty', () => {
    const debug = vi.fn();
    initOtel({
      serviceName: '',
      serviceVersion: '1.0.0',
      collectorUrl: 'http://localhost:14318',
      environment: 'development',
      enabled: true,
      debugLogger: debug,
    });
    expect(isOtelInitialized()).toBe(false);
    expect(debug).toHaveBeenCalledWith('init.config_invalid', expect.anything());
  });

  it('skips init when collectorUrl is empty', () => {
    const debug = vi.fn();
    initOtel({
      serviceName: 'my-app',
      serviceVersion: '1.0.0',
      collectorUrl: '',
      environment: 'development',
      enabled: true,
      debugLogger: debug,
    });
    expect(isOtelInitialized()).toBe(false);
    expect(debug).toHaveBeenCalled();
  });

  it('skips init when enabled is false', () => {
    initOtel({
      serviceName: 'my-app',
      serviceVersion: '1.0.0',
      collectorUrl: 'http://localhost:14318',
      environment: 'development',
      enabled: false,
    });
    expect(isOtelInitialized()).toBe(false);
  });

  it('does NOT invoke debugLogger when enabled is false', () => {
    const debug = vi.fn();
    initOtel({
      serviceName: 'my-app',
      serviceVersion: '1.0.0',
      collectorUrl: 'http://localhost:14318',
      environment: 'development',
      enabled: false,
      debugLogger: debug,
    });
    expect(debug).not.toHaveBeenCalled();
  });
});
