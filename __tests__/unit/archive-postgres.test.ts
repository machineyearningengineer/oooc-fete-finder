import { afterEach, expect, it, vi } from "vitest";
vi.mock("@/lib/config/env", () => ({
	env: {
		NODE_ENV: "production",
		DATABASE_URL: "postgresql://unused:unused@127.0.0.1:1/unused",
	},
}));
import {
	getPostgresClient,
	isPostgresConfigured,
} from "@/lib/platform/postgres/postgres-client";
afterEach(() => vi.unstubAllEnvs());
it("never creates a database client in archive mode even with retained credentials", () => {
	vi.stubEnv("ARCHIVE_MODE", "true");
	expect(isPostgresConfigured()).toBe(false);
	expect(getPostgresClient()).toBeNull();
});
