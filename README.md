# Diet Watch Japan / 参議院・国会ウォッチ

Static visualization of the Japanese House of Councillors' plenary voting
records and other activities. Data is pre-scraped CSV from
[GovWatchJapan/congressdata](https://github.com/GovWatchJapan/congressdata)
and bundled into the site at build time (see `public/data/votes_*.csv`).

## Update the data

Drop new `votes_{session}.csv` files into `public/data/`, then add the
session number to `AVAILABLE_SESSIONS` in `src/lib/data.ts`.

## Local dev

```bash
bun install
bun run dev
```

## Build for GitHub Pages

```bash
# Project page  https://<user>.github.io/<repo>/
BASE_PATH=/<repo>/ bun run build:static

# User / org root page  https://<user>.github.io/
bun run build:static
```

The static SPA is emitted to `dist/`. The included GitHub Actions workflow
(`.github/workflows/deploy.yml`) builds and publishes automatically on push
to `main`.
