# Secret recovery

Bitwarden Secrets Manager is the source of truth. `ops/secrets-recovery.json` lists exact production consumers and allowlisted runtime variable names. Keep the manifest current when adding a service or credential. Management API tokens and the Bitwarden access token are never installed in the apps.

After rotating/revoking provider credentials and saving replacements in the app's Bitwarden project, run from this repository:

```sh
pnpm secrets:recover          # read-only preflight
pnpm secrets:recover --apply  # install, redeploy existing artifacts, verify running values and health
```

The dependency-free equivalent is `node ops/secrets-recover.mjs --apply`; this avoids a package-manager dependency refresh during an incident.

Prerequisites: authenticated `railway` CLI; `bws` on PATH; a short-lived, read-only `BWS_ACCESS_TOKEN` scoped to this app's Secrets Manager project in the local process environment. Supply it through your password manager or a hidden local prompt; never paste it into chat, command arguments, shell history or a checked-in env file. Unset it after use. Milk & Henny also needs authenticated `cf` CLI access to its email relay Worker; the command pins the account from the manifest. No package dependencies are added.

This command **installs saved replacements**. Provider issuance/revocation still happens at Stripe, Cloudflare and Google. Application passwords, signing keys, cron capabilities and passcodes must likewise have fresh replacements saved before recovery. Review provider access and unexpected charges separately. A provider key cannot safely be “rotated” by changing a local string.

For a database password change, alter the actual database role first using a trusted administrative connection, update the matching Bitwarden URLs/password, reconcile Railway's Postgres service password/URL configuration, and terminate old authenticated sessions when appropriate. The app recovery command deliberately does not perform database role changes or schema/data migrations. A configuration readback alone does not prove the database accepts the replacement.

The command completes all vault/consumer preflights before writes, preserves unrelated variables and schedules, stages variables without automatic deploys, then redeploys the current artifacts. It never uploads the local working tree. It checks the **new** deployment ID, reads runtime SHA-256 digests over authenticated SSH in private memory, and checks the public readiness route. Milk & Henny also checks the worker’s internal readiness endpoint before and after recovery. Values, digests and raw provider errors are never printed or persisted. This is readiness verification; test the relevant payment/upload/OCR/email flow before declaring an incident closed.

A private journal at `~/.local/state/app-secret-recovery/<Railway-project-id>.json` contains only deployment IDs and progress. A pending deployment resumes on the next invocation. If the redeploy response was lost, the command stops instead of creating a duplicate. Inspect Railway and record its resulting deployment ID in the journal, or remove that service entry **only after proving no deployment was created**. A completed journal starts a new recovery on the next invocation. If a deployment fails, fix forward with the replacements; Railway rollback can restore exposed variables. Never use rollback as a credential recovery shortcut.

There is no atomic transaction across Railway and Cloudflare. A failure can leave some consumers updated and others pending; repair the failure and rerun with the same saved replacements. Expect temporary login invalidation, rejected webhook deliveries and unavailable dependent features during cutover. Never generate a second set just because a deploy is queued. Run one recovery process per app at a time. A sibling `.lock` directory enforces this; after a killed process, inspect Railway and the journal before removing that stale lock.

Verify the workflow itself with `pnpm secrets:recover:test`. These tests use fake providers and cover preflight failures, mapping isolation, encryption-root protection, uncertain deploys, runtime mismatch and suppressed subprocess output.

## Fête Finder consumers

While archive mode is live, the web service holds no vault secrets: the Postgres client, admin, OCR, geocoding, cron, revalidation and ticket-bot paths are all disabled, and each fails closed when its secret is unset. Its `AUTH_SECRET` is a random throwaway that satisfies env validation and is stored nowhere, because archive mode issues no sessions. The manifest therefore sets web `secrets` to `{}` with `deploy: false`; `liveSeasonSecrets` records the mapping to restore and is ignored by the recovery command. To restore the live season, move `liveSeasonSecrets` back to `secrets`, set `deploy: true`, and save a fresh `AUTH_SECRET` in Bitwarden first.

The manifest updates the four existing cron callers. Cron services receive only `CRON_SECRET`; this command does not enable schedules or launch cron jobs. Archive mode, current database mode and all other configuration remain unchanged. The current public check is `/archive`, so success does not prove inactive database/OCR/geocoding features work. Before restoring active mode, validate actual database authentication, an authorised OCR request, geocoding and an admin sign-in. Dedicated Fête Finder Gemini and Geocoding credentials must stay separate from Receipts and development credentials.

Keep spend caps, quotas and API restrictions on the provider projects. Provider billing alerts alone are not a guaranteed spending limit.
