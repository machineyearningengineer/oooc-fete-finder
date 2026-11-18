import { isArchiveModeEnabled } from "@/lib/archive-mode";
import { buildSiteUrl } from "@/lib/site-url";
import {
	generateOGMetadata,
	generatePresetOGImage,
} from "@/lib/social/og-utils";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { HomeEventsSection } from "../HomeEventsSection";
import { HomeEventsSectionLoading } from "../HomeEventsSectionLoading";
import { HomeHeader } from "../HomeHeader";

export const revalidate = 1800;
export const metadata = generateOGMetadata({
	title: "Paris Music Events: The 2026 Archive",
	description:
		"Browse OOOC’s archived Fête de la Musique 2026 Paris events, music genres and map. Events have ended; save favourites and build a route on your device.",
	ogImageUrl: generatePresetOGImage("archive"),
	url: buildSiteUrl("/archive"),
});

export default function ArchivePage() {
	if (!isArchiveModeEnabled()) redirect("/");
	return (
		<div className="ooo-site-shell">
			<HomeHeader />
			<main
				id="main-content"
				className="container mx-auto max-w-[92rem] px-4 py-8 sm:px-6"
				tabIndex={-1}
			>
				<header className="ooo-page-intro">
					<p className="ooo-page-eyebrow">
						Out Of Office Collective / Field notes
					</p>
					<h1>Paris, kept close.</h1>
					<p className="text-base text-muted-foreground">
						2026 archive · Events have ended. Plans are saved on this device.{" "}
						<a className="underline" href="/">
							Read the story ↗
						</a>
					</p>
				</header>
				<Suspense fallback={<HomeEventsSectionLoading />}>
					<HomeEventsSection mapLoadStrategy="expand" />
				</Suspense>
			</main>
		</div>
	);
}
