import { spawnSync } from "node:child_process";
import { existsSync, unlinkSync, writeFileSync } from "node:fs";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3100";
const parsedBaseUrl = new URL(baseUrl);
const port = parsedBaseUrl.port || (parsedBaseUrl.protocol === "https:" ? "443" : "80");
const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const e2eEnvPath = ".env.production.local";
const env = {
	...process.env,
	ARCHIVE_MODE: "false",
	AUTH_SECRET: "e2e-auth-secret-0123456789-abcdefghijklmnopqrstuvwxyz",
	DATABASE_URL: "",
	DATA_MODE: "test",
	NEXT_PUBLIC_ANALYTICS_ENABLED: "false",
	NEXT_PUBLIC_ARCHIVE_MODE: "false",
	NEXT_PUBLIC_SITE_URL: baseUrl,
	OOOC_FETE_LIVE_APP: "true",
	PLAYWRIGHT_BASE_URL: baseUrl,
	PORT: port,
	POSTGRES_URL: "",
};

const run = (args) => {
	const result = spawnSync(command, args, {
		cwd: process.cwd(),
		env,
		stdio: "inherit",
	});
	if (result.error) throw result.error;
	if (result.status !== 0) {
		const error = new Error(`Command failed: ${command} ${args.join(" ")}`);
		error.exitCode = result.status ?? 1;
		throw error;
	}
};

const playwrightArgs = process.argv
	.slice(2)
	.filter((argument, index) => !(index === 0 && argument === "--"));

if (existsSync(e2eEnvPath)) {
	throw new Error(`${e2eEnvPath} already exists; refusing to overwrite it`);
}

writeFileSync(
	e2eEnvPath,
	[
		"ARCHIVE_MODE=false",
		`AUTH_SECRET=${env.AUTH_SECRET}`,
		"DATABASE_URL=",
		"DATA_MODE=test",
		"NEXT_PUBLIC_ANALYTICS_ENABLED=false",
		"NEXT_PUBLIC_ARCHIVE_MODE=false",
		`NEXT_PUBLIC_SITE_URL=${baseUrl}`,
		"OOOC_FETE_LIVE_APP=true",
		"POSTGRES_URL=",
		"",
	].join("\n"),
);

try {
	run(["build"]);
	run(["exec", "playwright", "test", ...playwrightArgs]);
} catch (error) {
	process.exitCode = error?.exitCode ?? 1;
	throw error;
} finally {
	unlinkSync(e2eEnvPath);
}
