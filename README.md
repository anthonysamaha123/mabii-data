# Mabii — Lebanese economic databank

> Independent. Sourced. Comparable. Free.

Mabii pools data on the Lebanese economy from multilaterals, central banks, ministries, customs, markets, and bank research desks into a single comparable catalogue — with a source reference on every number, the source's report date, and Mabii's fetch timestamp.

**Mabii does not editorialise.** It does not generate narrative. It does not pick a winner when sources disagree. It joins data; you read it. Every page on the site is a deterministic SQL-style query, reproducible from its URL. No AI sits between you and the numbers.

This is the v0 public scaffold. See [SPEC.md](./SPEC.md) for the full architecture (v1.3) and [PLAN.md](./PLAN.md) for the phased build plan.

## What's in v0

- **Faceted catalogue** — indicators tagged across topic, subtopic, frequency, currency basis, geography level, stock/flow. Subject browsing is `WHERE facet = …`, nothing more.
- **Two real T1 connectors** — World Bank WDI and IMF WEO, pulled directly from public APIs, raw payloads stored verbatim and content-hashed.
- **Bilingual site** — English and Arabic, full RTL.
- **Six indicators** — GDP (nominal USD), GDP real growth, CPI inflation, current account % GDP, gross government debt % GDP, population.
- **Open API** — `/api/v1/indicators`, `/api/v1/observations`, `/api/v1/sources`, `/api/v1/topics`. Every response carries provenance.
- **Multi-source unification view** — every indicator detail page shows values from every source side-by-side with a deterministic divergence stat.
- **CSV downloads** with full provenance columns.

## Running locally

```sh
npm install
npm run fetch:all   # populate data/canonical/ from World Bank + IMF
npm run dev         # http://localhost:3000
```

## Repository layout

```
src/app/[lang]/        bilingual public site (en, ar)
src/app/api/v1/        open API routes
src/components/        institutional UI primitives (table, badges, sparkline)
src/data/types.ts      canonical data model (mirror of SPEC §6)
src/data/catalog/      sources, indicators, facet vocabulary — reviewed code, not user input
src/data/store.ts      file-backed query layer (graduates to Postgres in Phase 2)
src/lib/i18n/          dictionaries + locale resolution
scripts/connectors/    T1 connectors (more added each phase per PLAN.md)
data/raw/              immutable, content-hashed payloads as fetched
data/canonical/        per-indicator observation files
proxy.ts               locale routing
```

## What this is *not*

- An AI-generated dashboard. No model runs in the request path; per-query AI cost is zero. AI is used only at onboarding (proposing facet tags, schema mappings, bilingual metadata) and is always human-approved before going live.
- A news site, a blog, or a commentary platform. Mabii pools data; users read it; the only narrative Mabii produces is the per-indicator methodology page.
- A surveillance database. The schema enforces aggregates-not-individuals.

## License

Mabii-curated metadata and code under [MIT](./LICENSE). Source data retains its original publisher's licensing — see each source page on the site.

## Contributing

This is an early-phase project. The most useful contributions right now are:
- Reviewing indicator definitions, bilingual metadata, or methodology notes for accuracy.
- Reporting source-data issues (a wrong number, a missing series, an outdated methodology note).
- Suggesting facets to add to the published vocabulary.

Open an issue before sending a PR for non-trivial changes.

## Contact

`hello@mabii.org`
