import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.unstubAllEnvs());

describe("public search discovery", () => {
	const configure = (archive: boolean) => {
		vi.stubEnv("ARCHIVE_MODE", String(archive));
		vi.stubEnv("NEXT_PUBLIC_ARCHIVE_MODE", String(archive));
		vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://fete.example");
		vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "");
	};
	it("lists the archive and canonical route without closed flows or invented modification dates", () => {
		configure(true);
		const entries = sitemap();
		const paths = entries.map((entry) => new URL(entry.url).pathname);
		expect(paths).toContain("/archive");
		expect(paths).toContain("/plans/fete");
		expect(paths).not.toContain("/plans/fete-2026");
		expect(paths).not.toContain("/exchange");
		expect(paths).not.toContain("/submit-event");
		expect(entries.every((entry) => entry.lastModified === undefined)).toBe(
			true,
		);
		expect(new Set(paths).size).toBe(paths.length);
	});
	it("keeps live flows discoverable outside archive mode", () => {
		configure(false);
		const paths = sitemap().map((entry) => new URL(entry.url).pathname);
		expect(paths).not.toContain("/archive");
		expect(paths).toContain("/exchange");
		expect(paths).toContain("/submit-event");
	});
	it("allows preview image crawling and reading event noindex tags", () => {
		configure(true);
		const rules = robots().rules;
		expect(Array.isArray(rules)).toBe(true);
		const publicRule = (Array.isArray(rules) ? rules : [rules]).find(
			(rule) => rule.userAgent === "*",
		);
		expect(publicRule?.allow).toContain("/api/og");
		expect(publicRule?.allow).toContain("/plans/fete$");
		expect(publicRule?.disallow).not.toContain("/event");
		expect(publicRule?.disallow).toContain("/admin");
	});
});
