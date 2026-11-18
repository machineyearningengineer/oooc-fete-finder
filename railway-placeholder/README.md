# Railway Placeholder

This directory retains the previous static off-season fallback: HTML and CSS
served by Caddy. It is no longer the production deployment. The root Dockerfile
now builds the 2026 recap and database-free Next.js archive.

See [archive operations](../docs/operations/archive-mode.md) for the active
configuration, snapshot provenance, verification, and live-season restoration.

To preview the old fallback locally:

```bash
cd railway-placeholder/public
python3 -m http.server 8090
```

Restoring this fallback requires a dedicated Caddy Dockerfile that copies this
folder's public assets and uses its Caddyfile; `docker build ..` now builds the
archive app instead.
