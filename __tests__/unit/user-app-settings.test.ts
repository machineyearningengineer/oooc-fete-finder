import {
	DEFAULT_LOCAL_APP_SETTINGS,
	normalizeLocalAppSettings,
} from "@/lib/user-app-settings";
import { describe, expect, it } from "vitest";

describe("normalizeLocalAppSettings", () => {
	it("waits for expansion before loading the map by default", () => {
		expect(normalizeLocalAppSettings({}).mapLoadStrategy).toBe("expand");
		expect(DEFAULT_LOCAL_APP_SETTINGS.mapLoadStrategy).toBe("expand");
	});

	it("accepts saved map loading strategies", () => {
		expect(
			normalizeLocalAppSettings({ mapLoadStrategy: "expand" }).mapLoadStrategy,
		).toBe("expand");
		expect(
			normalizeLocalAppSettings({ mapLoadStrategy: "idle" }).mapLoadStrategy,
		).toBe("idle");
	});

	it("rejects unsupported map loading values", () => {
		expect(
			normalizeLocalAppSettings({
				mapLoadStrategy: "immediate",
			} as unknown as Parameters<typeof normalizeLocalAppSettings>[0])
				.mapLoadStrategy,
		).toBe("expand");
	});
});
