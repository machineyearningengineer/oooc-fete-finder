import { defineRailway, github, project, service } from "railway/iac";
// Railway settings for the production web service (replaces railway.json).
// Railway does not read this file on deploy. Change settings with:
//   npm ci --prefix .railway && railway config plan && railway config apply
// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "oooc-fete-finder";
export default defineRailway(() => {
	const ooocFeteFinder = service("oooc-fete-finder", {
		source: github("machineyearningengineer/oooc-fete-finder", {
			branch: "main",
			checkSuites: false,
		}),
		build: {
			buildEnvironment: "V3",
			builder: "DOCKERFILE",
			dockerfilePath: "Dockerfile",
			watchPatterns: [
				"Dockerfile",
				".dockerignore",
				"railway.json",
				"package.json",
				"pnpm-lock.yaml",
				"pnpm-workspace.yaml",
				"next.config.ts",
				"app/**",
				"components/**",
				"features/**",
				"hooks/**",
				"lib/**",
				"data/**",
				"public/**",
				"proxy.ts",
				"instrumentation*",
			],
		},
		healthcheck: "/archive",
		healthcheckTimeout: 90,
		replicas: { "europe-west4-drams3a": 1 },
		deploy: {
			limitOverride: { containers: { cpu: 2, memoryBytes: 1000000000 } },
			// Restart on failure (Railway's default policy, so it is not declared:
			// Railway does not store defaults and the plan would never settle).
			restartPolicyMaxRetries: 3,
			sleepApplication: true,
		},
		domains: ["fete.outofofficecollective.co.uk"],
	});

	return project("oooc-fete-finder", {
		variables: { managed: false },
		resources: [ooocFeteFinder],
	});
});
