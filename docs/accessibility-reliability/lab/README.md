# Production lab status

**Blocked, not measured (2026-11-02).** Normal Prisma generation and the safe build stop at pinned native engine checksum HTTP 403. The guarded performance command also stops before it can provision/use the generated client and start a current production artifact. There are no current production LCP, INP, CLS or bundle-byte results to report. No numbers from development rendering or a stale build are substituted.

Field goals remain LCP ≤2.5 s, INP ≤200 ms and CLS ≤0.1 at p75. No real-user performance telemetry is configured; even a successful local lab would not establish field performance.

After restoring normal pinned downloads, use the verified disposable PostgreSQL maintenance binding and run:

```bash
npm run prisma:generate
npm run lint -- --max-warnings=0
npm run build
npm run typecheck
npm run test:performance
```

The command refuses unmarked/production/development targets and stale/missing artifacts, creates synthetic fixtures through the guarded harness, starts its own local server and measures nine representative routes five times at 390×844, 4× CPU, 150 ms network latency, 1.6 Mbps down/0.75 Mbps up. It writes `production-lab.json` only after all routes load their intended state; it will appear here after an actual successful run. The report labels samples and lab p75; a safe-menu interaction proxy can be null, never a fabricated zero or field INP. See [runner and conditions](../README.md#production-laboratory-and-field-goals). CI is configured to run and upload that synthetic artifact, but remote CI is unverified.

The separate [payload evidence](../payload-evidence.json) measures real summary serialization with a synthetic 200-lesson object (29,117 → 177 bytes), not a route, bundle, lab Web Vital or production result. The [rate evidence](../rate-store-evidence.json) measures exact SQL/service concurrency and approximately one-second lock timeout in a fresh restricted database; it is not generated-Prisma/API verification or a site-speed score.
