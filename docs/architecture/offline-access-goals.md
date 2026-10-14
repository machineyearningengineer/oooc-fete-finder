# Offline access

The supported goal is to keep previously loaded event information usable when the app becomes unreachable. It requires a successful online visit first. It does not provide offline map tiles or turn authenticated APIs into offline services.

## Two layers of recovery

| Layer | Stores | Purpose |
| --- | --- | --- |
| Service worker | Approved public navigation shells, Next chunks, and safe same-origin assets / event JSON | Recover the public application shell |
| IndexedDB | Validated home event and opened-event detail snapshots | Recover event data with schema and freshness metadata |

`components/ServiceWorkerRegistration.tsx` registers `public/sw.js` in production and seeds approved shell resources. Navigation and Next chunks use network-first behavior with cached fallback. The worker validates URLs against allowlists rather than caching arbitrary requests.

`features/events/offline-event-snapshot.ts` owns snapshot validation and persistence. Malformed data and schema mismatches are ignored. `EventsOfflineProvider` owns live/saved data and sync state; `use-event-detail-hydration.ts` restores previously saved details when fresh hydration fails.

## Client responsibilities

The event experience has separate search/filter, list, summary, map, modal, and auth-control islands. `events-client.tsx` coordinates routes and selection; it does not own every interaction. `EventsSearchFiltersProvider` supplies shared filter state.

`EventsDataStatusBanner` reports saved, stale, missing, and error states. `components/online-status-gate.tsx` confirms app reachability with `/api/client-health` rather than relying only on `navigator.onLine`.

Maps load independently. When the app is unreachable, the map is replaced by fallback messaging so saved-event browsing can continue. An archive's bundled coordinates do not make basemap tiles available offline.

## Sensitive boundaries

The service worker excludes admin, auth, user, cron, revalidation, webhook, and partner-report surfaces. It must not cache sessions or account-shaped responses. Offline auth grace affects eligible local UI behavior; it is not server authorization and cannot authorize a privileged write.

Queued local mutations have a separate contract in [offline mutations](../../features/offline-mutations/README.md). Do not equate a local save with a successfully synchronized account change.

## Verification and remaining goals

`e2e/event-routes.spec.ts` contains the browser offline journey. After changing caching, hydration, or auth boundaries, verify an online visit followed by offline hard reload and reconnect in a production build. Unit checks alone cannot establish service worker behavior.

Remaining work is focused hardening:

- Decide whether explicit map fallback is enough or whether bounded offline tiles are a product requirement.
- Exercise storage pressure, stale snapshots, expired auth grace, and sensitive cache exclusions.
- Improve service worker observability if real failures justify it.

The current worker is hand-written. A generated precache or a new caching dependency needs an actual product requirement; another extraction of the existing UI is not the goal.
