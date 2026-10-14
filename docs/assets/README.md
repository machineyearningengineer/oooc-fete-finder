# Artwork and downloads

The diagrams use the site's Prata and Degular fonts, paper, forest ink, coral, and ochre. [DESIGN.md](../../DESIGN.md) records the palette and layout rules.

| Artwork | Animation | Still | Editable vector |
| --- | --- | --- | --- |
| Paris route study | [GIF](finder-route.gif) | [PNG](finder-route.png) | [SVG](finder-route.svg) |
| Public request and flyer processing | [GIF](system-map.gif) | [PNG](system-map.png) | [SVG](system-map.svg) |
| Event intake | — | [PNG](intake-flow.png) | [SVG](intake-flow.svg) |

The route study is schematic: its stops and times are illustrative. The request diagram traces the event-detail API and admin OCR path. OCR runs inside the request, not a background queue. Animation timing is illustrative too.

Both GIFs play once. Text stays still while route lines or small request markers move. PNGs provide a motion-free version. GitHub cannot apply a viewer's reduced-motion preference to a GIF.

## Render from source

[render-docs-artwork.mjs](../../scripts/render-docs-artwork.mjs) uses the existing `@resvg/resvg-js` dependency and bundled fonts. After installing repository dependencies:

```sh
node scripts/render-docs-artwork.mjs --stills-only
# With ffmpeg installed locally, render the animations too:
node scripts/render-docs-artwork.mjs
```

The script writes the assets listed above and removes temporary frame files. PNG/GIF text is rasterized for consistent GitHub display. SVG text remains editable and needs the same fonts for matching output.
