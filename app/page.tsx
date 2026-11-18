import { OffseasonPlaceholder } from "@/components/OffseasonPlaceholder";
import { ArchiveReveal } from "@/features/recap/ArchiveExperience";
import { RecapStory } from "@/features/recap/RecapStory";
import { isArchiveModeEnabled } from "@/lib/archive-mode";
import { isOffseasonPlaceholderEnabled } from "@/lib/offseason-placeholder";
import { buildSiteUrl } from "@/lib/site-url";
import {
	generateOGMetadata,
	generatePresetOGImage,
} from "@/lib/social/og-utils";
import { connection } from "next/server";
import { Suspense } from "react";
import { HomeEventsSection } from "./HomeEventsSection";
import { HomeEventsSectionLoading } from "./HomeEventsSectionLoading";
import { HomeHeader } from "./HomeHeader";

// Archive: prerendered and revalidated every 30 minutes. Live season: the
// connection() call in Home makes the build mark this route dynamic, so it
// renders per request. Account state stays in the client either way.
export const revalidate = 1800;
export const metadata = isArchiveModeEnabled()
	? generateOGMetadata({
			title: "Fête de la Musique 2026: Paris Recap & Guide",
			description:
				"Relive Fête de la Musique 2026 in Paris with Out Of Office Collective: the weekend’s music, memories and numbers, plus the archived event guide.",
			ogImageUrl: generatePresetOGImage("recap"),
			url: buildSiteUrl("/"),
		})
	: {};
const homeMapLoadStrategy = "expand";

export default async function Home() {
	if (!isArchiveModeEnabled()) await connection();
	if (isOffseasonPlaceholderEnabled()) {
		return <OffseasonPlaceholder />;
	}

	const finder = (
		<div className="ooo-site-shell">
			<HomeHeader />
			<main
				id="main-content"
				className="container mx-auto w-full max-w-[92rem] px-4 py-8 sm:px-6 lg:px-10 2xl:px-14 2xl:max-w-[104rem]"
				tabIndex={-1}
			>
				<h1 className="sr-only">
					Fete Finder: curated Paris music events by Out Of Office Collective
				</h1>
				<Suspense fallback={<HomeEventsSectionLoading />}>
					<HomeEventsSection mapLoadStrategy={homeMapLoadStrategy} />
				</Suspense>
			</main>
		</div>
	);
	return isArchiveModeEnabled() ? (
		<>
			<RecapStory />
			<ArchiveReveal>{finder}</ArchiveReveal>
		</>
	) : (
		finder
	);
}
