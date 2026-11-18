import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  command,
  mapSecrets,
  protectEncryptionKey,
  recover,
  selectSecrets,
} from "./secrets-recover.mjs";

test("isolates project records and maps worker database credentials without management tokens", () => {
  const values = selectSecrets(
    [
      { projectId: "other", key: "WEB", value: "wrong" },
      { projectId: "p", key: "WORKER", value: "right" },
      { projectId: "p", key: "MANAGEMENT", value: "excluded" },
    ],
    "p",
    ["WORKER"],
  );
  assert.deepEqual(mapSecrets(values, { DATABASE_URL: "WORKER" }), { DATABASE_URL: "right" });
});
test("missing, duplicate and placeholder credentials fail closed", () => {
  for (const rows of [
    [],
    [{ projectId: "p", key: "A", value: "PENDING_ROTATION" }],
    [
      { projectId: "p", key: "A", value: "one" },
      { projectId: "p", key: "A", value: "two" },
    ],
  ])
    assert.throws(() => selectSecrets(rows, "p", ["A"]));
});
test("encryption root cannot be silently bootstrapped or rotated", () => {
  assert.throws(() => protectEncryptionKey({}, { DATA_ENCRYPTION_KEY: "new" }));
  assert.throws(() =>
    protectEncryptionKey({ DATA_ENCRYPTION_KEY: "old" }, { DATA_ENCRYPTION_KEY: "new" }),
  );
  protectEncryptionKey(
    { DATA_ENCRYPTION_KEY: "same" },
    { DATA_ENCRYPTION_KEY: "same", AUTH_SECRET: "new-signing" },
  );
});
test("subprocess failures never echo secret stdout/stderr", () => {
  assert.throws(
    () => command(process.execPath, ["-e", "console.error('TOP_SECRET');process.exit(1)"]),
    (error) => !error.message.includes("TOP_SECRET"),
  );
});
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "recovery-test-"));
  const config = {
    project: "p",
    environment: "e",
    vaultProject: "v",
    services: [
      {
        id: "web",
        name: "web",
        deploy: true,
        health: "https://example.test/health",
        secrets: { AUTH_SECRET: "AUTH_SECRET" },
      },
      { id: "cron", name: "cron", deploy: false, secrets: { CRON_SECRET: "CRON_SECRET" } },
    ],
  };
  const values = { AUTH_SECRET: "replacement-auth", CRON_SECRET: "replacement-cron" };
  const current = { web: {}, cron: {} };
  const mutations = [];
  let deployment = "original";
  let generation = 0;
  let rejectRedeploy = false;
  const options = {
    stateFile: join(directory, "state.json"),
    report: () => {},
    delay: async () => {},
    run: (binary, args) => {
      if (binary === "bws")
        return JSON.stringify(
          Object.entries(values).map(([key, value]) => ({ projectId: "v", key, value })),
        );
      assert.equal(binary, "railway");
      assert.equal(args[0], "ssh");
      return JSON.stringify({
        AUTH_SECRET: createHash("sha256").update(values.AUTH_SECRET).digest("hex"),
      });
    },
    readVariables: (_config, service) => current[service.id],
    readStatus: () => ({ deploymentId: deployment }),
    railwayApi: (query, vars) => {
      if (query.includes("variableCollectionUpsert")) {
        mutations.push("variables");
        current[vars.input.serviceId] = vars.input.variables;
        assert.equal(vars.input.skipDeploys, true);
        assert.equal(vars.input.replace, false);
        return { variableCollectionUpsert: true };
      }
      if (query.includes("deploymentRedeploy")) {
        mutations.push("redeploy");
        if (rejectRedeploy) throw new Error("uncertain network failure");
        deployment = `replacement-${++generation}`;
        return { deploymentRedeploy: { id: deployment } };
      }
      return { deployment: { id: "replacement", status: "SUCCESS" } };
    },
    fetchHealth: async () => ({ ok: true }),
  };
  return {
    config,
    options,
    mutations,
    current,
    values,
    reject: () => {
      rejectRedeploy = true;
    },
    cleanup: () => rmSync(directory, { recursive: true, force: true }),
  };
}
test("dry run reads every consumer but performs no writes or deploys", async () => {
  const f = fixture();
  try {
    await recover(f.config, f.options);
    assert.deepEqual(f.mutations, []);
  } finally {
    f.cleanup();
  }
});
test("incomplete vault fails before any consumer is mutated", async () => {
  const f = fixture();
  delete f.values.CRON_SECRET;
  try {
    await assert.rejects(recover(f.config, { ...f.options, apply: true }));
    assert.deepEqual(f.mutations, []);
  } finally {
    f.cleanup();
  }
});
test("apply installs all consumers, deploys only web, verifies exact runtime and writes no credentials to journal", async () => {
  const f = fixture();
  try {
    await recover(f.config, { ...f.options, apply: true });
    assert.deepEqual(f.mutations, ["variables", "variables", "redeploy"]);
    const saved = readFileSync(f.options.stateFile, "utf8");
    assert.equal(JSON.parse(saved).complete, true);
    assert.ok(!saved.includes(f.values.AUTH_SECRET));
    assert.ok(!saved.includes(f.values.CRON_SECRET));
  } finally {
    f.cleanup();
  }
});
test("uncertain redeploy is never automatically repeated on retry", async () => {
  const f = fixture();
  f.reject();
  try {
    await assert.rejects(recover(f.config, { ...f.options, apply: true }));
    await assert.rejects(recover(f.config, { ...f.options, apply: true }), /outcome unknown/);
    assert.equal(f.mutations.filter((entry) => entry === "redeploy").length, 1);
  } finally {
    f.cleanup();
  }
});
test("healthy public route cannot hide stale runtime credentials", async () => {
  const f = fixture();
  const run = f.options.run;
  f.options.run = (binary, args, ...rest) =>
    binary === "railway" ? "{}" : run(binary, args, ...rest);
  try {
    await assert.rejects(recover(f.config, { ...f.options, apply: true }), /running deployment/);
  } finally {
    f.cleanup();
  }
});

test("signing recovery cannot reach images without the encryption split", async () => {
  const f = fixture();
  f.config.services[0].cryptoContract = true;
  f.options.fetchHealth = async () => ({ ok: true, json: async () => ({}) });
  try {
    await assert.rejects(recover(f.config, { ...f.options, apply: true }), /encryption-separation/);
    assert.deepEqual(f.mutations, []);
  } finally {
    f.cleanup();
  }
});
test("a completed recovery permits a later independent rotation", async () => {
  const f = fixture();
  try {
    await recover(f.config, { ...f.options, apply: true });
    f.values.AUTH_SECRET = "later-auth-replacement";
    await recover(f.config, { ...f.options, apply: true });
    assert.equal(f.mutations.filter((entry) => entry === "redeploy").length, 2);
  } finally {
    f.cleanup();
  }
});

test("a legacy worker blocks recovery before any secrets are installed", async () => {
  const f = fixture();
  f.config.services[0].internalHealth = true;
  try {
    await assert.rejects(recover(f.config, { ...f.options, apply: true }), /encryption-separation/);
    assert.deepEqual(f.mutations, []);
  } finally {
    f.cleanup();
  }
});
