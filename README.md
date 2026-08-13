# Kingfisher

The source for Kingfisher, a web interface for visualizing the data provided by the Kingfisher API [[source]](https://github.com/r-thak/kingfisher-api).

Inspired by [Madgrades](https://github.com/Madgrades/madgrades.com).

## Development

```sh
bun install
bun run dev
```

The dev server proxies `/v1` requests to a local instance of the [Kingfisher API](https://github.com/r-thak/kingfisher-api). Set `VITE_API_URL` to point at a different API instance if needed.

## Building

```sh
bun run build
```

## Docker

```sh
docker compose up --build
```
