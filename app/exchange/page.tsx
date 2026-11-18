import Header from "@/components/Header";
import { getPublicSlidingBannerSettingsCached } from "@/features/site-settings/queries";
import { getTicketExchangeSession } from "@/features/ticket-exchange/auth";
import { TicketExchangeShell } from "@/features/ticket-exchange/components/TicketExchangeShell";
import { getTicketExchangePageModel } from "@/features/ticket-exchange/service";
import { isArchiveModeEnabled } from "@/lib/archive-mode";
import { buildSiteUrl } from "@/lib/site-url";
import {
	generateOGMetadata,
	generatePresetOGImage,
} from "@/lib/social/og-utils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateOGMetadata({
	title: "Ticket Exchange",
	noIndex: isArchiveModeEnabled(),
	description:
		"Find people selling or looking for tickets linked to Fete Finder events. OOOC only connects people; trades happen off-platform.",
	ogImageUrl: generatePresetOGImage("exchange"),
	url: buildSiteUrl("/exchange"),
});

export default async function ExchangePage() {
	const [session, bannerSettings] = await Promise.all([
		getTicketExchangeSession(),
		getPublicSlidingBannerSettingsCached(),
	]);
	const { data } = await getTicketExchangePageModel({
		session,
	});

	return (
		<div className="ooo-site-shell">
			<Header bannerSettings={bannerSettings} />
			<main
				id="main-content"
				className="min-h-screen bg-background"
				tabIndex={-1}
			>
				<TicketExchangeShell initialData={data} />
			</main>
		</div>
	);
}
