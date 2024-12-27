FROM oven/bun:1 AS base
WORKDIR /usr/src/app

FROM base AS deps
RUN mkdir -p /tmp/dev
COPY bun.lockb package.json /tmp/dev/
COPY apps/web/package.json /tmp/dev/apps/web/package.json
COPY apps/jetstream/package.json /tmp/dev/apps/jetstream/package.json
COPY apps/classifier/package.json /tmp/dev/apps/classifier/package.json
COPY packages/atproto/package.json /tmp/dev/packages/atproto/package.json
COPY packages/db/package.json /tmp/dev/packages/db/package.json

RUN cd /tmp/dev && bun install --frozen-lockfile

# Astro build
FROM base AS project
COPY --from=deps /tmp/dev/node_modules node_modules
COPY . .
RUN bun run build

# Service
FROM project as service

USER bun
EXPOSE 3000/tcp

ENV HOST=0.0.0.0
ENV PORT=3000

ENTRYPOINT [ "bun", "run" ]
CMD [ "web" ]