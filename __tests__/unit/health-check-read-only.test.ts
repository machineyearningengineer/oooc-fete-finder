import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("production health check", () => {
	it("does not mutate the database schema", async () => {
		const script = await readFile(
			path.join(process.cwd(), "scripts/health-check.mjs"),
			"utf8",
		);

		expect(script).not.toMatch(
			/\b(?:CREATE|ALTER|DROP|TRUNCATE)\s+(?:TABLE|INDEX)\b/i,
		);
	});
});
