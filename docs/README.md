# The guide, and the system behind it

Fête Finder turns scattered event information into a guide people can use together. These docs explain the product first, then the boundaries that keep the data useful.

## Understand the product

| Read | For |
| --- | --- |
| [Product goals](product/goals.md) | The problem, intended experience, and remaining decisions |
| [Event intake](architecture/event-intake.md) | Collection, OCR, structured drafts, review, and publication |

## Understand the engineering

| Read | For |
| --- | --- |
| [Architecture overview](architecture/overview.md) | Actors, stores, rendering, failure, and recovery |
| [Event identity](architecture/event-identity.md) | Stable links and import identity |
| [Offline access](architecture/offline-access-goals.md) | Cached shells, saved snapshots, and supported limits |
| [Engagement tracking](architecture/engagement-tracking.md) | Recorded actions, deduplication, and social proof |
| [Location resolution](integrations/geocoding.md) | Venue lookup, coordinate fallback, and map links |
| [Haptics](architecture/haptics.md) | Mobile feedback and its interaction rules |
| [Rate limiting](security/rate-limiting.md) | Abuse controls at write boundaries |

## Run and maintain it

| Read | For |
| --- | --- |
| [Local data workflow](operations/local-data-workflow.md) | Development Postgres and bundled-data work |
| [Admin workflow](operations/admin-workflow.md) | Content, placements, operations, and insights |
| [Postgres setup and recovery](operations/postgres-setup-and-recovery.md) | Store initialization, backup, and recovery |
| [Archive mode](operations/archive-mode.md) | Frozen data, disabled writes, and seasonal restoration |
| [Production readiness](operations/production-readiness.md) | Release checks and cron configuration |
| [Logging and observability](operations/logging-and-observability.md) | Runtime diagnosis |
| [Environment variables](reference/environment-variables.md) | Configuration names and requirements |
| [API endpoints](reference/api-endpoints.md) | HTTP surface inventory |

## Supporting material

[Artwork and downloads](assets/README.md) cover the route animation and request-flow diagram. [Design history](design-archive/mobile-bottom-nav-before-liquid-split.md) retains a recoverable navigation reference; it is not the current design specification.

Product goals describe intent. Architecture describes implemented contracts. Runbooks describe procedures, not proof of a current deployment. Update the owning document when behavior changes; keep test reports dated and avoid turning them into permanent guarantees.
