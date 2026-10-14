# Fête Finder design

The site uses the layout of a printed guide: readable type, rules, columns, and routes. Decoration should leave event details easy to find.

## Type and colour

Prata is the display face; Degular is the body and UI face. The font files live in [public/fonts](public/fonts/FONTS.md). Use the site tokens in [app/globals.css](app/globals.css) for application UI.

Documentation artwork uses warm paper (`#f4eedf`), forest ink (`#243d30`), coral (`#b84a31`), and ochre (`#a9782d`). Keep the same type and colour choices across diagrams, stills, and animations.

## Layout and motion

- Anchor labels to a rule, column, card, or route. Keep enough space for long titles.
- Use pills for interactive controls; use plain labels in diagrams and share images.
- Show direction with lines and small markers. Keep text still while a request moves.
- Provide a still beside every documentation animation. Use a single playback rather than an endless loop.
- Keep diagrams readable at the width of a GitHub README.

## Share images

Open Graph images are 1200 × 630 PNGs. They need to read at a small preview size. Use the checked-in generators rather than editing rendered files by hand.

Event cards can show the title, date, time, price, venue, genre, and area. Shared-plan cards can show the date and stop count. Only supported, validated fields should reach the renderer; arbitrary query text must not become image copy.

Avoid floating badges, decorative blobs, glass effects, gradients, and card stacks that compete with the event information.

[Documentation artwork and downloads](docs/assets/README.md)
