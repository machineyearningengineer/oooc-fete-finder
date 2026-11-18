import fs from "node:fs/promises";
import path from "node:path";
import {
	fitOGFontSize,
	wrapOGText as wrapText,
	renderOGFrame,
	OG_HEIGHT,
	OG_WIDTH,
	renderOGSvgToPng,
} from "../lib/social/og-renderer.mjs";

const WIDTH = OG_WIDTH;
const HEIGHT = OG_HEIGHT;
const OUT_DIR = path.join(process.cwd(), "public", "og");

const presets = {
 archive: {label: "The 2026 Event Archive", title: "Paris, kept close", subtitle: "Explore the music, places and routes from Fête 2026.", accent: "#b84a31", facts: [{label: "Edition", value: "2026"}, {label: "City", value: "Paris"}, {label: "Explore", value: "The archive"}]},
 terms: {label: "Community Terms", title: "Our shared ground", subtitle: "The terms for using Fête Finder and the ticket exchange.", accent: "#52604e", facts: [{label: "Read", value: "Your rights"}, {label: "Respect", value: "The community"}, {label: "By", value: "OOOC"}]},
 recap: {
  label: "The 2026 Recap & Archive",
  title: "Fête Finder 2026",
  subtitle: "Fête de la Musique, Paris. The weekend we made together.",
  accent: "#b84a31",
  facts: [{label: "Where", value: "Paris"}, {label: "When", value: "June 2026"}, {label: "By", value: "OOOC"}],
 },

	home: {
		label: "Event Guide",
		title: "Fête Finder",
		subtitle: "Curated Paris music events by Out Of Office Collective.",
		accent: "#9a362f",
		facts: [
			{ label: "Picks", value: "Curated music" },
			{ label: "Where", value: "Paris" },
			{ label: "When", value: "Fête weekend" },
		],
	},
	"how-it-works": {
		label: "How It Works",
		title: "Your night, mapped",
		subtitle: "Find events, filter by vibe, save your route, and share it.",
		accent: "#176b65",
		facts: [
			{ label: "Find", value: "Events" },
			{ label: "Choose", value: "Your vibe" },
			{ label: "Share", value: "A route" },
		],
	},
	privacy: {
		label: "Privacy",
		title: "Clear data rules",
		subtitle: "How attendee, host, and partner information is handled.",
		accent: "#5a4f8f",
		facts: [
			{ label: "Data", value: "Clear rules" },
			{ label: "Control", value: "Consent first" },
			{ label: "Scope", value: "Your details" },
		],
	},
	"submit-event": {
		label: "Host Submission",
		title: "Submit your event",
		subtitle: "Send the essentials for OOOC review and publication.",
		accent: "#2f7652",
		facts: [
			{ label: "For", value: "Hosts" },
			{ label: "Review", value: "OOOC team" },
			{ label: "Result", value: "Listing" },
		],
	},
	"feature-event": {
		label: "Partner Placements",
		title: "Partner with OOOC",
		titleLines: ["Partner with", "OOOC"],
		subtitle: "Spotlight and promoted placements for Fête de la Musique.",
		accent: "#a35f26",
		facts: [
			{ label: "Reach", value: "Community" },
			{ label: "Placement", value: "Spotlight" },
			{ label: "Moment", value: "Fête weekend" },
		],
	},
	"partner-success": {
		label: "Payment Confirmed",
		title: "Your next spotlight",
		subtitle: "The OOOC team will review and activate your placement.",
		accent: "#24725b",
		facts: [
			{ label: "Status", value: "Received" },
			{ label: "Next", value: "Review" },
			{ label: "Then", value: "Activation" },
		],
	},
	"partner-performance-report": {
		label: "Private Report",
		title: "Partner performance",
		subtitle: "Private campaign metrics for OOOC placements.",
		accent: "#2f657d",
		facts: [
			{ label: "Access", value: "Private" },
			{ label: "Measure", value: "Reach" },
			{ label: "Action", value: "Clicks" },
		],
	},
	"social-assets": {
		label: "Social Assets",
		title: "Social assets",
		subtitle: "Private branded export routes for creative assets.",
		accent: "#754f88",
		facts: [
			{ label: "Story", value: "9:16" },
			{ label: "Square", value: "1:1" },
			{ label: "Social", value: "X / LinkedIn" },
		],
	},
	exchange: {
		label: "Ticket Exchange",
		title: "Ticket exchange",
		subtitle: "Find ticket posts linked to curated Fête Finder events.",
		accent: "#155d63",
		facts: [
			{ label: "For", value: "Buyers" },
			{ label: "Also", value: "Sellers" },
			{ label: "Trades", value: "Off-platform" },
		],
	},
	plans: {
		label: "Route Planner",
		title: "Plan your route",
		subtitle: "Save events, order your stops, and share the night.",
		accent: "#2f7652",
		facts: [
			{ label: "Save", value: "Events" },
			{ label: "Order", value: "Stops" },
			{ label: "Share", value: "A route" },
		],
	},
};

const escapeXml = (value) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

const truncateText = (value, maxChars) =>
	value.length > maxChars ? `${value.slice(0, maxChars - 1)}…` : value;

