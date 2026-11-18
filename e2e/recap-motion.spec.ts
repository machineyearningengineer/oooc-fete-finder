import { expect, test } from "@playwright/test";

test.skip(
	process.env.ARCHIVE_MODE !== "true",
	"Requires an archive-mode build (ARCHIVE_MODE=true).",
);

test.use({
	viewport: { width: 390, height: 700 },
	isMobile: true,
	hasTouch: true,
});

test("mobile counters wait for visibility and the chart survives a scroll touch", async ({
	page,
}) => {
	await page.goto("/", { waitUntil: "domcontentloaded" });
	const number = page.locator("[data-roll]").first();
	await expect(number).not.toHaveClass(/is-rolling/);
	await number.scrollIntoViewIfNeeded();
	await expect(number).toHaveClass(/is-rolling/);
	const chart = page.locator(".chart-scrubber");
	await chart.scrollIntoViewIfNeeded();
	await expect(page.getByRole("button", { name: /FRI 19/ })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
	await page
		.getByRole("slider")
		.dispatchEvent("pointerdown", { pointerType: "touch" });
	await expect(page.getByRole("button", { name: /SAT 20/ })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
	await expect(page.getByRole("button", { name: /SUN 21/ })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
	await page.getByRole("button", { name: /MON 22/ }).click();
	await expect(page.getByRole("slider")).toHaveValue("3");
	await expect(page.locator(".recap-skip svg")).toBeVisible();
	await expect(page.locator(".recap")).not.toContainText(/[↗✳]/);
});

test("reduced motion keeps final numbers and Sunday without autoplay", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/", { waitUntil: "domcontentloaded" });
	await page.locator(".chart-scrubber").scrollIntoViewIfNeeded();
	await expect(page.getByRole("button", { name: /SUN 21/ })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
	await expect(page.locator("[data-roll].is-rolling")).toHaveCount(0);
	await page.getByRole("button", { name: /FRI 19/ }).click();
	await expect(page.getByRole("slider")).toHaveValue("0");
});
