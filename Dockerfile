FROM oven/bun:latest AS build

WORKDIR /app

# Install git so vite can embed the real commit hash at build time.
RUN apt-get update && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Allow overriding the commit info via build args; otherwise git rev-parse is used.
ARG COMMIT_HASH=dev
ARG COMMIT_SHORT=dev
ENV COMMIT_HASH=$COMMIT_HASH
ENV COMMIT_SHORT=$COMMIT_SHORT

RUN bun run build

FROM oven/bun:slim

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY server.js ./

EXPOSE 5903

CMD ["bun", "run", "server.js"]