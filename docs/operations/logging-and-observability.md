# Logging and observability

## Logger model

- Central logger: `lib/platform/logger.ts`
- Dev format: human-readable logs
- Production format: structured JSON logs

## What is logged

- Startup runtime mode and integration readiness
- Runtime read/revalidation errors
- Geocoding fallback warning when API is unavailable
- Auth verify limiter availability warnings

## Noise controls

- Development `info` logs are briefly deduped to reduce repeated spam
- `warn` and `error` are never deduped
- Dedupe affects logs only, not runtime reads or behavior

## What was intentionally removed

- Per-address geocoding failure spam
- Repetitive coordinate-skip logs
- Periodic memory dump spam

## Troubleshooting pattern

1. Confirm env vars in [Environment Variables](../reference/environment-variables.md)
2. Check `DataManager` source and warnings from admin runtime status
3. Validate DB/KV health from `/api/admin/health`
4. Re-run publish flow from [Admin Workflow](./admin-workflow.md)
