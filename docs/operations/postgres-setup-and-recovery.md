# Postgres setup and recovery

Use this for first-time setup, production-parity local setup, backup review, or
restore.

## Target state

- Primary runtime source: managed Postgres event store
- Fallback sources in remote mode: latest Postgres event-store backup, then bundled local CSV (`data/events.csv`)
- Bundled CSV is a server-side emergency fallback. It is deployment-time data, not a live sync or full browser offline cache.
- Local production-parity development uses `DATA_MODE=remote` against Postgres. `DATA_MODE=local` is used for fallback testing, no-database browsing, and archive mode.

## Required env

- `DATABASE_URL`
- `AUTH_SECRET`
- `DATA_MODE=remote`
- `ADMIN_KEY` if admin auth is enabled

## First-Time setup

1. Create/connect Postgres and set `DATABASE_URL`.
2. Open `/admin`.
3. Load data with `Upload CSV to Store`.
4. Run `Backup Now`.
5. Review and save in `Event Sheet Editor`.
6. Run `Save and Revalidate Homepage`.
7. Verify source/status in admin runtime cards.

## CLI bootstrap

For a new development database, configure its connection through the project's development environment before running:

```bash
pnpm bootstrap:postgres-store
```

For local workflow policy and release fallback refresh steps, see [Local Data Workflow](./local-data-workflow.md).

## Backups

- Manual: `Backup Now` in admin
- Scheduled: `GET /api/cron/backup-event-store`
- Default schedule: daily at 04:20 UTC
- Contents: events, placements, paid orders, submissions, settings, and collected emails
- Retention: newest 30 snapshots; older snapshots are pruned after successful backup/pre-restore snapshot creation

## Recovery

Fastest recovery:

1. Restore latest/selected snapshot in admin.
2. Revalidate homepage.

Emergency-only fallback:

- Set `DATA_MODE=local` to force local CSV runtime.
