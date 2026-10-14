# Production readiness

Check the build target before treating a deployment as the full application.

| Target | Build | Live services |
| --- | --- | --- |
| Holding page | Root Dockerfile → Caddy | Static files only |
| Archive app | Next.js build with both archive flags enabled | Bundled events and local browser state |
| Live app | Next.js build with archive flags disabled | Postgres, auth, admin, and configured integrations |

The repository contains all three paths. The selected deployment configuration determines which one runs. [Archive operations](archive-mode.md) cover the snapshot files and flags; [holding-page notes](../../railway-placeholder/README.md) cover Caddy.

## Live configuration

For a live app, verify `NODE_ENV=production`, `DATA_MODE=remote`, `DATABASE_URL`, `AUTH_SECRET`, and `NEXT_PUBLIC_SITE_URL`. Set `ADMIN_KEY` only when admin access should be enabled. Factory reset uses a separate `ADMIN_RESET_PASSCODE`.

Maintenance jobs need `CRON_SECRET`; deploy revalidation needs `DEPLOY_REVALIDATE_SECRET`. A public deployment identifier lets the admin UI detect a new build. Geocoding, OCR, Stripe, and bot integrations each need their own server-side configuration. See the [environment reference](../reference/environment-variables.md).

Runtime disk is not the durable store for live events, coordinates, users, analytics, plans, submissions, or rate limits. Those workflows depend on Postgres.

## Before release

Run focused checks for the changed behavior first. Type checks and a production build cover changes to route rendering or application boundaries:

```sh
pnpm exec tsc --noEmit
pnpm build
```

Use the repository's lint, unit, and browser checks for the affected files and journeys. Documentation-only changes need link, copy, and artwork checks rather than an application build.

The public-route size check and cron manifest check are available separately:

```sh
BASE_URL=http://localhost:3000 pnpm check:public-routes
pnpm check:railway-cron
```

## After release

1. Confirm Railway's active deployment and the domain's target.
2. Inspect build/runtime logs for environment, Postgres, fallback, and revalidation failures.
3. Open the public home, a known event, `/exchange`, `/plans`, `/feature-event`, and `/submit-event` as appropriate for the selected mode.
4. For live mode, confirm authenticated admin health, the expected deployment identifier, and the runtime data source.
5. After editing content or placements, confirm the public event and effective schedule.

The [API reference](../reference/api-endpoints.md) lists the health and deployment-status endpoints. A holding page redirect does not establish that an app route works.

## Maintenance jobs

[config/railway-cron-services.json](../../config/railway-cron-services.json) records the intended cron services. The live schedules use UTC:

| Endpoint | Schedule |
| --- | --- |
| `/api/cron/cleanup-admin-sessions` | `0 4 * * *` |
| `/api/cron/cleanup-rate-limits` | `10 4 * * *` |
| `/api/cron/backup-event-store` | `20 4 * * *` |
| `/api/cron/cleanup-dismissed-partner-reports` | `30 4 * * *` |

Calls require `Authorization: Bearer <CRON_SECRET>`. The trigger script uses `TARGET_URL` and the injected secret. Enable jobs for the live service that needs them; pause them when parking that service.

## Older client compatibility

The auth verify route still accepts legacy `marketingConsent` alongside `marketingOptedOut`. Remove that compatibility path only after deployed client/cache behavior and request logs show it is no longer needed. It supports older open tabs, not a second preference model.

## Recovery

Inspect the deployment, logs, route status, runtime source, and recent admin changes before choosing a recovery action. For a bad build, restore the previous known-good deployment. For damaged event data, restore a selected backup and revalidate. For database unavailability, bundled CSV reads can preserve browsing but do not restore live account or write workflows.

Before parking a season, create and verify a backup, refresh the bundled event/support snapshots, and decide whether submissions stay open. Do not stop a shared database while another service still needs it.

[Admin workflow](admin-workflow.md) · [Postgres recovery](postgres-setup-and-recovery.md) · [Logging](logging-and-observability.md)