const getTitleLayout = (title, forcedLines) => {
	if (Array.isArray(forcedLines) && forcedLines.length > 0) {
		return {
			lines: forcedLines,
			size: forcedLines.length === 1 ? 82 : 78,
			lineHeight: 76,
		};
	}

	for (const candidate of [
		{ maxChars: 18, size: 82, maxLines: 2 },
		{ maxChars: 20, size: 74, maxLines: 2 },
		{ maxChars: 22, size: 66, maxLines: 2 },
	]) {
		const lines = wrapText(title, candidate.maxChars, candidate.maxLines);
		if (lines.join(" ").replace(/\.\.\.$/, "") === title) {
			return {
				lines,
				size:
					lines.length === 1
						? title.length <= 14
							? 104
							: Math.min(candidate.size, 74)
						: candidate.size,
				lineHeight: candidate.size * 0.98,
			};
		}
	}

	return {
		lines: wrapText(title, 22, 2),
		size: 66,
		lineHeight: 64,
	};
};

const renderTextLines = ({ lines, x, startY, className, fontSize, lineHeight }) =>
	lines
		.map(
			(line, index) =>
				`<text x="${x}" y="${
					startY + index * lineHeight
				}" class="${className}" style="font-size:${fitOGFontSize(line, fontSize, 640, className === "title" ? "Prata" : "Degular")}px">${escapeXml(
					line,
				)}</text>`,
		)
		.join("");

const renderMetaRow = (items, accent) => {
	const facts = items.slice(0, 3).map((item) => ({
		label: truncateText(item.label, 12),
		value: truncateText(item.value, 19),
	}));
	return `<g transform="translate(86 492)">
	<line x1="0" y1="0" x2="540" y2="0" stroke="${accent}" stroke-opacity="0.5" stroke-width="2"/>
	${facts
		.map((fact, index) => {
			const x = index * 180;
			return `<g transform="translate(${x} 23)">
	<line x1="0" y1="-10" x2="0" y2="36" stroke="${accent}" stroke-opacity="0.28"/>
	<text x="18" y="0" class="metaLabel">${escapeXml(fact.label)}</text>
	<text x="18" y="27" class="meta" style="font-size:${fitOGFontSize(fact.value, 22, 152)}px">${escapeXml(fact.value)}</text>
</g>`;
		})
		.join("\n")}
</g>`;
};

const buildSvg = ({ label, title, titleLines, subtitle, accent, facts }) => {
	const titleLayout = getTitleLayout(title, titleLines);
	const titleTop = titleLayout.lines.length === 1 ? 262 : 252;
	const titleBottom =
		titleTop + (titleLayout.lines.length - 1) * titleLayout.lineHeight;
	const subtitleTop = titleBottom + 66;
	const subtitleLines = wrapText(subtitle, 42, 2);

	return `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg">
	<defs>
		<style>
			.eyebrow { font: 700 19px "Degular", sans-serif; letter-spacing: 3px; fill: #52604e; }
			.label { font: 700 22px "Degular", sans-serif; letter-spacing: 1.2px; fill: ${accent}; text-transform: uppercase; }
			.title { font-family: "Prata", serif; font-weight: 400; fill: #243d30; }
			.subtitle { font: 500 30px "Degular", sans-serif; fill: #52604e; }
			.metaLabel { font: 700 13px "Degular", sans-serif; letter-spacing: 1.8px; fill: ${accent}; text-transform: uppercase; }
			.meta { font: 700 22px "Degular", sans-serif; fill: #243d30; }
			.footer { font: 700 19px "Degular", sans-serif; letter-spacing: 2.1px; fill: #6a5849; }
		</style>
	</defs>
	${renderOGFrame()}
	<rect x="86" y="82" width="72" height="6" rx="3" fill="${accent}"/>
	<text x="86" y="122" class="eyebrow">OUT OF OFFICE COLLECTIVE</text>
	<text x="86" y="172" class="label">${escapeXml(label)}</text>
	${renderTextLines({
		lines: titleLayout.lines,
		x: 86,
		startY: titleTop,
		className: "title",
		fontSize: Math.min(...titleLayout.lines.map(line => fitOGFontSize(line, titleLayout.size, 640, "Prata"))),
		lineHeight: titleLayout.lineHeight,
	})}
	${renderTextLines({
		lines: subtitleLines,
		x: 90,
		startY: subtitleTop,
		className: "subtitle",
		fontSize: 30,
		lineHeight: 41,
	})}
	${renderMetaRow(facts, accent)}
	<text x="54" y="584" class="footer">PARIS</text>
	<text x="640" y="584" class="footer" text-anchor="end">FÊTE FINDER</text>
</svg>`;
};

await fs.mkdir(OUT_DIR, { recursive: true });

for (const [slug, content] of Object.entries(presets)) {
 if (process.argv[2] && slug !== process.argv[2]) continue;
	const outputPath = path.join(OUT_DIR, `${slug}.png`);
	await fs.writeFile(outputPath, await renderOGSvgToPng(buildSvg(content)));
	console.log(outputPath);
}
