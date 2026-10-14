# Admin workflow

Live admin routes require server-validated authentication. Archive mode replaces the dashboard with a read-only status page.

## Areas

| Route | Work |
| --- | --- |
| `/admin` | Overview and links to modules |
| `/admin/content` | Event sheet, OCR drafts, submissions, and banner settings |
| `/admin/placements` | Paid order queue and spotlight/promoted scheduling |
| `/admin/operations` | Runtime source, store controls, sessions, backup, and recovery |
| `/admin/insights` | Engagement, traffic, and audience exports |

## Publish content

1. Open `/admin/content` and review the event sheet or submissions.
2. Check incomplete fields and OCR alternatives before accepting a draft.
3. Create a backup before a risky edit in `/admin/operations`.
4. Save and revalidate through the content/operations controls.
5. Confirm the source and row count in the runtime snapshot, then open the changed public event.

For paid placements, review the queue in `/admin/placements`, fulfill the order into the appropriate schedule, and confirm its effective window. Partner report links contain access tokens; share them only with the intended recipient.

## Insights and downloads

`click`, `outbound_click`, and `calendar_sync` record event views, external-link clicks, and calendar interactions. The public “saved this” label uses calendar interactions; personal bookmarked events use a separate store.

Traffic and audience CSV exports require authorized admin access and a working live database. Partner CSV exports require the report token. These are runtime downloads, not public repository assets. See [engagement tracking](../architecture/engagement-tracking.md).

## Restore and check

Restore a selected backup in `/admin/operations`, revalidate, and confirm the restored payload in the runtime snapshot. Check a public event too.

| Symptom | Check |
| --- | --- |
| Public content looks stale after save | Runtime source, cache state, and revalidation result |
| A placement is absent | Event key, effective schedule, and queue status |
| Analytics are empty | Runtime mode, Postgres, and tracking routes |
| Submission intake is closed | Submission settings in `/admin/content` |

The authenticated health and store endpoints are listed in the [API reference](../reference/api-endpoints.md). [Postgres recovery](postgres-setup-and-recovery.md) covers backup scope and retention.
