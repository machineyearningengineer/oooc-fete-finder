import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "docs/assets");
// Palette and typography are documented in DESIGN.md.
const palette = {
	paper: "#f4eedf",
	ink: "#243d30",
	coral: "#b84a31",
	gold: "#a9782d",
	card: "#faf6ec",
};
const escape = (value) =>
	String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;");
const text = (
	x,
	y,
	value,
	size = 22,
	fill = palette.ink,
	family = "Degular",
	extra = "",
) =>
	`<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" fill="${fill}" ${extra}>${escape(value)}</text>`;
const line = (x1, y1, x2, y2, color = palette.ink, extra = "") =>
	`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${color}" fill="none" ${extra}/>`;
const base = (content, title, height = 560) =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="${height}" viewBox="0 0 1000 ${height}"><title>${escape(title)}</title><rect width="1000" height="${height}" fill="${palette.paper}"/><rect x="14" y="14" width="972" height="${height - 28}" fill="none" stroke="${palette.coral}" stroke-opacity=".4"/>${content}</svg>`;
const ease = (value) => {
	const t = Math.max(0, Math.min(1, value));
	return t * t * (3 - 2 * t);
};
const points = [
	[586, 365],
	[714, 222],
	[897, 310],
];
const route = (seconds = 8) => {
	const phase = Math.min(2, Math.floor(seconds / 2.5));
	const stages = [
		"Find your sound",
		"Compare the places",
		"Make it your route",
	];
	const progress = ease((seconds - 2.2) / 3.6);
	let art = text(
		48,
		60,
		"OUT OF OFFICE COLLECTIVE  /  FÊTE FINDER",
		16,
		palette.ink,
		"Degular",
		'letter-spacing="2"',
	);
	art += line(48, 84, 952, 84, palette.ink, 'stroke-opacity=".25"');
	art +=
		text(48, 182, "Paris, at", 64, palette.ink, "Prata") +
		text(48, 267, "your pace.", 64, palette.ink, "Prata");
	art +=
		text(50, 326, "A little music. A few good detours.", 24) +
		text(50, 360, "One guide to make the night yours.", 24);
	art += `<g opacity=".12" stroke="${palette.ink}" fill="none">`;
	for (let i = 0; i < 8; i++)
		art += `<path d="M${520 + i * 58} 124L${470 + i * 64} 431"/><path d="M518 ${146 + i * 36}L950 ${123 + i * 41}"/>`;
	art += `</g><path d="M490 398C620 263 689 464 780 365S886 213 968 247" stroke="${palette.ink}" stroke-opacity=".13" stroke-width="22" fill="none"/>`;
	art += text(
		861,
		420,
		"PARIS / STUDY",
		13,
		palette.ink,
		"Degular",
		'letter-spacing="1.5"',
	);
	art += `<path d="M586 365L714 222L897 310" fill="none" stroke="${palette.coral}" stroke-width="2" stroke-dasharray="4 7" stroke-opacity=".35"/>`;
	art += `<path d="M586 365L714 222L897 310" fill="none" stroke="${palette.coral}" stroke-width="3" stroke-dasharray="${progress * 396} 396"/>`;
	points.forEach(([x, y], i) => {
		const opacity = 0.35 + 0.65 * ease((seconds - i * 0.7) / 0.6);
		art += `<g opacity="${opacity}"><circle cx="${x}" cy="${y}" r="16" fill="${palette.paper}" stroke="${palette.coral}" stroke-width="2"/>${text(x, y + 6, i + 1, 18, palette.coral, "Degular", 'text-anchor="middle"')}${text(x - 16, y - 33, ["18:00", "20:00", "23:00"][i], 20)}${text(i === 2 ? 952 : x - 16, y + 45, ["Start outside", "Find your sound", "Stay for one more"][i], 17, palette.ink, "Degular", i === 2 ? 'text-anchor="end"' : "")}</g>`;
	});
	art += line(48, 464, 952, 464, palette.ink, 'stroke-opacity=".25"');
	stages.forEach((stage, i) => {
		const active = phase === i;
		art += text(
			48 + i * 305,
			513,
			`0${i + 1}  ${stage}`,
			22,
			active ? palette.coral : palette.ink,
		);
		if (active)
			art += line(
				48 + i * 305,
				531,
				262 + i * 305,
				531,
				palette.coral,
				'stroke-width="2"',
			);
	});
	return base(
		art,
		"Fête Finder: discover, compare, and plan. Illustrative route, not a geographic map.",
	);
};
const box = (x, y, width, title, lines) =>
	`<rect x="${x}" y="${y}" width="${width}" height="112" fill="${palette.card}" stroke="${palette.ink}" stroke-opacity=".3"/>${text(x + 18, y + 35, title, 25)}${lines.map((value, i) => text(x + 18, y + 65 + 24 * i, value, width < 220 ? 17 : 19)).join("")}`;
const arrow = (x1, y1, x2, y2) =>
	line(x1, y1, x2, y2, palette.coral, 'stroke-width="2"') +
	`<path d="M${x2 - 6} ${y2 - 5}L${x2} ${y2}L${x2 - 6} ${y2 + 5}" fill="none" stroke="${palette.coral}" stroke-width="2"/>`;
const nodeXs = [48, 286, 524, 762];
const progressDot = (seconds, start, end, from, to, y, color) => {
	if (seconds < start || seconds > end) return "";
	const x = from + (to - from) * ease((seconds - start) / (end - start));
	return `<circle cx="${x}" cy="${y}" r="4.5" fill="${color}"/>`;
};
const system = (seconds = 13) => {
	let art = text(
		48,
		60,
		"FÊTE FINDER / REQUEST FLOW",
		16,
		palette.ink,
		"Degular",
		'letter-spacing="2"',
	);
	art += text(
		48,
		124,
		"Read an event. Process a flyer.",
		42,
		palette.ink,
		"Prata",
	);
	art += text(
		48,
		165,
		"PUBLIC EVENT REQUEST",
		15,
		palette.coral,
		"Degular",
		'letter-spacing="1.5"',
	);
	const publicNodes = [
		["Browser", ["GET event by key", "Open details"]],
		["Events API", ["Resolve eventKey", "200 or 404"]],
		["Runtime", ["Cached event data", "Assemble + validate"]],
		["Data sources", ["Store / backup / CSV", "Archive: CSV only"]],
	];
	const mediaNodes = [
		["Editor", ["Upload 1–6 images", "PNG / JPEG / WebP"]],
		["OCR API", ["Auth + origin checks", "Validate upload limits"]],
		["Extraction", ["Gemini → normalize", "Source + alternatives"]],
		["Review draft", ["Fields and warnings", "Editor decides to save"]],
	];
	for (let i = 0; i < 4; i++) {
		art += box(nodeXs[i], 188, 190, publicNodes[i][0], publicNodes[i][1]);
		art += box(nodeXs[i], 415, 190, mediaNodes[i][0], mediaNodes[i][1]);
		if (i < 3) {
			art += arrow(nodeXs[i] + 193, 245, nodeXs[i + 1] - 9, 245);
			art += arrow(nodeXs[i] + 193, 472, nodeXs[i + 1] - 9, 472);
			art += progressDot(
				seconds,
				0.6 + i,
				1.6 + i,
				nodeXs[i] + 193,
				nodeXs[i + 1] - 9,
				245,
				palette.coral,
			);
			art += progressDot(
				seconds,
				7.1 + i * 1.2,
				8.3 + i * 1.2,
				nodeXs[i] + 193,
				nodeXs[i + 1] - 9,
				472,
				palette.gold,
			);
		}
	}
	art += `<path d="M857 300V326H143V300" fill="none" stroke="${palette.ink}" stroke-opacity=".35"/>`;
	art += progressDot(seconds, 3.9, 6.1, 857, 143, 326, palette.coral);
	art += text(373, 351, "Event JSON returns to the browser", 19);
	art += line(48, 372, 952, 372, palette.ink, 'stroke-opacity=".25"');
	art += text(
		48,
		396,
		"MEDIA PROCESSING / AUTHENTICATED REQUEST",
		15,
		palette.coral,
		"Degular",
		'letter-spacing="1.5"',
	);
	art += `<path d="M857 527V553H143V527" fill="none" stroke="${palette.ink}" stroke-opacity=".35"/>`;
	art += progressDot(seconds, 10.7, 12.5, 857, 143, 553, palette.gold);
	art += text(
		310,
		578,
		"Draft results return; extraction does not publish",
		19,
	);
	art += line(48, 602, 952, 602, palette.ink, 'stroke-opacity=".25"');
	art += text(
		48,
		636,
		"OCR runs within the request. Separate images run sequentially; a combined batch uses one call.",
		19,
	);
	return base(
		art,
		"Public event request and authenticated image extraction, including their responses. Timing is illustrative.",
		670,
	);
};
const intake = () =>
	base(
		text(
			48,
			60,
			"THE DATA JOURNEY / BEFORE THE GUIDE",
			16,
			palette.ink,
			"Degular",
			'letter-spacing="2"',
		) +
			text(48, 126, "A suggestion needs a source.", 44, palette.ink, "Prata") +
			[
				[48, "01  Collect", ["Flyers and listings", "External + manual"]],
				[283, "02  Extract", ["Gemini draft fields", "Source + alternatives"]],
				[518, "03  Review", ["Dates and duplicates", "Venue ambiguity"]],
				[753, "04  Publish", ["Reviewed event rows", "Public finder"]],
			]
				.map(([x, title, lines]) => box(x, 190, 199, title, lines))
				.join("") +
			arrow(250, 245, 276, 245) +
			arrow(485, 245, 511, 245) +
			arrow(720, 245, 746, 245) +
			line(48, 338, 952, 338, palette.ink, 'stroke-opacity=".25"') +
			text(48, 381, "Fixed choices", 26, palette.coral) +
			text(48, 416, "Indoor / outdoor", 22) +
			text(351, 381, "Structured values", 26, palette.coral) +
			text(351, 416, "Dates, times, prices", 22) +
			text(682, 381, "Free text", 26, palette.coral) +
			text(682, 416, "Titles, venues, notes", 22) +
			text(
				48,
				507,
				"Confidence helps prioritize review. It does not prove the extracted value is correct.",
				22,
			),
		"Collection to extraction to human review to publication, with fixed choices, structured values, and free text.",
	);
const render = (svg) =>
	new Resvg(svg, {
		font: {
			loadSystemFonts: false,
			fontFiles: [
				join(root, "public/fonts/prata_regular.ttf"),
				join(root, "public/fonts/degular_regular.ttf"),
			],
		},
	})
		.render()
		.asPng();
await mkdir(output, { recursive: true });
for (const [name, svg] of [
	["finder-route", route()],
	["system-map", system()],
	["intake-flow", intake()],
]) {
	await writeFile(join(output, `${name}.svg`), svg);
	await writeFile(join(output, `${name}.png`), render(svg));
}
if (!process.argv.includes("--stills-only")) {
	for (const [name, draw, frames] of [
		["finder-route", route, 108],
		["system-map", system, 168],
	]) {
		const temporary = await mkdtemp(join(tmpdir(), "fete-docs-"));
		try {
			for (let frame = 0; frame < frames; frame++) {
				await writeFile(
					join(temporary, `${String(frame).padStart(3, "0")}.png`),
					render(draw(frame / 12)),
				);
			}
			const result = spawnSync(
				"ffmpeg",
				[
					"-y",
					"-loglevel",
					"error",
					"-framerate",
					"12",
					"-i",
					join(temporary, "%03d.png"),
					"-filter_complex",
					"split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5",
					"-loop",
					"-1",
					join(output, `${name}.gif`),
				],
				{ stdio: "inherit" },
			);
			if (result.error) throw result.error;
			if (result.status !== 0)
				throw new Error(`ffmpeg failed (${result.status})`);
		} finally {
			await rm(temporary, { recursive: true, force: true });
		}
	}
}
console.log("Rendered documentation artwork in docs/assets.");
