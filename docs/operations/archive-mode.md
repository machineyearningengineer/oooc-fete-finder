# Archive Mode

Archive mode is the production off-season runtime, deployed on 5 September 2026.
The root page tells the 2026 story, then reveals the finder on scroll or “Skip to
app”. `/archive` opens the finder directly. Event pages remain addressable.

## Snapshot provenance

The event CSV and bundled map, route, and settings data were compared against
`oooc-fete-finder-postgres-20260703T095743Z.dump`, the latest available local
production backup. Their contents matched; support export timestamps were
refreshed. This verifies the archive against the 3 July backup, not against the
currently stopped production database volume.

The recap contains 159 dated 2026 listings and aggregate June analytics. Save
counts are save/unsave actions, genre counts are listing tags, and activity is
recorded actions rather than unique people. Repeated genre tags within one
listing are counted once. No user or session rows are published.

To regenerate recap aggregates against an isolated restored backup, set
`DATABASE_URL` and a descriptive `RECAP_SOURCE`, then run
`node scripts/generate-static-recap.mjs`. Review `data/recap-2026.json` before
publishing. Backup dumps are excluded from Docker and Railway uploads.

## Flags

Keep these false for live production:

```env
ARCHIVE_MODE=false
NEXT_PUBLIC_ARCHIVE_MODE=false
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

The production Docker build sets both archive flags to `true`. `ARCHIVE_MODE`
controls server behavior, and `NEXT_PUBLIC_ARCHIVE_MODE` controls bundled
client behavior. `ARCHIVE_MODE=true` forces event reads to the bundled CSV even
if `DATA_MODE=remote` remains set.

## What Still Works

- Public event browsing, search, filters, maps, event detail pages, and static
  assets.
- Map pins hydrate from the bundled `data/event-locations.json` archive instead
  of Postgres KV.
- Planner routes in localStorage. Account sync is disabled. The official
  `/plans/fete` and `/plans/fete-2026` route pages resolve from the bundled
  published-plan archive.
- Ticket Exchange in local browser demo mode. Users can save a local contact
  profile, create local listings, reply to demo listings, and exercise owner
  lifecycle actions. Nothing is visible to other browsers.
- Admin `/admin` becomes a read-only archive status page showing CSV load state
  and archive behavior.
- Local app settings, theme, and map preference controls.

## What Is Disabled

- Login, user sessions, saved-account data, user app-setting sync, notices, and
  saved event sync.
- User-created shared plan links that were not explicitly published into the
  archive.
- Partner stats reports.
- First-party analytics, discovery analytics, ticket-exchange analytics, and
  genre preference writes.
- Event submissions, event-update submissions, paid promotion intake, Stripe
  webhook ingestion, cron database maintenance, and Ticket Exchange bot writes.
- Full admin dashboard and admin write workflows.

## Refresh Checklist

1. Refresh `data/events.csv` from production while Postgres is still connected:

```bash
pnpm db:pull-events-csv
```

2. Refresh static archive support data while Postgres is still connected:

```bash
pnpm archive:pull-static-data
```

This writes:

- `data/event-locations.json` for map pins and nearby sorting.
- `data/archive-published-plans.json` for published official routes.
- `data/archive-site-settings.json` for small public UI settings.

3. Confirm `pnpm build` passes with `ARCHIVE_MODE=true` and
   `NEXT_PUBLIC_ARCHIVE_MODE=true`.
4. Set Railway production variables:

```env
ARCHIVE_MODE=true
NEXT_PUBLIC_ARCHIVE_MODE=true
NEXT_PUBLIC_ANALYTICS_ENABLED=false
NEXT_TELEMETRY_DISABLED=1
```

5. Set `DATA_MODE=local`. Archive mode forces local reads and disables the
   Postgres client even if database credentials remain configured.
6. After deploy, check `/admin`, `/exchange`, `/plans`, `/plans/fete`,
   `/submit-event`, and
   `/feature-event`.
7. If the archive is stable, consider detaching Postgres from the app service
   after exporting a backup. Keep the Railway database only if you still need
   admin/history access.

## Login Behavior

Archive mode treats every visitor as signed out. The client auth provider clears
offline auth grace, does not fetch a live session, and hides login/logout/admin
controls from public navigation. `/api/auth/session` returns a successful
signed-out response with `archiveMode: true` and clears the user auth cookie.
Lookup and verification endpoints return archive-disabled errors, so no login
codes are sent or accepted.

## Hosting and verification

Public home, archive, and event pages are pre-rendered with a 30-minute
revalidation interval. Maps load only when expanded. The story uses CSS and
IntersectionObserver, respects reduced motion, and loads its optional soundtrack
only on request. Local saved events and routes work without requiring login.

Railway serverless remains enabled. All four maintenance cron schedules are
paused; `config/railway-cron-services.json` records `enabled: false` while
retaining their intended live-season schedules. The database has no running
deployment; its backup and retained storage have not been deleted. The app still
has a Next.js runtime, so this is not zero-compute static hosting. Local container
smoke testing measured approximately 200 MiB resident memory; actual Railway
usage depends on traffic and sleeping behavior.

Release verification: 27 focused tests, changed-file lint, TypeScript and
production builds, database-free Docker smoke tests, desktop/mobile interaction
checks, reduced motion, and public-domain HTTP checks. Home, archive, and event
responses returned cache HIT. Full repository suites were deferred to CI.

## Restore the live season

Rebuild with both archive flags false and analytics enabled **at build time and
runtime**. The current root Dockerfile explicitly builds an archive image;
changing Railway runtime variables alone cannot undo bundled public flags or
pre-rendered output. Adapt those Dockerfile build settings for a live release,
restore `DATA_MODE=remote`, start Postgres, and validate auth/admin/write flows.
Only then restore required cron schedules and set their manifest entries enabled.
The previous Caddy placeholder remains in `railway-placeholder/` as source for a
minimal fallback, but the root Dockerfile no longer builds it.

## Design revision — 20260905-atlas-1

The public page palette and archive introduction now carry the recap's warm paper
and forest ink. All 13 static Open Graph cards and dynamic event/shared-plan cards
share a printed-atlas frame. Recap, archive and terms have separate artwork and
metadata. Image URLs include the design revision as well as any configured
release version, so a stale environment version cannot hide a design update.

The renderer measures actual bundled font bounds to fit titles, subtitles and
metadata within their columns. Long unbroken titles wrap and omitted content is
marked with an ellipsis. Regenerate static artwork with `pnpm generate:og` after
changing its template.

Verification: 20 focused OG layout, URL, route and SEO tests; supported changed-file
lint; JavaScript syntax checks; TypeScript and an archive production build. Browser
checks covered 12 public routes at 390px with no horizontal overflow, desktop and
dark archive layouts, recap day selection with reduced motion, and a real event's
metadata. Static cards and dynamic event/plan images were visually inspected.
These checks cover the shared presentation and metadata boundaries. Full test,
coverage and repository-wide lint suites are deferred to CI.
