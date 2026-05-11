import { describe, it, expect } from 'vitest';
import { BASELINE_POLICY, classifyLane } from '../policy-engine';

describe('perf-telemetry smoke', () => {
  it('exports BASELINE_POLICY', () => {
    expect(BASELINE_POLICY.profile).toBe('baseline');
  });

  it('classifyLane returns C for runtime.foo', () => {
    expect(classifyLane('runtime.foo')).toBe('C');
  });
});
