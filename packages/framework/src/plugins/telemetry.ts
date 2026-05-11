// @cpt-dod:cpt-frontx-dod-perf-telemetry-fail-open:p1
/**
 * Telemetry Plugin - Performance telemetry via @cyberfabric/perf-telemetry
 *
 * Framework Layer: L2
 * Provides: OTel initialization + lifecycle. The `telemetryStore` is read directly
 * from `@cyberfabric/perf-telemetry` (which delegates to the cross-runtime
 * `globalThis[Symbol.for('frontx:telemetry-registry')]` store) — Studio resolves
 * it via dynamic import, not via this plugin's `provides`.
 */

import type { HAI3Plugin } from '../types';

/**
 * Telemetry Plugin Configuration
 */
export type TelemetryPluginConfig = {
  /** OTel service name — required to activate the plugin */
  serviceName?: string;
  /** OTel service version */
  serviceVersion?: string;
  /** OTel collector URL (OTLP/HTTP endpoint) — required to activate the plugin */
  collectorUrl?: string;
  /** Deployment environment */
  environment?: string;
  /** Enable/disable telemetry (default: false) */
  enabled?: boolean;
};

/** Shape of the @cyberfabric/perf-telemetry module (avoids require + unknown). */
type PerfTelemetryModule = {
  initOtel: (config: { serviceName: string; serviceVersion: string; collectorUrl: string; environment: string; enabled: boolean }) => void;
  isOtelInitialized: () => boolean;
  flushOtel: () => Promise<void>;
  shutdownOtel: () => Promise<void>;
};

/**
 * Telemetry plugin factory.
 *
 * Provides performance telemetry integration via @cyberfabric/perf-telemetry.
 * When enabled, initializes OTel Browser SDK and joins the cross-runtime
 * shared telemetry registry so MFE child runtimes converge on the host store.
 *
 * @param config - Telemetry configuration
 * @returns Telemetry plugin
 *
 * @example
 * ```typescript
 * const app = createHAI3()
 *   .use(telemetry({
 *     serviceName: 'my-app',
 *     collectorUrl: 'http://localhost:14318',
 *     environment: 'development',
 *   }))
 *   .build();
 * ```
 */
export function telemetry(config?: TelemetryPluginConfig): HAI3Plugin {
  let _mod: PerfTelemetryModule | null = null;

  return {
    name: 'telemetry',
    dependencies: [],

    async onInit() {
      const enabled = config?.enabled ?? false; // safe default
      if (!enabled) return;
      if (!config?.serviceName || !config.collectorUrl) return;

      try {
        // Dynamic import to keep @cyberfabric/perf-telemetry optional — cached for onDestroy
        const mod = await import('@cyberfabric/perf-telemetry');
        // Shape guard: reject modules that don't expose the expected API surface
        if (
          typeof (mod as Partial<PerfTelemetryModule>).initOtel !== 'function' ||
          typeof (mod as Partial<PerfTelemetryModule>).shutdownOtel !== 'function'
        ) {
          return;
        }
        _mod = mod as PerfTelemetryModule;
        _mod.initOtel({
          serviceName: config.serviceName,
          serviceVersion: config.serviceVersion ?? '1.0.0',
          collectorUrl: config.collectorUrl,
          environment: config.environment ?? 'development',
          enabled: true,
        });
      } catch {
        // Fail-open: optional dependency not installed or shape mismatch
      }
    },

    onDestroy() {
      if (!_mod) return;
      try {
        if (_mod.isOtelInitialized()) {
          _mod.flushOtel()
            .catch(() => undefined)
            .finally(() => {
              _mod?.shutdownOtel().catch(() => { /* fail-open */ });
            });
        }
      } catch {
        // Fail-open
      }
    },
  };
}
