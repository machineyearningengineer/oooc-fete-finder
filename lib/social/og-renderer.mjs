import { Resvg } from "@resvg/resvg-js";
import { join } from "node:path";
import sharp from "sharp";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
export const OG_SCALE = 2;

const FONT_ROOT = join(process.cwd(), "public", "fonts");

export const OG_FONT_FILES = [
	join(FONT_ROOT, "degular_regular.ttf"),
	join(FONT_ROOT, "prata_regular.ttf"),
];

export const OG_RESVG_FONT_CONFIG = Object.freeze({
	fontFiles: OG_FONT_FILES,
	loadSystemFonts: false,
	defaultFontFamily: "Degular",
	serifFamily: "Prata",
	sansSerifFamily: "Degular",
});

export const renderOGSvgToPng = async (svg) => {
	const png2x = new Resvg(svg, {
		font: OG_RESVG_FONT_CONFIG,
		fitTo: { mode: "width", value: OG_WIDTH * OG_SCALE },
		imageRendering: 0,
		logLevel: "error",
		shapeRendering: 2,
		textRendering: 2,
	})
		.render()
		.asPng();

	return sharp(png2x)
		.resize(OG_WIDTH, OG_HEIGHT, {
			fit: "fill",
			kernel: "lanczos3",
		})
		.png({ compressionLevel: 9 })
		.toBuffer();
};

// Shared printed-atlas frame for static pages and dynamic event/route cards.
export const renderOGFrame = () => `<rect width="1200" height="630" fill="#f4eedf"/>
<defs><pattern id="paper-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" stroke="#a9782d" stroke-opacity=".07"/></pattern></defs>
<rect width="1200" height="630" fill="url(#paper-grid)"/>
<path d="M780 0V630" stroke="#a9782d" stroke-opacity=".4" stroke-dasharray="3 8"/>
<g stroke="#a9782d" stroke-opacity=".18" fill="none" stroke-width="2">
<path d="M810 160L1170 260M820 390L1160 140M850 80L1080 560M800 490L1160 400M940 60L860 560M1150 60L1010 570"/>
<path d="M790 350C920 270 920 440 1200 330" stroke-width="18" stroke-opacity=".12"/>
</g>
<g fill="none" stroke="#b84a31" stroke-width="3" stroke-linecap="round">
<path d="M1035 164C870 180 1110 260 955 310S840 400 1025 450"/>
<circle cx="1035" cy="164" r="8" fill="#f4eedf"/><circle cx="955" cy="310" r="8" fill="#f4eedf"/><circle cx="1025" cy="450" r="8" fill="#f4eedf"/>
</g>
<g fill="#243d30" font-family="Degular" letter-spacing="2">
<text x="838" y="90" font-size="16">OOOC / FIELD NOTES</text>
<text x="838" y="116" font-size="13">PARIS · FRANCE</text>
</g>
<g transform="translate(843 500) rotate(-4)">
<rect width="292" height="72" fill="#ede2c9" stroke="#a9782d" stroke-dasharray="3 4"/>
<text x="18" y="29" fill="#243d30" font-family="Prata" font-size="21">A few good detours.</text>
<text x="18" y="53" fill="#b84a31" font-family="Degular" font-size="13" letter-spacing="2">FÊTE FINDER / PARIS</text>
</g>`;

const escapeText = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const fitOGFontSize = (text, size, maxWidth, family = "Degular") => {
 const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="10000" height="300"><text y="150" font-family="${family}" font-size="${size}">${escapeText(text)}</text></svg>`;
 const bounds = new Resvg(svg, {font: OG_RESVG_FONT_CONFIG}).getBBox();
 return bounds?.width ? Math.min(size, size * maxWidth / (bounds.width + 2)) : size;
};

export const wrapOGText = (value, maxChars, maxLines) => {
 const words = value.trim().split(/\s+/).flatMap(word => {
  const chars = Array.from(word);
  const chunks = [];
  for (let i = 0; i < chars.length; i += maxChars) chunks.push(chars.slice(i, i + maxChars).join(""));
  return chunks;
 });
 const lines = [];
 let current = "";
 for (const word of words) {
  const next = current ? `${current} ${word}` : word;
  if (next.length > maxChars && current) { lines.push(current); current = word; }
  else current = next;
 }
 if (current) lines.push(current);
 const visible = lines.slice(0, maxLines);
 if (lines.length > maxLines) visible[maxLines - 1] = `${visible[maxLines - 1].slice(0, maxChars - 1).trimEnd()}…`;
 return visible;
};
