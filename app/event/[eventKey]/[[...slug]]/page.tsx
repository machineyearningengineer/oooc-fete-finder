import { getLiveEvents } from "@/features/data-management/runtime-service";
import { isArchiveModeEnabled } from "@/lib/archive-mode";

// Archive: every event page is prerendered at build and revalidated.
// Live season never reaches this route: proxy.ts rewrites /event/* to
// app/live-event, which renders per request so ticket-exchange counts and
// submission settings stay fresh. Next fixes a route's rendering mode at build,
// and generateStaticParams makes this one static, so live needs its own route.
export const revalidate = 1800;

export async function generateStaticParams() {
	if (!isArchiveModeEnabled()) return [];
	const { data } = await getLiveEvents({ includeEngagementProjection: false });
	return data.flatMap((event) => [
		{ eventKey: event.eventKey, slug: [] },
		{ eventKey: event.eventKey, slug: [event.slug] },
	]);
}

export { default, generateMetadata } from "./event-share-page";
