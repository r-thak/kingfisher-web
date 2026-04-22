FROM oven/bun:latest AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM oven/bun:slim

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY server.js ./

EXPOSE 5903

CMD ["bun", "run", "server.js"]