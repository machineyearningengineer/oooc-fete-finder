import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "./cache-control";

export const DEFAULT_JSON_BODY_LIMIT_BYTES = 32 * 1024;
export const EVENT_SUBMISSION_JSON_BODY_LIMIT_BYTES = 64 * 1024;
export const EVENT_SHEET_JSON_BODY_LIMIT_BYTES = 256 * 1024;
export const EVENT_SHEET_OCR_JSON_BODY_LIMIT_BYTES = 16 * 1024 * 1024;
export const TRACKING_JSON_BODY_LIMIT_BYTES = 16 * 1024;

const getHeaderHost = (headers: Pick<Headers, "get">): string =>
	(headers.get("x-forwarded-host") || headers.get("host") || "")
		.trim()
		.toLowerCase();

const getRequestProtocol = (request: Request): string => {
	const protocol = (
		request.headers.get("x-forwarded-proto") ||
		request.headers.get("x-forwarded-protocol") ||
		new URL(request.url).protocol.replace(":", "")
	)
		.split(",")[0]
		?.trim()
		.toLowerCase();
	return protocol === "http" ? "http" : "https";
};

export const isSameOriginRequest = (request: Request): boolean => {
	const secFetchSite = request.headers
		.get("sec-fetch-site")
		?.trim()
		.toLowerCase();
	if (secFetchSite === "cross-site") return false;

	const origin = request.headers.get("origin")?.trim();
	if (!origin) return true;

	const host = getHeaderHost(request.headers);
	if (!host) return false;

	try {
		const parsedOrigin = new URL(origin);
		return (
			parsedOrigin.host.toLowerCase() === host &&
			parsedOrigin.protocol.replace(":", "") === getRequestProtocol(request)
		);
	} catch {
		return false;
	}
};

export const isJsonContentType = (request: Request): boolean => {
	const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
	return contentType.includes("application/json");
};

export const isWithinBodySizeLimit = (
	request: Request,
	limitBytes: number,
): boolean => {
	const contentLength = request.headers.get("content-length");
	if (!contentLength) return true;
	const parsedLength = Number.parseInt(contentLength, 10);
	return Number.isFinite(parsedLength) && parsedLength <= limitBytes;
};

export class RequestBodyTooLargeError extends Error {
	constructor() {
		super("Request body too large");
		this.name = "RequestBodyTooLargeError";
	}
}

export const readTextBodyWithinLimit = async (
	request: Request,
	limitBytes: number,
): Promise<string> => {
	if (!isWithinBodySizeLimit(request, limitBytes)) {
		throw new RequestBodyTooLargeError();
	}
	if (!request.body) return "";

	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let totalBytes = 0;
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		totalBytes += value.byteLength;
		if (totalBytes > limitBytes) {
			await reader.cancel();
			throw new RequestBodyTooLargeError();
		}
		chunks.push(value);
	}

	const body = new Uint8Array(totalBytes);
	let offset = 0;
	for (const chunk of chunks) {
		body.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return new TextDecoder().decode(body);
};

export const readJsonBodyWithinLimit = async (
	request: Request,
	limitBytes: number,
): Promise<unknown> =>
	JSON.parse(await readTextBodyWithinLimit(request, limitBytes));

export const acceptedNoStoreResponse = (): NextResponse =>
	NextResponse.json(
		{ success: true },
		{ status: 202, headers: NO_STORE_HEADERS },
	);

export const forbiddenNoStoreResponse = (): NextResponse =>
	NextResponse.json(
		{ success: false, error: "Forbidden" },
		{ status: 403, headers: NO_STORE_HEADERS },
	);

export const tooLargeNoStoreResponse = (): NextResponse =>
	NextResponse.json(
		{ success: false, error: "Request body too large" },
		{ status: 413, headers: NO_STORE_HEADERS },
	);
