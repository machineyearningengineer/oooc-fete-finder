import EventSharePage, {
	type EventSharePageProps,
} from "@/app/event/[eventKey]/[[...slug]]/event-share-page";
import { isArchiveModeEnabled } from "@/lib/archive-mode";
import { notFound } from "next/navigation";

// Live-season event pages, served at /event/* through the rewrite in proxy.ts.
// Rendered per request: the page shows ticket-exchange counts and submission
// settings, which change minute to minute during the season.
export const dynamic = "force-dynamic";

export { generateMetadata } from "@/app/event/[eventKey]/[[...slug]]/event-share-page";

export default function LiveEventSharePage(props: EventSharePageProps) {
	// Archive builds serve the prerendered /event route; no second copy.
	if (isArchiveModeEnabled()) notFound();
	return <EventSharePage {...props} />;
}
