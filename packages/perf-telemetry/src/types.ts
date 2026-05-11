// @cpt-dod:cpt-frontx-dod-perf-telemetry-action-first:p1
/**
 * @cyberfabric/perf-telemetry - Type Definitions
 * Action-first performance telemetry types.
 */

import type { Span } from '@opentelemetry/api';
import type { ReactNode } from 'react';

export type { Span } from '@opentelemetry/api';

export type ActionScope = {
  span: Span;
  spanId: string;
  traceId: string;
  actionName: string;
  routeId: string;
  startedAtMs: number;
  endedAtMs?: number;
};

export type ActionSnapshot = {
  actionName: string;
  spanId: string;
  traceId: string;
  routeId: string;
};

export type RouteUiScope = {
  routeId: string;
  signalName: string;
  startedAtMs: number;
  readySpan: Span;
  uiSpan: Span;
  actionSnapshot?: ActionSnapshot;
  endedAtMs?: number;
};

/** Discriminated payload for debugLogger — covers config-validation and caught errors. */
export type DebugLoggerPayload = Error | { missing: string[] } | string | null;

export type OtelConfig = {
  serviceName: string;
  serviceVersion: string;
  collectorUrl: string;
  environment: string;
  enabled: boolean;
  /**
   * Optional logger invoked from every fail-open catch. Receives an event
   * label (e.g. 'init.config_invalid') and the underlying error/payload.
   * Default: undefined → silent fail-open (production posture).
   */
  debugLogger?: (event: string, error?: DebugLoggerPayload) => void;
};

export type TelemetryRuntimeConfig = {
  exportToCollector: boolean;
  includeDebugData: boolean;
  policyProfile: PolicyProfile;
  accountId: string;
  /** Pseudonymous display name only — never store real PII */
  accountName: string;
  accountPlan: string;
  accountRegion: string;
  accountSegment: string;
  accountTenureBucket: string;
  abBucketSeed: string;
};

export type StoredSpan = {
  spanId: string;
  traceId: string;
  parentSpanId: string | undefined;
  name: string;
  startTimeMs: number;
  endTimeMs: number;
  durationMs: number;
  status: 'ok' | 'error' | 'unset';
  attributes: Record<string, string | number | boolean>;
};

export type SpanListener = () => void;

export type TelemetryContextValue = {
  emit: (type: string, routeId: string, payload: Record<string, string | number | boolean | null>) => void;
  sessionId: string;
  enabled: boolean;
  killSwitch: () => void;
};

/** Telemetry event priority lane. A = critical errors, B = UI/network, C = runtime diagnostics. */
export type Lane = 'A' | 'B' | 'C';

/** Named policy profile controlling sampling rates and feature toggles. */
export type PolicyProfile = 'baseline' | 'investigation' | 'support-burst' | 'kill-switch';

/** Full collection policy snapshot: sampling rates, rate limits, feature toggles, and kill switch state. */
export type CollectionPolicy = {
  version: number;
  updatedAt: number;
  profile: PolicyProfile;
  samplingRates: {
    laneA: number;
    laneB: number;
    laneC: number;
  };
  limits: {
    maxEventsPerMinute: number;
    maxBatchSizeBytes: number;
    flushIntervalMs: number;
  };
  featureToggles: {
    networkDiagnostics: boolean;
    actionTracing: boolean;
    resourceTiming: boolean;
    longTaskObserver: boolean;
  };
  killSwitch: {
    active: boolean;
    reason?: string;
    activatedAt?: number;
  };
  ttl: number;
};

export type PolicyOverrides = {
  version?: number;
  profile?: PolicyProfile;
  ttl?: number;
  samplingRates?: Partial<CollectionPolicy['samplingRates']>;
  limits?: Partial<CollectionPolicy['limits']>;
  featureToggles?: Partial<CollectionPolicy['featureToggles']>;
  killSwitch?: Partial<CollectionPolicy['killSwitch']>;
};

export interface TelemetryProviderProps {
  children: ReactNode;
  /** Required: OTel service identity */
  serviceName: string;
  /** Required: OTLP/HTTP endpoint */
  collectorUrl: string;
  serviceVersion?: string;
  environment?: string;
  /** Default: false — host app must explicitly opt in */
  enabled?: boolean;
  debugLogger?: (event: string, error?: DebugLoggerPayload) => void;
}

/** Action trigger types per data contract: click, navigation, polling, timer, lifecycle, ambient. */
export type ActionTrigger = 'click' | 'navigation' | 'polling' | 'timer' | 'lifecycle' | 'ambient';

/** Serializable primitive record used for JSON-safe config and span attributes. */
export type PrimitiveRecord = Record<string, string | number | boolean>;

export type DoneRenderingOptions = {
  timeoutMs?: number;
  routeId?: string;
};

/** Dependency map for useDoneRendering — dataReady is required, extra keys for custom tracking. */
export type DoneRenderingDeps = { dataReady: boolean; [key: string]: string | number | boolean | null | undefined };

export type TelemetryActionOptions = { routeId?: string; trigger?: ActionTrigger };

/** Metadata for instrumentedFetch correlation. */
export type FetchMeta = { routeId: string; actionName?: string };

/** Flat key-value map of client fingerprint attributes attached to spans. */
export type ClientAttributes = Record<string, string | number | boolean>;

/** Navigator extended with Network Information API (non-standard, vendor-prefixed). */
export interface NavigatorWithConnection extends Navigator {
  connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean };
  mozConnection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean };
  webkitConnection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean };
}
