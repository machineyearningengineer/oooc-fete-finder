# Off-season holding page

The root [Dockerfile](../Dockerfile) serves this folder's HTML and CSS through Caddy. It does not run Next.js, client JavaScript, or Postgres.

The [Caddyfile](Caddyfile) serves `/`, `/styles.css`, and `/favicon.svg`; other paths redirect to `/`. This is a holding page, separate from the application's [archive mode](../docs/operations/archive-mode.md).

## Preview and build

From the repository root:

```sh
python3 -m http.server 8090 --bind 127.0.0.1 --directory railway-placeholder/public
docker build -t oooc-fete-placeholder .
```

The local Python server previews the files; only the Caddy build exercises the redirect policy. The root [railway.json](../railway.json) selects the Docker deployment.

## Seasonal changes

Before stopping the full app, confirm the domain points to the intended service, export a database backup, and check whether any other service still needs Postgres. Pause maintenance cron jobs when the live app is not using the database.

Restoring the full app requires its build configuration, Postgres, and the live-mode flags. Merely restarting the holding-page container will not restore the finder.
