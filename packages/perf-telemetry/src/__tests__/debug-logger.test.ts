import { describe, it, expect, vi, afterEach } from 'vitest';
import { initOtel, shutdownOtel } from '../otel-init';

describe('debugLogger (m7)', () => {
  afterEach(async () => {
    await shutdownOtel();
  });

  it('receives init.config_invalid when serviceName is missing', () => {
    const log = vi.fn();
    initOtel({
      serviceName: '',
      serviceVersion: '1.0.0',
      collectorUrl: 'http://localhost:14318',
      environment: 'development',
      enabled: true,
      debugLogger: log,
    });
    expect(log).toHaveBeenCalledWith('init.config_invalid', expect.anything());
  });
});
