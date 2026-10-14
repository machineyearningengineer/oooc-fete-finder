# A useful guide for a city-wide music weekend

Fête Finder exists to reduce the work between hearing about an event and deciding to go. Out Of Office Collective supplies the curation; the product makes a wider set of listings searchable, comparable, and shareable.

## What a good experience looks like

1. Find music that fits your taste and the day you are in Paris.
2. Understand the place, time, price, and setting without piecing together several posts.
3. Keep a shortlist and arrange the stops you want to make.
4. Send a friend a link that opens the same event or a shared route.
5. Recover useful saved information when connectivity drops.

The operator's corresponding job is to get messy source material into a trustworthy catalogue without manually retyping every flyer. Extraction speeds up drafting; uncertainty stays visible until someone reviews it.

## Design choices

**A guide with a point of view.** OOOC Picks sit alongside discovery filters. Curation and paid placement have separate domain logic; do not imply that a paid slot proves event quality.

**Readable before decorative.** The site uses Prata headings, Degular body text, warm paper, and restrained ink and accent colours. Motion should clarify a journey or a state change. It should leave room to read.

**A small decision surface.** Show the details needed to choose a place, then let the visitor open the original listing, directions, or calendar. Missing information should remain missing or visibly uncertain.

**Useful after the season.** A frozen archive can retain browsing and local plans without maintaining live accounts, analytics writes, or submission intake. The holding page and archive app are distinct deployment choices.

## Scope and boundaries

The app implements discovery, event and route links, maps, admin editing, placement scheduling, first-party engagement tracking, an OCR draft workflow, and a ticket-exchange surface. Availability depends on runtime mode.

It is not a guarantee of admission, availability, or unchanged event details. An external ticketing page owns the purchase. Geocoding produces a coordinate candidate, not proof that a flyer named the right venue. AI confidence is a review signal, not measured factual accuracy.

## Remaining decisions

| Goal | Current boundary | Next useful evidence |
| --- | --- | --- |
| Reliable intake | Collection orchestration lives outside the app runtime | Identify the scheduler, monitored sources, retries, and connector handoff |
| Better draft quality | Field evidence and alternatives exist; human review remains essential | Review a representative set of flyers and record corrections by field |
| Useful offline browsing | Previously saved listings and details can recover; true offline map tiles are absent | Exercise reload, stale storage, and reconnect in a production build |
| A clear seasonal lifecycle | Both archive logic and a static holding page exist | Verify the deployed mode and test restoration before the next season |

These are goals and evidence to collect, not claimed outcomes or a promised roadmap. [See the implementation boundaries](../architecture/overview.md).
