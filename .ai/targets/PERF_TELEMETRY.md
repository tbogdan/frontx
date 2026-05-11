<!-- @standalone -->
# Performance Telemetry Target Rules (@cyberfabric/perf-telemetry)

## AI WORKFLOW (REQUIRED)
1) Summarize 3-6 rules from this file before making changes.
2) STOP if you create new telemetry hook implementations outside @cyberfabric/perf-telemetry. Using hooks (useRoutePerf, useTelemetryAction, etc.) in app screens is required.

## SCOPE
- Package: `packages/perf-telemetry/`
- Layer: L1 SDK (zero @hai3 dependencies)
- Peer dependencies: @opentelemetry/*, react

## CRITICAL RULES
- REQUIRED: Every span MUST belong to a named action. No orphan spans.
- REQUIRED: Route modules MUST include useRoutePerf and useDoneRendering.
- REQUIRED: Critical actions MUST use useTelemetryAction.
- REQUIRED: First-party API requests MUST use instrumented wrapper or TelemetryPlugin.
- REQUIRED: Telemetry runtime MUST fail-open (no business-flow breakage).
- REQUIRED: No sensitive fields in telemetry metadata.
- FORBIDDEN: Ad-hoc tracking code outside this package.
- FORBIDDEN: Orphan spans (any span without action.name).
- FORBIDDEN: Raw fetch() for first-party APIs when telemetry is active.

## ACTION-FIRST CORRELATION (mandatory)
- User clicks, form submits, navigations -> explicit actions via useTelemetryAction
- Background polling, timers, lifecycle -> explicit actions with trigger type
- Web vitals, long tasks, resource timing -> auto-parented to active/ambient action
- Ambient action (<routeId>.ambient) created when no explicit action is active

## REQUIRED CODE PATTERNS

### App root provider
```tsx
<TelemetryProvider
  serviceName={APP_NAME}
  collectorUrl={OTEL_COLLECTOR_URL}
  serviceVersion={APP_VERSION}
  environment={ENV}
  enabled={ENV !== 'local'}
  debugLogger={ENV === 'development' ? console.warn : undefined}
>
  <App />
</TelemetryProvider>
```

### Route module
```tsx
const routeId = "billing.overview";
useRoutePerf(routeId, performance.now());
useDoneRendering("billing.overview.ready", { dataReady });
```

### Critical action
```tsx
const runSubmit = useTelemetryAction("billing.submit");
const onSubmit = () => runSubmit(async () => {
  await api.billing.save(payload);
});
```

## STOP CONDITIONS
- Adding telemetry hooks outside @cyberfabric/perf-telemetry.
- Modifying action-scope.ts or otel-init.ts without reading this file.
- Adding @hai3 dependencies to this package.

## PRE-DIFF CHECKLIST
- [ ] No orphan spans (every span has action.name).
- [ ] Route/action/API instrumentation coverage complete.
- [ ] No sensitive fields in metadata.
- [ ] Telemetry errors cannot crash UX (fail-open).
- [ ] Types and dependents compile.

## Configuration Safety

- `serviceName` and `collectorUrl` are required; omission causes init to
  skip via `debugLogger('init.config_invalid', { missing })`.
- `enabled` defaults to `false`; host apps must explicitly opt in per
  environment.
- `debugLogger` is optional; pass `console.warn` (or similar) in development
  to diagnose fail-open paths. Leave unset in production for silent posture.
- `DoneRenderingOptions.routeId` overrides the `signalName` suffix extraction
  when present.
