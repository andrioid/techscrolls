FROM debian:12-slim as base
RUN apt-get update \
    && apt-get -y install \
    sudo curl git gpg ca-certificates build-essential \
    && rm -rf /var/lig/apt/lists/* \
    && useradd -u 1000 -m app && mkdir /mise && chown -R 1000:1000 /mise && chown 1000 /usr/local/bin

# Friends dont let friends run Docker w. root
USER 1000:1000

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
ENV MISE_DATA_DIR="/mise"
ENV MISE_CONFIG_DIR="/mise"
ENV MISE_CACHE_DIR="/mise/cache"
ENV MISE_INSTALL_PATH="/usr/local/bin/mise"
ENV PATH="/mise/shims:$PATH"
# ENV MISE_VERSION="..."


RUN curl https://mise.run | sh

WORKDIR /home/app
RUN mise use --verbose -g bun@1.1.45 node@lts

# Deps
FROM base as deps
USER 1000:1000
RUN mkdir -p /tmp/dev
COPY bun.lockb package.json /tmp/dev/
COPY apps/web/package.json /tmp/dev/apps/web/package.json
COPY apps/jetstream/package.json /tmp/dev/apps/jetstream/package.json
COPY apps/classifier/package.json /tmp/dev/apps/classifier/package.json
COPY apps/worker/package.json /tmp/dev/apps/worker/package.json
COPY packages/atproto/package.json /tmp/dev/packages/atproto/package.json
COPY packages/db/package.json /tmp/dev/packages/db/package.json
COPY packages/jetstream/package.json /tmp/dev/packages/jetstream/package.json
COPY packages/tfjs/package.json /tmp/dev/packages/tfjs/package.json

# NOTE: If access denied below, then remove the bun lockfile, install and try gain
RUN cd /tmp/dev
RUN cd /tmp/dev && bun install --frozen-lockfile
#RUN npm rebuild @tensorflow/tfjs-node --build-from-source


# Build what needs building
FROM base AS project
COPY --from=deps --chown=1000:1000  /tmp/dev/node_modules node_modules
COPY --chown=1000:1000 . .
# Fail on type errors
RUN bun run verify:types
RUN bun run build

# Service
FROM project as service

EXPOSE 3000/tcp

ENV HOST=0.0.0.0
ENV PORT=3000

ENTRYPOINT [ "bun", "run" ]
CMD [ "web" ]