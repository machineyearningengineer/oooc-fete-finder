export const extractClientIpFromHeaders = (
	headers: Pick<Headers, "get">,
): string => {
	const realIp = headers.get("x-real-ip");
	if (realIp?.trim()) {
		return realIp.trim();
	}

	const forwardedFor = headers.get("x-forwarded-for");
	if (forwardedFor?.trim()) {
		return forwardedFor.split(",")[0]?.trim() || "unknown";
	}

	return "unknown";
};
