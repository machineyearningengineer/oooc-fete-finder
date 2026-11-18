import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function selectSecrets(records, project, names) {
  const selected = {};
  for (const name of names) {
    const matches = records.filter((r) => r.projectId === project && r.key === name);
    if (
      matches.length !== 1 ||
      typeof matches[0].value !== "string" ||
      !matches[0].value.trim() ||
      /^(PENDING_|REPLACE_ME|CHANGEME)/i.test(matches[0].value)
    ) {
      throw new Error(`Vault entry missing, duplicated or unfinished: ${name}`);
    }
    selected[name] = matches[0].value;
  }
  return selected;
}

export function mapSecrets(values, mapping) {
  return Object.fromEntries(
    Object.entries(mapping).map(([runtime, vault]) => [runtime, values[vault]]),
  );
}

export function protectEncryptionKey(current, desired) {
  if (desired.DATA_ENCRYPTION_KEY && current.DATA_ENCRYPTION_KEY !== desired.DATA_ENCRYPTION_KEY) {
    throw new Error(
      "DATA_ENCRYPTION_KEY differs or is uninstalled. Follow the encryption bootstrap/migration runbook; routine recovery cannot replace it.",
    );
  }
}

const digest = (value) => createHash("sha256").update(value).digest("hex");

// Capture all child output: provider errors can echo request bodies or credentials.
export function command(binary, args, input, { vault = false, account } = {}) {
  const env = { ...process.env };
  if (!vault) delete env.BWS_ACCESS_TOKEN;
  if (account) env.CLOUDFLARE_ACCOUNT_ID = account;
  const result = spawnSync(binary, args, {
    input,
    env,
    encoding: "utf8",
    timeout: 90_000,
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error || result.status !== 0)
    throw new Error(
      `${binary} command failed; output suppressed to protect credentials. Check login, service status and permissions.`,
    );
  return result.stdout;
}

function api(query, variables) {
  let response;
  try {
    response = JSON.parse(
      command(
        "railway",
        ["api", query, "--variables", "@-", "--compact"],
        JSON.stringify(variables),
      ),
    );
  } catch {
    throw new Error("Railway API failed; output suppressed.");
  }
  if (response.errors || !response.data)
    throw new Error("Railway rejected the request; no provider output logged.");
  return response.data;
}

function variablesFor(config, service) {
  return api(
    "query($p:String!,$e:String!,$s:String!){variables(projectId:$p,environmentId:$e,serviceId:$s,unrendered:false)}",
    { p: config.project, e: config.environment, s: service.id },
  ).variables;
}
function statusFor(config, service) {
  return JSON.parse(
    command("railway", [
      "service",
      "status",
      "-p",
      config.project,
      "-e",
      config.environment,
      "-s",
      service.id,
      "--json",
    ]),
  );
}

function runtimeState(config, service, names, run) {
  const probe = `const c=require("node:crypto");(async()=>{const result=Object.fromEntries(${JSON.stringify(names)}.map(k=>[k,c.createHash("sha256").update(process.env[k]||"").digest("hex")]));${service.internalHealth ? 'const r=await fetch("http://127.0.0.1:"+(process.env.PORT||3000)+"/api/health",{redirect:"error",signal:AbortSignal.timeout(15000)});const h=await r.json();result.__ready=r.ok&&h.ok===true&&h.cryptoKeyContract==="separate-v1";' : ""}console.log(JSON.stringify(result));})().catch(()=>process.exit(1))`;
  let runtime;
  try {
    runtime = JSON.parse(
      run("railway", [
        "ssh",
        "-p",
        config.project,
        "-e",
        config.environment,
        "-s",
        service.id,
        "--",
        "node",
        "-e",
        probe,
      ]),
    );
  } catch {
    throw new Error(`${service.name}: runtime verification unavailable; recovery is not verified.`);
  }
  return runtime;
}

export async function recover(
  config,
  {
    apply = false,
    stateFile,
    run = command,
    railwayApi = api,
    readVariables = variablesFor,
    readStatus = statusFor,
    fetchHealth = fetch,
    delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    report = console.log,
  } = {},
) {
  const names = [
    ...new Set([
      ...config.services.flatMap((s) => Object.values(s.secrets)),
      ...(config.cloudflare ? [config.cloudflare.vaultKey] : []),
    ]),
  ];
  let records;
  try {
    records = JSON.parse(
      run("bws", ["secret", "list", config.vaultProject], undefined, { vault: true }),
    );
  } catch {
    throw new Error(
      "Unable to read Bitwarden. Supply a scoped BWS_ACCESS_TOKEN in your local environment.",
    );
  }
  if (!Array.isArray(records)) throw new Error("Unexpected Bitwarden response.");
  const vault = selectSecrets(records, config.vaultProject, names);
  // Complete every preflight before making any change.
  const plans = config.services.map((service) => {
    const desired = mapSecrets(vault, service.secrets);
    const current = readVariables(config, service);
    protectEncryptionKey(current, desired);
    const status = readStatus(config, service);
    if (service.deploy && !status.deploymentId)
      throw new Error(`${service.name}: no existing deployment to recover.`);
    return {
      service,
      desired,
      status,
      changed: Object.keys(desired).filter((key) => current[key] !== desired[key]),
    };
  });
  if (config.cloudflare)
    run("cf", ["workers", "secrets", "list", "--worker", config.cloudflare.worker], undefined, {
      account: config.cloudflare.account,
    });
  for (const plan of plans)
    report(
      `${plan.service.name}: ${plan.changed.length} variable changes; ${plan.service.deploy ? "redeploy and verify runtime" : "configuration only; schedule remains unchanged"}.`,
    );
  if (!apply) {
    report(
      "Dry run complete. Use --apply after provider replacements are saved and old credentials revoked.",
    );
    return;
  }
  // Prevent signing changes from reaching any image that still uses AUTH for encryption.
  for (const { service } of plans.filter((plan) => plan.service.cryptoContract)) {
    const response = await fetchHealth(service.health, {
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok || (await response.json()).cryptoKeyContract !== "separate-v1") {
      throw new Error(
        `${service.name}: deploy the encryption-separation release before applying recovery.`,
      );
    }
  }
  for (const { service } of plans.filter((plan) => plan.service.internalHealth)) {
    if (runtimeState(config, service, [], run).__ready !== true) {
      throw new Error(
        `${service.name}: deploy and verify the encryption-separation release first.`,
      );
    }
  }
  if (!stateFile) throw new Error("A private recovery state path is required.");
  let state;
  try {
    state = JSON.parse(readFileSync(stateFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT")
      throw new Error("Recovery journal is unreadable; inspect it before retrying.", {
        cause: error,
      });
  }
  if (state && state.project !== config.project)
    throw new Error("Recovery journal belongs to another project.");
  if (state?.complete) state = undefined;
  state ??= { project: config.project, services: {} };
  const save = () => {
    mkdirSync(dirname(stateFile), { recursive: true, mode: 0o700 });
    writeFileSync(stateFile, JSON.stringify(state, null, 2), { mode: 0o600 });
  };
  // Never write secret values, hashes or provider output into the journal.
  for (const { service, desired } of plans) {
    const result = railwayApi(
      "mutation($input:VariableCollectionUpsertInput!){variableCollectionUpsert(input:$input)}",
      {
        input: {
          projectId: config.project,
          environmentId: config.environment,
          serviceId: service.id,
          variables: desired,
          replace: false,
          skipDeploys: true,
        },
      },
    );
    if (result.variableCollectionUpsert !== true)
      throw new Error(`${service.name}: variable installation was not acknowledged.`);
    const stored = readVariables(config, service);
    if (Object.entries(desired).some(([key, value]) => stored[key] !== value))
      throw new Error(`${service.name}: configuration readback differs.`);
  }
  if (config.cloudflare) {
    run(
      "cf",
      [
        "workers",
        "secrets",
        "update",
        config.cloudflare.runtimeKey,
        "--worker",
        config.cloudflare.worker,
        "--type",
        "secret_text",
        "--text",
        "@/dev/stdin",
      ],
      vault[config.cloudflare.vaultKey],
      { account: config.cloudflare.account },
    );
    report("Cloudflare relay secret installed.");
  }
  for (const { service, desired, status } of plans.filter((p) => p.service.deploy)) {
    let entry = state.services[service.id];
    if (!entry) {
      // Save intent before the network mutation. An ambiguous failure must never trigger a duplicate redeploy.
      entry = state.services[service.id] = { previous: status.deploymentId, phase: "requesting" };
      save();
      const result = railwayApi(
        "mutation($id:String!,$previous:Boolean){deploymentRedeploy(id:$id,usePreviousImageTag:$previous){id status}}",
        { id: status.deploymentId, previous: true },
      );
      if (!result.deploymentRedeploy?.id || result.deploymentRedeploy.id === status.deploymentId)
        throw new Error(
          `${service.name}: new deployment ID not acknowledged; reconcile the journal before retrying.`,
        );
      entry.id = result.deploymentRedeploy.id;
      entry.phase = "deploying";
      save();
    }
    if (!entry.id)
      throw new Error(
        `${service.name}: previous redeploy outcome unknown. Inspect Railway; record the resulting deployment ID in the journal, or remove the entry only after confirming no deploy was created.`,
      );
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      const deployment = railwayApi("query($id:String!){deployment(id:$id){id status}}", {
        id: entry.id,
      }).deployment;
      if (deployment?.status === "SUCCESS") {
        ready = true;
        break;
      }
      if (
        !deployment ||
        ["FAILED", "CRASHED", "REMOVED", "SKIPPED", "CANCELLED"].includes(deployment.status)
      )
        throw new Error(
          `${service.name}: replacement deployment failed. Keep replacements; do not roll back exposed variables.`,
        );
      await delay(10_000);
    }
    if (!ready)
      throw new Error(
        `${service.name}: deployment still pending. Retry this command to resume the same deployment.`,
      );
    if (readStatus(config, service).deploymentId !== entry.id)
      throw new Error(
        `${service.name}: another deployment became current; inspect before continuing.`,
      );
    // Names are manifest constants. Only private captured digests cross SSH, never secret values.
    const runtime = runtimeState(config, service, Object.keys(desired), run);
    if (Object.entries(desired).some(([key, value]) => runtime[key] !== digest(value)))
      throw new Error(`${service.name}: running deployment still has different credentials.`);
    if (service.internalHealth && runtime.__ready !== true)
      throw new Error(`${service.name}: internal readiness failed.`);
    if (service.health) {
      const response = await fetchHealth(service.health, {
        redirect: "error",
        signal: AbortSignal.timeout(20_000),
        headers: { "Cache-Control": "no-cache" },
      });
      if (!response.ok) throw new Error(`${service.name}: health check failed.`);
      if (service.cryptoContract && (await response.json()).cryptoKeyContract !== "separate-v1")
        throw new Error(`${service.name}: encryption separation is not deployed.`);
    }
    entry.phase = "verified";
    save();
    report(`${service.name}: replacement deployment and runtime verified.`);
  }
  state.complete = true;
  save();
  report(
    "Recovery verified. Provider functionality and billing/audit review remain in the runbook.",
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const args = process.argv.slice(2).filter((arg) => arg !== "--");
    if (args.some((arg) => arg !== "--apply"))
      throw new Error("Usage: pnpm secrets:recover [--apply]");
    const config = JSON.parse(
      readFileSync(new URL("./secrets-recovery.json", import.meta.url), "utf8"),
    );
    const stateFile = join(homedir(), ".local/state/app-secret-recovery", `${config.project}.json`);
    const lock = `${stateFile}.lock`;
    if (args.includes("--apply")) {
      mkdirSync(dirname(stateFile), { recursive: true, mode: 0o700 });
      try {
        mkdirSync(lock, { mode: 0o700 });
      } catch {
        throw new Error(
          "Recovery journal is locked by another invocation; inspect it before removing a stale lock.",
        );
      }
    }
    try {
      await recover(config, {
        apply: args.includes("--apply"),
        stateFile,
      });
    } finally {
      if (args.includes("--apply")) rmSync(lock, { recursive: true });
    }
  } catch (error) {
    // Only deliberately constructed messages leave this process. Never expose an arbitrary child/network exception.
    const safe =
      /^(Vault entry|DATA_ENCRYPTION_KEY|Unable to read Bitwarden|Unexpected Bitwarden|Recovery journal|A private recovery|Usage:|Railway |cf command|bws command)/.test(
        error.message,
      ) || /^[a-z-]+: /.test(error.message);
    console.error(
      safe
        ? error.message
        : "Recovery interrupted; provider output suppressed. Inspect service status and retry using the journal.",
    );
    process.exitCode = 1;
  }
}
