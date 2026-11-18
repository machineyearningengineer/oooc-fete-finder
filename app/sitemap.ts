import {
	OFFICIAL_FETE_PLAN,
	getOfficialFetePlanHref,
} from "@/features/plans/official-plan-config";
import { isArchiveModeEnabled } from "@/lib/archive-mode";
import { buildSiteUrl } from "@/lib/site-url";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const archive = isArchiveModeEnabled();

	const entries: MetadataRoute.Sitemap = [
		{
			url: buildSiteUrl("/"),
			changeFrequency: "weekly",
			priority: 0.9,
		},
		...(archive
			? [
					{
						url: buildSiteUrl("/archive"),
						changeFrequency: "yearly" as const,
						priority: 0.8,
					},
				]
			: []),
		{
			url: buildSiteUrl("/how-it-works"),
			changeFrequency: "weekly",
			priority: 0.8,
		},
		{
			url: buildSiteUrl("/submit-event"),
			changeFrequency: "weekly",
			priority: 0.7,
		},
		{
			url: buildSiteUrl("/feature-event"),
			changeFrequency: "weekly",
			priority: 0.7,
		},
		{
			url: buildSiteUrl("/exchange"),
			changeFrequency: "weekly",
			priority: 0.6,
		},
		{
			url: buildSiteUrl("/plans"),
			changeFrequency: "weekly",
			priority: 0.6,
		},
		...(OFFICIAL_FETE_PLAN.active
			? [
					{
						url: buildSiteUrl(getOfficialFetePlanHref()),
						changeFrequency: "yearly" as const,
						priority: 0.5,
					},
				]
			: []),
		{
			url: buildSiteUrl("/privacy"),
			changeFrequency: "yearly",
			priority: 0.2,
		},
		{
			url: buildSiteUrl("/terms"),
			changeFrequency: "yearly",
			priority: 0.2,
		},
	];
	return entries.filter(
		(entry) =>
			!archive ||
			!["/exchange", "/submit-event"].some(
				(path) => entry.url === buildSiteUrl(path),
			),
	);
}
