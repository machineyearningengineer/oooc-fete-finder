import {
	isJsonContentType,
	isSameOriginRequest,
	isWithinBodySizeLimit,
	readJsonBodyWithinLimit,
} from "@/lib/http/request-security";
import { describe, expect, it } from "vitest";

describe("request security helpers", () => {
	it("allows same-origin browser requests", () => {
		const request = new Request("http://localhost:3000/api/analytics/event", {
			method: "POST",
			headers: {
				host: "localhost:3000",
				origin: "http://localhost:3000",
				"sec-fetch-site": "same-origin",
			},
		});

		expect(isSameOriginRequest(request)).toBe(true);
	});

	it("rejects cross-site browser requests", () => {
		const request = new Request("https://fete.example/api/analytics/event", {
			method: "POST",
			headers: {
				host: "fete.example",
				origin: "https://attacker.example",
				"sec-fetch-site": "cross-site",
			},
		});

		expect(isSameOriginRequest(request)).toBe(false);
	});

	it("allows server-to-server requests without an origin", () => {
		const request = new Request("https://fete.example/api/revalidate/deploy", {
			method: "POST",
			headers: {
				host: "fete.example",
			},
		});

		expect(isSameOriginRequest(request)).toBe(true);
	});

	it("validates JSON content types and content-length limits", () => {
		const request = new Request("https://fete.example/api/analytics/event", {
			method: "POST",
			headers: {
				"content-type": "application/json; charset=utf-8",
				"content-length": "128",
			},
		});

		expect(isJsonContentType(request)).toBe(true);
		expect(isWithinBodySizeLimit(request, 256)).toBe(true);
		expect(isWithinBodySizeLimit(request, 64)).toBe(false);
	});

	it("enforces the limit while reading a body without content-length", async () => {
		const smallRequest = new Request(
			"https://fete.example/api/analytics/event",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ payload: "bounded" }),
			},
		);
		const largeRequest = new Request(
			"https://fete.example/api/analytics/event",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ payload: "x".repeat(300) }),
			},
		);

		await expect(readJsonBodyWithinLimit(smallRequest, 256)).resolves.toEqual({
			payload: "bounded",
		});
		await expect(readJsonBodyWithinLimit(largeRequest, 256)).rejects.toThrow(
			"Request body too large",
		);
	});
});
