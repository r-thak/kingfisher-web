FROM oven/bun:1.1 AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Build argument for API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN bun run build

FROM oven/bun:1.1-slim

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY server.js ./

EXPOSE 3000

CMD ["bun", "run", "server.js"]
