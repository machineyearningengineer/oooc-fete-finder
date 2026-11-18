import {
	OG_RESVG_FONT_CONFIG,
	fitOGFontSize,
	wrapOGText,
} from "@/lib/social/og-renderer.mjs";
import { Resvg } from "@resvg/resvg-js";
import { describe, expect, it } from "vitest";

describe("OG text boundaries", () => {
	it.each([
		["Damside FDLM Block", 76, 640, "Prata"],
		["42 Rue Notre Dame", 22, 152, "Degular"],
		["WWWWWWWWWWWWWWWWWWWWWW", 76, 640, "Prata"],
	] as const)("fits %s inside its column", (text, size, width, family) => {
		const fitted = fitOGFontSize(text, size, width, family);
		const svg = new Resvg(
			`<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="300"><text y="150" font-family="${family}" font-size="${fitted}">${text}</text></svg>`,
			{ font: OG_RESVG_FONT_CONFIG },
		);
		expect(svg.getBBox()?.width).toBeLessThanOrEqual(width);
	});
	it("bounds unbroken words and marks omitted title content", () => {
		const lines = wrapOGText("W".repeat(110), 22, 2);
		expect(lines).toHaveLength(2);
		expect(lines.every((line: string) => line.length <= 22)).toBe(true);
		expect(lines[1].endsWith("…")).toBe(true);
	});
	it("preserves a complete short title", () => {
		expect(wrapOGText("A Fête Route", 18, 2)).toEqual(["A Fête Route"]);
	});
});
