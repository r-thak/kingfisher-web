FROM oven/bun:1.1 AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM oven/bun:1.1-slim

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY server.js ./

EXPOSE 3000

CMD ["bun", "run", "server.js"]
