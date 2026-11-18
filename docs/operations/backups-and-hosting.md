# Backups and hosting

Where the archive runs, where the season's data lives, and how to bring either
back.

## Hosting today

| Piece | Where |
| --- | --- |
| App | Railway project `oooc-fete-finder`, service `oooc-fete-finder`, built from the root `Dockerfile` on `main`. It sleeps when idle. |
| Service settings | `.railway/railway.ts` (Railway Infrastructure as Code). Railway no longer reads `railway.json`. Change settings with `npm ci --prefix .railway && railway config plan && railway config apply`. |
| Domain | `fete.outofofficecollective.co.uk`. DNS is in Squarespace, controlled by the OOOC founder: `fete` is a CNAME to `zqvcju2c.up.railway.app`. |
| Cron jobs | Four Railway cron services with no schedule (paused). `config/railway-cron-services.json` keeps the live-season schedules. |
| Database | None. The Railway Postgres service and volume were deleted on 18 November 2026, after the backup below was verified. |

## Database backups

The final production dump is in the private R2 bucket `fete-finder-backups` on
Owen's personal Cloudflare account (`Owen Personal`,
`d88459b45dfbe1ccc64136eac246387c`), under `postgres/`. The bucket has no public
URL.

| Object | SHA-256 |
| --- | --- |
| `oooc-fete-finder-postgres-20261118T205542Z.dump` | `86912510d445efef325337b82b416d2f173cb2aa769cd67bf3827806b3c2b635` |
| `oooc-fete-finder-postgres-20261118T205542Z.dump.list` | `d6dd7bb9d26b79480ed294f5fb5d1be3a2f59edc586709b2b3c1fa88fcf92e37` |
| `oooc-fete-finder-postgres-20261118T205542Z.row-counts.txt` | `c4a6ce47338ef0075ac0918f8b655518bdfbf7994eaa7bb922ef3ad08d1dc432` |
| `oooc-fete-finder-postgres-20260703T095743Z.dump` | `8beda5e9268415fc9acb8d82971ffae3c83e2d30d12fc604604e992e3b459ac3` |
| `oooc-fete-finder-postgres-20260703T095743Z.dump.list` | `85d0001d0d07ba6ff4498d7a9e636f599709acf69c9bbde6da96b1bbaa578a94` |
| `SHA256SUMS` | Checksums for all of the above |

The 18 November dump is the one to restore. It is a Postgres 18 custom-format
dump (`pg_dump -Fc`) of the whole `railway` database: 42 tables, 161 MB once
restored. It was taken from the production volume in its final state. That
volume last ran on 3 July 2026. The 3 July dump has the same row count in every
table and is kept as a second copy. The `.row-counts.txt` file holds exact
per-table counts from the source database.

Verified on 18 November 2026: everything was downloaded back from R2 and passed
`shasum -c SHA256SUMS`. The dump restored into a clean `postgres:18` container
with `--exit-on-error`, and the restored row counts matched the source in all
42 tables.

### Download and verify

The `cf` CLI's `personal-deploy` profile only has the personal account. Name
the account anyway, because the same machine is also signed in to other
accounts:

```sh
export CLOUDFLARE_ACCOUNT_ID=d88459b45dfbe1ccc64136eac246387c
cf auth whoami --profile personal-deploy   # accounts must list only "Owen Personal"
mkdir fete-backup && cd fete-backup
cf r2 objects get postgres/SHA256SUMS --profile personal-deploy --bucket-name fete-finder-backups > SHA256SUMS
for f in $(awk '{print $2}' SHA256SUMS); do
  cf r2 objects get "postgres/$f" --profile personal-deploy --bucket-name fete-finder-backups > "$f"
done
shasum -a 256 -c SHA256SUMS
```

The Cloudflare dashboard (R2 → `fete-finder-backups`) can also download the
objects.

## Restore for next season (Neon)

The live app needs Postgres. Neon's free plan is enough for the restored data:
check its current storage limit against the 161 MB above.

1. Create a Neon project on Postgres 18, in an EU region. Copy two connection
   strings: the **direct** one (for the restore) and the **pooled** one, whose
   host contains `-pooler` (for the app). Both need `sslmode=require`.
2. Restore with a Postgres 18 client, using the direct connection:

   ```sh
   pg_restore --no-owner --no-acl --exit-on-error \
     -d "$NEON_DIRECT_URL" oooc-fete-finder-postgres-20261118T205542Z.dump
   ```

3. Check the counts against `oooc-fete-finder-postgres-20261118T205542Z.row-counts.txt`
   (`select count(*)` per table). Every line should match.
4. Build the live app. Archive mode is baked in at build time: the root
   `Dockerfile` sets `ARCHIVE_MODE`, `NEXT_PUBLIC_ARCHIVE_MODE` and
   `DATA_MODE=local` in both stages. Change those to:

   ```env
   DATA_MODE=remote
   ARCHIVE_MODE=false
   NEXT_PUBLIC_ARCHIVE_MODE=false
   NEXT_PUBLIC_ANALYTICS_ENABLED=true
   ```

   They must be set at build time **and** runtime. Changing only the Railway
   variables cannot undo the bundled public flags or the pre-rendered pages.
5. Set `DATABASE_URL` on the app service to the pooled Neon URL. The client sees
   `pooler` in the URL and sizes its pool for PgBouncer. It already disables
   prepared statements. Set the other live variables listed in
   [production readiness](production-readiness.md#live-configuration).
6. Deploy, then check login, admin and one write flow. After that, re-enable
   the cron services: set their schedules from
   `config/railway-cron-services.json`, flip their manifest entries to enabled,
   and run `pnpm check:railway-cron`.

Neon suspends idle compute, so the first query after a quiet spell takes a moment
longer. Any other Postgres 18 host works the same way: restore the dump, then
point `DATABASE_URL` at it.

## Moving to Cloudflare Workers later

The adapter would be OpenNext for Cloudflare (`@opennextjs/cloudflare`). The
port needs these changes:

- `sharp` and `@resvg/resvg-js` are native modules and do not run on Workers.
  Images would be served unoptimised or prebuilt. The dynamic event and plan
  Open Graph cards would be pre-generated or rendered with a WebAssembly
  renderer.
- Pre-render the event pages (archive mode already lists them in
  `generateStaticParams`) so the Workers free plan's CPU limit is never in
  play.
- Keep the security and cache headers from `next.config.ts`, the
  `/plans/<token>` redirect and the `proxy.ts` behaviour, and check that
  `/live-event` still returns 404 in archive mode.

DNS is the one change that needs the founder, made in Squarespace DNS. A Worker
custom domain only attaches directly when the zone is on Cloudflare. While
`outofofficecollective.co.uk` stays at Squarespace, serve the hostname through
Cloudflare for SaaS on a zone in Owen's account (for example `owenabel.com`):
add `fete.outofofficecollective.co.uk` as a custom hostname and route it to the
Worker. Then the record to change is:

```text
fete  CNAME  <the fallback origin hostname Cloudflare shows for the custom hostname>
```

It replaces the current `zqvcju2c.up.railway.app` target. To issue the
certificate before switching, Cloudflare also offers TXT validation records,
which can be added first so the switch has no downtime. Moving the whole zone's
nameservers to Cloudflare would also work, and would allow a plain Worker custom
domain, but it changes every record for the domain.
