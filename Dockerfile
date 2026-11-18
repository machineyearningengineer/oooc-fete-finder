FROM node:26-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@11.17.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 DATA_MODE=local ARCHIVE_MODE=true NEXT_PUBLIC_ARCHIVE_MODE=true NEXT_PUBLIC_ANALYTICS_ENABLED=false OOOC_FETE_LIVE_APP=true
ENV NEXT_PUBLIC_SITE_URL=https://fete.outofofficecollective.co.uk
# Archive auth endpoints are disabled; no production credentials enter the build.
RUN AUTH_SECRET=archive-build-placeholder-no-auth-available pnpm build

FROM node:26-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=8080
ENV DATA_MODE=local ARCHIVE_MODE=true NEXT_PUBLIC_ARCHIVE_MODE=true NEXT_PUBLIC_ANALYTICS_ENABLED=false OOOC_FETE_LIVE_APP=true
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/data ./data
USER node
EXPOSE 8080
CMD ["node", "server.js"]
