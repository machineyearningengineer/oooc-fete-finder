// Run only against a restored backup. Publishes aggregates, never user/session rows.
import { readFile, writeFile } from "node:fs/promises";
import Papa from "papaparse";
import postgres from "postgres";

if (!process.env.DATABASE_URL || !process.env.RECAP_SOURCE) {
	throw new Error("Set DATABASE_URL for the restored backup and RECAP_SOURCE for its provenance.");
}
const { data, errors } = Papa.parse(await readFile("data/events.csv", "utf8"), { header: true, skipEmptyLines: true });
if (errors.length) throw new Error(errors[0].message);
const events = data.filter(row => row.Title?.trim() && row["Event Key"]?.trim() && row.Date?.endsWith("-2026"));
const minutes = value => /^\d{1,2}:\d{2}$/.test(value ?? "") ? Number(value.split(":")[0]) * 60 + Number(value.split(":")[1]) : null;
const titleCase = value => value.trim().split(/\s+/).map(word => word.length <= 3 && word === word.toUpperCase() ? word : word[0]?.toUpperCase() + word.slice(1).toLowerCase()).join(" ");
const genres = new Map();
for (const event of events) for (const genre of new Set(event.Categories.split(",").map(titleCase).filter(Boolean))) genres.set(genre, (genres.get(genre) ?? 0) + 1);
const catalog = {
	events: events.length,
	freeEvents: events.filter(row => /free/i.test(row.Price)).length,
	lateNightEvents: events.filter(row => {
		const start = minutes(row["Start Time"]), end = minutes(row["End Time"]);
		return (start !== null && start >= 22 * 60) || (end !== null && end <= 9 * 60);
	}).length,
	eventsWithLocation: events.filter(row => row.Location?.trim()).length,
	topGenres: [...genres].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])).slice(0,6).map(([label,value]) => ({label,value})),
};
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, connect_timeout: 10, onnotice: () => {} });
const start = "2026-06-01T00:00:00Z", end = "2026-07-01T00:00:00Z";
try {
	const [views, engagements, dailyActivity, topEvents] = await sql.begin("read only", async tx => {
		return Promise.all([
			tx`SELECT COUNT(*)::int AS count FROM app_discovery_analytics_stats WHERE action_type = 'page_view' AND recorded_at >= ${start} AND recorded_at < ${end}`,
			tx`SELECT action_type, COUNT(*)::int AS count FROM app_event_engagement_stats WHERE recorded_at >= ${start} AND recorded_at < ${end} GROUP BY action_type`,
			tx`WITH actions AS (
				SELECT recorded_at FROM app_discovery_analytics_stats WHERE recorded_at >= ${start} AND recorded_at < ${end}
				UNION ALL SELECT recorded_at FROM app_event_engagement_stats WHERE recorded_at >= ${start} AND recorded_at < ${end}
				UNION ALL SELECT recorded_at FROM ticket_exchange_analytics_stats WHERE recorded_at >= ${start} AND recorded_at < ${end}
			) SELECT DATE(recorded_at AT TIME ZONE 'Europe/Paris')::text AS day, COUNT(*)::int AS actions FROM actions
			WHERE DATE(recorded_at AT TIME ZONE 'Europe/Paris') BETWEEN '2026-06-19' AND '2026-06-22' GROUP BY 1 ORDER BY 1`,
			tx`SELECT event_key, COUNT(*)::int AS total_actions FROM app_event_engagement_stats WHERE recorded_at >= ${start} AND recorded_at < ${end} GROUP BY event_key ORDER BY total_actions DESC, event_key ASC LIMIT 5`,
		]);
	});
	const count = action => {
		const row = engagements.find(row => row.action_type === action);
		if (!row) throw new Error(`Missing expected metric: ${action}`);
		return row.count;
	};
	const snapshot = {
		source: process.env.RECAP_SOURCE, period: "June 2026", catalog,
		pageViews: views[0].count, outboundClicks: count("outbound_click"), saveToggles: count("saved_toggle"), mapOpens: count("map_open"),
		dailyActivity,
		topEvents: topEvents.map(row => {
			const event = events.find(event => event["Event Key"] === row.event_key);
			if (!event) throw new Error(`Top event absent from public catalog: ${row.event_key}`);
			return { eventKey: row.event_key, title: event.Title, totalActions: row.total_actions };
		}),
	};
	await writeFile(process.env.RECAP_OUTPUT_PATH || "data/recap-2026.json", `${JSON.stringify(snapshot, null, 2)}\n`);
	console.log(`Verified recap: ${snapshot.catalog.events} listings, ${snapshot.pageViews} page views.`);
} finally {
	await sql.end({ timeout: 5 });
}
