# Product goals

Fête Finder helps people choose events during Fête de la Musique in Paris. Out Of Office Collective provides the curation; search, maps, saved events, and routes help visitors make a plan.

## For visitors

- Find music by date, genre, price, and area.
- See the time and place together, with a link to the original listing.
- Keep a shortlist and arrange stops into a route.
- Send a friend a stable event or shared-plan link.
- Recover previously loaded listings when connectivity drops.

## For editors

Import event rows or upload flyers, review extracted details, and publish through the event sheet. Missing dates, conflicting suggestions, and uncertain venues need review. OCR reduces retyping; it does not approve listings.

OOOC Picks and paid placements have separate scheduling logic. A paid slot describes placement, not a quality assessment.

## Limits and next work

| Area | Current limit | Work to resolve it |
| --- | --- | --- |
| Extraction | Confidence comes from the model | Compare draft fields with a reviewed sample and record corrections |
| Offline use | Saved listings and details can recover; map tiles still need a connection | Test storage pressure, stale snapshots, and reconnect |
| Seasonal hosting | The app supports archive mode; the root Dockerfile builds a holding page | Verify the chosen mode and restoration path before the next season |

Ticket purchases happen on external sites. Venue coordinates and event details can change, so original sources remain part of the guide.

[Architecture](../architecture/overview.md) · [Design](../../DESIGN.md)
