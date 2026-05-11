import { describe, it, expect } from 'vitest';
import {
  BASELINE_POLICY,
  INVESTIGATION_POLICY,
  SUPPORT_BURST_POLICY,
  KILL_SWITCH_POLICY,
  getPolicyByProfile,
  PolicyEngine,
} from '../policy-engine';

describe('frozen policies — updatedAt sentinel (M6)', () => {
  it('BASELINE_POLICY has updatedAt=0', () => {
    expect(BASELINE_POLICY.updatedAt).toBe(0);
  });
  it('INVESTIGATION_POLICY has updatedAt=0', () => {
    expect(INVESTIGATION_POLICY.updatedAt).toBe(0);
  });
  it('SUPPORT_BURST_POLICY has updatedAt=0', () => {
    expect(SUPPORT_BURST_POLICY.updatedAt).toBe(0);
  });
  it('KILL_SWITCH_POLICY has updatedAt=0', () => {
    expect(KILL_SWITCH_POLICY.updatedAt).toBe(0);
  });
  it('getPolicyByProfile stamps updatedAt with current time', () => {
    const before = Date.now();
    const policy = getPolicyByProfile('baseline');
    const after = Date.now();
    expect(policy.updatedAt).toBeGreaterThanOrEqual(before);
    expect(policy.updatedAt).toBeLessThanOrEqual(after);
  });
});

describe('shouldAcceptEvent — sampling vs rate limit (M5)', () => {
  it('sampling-rejected events do NOT count toward maxEventsPerMinute', () => {
    let toggle = false;
    const random = () => {
      toggle = !toggle;
      return toggle ? 0.05 : 0.95;
    };
    const engine = new PolicyEngine(
      {
        version: 1,
        updatedAt: 0,
        profile: 'baseline',
        samplingRates: { laneA: 1, laneB: 1, laneC: 0.1 },
        limits: { maxEventsPerMinute: 10, maxBatchSizeBytes: 65536, flushIntervalMs: 5000 },
        featureToggles: { networkDiagnostics: true, actionTracing: true, resourceTiming: false, longTaskObserver: false },
        killSwitch: { active: false },
        ttl: 300,
      },
      random,
    );
    let accepted = 0;
    let samplingRejected = 0;
    for (let i = 0; i < 100; i++) {
      const result = engine.shouldAcceptEvent('C');
      if (result.accept) accepted++;
      else if (result.reason === 'sampling_rejected') samplingRejected++;
    }
    // With rollback: counter only increments on accepted events, so all 10 quota
    // slots reach accepted=10 across 20 paired (accept/reject) iterations.
    // Without rollback the counter ticks on every call, hitting the cap after
    // 10 total calls — leaving only ~5 accepted before rate_limit_exceeded.
    expect(accepted).toBe(10);
    // Sampling rejections must occur — they prove the rollback path is exercised.
    expect(samplingRejected).toBeGreaterThan(0);
  });
});
