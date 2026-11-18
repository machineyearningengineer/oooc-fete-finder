import {
	DEFAULT_EVENT_FILTER_STATE,
	filterEvents,
	getDefaultDateRangeForEvents,
} from "@/features/events/filtering";
import type { Event } from "@/features/events/types";
import { afterEach, describe, expect, it, vi } from "vitest";

const events = [2025, 2026].map(
	(year) =>
		({
			eventKey: `evt_archive_${year}`,
			name: `Fête ${year}`,
			date: `${year}-06-21`,
			genre: [],
			type: "main",
			sourceConfirmed: true,
		}) as unknown as Event,
);
afterEach(() => vi.unstubAllEnvs());
describe("off-season discovery", () => {
	it("opens the latest archived season even in a later calendar year", () => {
		vi.stubEnv("NEXT_PUBLIC_ARCHIVE_MODE", "true");
		const range = getDefaultDateRangeForEvents(
			events,
			new Date("2027-01-20T12:00:00Z"),
		);
		expect(range).toEqual({ from: "2026-01-01", to: "2026-12-31" });
		expect(
			filterEvents(
				events,
				{ ...DEFAULT_EVENT_FILTER_STATE, selectedDateRange: range },
				{
					defaultDateRange: range,
					referenceDate: new Date("2027-01-20T12:00:00Z"),
				},
			),
		).toEqual([events[1]]);
	});
	it("keeps explicit archive year filters and handles an empty catalog", () => {
		vi.stubEnv("NEXT_PUBLIC_ARCHIVE_MODE", "true");
		expect(getDefaultDateRangeForEvents([])).toEqual({ from: null, to: null });
		expect(
			filterEvents(events, {
				...DEFAULT_EVENT_FILTER_STATE,
				selectedDateRange: { from: "2025-01-01", to: "2025-12-31" },
			}),
		).toEqual([events[0]]);
	});
});
