# Documentation artwork

The README route study uses the site's Prata and Degular fonts and its paper (`#f4eedf`), forest ink (`#243d30`), coral (`#b84a31`), and ochre (`#a9782d`) palette. These match the archive design in the working site. There are no external images or generated illustrations.

- `finder-route.gif`: a nine-second, single-play route study. Static copy stays readable while pins and a route appear. Times and stops are illustrative; the map is schematic.
- `finder-route.png`: the complete still, also linked beside the animation.
- `system-map.png`: the system's responsibilities and recovery boundaries.
- `intake-flow.png`: source material → draft → human review → publication.
- Matching SVGs: editable vector stills. Text is rasterized into PNG/GIF with bundled fonts so GitHub rendering is consistent.

The authoring source is [render-docs-artwork.mjs](../../scripts/render-docs-artwork.mjs). It uses the existing `@resvg/resvg-js` dependency. No application dependency or runtime code was added.

```sh
node scripts/render-docs-artwork.mjs --stills-only
# For the GIF, install ffmpeg locally, then:
node scripts/render-docs-artwork.mjs
```

Run after installing the repo dependencies. The renderer works relative to its own file path, writes only these assets, and removes temporary animation frames. The GIF plays once to keep a long README quiet; its adjacent still provides a motion-free alternative. GitHub's image renderer cannot implement a viewer-specific reduced-motion setting for a GIF.

When the site's design changes, update the palette and composition here rather than treating the docs artwork as a second design system.
