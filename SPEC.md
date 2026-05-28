# Mabii — Architecture & Product Specification
**Mabii** · *Market Analytics & Business Intelligence Infrastructure*
*The independent data and accountability backbone for the Lebanese economy.*

**Version:** 1.3 (concept architecture)
**Status:** Pre-build blueprint
**v1.3 changes (over v1.2):**
- Adds the **Pool, Don't Opine** principle (§2.12) — the system joins data, it does not compose views or assert relationships.
- Formalizes a **Faceted Catalog** (§6) and an explicit **Query Model** (§7) so subject browsing is a deterministic SQL join, not an AI-generated narrative.
- Tightens **AI scope** (§5): AI is used only at *onboarding* (schema mapping, tagging, bilingual metadata, same-indicator matching), never in the user-facing request path. Per-query AI cost = 0.
- Adds **Website Use Cases** (§12) and **Website Layout & Visual Standard** (§13).

**v1 definition:** **Mabii − T3** — the full architecture, runnable for ~the price of a domain, with the single paid tier (T3 licensed/market data) deferred and replaced by free substitutes (see §4, §10).

**North star:** *Accuracy and reliability above everything.* Mabii's only durable moat is being **right, current, and verifiable** — clear tables, a source reference on every number, and visible freshness. Breadth and features are secondary to trust (see §1.5).

**Scope:** Product definition, the accuracy/reliability standard, end-to-end system architecture, layer-by-layer technical description, AI placement, data model, query model, the two-arm structure, tech stack, build roadmap, risks, website use cases, and website layout.

---

## 1. Product Description

### 1.1 The problem Mabii exists to solve
Lebanon's economy suffers less from a lack of data than from data that is **scattered, lagged, PDF-locked, contradictory, and partly suppressed by design**. National accounts run years behind, the CPI rests on a ~2004–05 consumption basket, and a major rating agency (Fitch) withdrew coverage entirely citing insufficient data. The absence of credible information is not a measurement footnote — it is an active economic cost: it shows up as the sovereign risk premium, deters investment and credit, and protects the information asymmetry that enables rent extraction.

Yet the raw material exists. Multilateral APIs, bank research desks, customs and port records, central-bank balance sheets, satellite imagery, and market prices all carry usable signal. **No one has pooled, triangulated, and published it as one credible, current, cited source.**

### 1.2 What Mabii is
Mabii is a **data pipeline and public platform** that ingests Lebanese economic data from many heterogeneous sources, normalizes and tags it, and serves it through a free public library and a paid API. Its core product is not the raw data (which it does not own) but the **curation, faceted-catalog, provenance, and trust-labeling layer** that makes scattered data legible. **Mabii pools data, it never composes narrative** (see §2.12, §7). **v1 ("Mabii − T3") runs entirely on free sources and free-tier infrastructure** — the architecture is unchanged; only the one paid tier is deferred.

Mabii is structured as **two firewalled arms**:
- **The Data Arm** — a neutral, technical, non-partisan data institute. Runs on trust; designed so government, telcos, multilaterals, and the public will cooperate with it and believe it. This is the public good and the revenue engine.
- **The Accountability Arm** — an investigative/transparency function (money-flow analysis, asset tracing, OSINT). Inherently adversarial. Kept structurally, legally, and operationally separate so its work cannot contaminate the Data Arm's credibility.

### 1.3 Strategic thesis
Mabii does not try to *force* transparency head-on. It becomes the **credible alternative data backbone** that the existing leverage machinery — IMF conditionality, FATF action plan, reconstruction donors, investors, the diaspora — needs verified data to act on. By making credible data exist, it makes opacity costly and erodes the information monopoly that sustains the status quo. The path is incremental: **aggregate → synthesize → originate → plug into leverage.**

### 1.4 Who pays (sustainability in one paragraph)
Grants from open-data/governance funders and a diaspora seed campaign get Mabii born. **Earned revenue from the Data Arm** (API subscriptions, custom analysis for investors, banks, researchers, risk/diligence firms) plus diaspora recurring donors keep it alive and independent. The Accountability Arm is funded only by Data Arm surplus and mission-locked philanthropy — never by anyone it might investigate. Every dollar's source is disclosed, because for Mabii funding *is* part of credibility. **Note:** money is *not* the binding constraint on v1 — three of four data tiers are free, so the build's real cost is engineering time and disciplined maintenance, not capital (see §10).

### 1.5 The real product: accuracy and reliability
Everything else in this document is plumbing in service of one thing: **being incredibly accurate, current, and verifiable.** Mabii is free to access and free to run — so it cannot compete on price, and it has no exclusive data. Its *only* moat is trust, and trust is earned through relentless correctness, clear presentation, and a source reference on every single number. A platform that is occasionally wrong, or right but unverifiable, has no reason to exist. Concretely, this means a set of non-negotiable commitments — the **Accuracy & Reliability Standard** — that the architecture enforces:

1. **A source reference on every data point.** No number appears anywhere — dashboard, table, API, export — without a one-click link to its exact source, the source's report date (vintage), and Mabii's fetch timestamp. "Trust us" is banned; "here's where it came from" is the rule.
2. **Clear, consistent, comparable tables.** Uniform structure across all series — value, unit, currency (with the FX basis when converted), period, frequency, source, vintage, trust label, last-updated, next-expected-update. The same columns mean the same thing everywhere, so a reader can compare without being misled.
3. **Cross-source verification before publish.** Where a figure exists in more than one source, it is checked against the others; agreement raises confidence, disagreement is surfaced (never hidden). Nothing reaches the public layer without passing deterministic validation gates (see §3, §5).
4. **Visible freshness, per series.** Each indicator shows its own "last updated" and "next expected update." A single site-wide date would be a lie because sources move at wildly different speeds.
5. **Honest staleness and known-limitation flags.** A series openly states when its source lags or its method is dated (e.g., "CPI weights date to 2004–05"). Admitting what is *not* reliable is itself a reliability feature.
6. **Versioned corrections with a public changelog.** Numbers are never silently edited. A correction is a new version, with the old value and the reason preserved and visible. Errors handled transparently *build* trust; hidden errors destroy it.
7. **Clear trust labeling.** Every value is tagged *official / proxy / modeled / reference*, so users never mistake a satellite estimate for a central-bank figure.
8. **Published methodology and measured error rate.** How each indicator is sourced and derived is documented publicly, and AI-assisted/derived figures are sample-audited against ground truth so Mabii can state — and improve — its own accuracy.

These eight commitments are the product. The pipeline, the AI layer, and the data model below exist to make them automatic and unbreakable rather than aspirational.

---

## 2. Design Principles (values encoded as architecture)
These are not features bolted on; they are structural constraints the system must enforce.

1. **Accuracy and verifiability first.** Being right and provable beats being broad or fast. Every other principle serves this one (see §1.5).
2. **Glass house.** Funding, governance, methodology, and every number's provenance are public by default.
3. **A source reference on every number.** Nothing is published without a one-click lineage to the exact source, location, vintage, and fetch timestamp.
4. **Raw is immutable; published is versioned.** Source data is never overwritten. Corrections are new versions with full history and a public changelog — never silent edits.
5. **Triangulation over selection.** When sources disagree, surface the discrepancy; do not silently pick a winner.
6. **Trust labeling.** Every series is labeled by tier: *official / proxy / modeled / reference*.
7. **Honest staleness.** A series openly states when its source lags. Admitting unreliability builds more trust than false freshness.
8. **Aggregates, not individuals.** The schema structurally stores patterns, not people. No profiling, no biometric/facial data. Privacy by design.
9. **AI proposes, code disposes.** AI handles interpretation; deterministic code validates and owns the final published number. AI is never the source of truth.
10. **Two-arm firewall.** Data and Accountability arms run on separate infrastructure with separate access; a breach of one cannot compromise the other.
11. **Boring, proven tech, runnable for free.** A modular monolith on well-understood, free-tier-friendly tools beats fashionable complexity at this scale.
12. **Pool, don't opine.** The system joins data; it never composes a view, asserts a relationship, or generates narrative. Subject browsing is a SQL join over a faceted catalog (see §7) — the *user* composes meaning, Mabii supplies rows with provenance. This makes Mabii cheap to run, deterministic to query, and impossible to accuse of editorial bias.

---

## 3. End-to-End Architecture (overview)

```
                          ┌─────────────────────────────────────────────────┐
                          │                 SOURCE UNIVERSE                   │
                          │  APIs · Scraped sites · PDFs · Satellite · Market │
                          │  · Gov/Intel reference · Digital/social signals   │
                          └───────────────────────┬─────────────────────────┘
                                                  │
        ┌─────────────────────────────────────────┴─────────────────────────────────────────┐
        │              ONBOARDING WORKBENCH  (one-time per source/indicator)                  │
        │              AI proposes — humans approve — then never touched at runtime           │
        │   • Schema mapping (new source → canonical observation fields)                      │
        │   • Faceted tagging (topic, subtopic, sector, frequency, currency_basis, …)         │
        │   • Bilingual metadata (AR + EN canonical name + definition)                        │
        │   • Same-indicator matching across sources                                          │
        │   Outputs: rows in `indicator`, `indicator_source_mapping`, `indicator_facet`        │
        └──────────────────────────────────────────────────────────────────────────────────────┘
                                                  │
   ┌──────────────────────────────────────────────▼──────────────────────────────────────────────┐
   │ LAYER 1 — INGESTION (deterministic, scheduled per source's clock)                              │
   │   API connectors · Scrapers (change-detecting) · PDF extraction (AI-assisted, queued)          │
   │   Geospatial/raster processors                                                                 │
   │   Orchestrator (Dagster/Prefect) — per-source cadence, isolation, freshness alerts             │
   └──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                                  │  (every fetch written verbatim to landing first)
   ┌──────────────────────────────────────────────▼──────────────────────────────────────────────┐
   │ LAYER 2 — STORAGE (three tiers, never collapsed)                                               │
   │   RAW (immutable, timestamped)                                                                 │
   │     → CANONICAL (observation + indicator + indicator_facet + indicator_source_mapping)         │
   │       → PUBLISHED (curated, versioned, trust-labeled)                                          │
   └──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                                  │
   ┌──────────────────────────────────────────────▼──────────────────────────────────────────────┐
   │ LAYER 3 — PROCESSING (deterministic; no AI in this layer's hot path)                            │
   │   Reconciliation math (divergence detection) · Derived indicators (price index, trade-mirror,    │
   │   nowcasts) · Validation gates · Human review queue                                              │
   └──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                                  │
   ┌──────────────────────────────────────────────▼──────────────────────────────────────────────┐
   │ LAYER 4 — SERVING (NO AI in the request path · per-query AI cost = 0)                          │
   │   Faceted query  →  SQL JOIN  →  raw rows with provenance                                       │
   │   Public website (institutional layout, bilingual AR/EN · §13)                                  │
   │   Open API (freemium · provenance carried in every response)                                    │
   │   Bulk exports (CSV / JSON / SDMX · provenance per row)                                         │
   └───────────────────────────────────────────────────────────────────────────────────────────────┘

   CROSS-CUTTING:  Monitoring/observability · Security · Privacy-by-design · Governance-in-code
   FIREWALL:       Data Arm  ‖  Accountability Arm   (separate infra, separate access)
```

**Flow in one sentence:** messy sources are mapped/tagged once at onboarding (AI proposes, humans approve), then ingested on each source's own clock, stored raw-immutable, normalized into a canonical observation + facet model, validated by deterministic processing, and served via pure SQL queries to a faceted website and a faceted API — with provenance attached at every step and *no AI between the user and the data.*

---

## 4. Layer-by-Layer Description

### Layer 0 — The Source Universe
Sources are organized into five tiers by accessibility and trust. (Full source catalog is a separate living document; this is the structure.)

| Tier | Nature | Examples | Pull method | Trust label |
|------|--------|----------|-------------|-------------|
| **T1 — Open APIs** | Reliable spine | World Bank, IMF, FRED, UN Comtrade, HDX, UNCTAD, WorldPop, VIIRS night-lights | API (auto) | Official |
| **T2 — Scrape / PDF** | Differentiator | Byblos, BLOMINVEST, Credit Libanais, Bankmed, BDL, CAS, Min. of Finance, ABL, Customs, BSE, Port of Beirut, IDAL | Scrape + PDF parse | Official / proxy |
| **T3 — Manual / licensed** *(DEFERRED in v1)* | Risk & forecast | S&P, Moody's, EIU, BMI/Fitch Solutions, Oxford Economics, IIF, AMF, Eurobond/FX feeds | License / manual | Official |
| **T4 — Reference / intel** | Structural context | CIA World Factbook, US State Dept, USAID, ESCWA | Scrape / manual | Reference (often stale) |
| **T5 — Digital / social** | High-frequency edge | Meta/Google ad-audience, GDELT, e-commerce/fuel/rent scraping, flight & ship trackers | Scrape / API | Modeled / proxy |

**v1 = Mabii − T3 (free build).** T3 is the only paid tier, and it is deferred without real loss, because each item has a free substitute:
- *Forecasts (EIU/BMI/Oxford)* → **Mabii generates its own** from T1/T2 with published method — this is on-brand, not a downgrade.
- *Ratings (S&P/Moody's)* → **scrape the public rating-action press releases** (≈90% of the signal, free).
- *Regional stats (AMF/IIF)* → **free multilateral substitutes** (ESCWA, World Bank, IMF, UNCTAD).
- *Market data (Eurobond/FX)* → the one genuine gap; launch with **free indicative levels clearly labeled as indicative**, add a paid feed only when revenue justifies it. (FX is now largely stabilized, lowering the urgency.)

**Coverage reality:** the true universe is thousands of individual series (the World Bank API alone carries 1,000+ Lebanon indicators; Comtrade is every commodity × partner). The constraint is **selection, curation, and accuracy** — not availability and not money. v1 targets ~30–50 high-value indicators done impeccably, free, with a source reference on every one.

### Layer 1 — Ingestion (the highest-effort layer)
The most engineering-heavy layer, because sources are radically heterogeneous.

- **Connector framework.** Each source is a pluggable module implementing a standard interface: `fetch()`, `parse()`, `schedule`, `source_metadata`. New sources are added without touching the core.
- **Connector types:**
  - *API connectors* — deterministic, scheduled, mostly SDMX/JSON. The easy, reliable path. **No AI.**
  - *Scrapers* — isolated per-source so one failure never cascades; change-detection so re-parsing only happens when a page actually changes. **Highest maintenance risk.**
  - *PDF/document extraction* — the nastiest problem; layouts drift and break rule-based parsers. **AI-assisted** (vision models) with mandatory human-in-the-loop review for these.
  - *Geospatial/raster processors* — separate toolchain for satellite/night-lights.
- **Orchestrator** (Dagster / Prefect): runs each connector on **its own cadence** (the per-source clock), isolates failures, retries, and **alerts when a source goes stale or a scraper breaks**. Scraper rot is the #1 operational risk; the system must announce it, never silently serve stale data.
- **First action on every fetch:** write the raw payload to the landing zone verbatim, before any processing.

### Layer 2 — Storage (three tiers, never collapsed)
The single most important architectural decision for a trust project.

- **RAW / landing zone** — every fetch stored verbatim, immutable, timestamped. This is the audit trail and the proof behind every claim. Append-only; never overwritten.
- **CANONICAL / normalized layer** — all data reshaped into one consistent schema (see §6). This is where the hard modeling lives: reconciling geographies, **currencies (LBP vs USD — at which exchange rate?)**, units, base years, and methodologies into comparable observations, and where the **faceted catalog** (indicator + facet + source mapping tables) lives so subject queries are pure SQL joins. Storage: Postgres + a time-series extension (e.g., TimescaleDB) is sufficient; no exotic infrastructure needed at this scale.
- **PUBLISHED / serving layer** — the curated, triangulated, trust-labeled subset exposed publicly. **Versioned**: a correction is a new version with preserved history.

### Layer 3 — Processing (deterministic)
Ingestion and storage are commodity engineering. This layer enforces the accuracy standard.

- **Reconciliation math** — links competing observations of the same `indicator_id` from different `source_id`s, computes divergence statistics (range, max %), and surfaces the discrepancy. Does **not** pick a winner unless a deterministic, human-set rule says to (see §7).
- **Derived indicators** — Mabii's original outputs (each is its own indicator with `extraction_method = derived` and a published methodology):
  - *Scraped price index* — an independent, current alternative to the stale official CPI (potentially Mabii's single most valuable original product).
  - *Trade-mirror analysis* — compares partner-country Comtrade data against Lebanese figures to detect misinvoicing/illicit flows.
  - *Satellite/ad-audience population & activity estimates.*
  - *Composite nowcasts* from the high-frequency tier.
- **Data-quality & trust scoring** — automated freshness checks, outlier/anomaly detection (catches both bad scrapes and genuinely suspicious official numbers), and programmatic assignment of the *official/proxy/modeled* trust label.
- **Provenance tracking** — every published number carries machine-readable lineage back to its `raw_fetch` row.
- **Validation gates (deterministic)** — type/range/format checks, cross-checks against prior value and alternate sources, reconciliation math. **Nothing publishes that fails the gate.**
- **Human review queue** — low-confidence, out-of-range, or AI-extracted-but-unverified values route here, not to auto-publish.

### Layer 4 — Serving
The serving layer is where the Accuracy & Reliability Standard (§1.5) becomes visible to users. Presentation *is* part of correctness — a right number shown without its source or freshness is functionally untrustworthy. **No AI runs in the request path** — every page and API response is a deterministic SQL query (see §7), so latency is predictable, cost is bounded, and behavior is reproducible from URL alone.

- **Public website** — the free library; institutional layout (§13). Two primary surface types:
  - *Indicator detail pages* — every series rendered with the same columns (value · unit · currency/FX-basis · period · frequency · **source link** · vintage · trust label · last-updated · next-expected-update). Uniform structure so figures are genuinely comparable and never ambiguous.
  - *Faceted browse / subject pages* — pick subject/geography/frequency/source/etc. → SQL join → result table. The system pools matching rows; it does not narrate.
  - **A source reference on every number, everywhere** — one click from any value to its exact origin and dates. This is the single most important UI rule.
  - **Bilingual Arabic/English** is a real engineering requirement (RTL layout, bilingual metadata per series), not a nice-to-have.
- **API** — the earned-revenue engine; design **API-first** (the website is just one consumer). Every API response carries the same provenance and trust metadata as the UI — accuracy travels *with* the data, not just on the site. Freemium: public data open; premium (historical depth, higher rate limits, derived indicators, alerts) gated.
- **Open exports** — CSV / JSON / SDMX, each row carrying its source and trust label. Both a mission feature and a credibility signal that Mabii is not hoarding.
- **Public changelog & methodology pages** — corrections, revisions, and the per-indicator methodology are themselves published surfaces, not buried.

### Cross-cutting layers
- **Monitoring / observability** — pipeline health, source freshness, scraper status. *The pipeline is the product*, so it is heavily instrumented.
- **Security** — resilient hosting outside Lebanon, backups, no single point of failure; secrets management; source protection for the Accountability Arm.
- **Privacy by design** — aggregates-not-individuals enforced at the schema level, so Mabii *cannot* accidentally become a surveillance database.
- **Governance-in-code** — methodology published, changelogs automatic, corrections versioned.

---

## 5. The AI-Assisted Layer (placement and discipline)
**Reframe:** not an "AI orchestrator" — an **AI-*assisted* pipeline**, with AI confined to **onboarding** and a handful of well-bounded ingestion helpers. Deterministic orchestration, deterministic processing, and deterministic serving are the skeleton; AI is never in the user request path and never decides a published number.

### 5.1 Where AI is used (one-time-per-source or queued, never per-query)

**At onboarding (the heaviest leverage):**
1. **Schema mapping** — given a new source's JSON/CSV/PDF samples, propose the mapping to canonical observation fields. Human approves once; the connector then runs deterministically forever.
2. **Faceted tagging** — propose `topic`, `subtopic`, `sector`, `frequency`, `currency_basis`, etc. for each new indicator. Human approves. This is what makes the SQL-join query model (§7) work.
3. **Bilingual metadata** — draft canonical AR + EN names and definitions for every indicator. Human approves.
4. **Same-indicator matching across sources** — propose `indicator_source_mapping` rows ("WB code `NY.GDP.MKTP.CD` ≡ IMF code `NGDPD` ≡ canonical `mabii.macro.gdp_nominal_usd`"). Human approves once per pair.

**At ingestion (per fetch, queued — never blocking the read path):**
5. **PDF/document extraction** — vision models read source PDFs and emit structured proposals into the review queue. Strongest case for AI in Mabii.
6. **Scraper self-healing** — when HTML changes, re-identify the right element semantically; self-heal or alert with a diagnosis.
7. **Anomaly explanation** — draft "methodology change vs scrape error vs real event" for items the deterministic validator flags. Human adjudicates.

**Optional discovery helper (cheap, indexed once at startup):**
8. **Semantic search over the catalog** — embedding index over (indicator name + definition + facet values) to help users find *which deterministic facet to filter on*. Does not compose, does not interpret — only navigates the user to a faceted query.

### 5.2 Where AI is NOT used (hard rules)

- **The request path.** Every page render and API call is pure SQL. Per-query LLM cost = 0. Latency is database-bound, not model-bound.
- **Final published numbers.** Never. A plausible-looking hallucinated number is more dangerous than a missing one.
- **Composing views or narrating relationships.** Subject pages are SQL joins over the facet table. No "AI thinks these go together." No generated commentary, dashboards, or summaries. This is the §2.12 principle in execution.
- **Picking the "true" value when sources disagree.** Triangulation = math (range, divergence flag), not editorial.
- **Orchestration/scheduling.** Deterministic tools do this perfectly and predictably. No LLM in the control loop of *when/whether* data flows.

### 5.3 The hard rule — AI proposes, code disposes
```
AI extracts/interprets → emits a structured, confidence-scored proposal
                         WITH a citation to the exact source location
        ↓
Deterministic validation gate (type/range/cross-source/reconciliation)
        ↓
   pass → publish (tagged with provenance, incl. "AI-extracted" until sampled)
   fail / low-confidence → human review queue
        ↓
Periodic sample-audit of AI extractions against retained raw source
                         → measured, published error rate
```

AI is a fast, fallible research assistant whose work is always checked, always traceable, and never the source of truth. Provenance must **survive** the AI step — "the AI said so" is the opposite of a glass house. The economic consequence of this discipline: **per-user-query AI cost is zero**, because the AI's work happened once at onboarding and lives in the deterministic facet table thereafter.

---

## 6. Canonical Data Model

The canonical layer has two halves:
- The **observation half** — every measured number, with full provenance.
- The **catalog half** — the indicators themselves, their facets, and the mappings that say "this source's series ≡ that canonical indicator." This is what makes the query model in §7 work.

### 6.1 Observation (the data)

```
observation
-----------
id                BIGINT PK
indicator_id      FK → indicator(id)
geography_id      FK → geography(id)        -- country / governorate / district
period_start      DATE                       -- supports any frequency
period_end        DATE
frequency         ENUM(daily, weekly, monthly, quarterly, annual, irregular)
value             NUMERIC
unit              TEXT                        -- %, LBP, USD, tonnes, TEU, persons...
currency          TEXT NULL                   -- with explicit fx_basis when converted
fx_basis          TEXT NULL                   -- which rate/date used for conversion
source_id         FK → source(id)
raw_ref           FK → raw_fetch(id)          -- lineage to immutable raw payload
trust_label       ENUM(official, proxy, modeled, reference)
method_note       TEXT                        -- methodology / caveat (e.g. "CPI weights 2004-05")
extraction_method ENUM(api, scrape, pdf_ai, manual, derived)
confidence        NUMERIC NULL                -- for AI-extracted / modeled values
vintage           DATE                        -- when the source reported it
fetched_at        TIMESTAMP
version           INT                         -- published-layer versioning
superseded_by     FK NULL                     -- correction history
```

Two sources reporting the "same" thing are two `observation` rows sharing an `indicator_id` but differing in `source_id` and `value` — reconciliation math operates on exactly that.

### 6.2 Catalog (the facets — this is what makes raw pooling work)

```
indicator
---------
id                  BIGINT PK
code                TEXT UNIQUE   -- e.g. 'mabii.macro.gdp_nominal_usd'
name_en             TEXT
name_ar             TEXT
definition_en       TEXT
definition_ar       TEXT
default_unit        TEXT
primary_source_id   FK NULL → source(id)   -- optional: deterministic rule for "headline" value
notes_en            TEXT
notes_ar            TEXT
```

```
indicator_facet                              -- multi-dimensional tags; the query primitive
---------------
indicator_id        FK → indicator(id)
facet_type          ENUM(topic, subtopic, sector, frequency, currency_basis,
                         geography_level, stock_or_flow, methodology_family,
                         trust_tier, time_horizon, ...)
facet_value         TEXT          -- e.g. 'banking', 'solvency', 'private_sector',
                                  --      'quarterly', 'usd', 'governorate', 'stock'
proposed_by         TEXT          -- model id + version, or human
approved_by         TEXT NULL     -- user who approved
approved_at         TIMESTAMP NULL
PRIMARY KEY (indicator_id, facet_type, facet_value)
```

```
indicator_source_mapping                     -- "this source's series = this canonical indicator"
------------------------
indicator_id          FK → indicator(id)
source_id             FK → source(id)
source_native_code    TEXT         -- e.g. WB 'NY.GDP.MKTP.CD', IMF 'NGDPD'
mapping_status        ENUM(ai_proposed, human_approved, retired)
mapping_confidence    NUMERIC
proposed_by           TEXT
approved_by           TEXT NULL
approved_at           TIMESTAMP NULL
reconciliation_notes  TEXT         -- e.g. 'IMF fiscal-year adjusted to calendar'
comparability         ENUM(direct, after_conversion, directional_only)
```

Supporting tables: `source` (publisher, tier, licence, URL, release_calendar), `raw_fetch` (immutable payload + hash + timestamp + ETag), `geography`, `revision_log`, `facet_vocabulary` (the canonical list of allowed `facet_value`s per `facet_type` — versioned and published as part of the glass house).

### 6.3 Why the facet table is load-bearing

A user (human or machine) never asks "compose me a banking view." They ask:
> `WHERE facet (topic='banking' AND subtopic='solvency') AND facet (geography_level='country') AND facet (currency_basis='usd') AND frequency='quarterly'`

→ deterministic SQL join over `indicator_facet` → list of `indicator_id`s → join into `observation` → result table.

No interpretation, no per-query AI, no editorial. Just pooling.

The facet vocabulary is therefore the **highest-leverage design artifact** — it determines which questions the catalog can answer, and it is itself published, versioned, and reviewable.

---

## 7. Query Model — Raw Pooling, Not Interpretation

This section formalizes §2.12 ("Pool, don't opine") into a query contract.

### 7.1 The contract

1. **Every user-facing query is a pure SQL join.** The website, the API, the bulk exports — same path. No LLM call, no composition, no narrative.
2. **The output is rows, not opinions.** A query returns observations with provenance per row. The user (human or machine) decides what those rows mean.
3. **The composition is the `WHERE` clause.** "Subject browsing" is `WHERE facet = X AND facet = Y`. There is no other composition layer.
4. **Divergence is math, not editorial.** When multiple sources cover the same `indicator_id` × period, Mabii returns all of them, plus deterministic divergence statistics (range, max %, std). It does not declare a winner unless `indicator.primary_source_id` was set deterministically by a human at onboarding.
5. **Provenance travels with the data.** Every row, in every surface, carries `source_id` (link), `raw_ref` (link), `vintage`, `fetched_at`, `trust_label`, `extraction_method`. No exceptions.
6. **The facet vocabulary is finite and published.** Users can only ask questions the taxonomy supports — and the taxonomy is itself a public, versioned artifact (see §6.3 `facet_vocabulary`).

### 7.2 What this rules out (deliberately)

- AI-composed "topic dashboards" with generated commentary.
- A "Mabii consensus value" that quietly selects a winner across sources.
- Free-form "ask Mabii anything" search that returns generated answers.
- Charts or tables whose contents depend on a model's interpretation at request time.
- Any surface where the user cannot inspect the exact SQL that produced what they see.

### 7.3 What it preserves

- **Deterministic reproducibility.** Hitting the same URL next month returns the same rows (modulo new observations or versioned corrections, both of which are themselves auditable).
- **Zero per-query AI cost.** Mabii at scale costs database queries, not model tokens.
- **Sub-second latency.** Postgres + indexes, not an inference round-trip.
- **Audit-grade traceability.** Every value on the site maps to a `raw_fetch` row and a deterministic query — no "the model said so" gap.

### 7.4 The optional discovery helper (the one carveout)

The search box may use semantic search over the facet vocabulary to translate user phrases ("remittances") into candidate `(facet_type, facet_value)` pairs. The result is *a suggested faceted query*, which then runs deterministically. The helper navigates; it never composes. If even this feels like editorial overreach, the facet picker UI alone is sufficient.

---

## 8. The Two Arms & The Firewall

| | **Data Arm** | **Accountability Arm** |
|---|---|---|
| Posture | Neutral, technical, cooperative | Adversarial, investigative |
| Output | Public library + API + analysis | Investigations, asset tracing, OSINT |
| Legitimacy basis | Trust, neutrality, provenance | Evidence, exposure |
| Funding | Grants + earned revenue + diaspora | Data Arm surplus + mission-locked philanthropy only |
| Legal form | Research institute/foundation (consider non-Lebanese incorporation) | Investigative nonprofit / media outlet, separate jurisdiction |
| Infrastructure | Separate | Separate (firewalled) |

**Why firewalled:** the moment Mabii is publicly "the people going after elite money," the powerful stop cooperating with the data side and discredit its numbers as political. The adversarial arm must never be able to contaminate the neutral arm's credibility — or compromise it in a breach/seizure.

---

## 9. Tech Stack (recommended, deliberately boring)
- **Orchestration:** Dagster or Prefect (asset-aware, good observability).
- **Storage:** PostgreSQL + TimescaleDB (canonical + published); object storage (S3-compatible) for the raw landing zone.
- **Ingestion:** Python connectors; Playwright for scraping; a vision-LLM service for PDF extraction; GDAL/rasterio for geospatial.
- **Processing:** Python (pandas/polars) for reconciliation and derived indicators; dbt for transformation lineage.
- **API:** FastAPI, API-first, OpenAPI-documented; API-key + tiered rate limiting for freemium.
- **Frontend:** a static-friendly framework with first-class i18n/RTL (Next.js or similar); charting via a mature library (Observable Plot, ECharts, or Chart.js — institutional/minimal aesthetic per §13).
- **Search (optional helper):** Postgres FTS for v1; graduate to Meilisearch/Typesense only if needed.
- **Monitoring:** standard observability stack (metrics + logs + alerting) focused on source freshness and connector health.
- **Hosting:** reputable provider outside Lebanon; backups; IaC for reproducibility.

Principle: a **modular monolith** on proven tools. Avoid microservice sprawl — the value is in curation and accuracy, not infrastructure novelty.

**Free-tier build (v1).** None of the above requires paid infrastructure at launch: a free static-hosting tier for the site, a free-tier managed Postgres (or even flat Parquet files in a repo before a DB is needed) for storage, a free CI/cron tier (e.g., scheduled GitHub Actions) to run the T1 connectors, and Python connectors written incrementally. The only unavoidable cash cost is a **domain (~$10–15/year)**, plus a small one-time AI spend per source onboarded (typically a few dollars). Paid infrastructure (and the T3 market feed) are added only when usage and revenue justify them — the architecture does not change, only the budget.

---

## 10. Build Roadmap
**v1 = Mabii − T3, built free, sequenced by maintenance-cost (not dollar-cost).** Both T1 and T2 are free to access, but T1 is reliable APIs (cheap, never breaks) and T2 is fragile scrapers (free to access but costly in *maintenance time* — your real scarce resource). So build T1 first, add T2 only as fast as you can keep it accurate. Accuracy discipline (§1.5) ships from day one, even when data is hand-entered. **The faceted catalog (§6, §7) is built in Phase 0 and grows with every indicator added thereafter** — no AI composition layer is ever built, because §2.12 says there isn't one.

| Phase | Goal | What ships |
|-------|------|-----------|
| **0 — Foundations** | Accuracy spine + glass house + faceted catalog skeleton | Canonical model (observation + indicator + indicator_facet + indicator_source_mapping), raw store, provenance/changelog mechanics, **published facet vocabulary v1**, "who we are / funding / methodology" pages, the Accuracy & Reliability Standard published, **internal onboarding workbench** (the AI-proposes / human-approves UI for new sources/indicators/facets) |
| **1 — Aggregate (free launch)** | Be useful, cited, and trusted | The Lebanon **"data reliability map"** as flagship (pure curation, zero risk) **+** a small T1 macro dashboard (free APIs) **+** a handful of hand-verified indicators (FX, indicative Eurobond level) — every number with a source link and freshness stamp, every indicator faceted, every page a SQL query |
| **2 — Synthesize** | Become an authority | T1 API connectors automated on free cron; reconciliation math live (deterministic divergence display, no editorial); T2 bank-desk/official scrapes added incrementally with validation gates; bilingual site complete; periodic "state of the data" note; faceted browse with full taxonomy |
| **3 — Originate** | Produce unique data | Scraped price index (CPI alternative), trade-mirror analysis, satellite/ad-audience population estimates (each shipped as a derived indicator in the same canonical model); paid API tier launches with stable query contracts; **add T3 market feed once revenue justifies it** |
| **4 — Plug into leverage** | Become the reference | Cited by World Bank/investors/journalists/diaspora; feeds IMF/FATF/donor decisioning; Accountability Arm stands up (firewalled) |

**The job, restated:** Phase 1's "data reliability map" is pure curation, zero risk, immediately citeable, and positions Mabii as the meta-authority on Lebanese data before it produces any data itself — the ideal opening identity. The whole of v1 launches for ~the price of a domain; what makes it matter is not spend but **relentless accuracy, clear tables, a source on every number, and a query model that cannot mislead.**

**Cost reality:** v0–v2 ≈ domain + free tiers + your time + a few dollars of AI per source onboarded. The first real money (paid hosting at scale, T3 feed, a second engineer) is a *phase-3 consequence of traction*, not a precondition. If the free version isn't used and cited, that is the cheapest possible signal to rethink — before any capital is spent.

---

## 11. Risks & Mitigations

| Risk | Why it matters | Mitigation |
|------|----------------|-----------|
| **Published inaccuracy** | A single wrong, sourceless, or stale number erodes the only moat | Source link + freshness on every value; cross-source validation gates; versioned public corrections; measured error rate (§1.5) |
| **Scraper rot** | #1 operational killer; silent staleness destroys trust | Isolated connectors, change-detection, freshness alerts, AI self-heal, budget maintenance as ongoing |
| **AI hallucination** | A plausible wrong number is disqualifying | AI proposes / code disposes; AI only at onboarding (not in request path — §5); deterministic validation gates; human review; sample-audits |
| **Editorial drift / "composed-view misleads"** | A generated topic page that omits a relevant series, or implies a relationship that isn't there, breaks trust the same way a wrong number does | Structurally impossible by §2.12 / §7 — there is no AI composition layer to drift. Subject views are SQL joins over a published facet taxonomy; "what was included and why" is the SQL itself. |
| **Taxonomy gap** | If the facet vocabulary doesn't have a concept, no query can answer it; users get "no results" instead of insight | Versioned, published `facet_vocabulary`; public "request a facet" backlog; quarterly editorial review of the taxonomy |
| **Credibility capture** | Opaque or single-source funding discredits a transparency org | Glass-house funding disclosure; diversified funders; independent board |
| **Arm contamination** | Adversarial work poisons neutral data credibility | Structural/legal/infra firewall; separate brands |
| **Political/legal attack** | "Foreign-agent" smear; shutdown; intimidation | Non-Lebanese incorporation option; diaspora funding; downplay intel-source branding; serious legal counsel |
| **Drift into irrelevance** | A pretty site nobody updates | Relentless monthly cadence on the core; the maintenance *is* the product |
| **Renewed conflict** | Can derail the whole agenda | Lean cost base; remote/distributed team; resilient hosting |
| **Privacy harm** | Becoming a surveillance database | Aggregates-not-individuals at schema level; no biometric/facial data |

---

## 12. Website Use Cases

The website exists to serve a small number of well-defined user journeys. Every UI decision in §13 should serve at least one of these; anything that doesn't is decoration.

### 12.1 Researcher writing a paper or report
**Goal:** find authoritative data on a Lebanese economic concept, cite it.
**Journey:**
1. Lands on home, types "inflation" or browses topic `monetary → prices`.
2. Indicator detail page shows: CAS CPI (official, with "weights 2004–05" staleness flag), Mabii scraped price index (modeled, monthly), IMF projection — all on one table.
3. Reads the methodology section per source, downloads CSV with provenance columns.
4. Copies the "Cite this" block (Mabii URL + indicator code + retrieval date) into the paper.

**What the site must deliver:** stable URLs, citation block on every page, downloadable CSV with provenance.

### 12.2 Bank-desk or sell-side analyst preparing a morning note
**Goal:** pull the latest moves in a sector, fast, programmatically.
**Journey:**
1. Hits `GET /api/v1/observations?facet.topic=banking&facet.geography_level=country&geography=LBN&updated_since=last_week`.
2. Receives JSON with every banking observation updated in the last 7 days, including `vintage`, `source`, `trust_label`, `raw_ref`.
3. Pipes into internal dashboard. No human in the loop.

**What the site must deliver:** stable, faceted API; reliable freshness metadata; OpenAPI doc.

### 12.3 Journalist fact-checking a public claim
**Goal:** verify or refute a number stated in public.
**Journey:**
1. Minister says "GDP grew X% last year."
2. Navigates to indicator `mabii.macro.gdp_real_growth` for Lebanon.
3. Sees IMF says A%, WB says B%, BDL says C% — divergence flag inline.
4. Quotes the divergence; links to the Mabii indicator URL as the citation.

**What the site must deliver:** multi-source unified view per indicator, clear divergence display, shareable URL.

### 12.4 Diaspora investor exploring an opportunity
**Goal:** orient on the Lebanese banking sector, FX regime, sovereign risk.
**Journey:**
1. Lands on home, opens topic `banking`.
2. Sees a table of every banking indicator with last value, source, freshness — sorted by sub-topic.
3. Drills into individual indicators; downloads what's interesting as CSV.
4. No marketing, no editorial — they form their own view from the rows.

**What the site must deliver:** topic browse → result table; downloads; bilingual presentation.

### 12.5 Multilateral country team (IMF / WB / EU mission)
**Goal:** programmatic reference data feed for internal monitoring.
**Journey:**
1. Uses paid API tier (Phase 3).
2. Cron job pulls the canonical Lebanon dataset monthly.
3. Mabii becomes their alt-data reference, especially for the high-frequency originated indicators (price index, trade-mirror).

**What the site must deliver:** stable API contracts (versioned), historical depth, SLA on freshness.

### 12.6 Educator / student
**Goal:** learn how Lebanese economic statistics are constructed.
**Journey:**
1. Browses methodology pages indexed by topic.
2. Reads the per-indicator definition, source list, reconciliation rules, known limitations.
3. Uses indicator detail pages as live teaching material.

**What the site must deliver:** every indicator has a real methodology page; every facet and source page is human-readable.

### 12.7 Auditor / quality reviewer (internal use case)
**Goal:** approve or reject AI-proposed mappings/extractions before publish.
**Journey (admin workbench, not public):**
1. Logs into the onboarding workbench.
2. Reviews AI-proposed schema mappings, facet tags, same-indicator matches, PDF extractions.
3. Approves, edits, or rejects with reason. Approval flips the row's `mapping_status` to `human_approved`.

**What the system must deliver:** the workbench is the second most important UI in v1 (after the public site). Without it, the catalog cannot grow at AI-assisted speed.

---

## 13. Website Layout & Visual Standard

**Aesthetic direction:** institutional, technical, plain. Designed and built by engineers and data scientists, not marketers. Reference points: **FRED** (St. Louis Fed), **IMF Data**, **World Bank Data**, **ECB Statistical Data Warehouse**, **BIS Statistics**, **OECD.stat**, **Eurostat**, **Statistics Canada**. None of these have hero images, gradient backgrounds, illustrations, or animation. They all signal seriousness through typography, density, and discipline. Mabii follows the same convention.

### 13.1 Visual standard

- **Typography is the primary design element.** One serif for body (e.g. Source Serif, IBM Plex Serif) or one technical sans (e.g. IBM Plex Sans, Inter). Pick one family; use weight and size for hierarchy, not color. Numbers everywhere use tabular figures, right-aligned in tables.
- **Color is semantic, not decorative.** Charcoal/near-black text on off-white. One accent (deep navy or muted maroon) for links and headers. Color *only* used for meaning: red for divergence/staleness flags, amber for low-confidence/AI-unreviewed, green sparingly for fresh-as-expected. No gradients. No background colors on content blocks.
- **No illustrations, no hero images, no stock photography, ever.** A small wordmark is the only graphic asset.
- **Charts are minimal.** Line charts with no fill, no shadow, no animation. One series per color (the accent). Faint gridlines. Source line under every chart, in small type. Charts are never the primary content unit — tables are.
- **Tables are the primary content unit.** Every observation, every indicator, every source view is fundamentally a table. The table primitive must look identical sitewide.
- **Information density is high but not crowded.** Generous line-height, modest padding, but no wasted whitespace. Aim for the visual feel of a working scientific reference, not a marketing page.
- **Bilingual is real.** Full RTL flip for Arabic — not just translated labels. The locale switcher is in the header. Indicator names, definitions, methodology, and source descriptions all exist in both languages.

### 13.2 Page templates

**Header (60-70px, persistent):**
Left: small wordmark "Mabii" + tagline ("Lebanese economic data, sourced"). Center: empty. Right: top nav (Data · Topics · Sources · Methodology · API · About), search icon, AR/EN toggle.

**Footer (multi-column, dense):**
- Col 1: Data (All indicators, Sources, Topics, Downloads)
- Col 2: Methodology (Standards, Vintage policy, Trust labels, Facet vocabulary)
- Col 3: About (Funding, Governance, Contact, Status, Changelog)
- Col 4: Technical (API docs, Open data license, Build version, Last data refresh)

**Home (`/`):**
- Single-line mission tagline.
- Prominent faceted search: subject · geography · frequency · source pickers + free-text field.
- "Most-used indicators" table (top ~10, deterministic by query count).
- "Data reliability map" preview block (linked).
- "Recent corrections" snippet (changelog teaser — proof of honesty).
- "Pipeline health" widget (X sources tracked · Y fresh · Z late) → status page.

**Indicator detail (`/indicators/{code}`)** — the most important page:
- Breadcrumb: `Topics > Banking > Solvency > Capital adequacy ratio`.
- H1: indicator name (bilingual primary in current locale, secondary shown smaller).
- Subtitle: definition (one sentence).
- Meta row: unit · frequency · geography · trust label · last updated · next expected.
- **Multi-source table** (the core unification view):
  - Rows = time periods.
  - Columns = each source's value.
  - Each cell: value, source-link icon, vintage badge.
  - Rightmost column: divergence flag (range %), red if above threshold.
- Download row: CSV · JSON · SDMX.
- Methodology section (collapsed by default, expand inline).
- Provenance section: full source list with last-fetched timestamp + link to raw payload.
- "Cite this" block: copy-pasteable citation + permalink + facets used.

**Topic / faceted browse (`/topics/{topic}` or `/browse?facet=...`):**
- H1: topic name; one-paragraph topic definition from the facet vocabulary.
- Left rail: facet picker (sub-topics, geographies, frequencies, sources, currency basis, etc.) — every checkbox is a SQL filter.
- Right pane: result table — each row is an indicator with last value, source, freshness, trust label.
- Sort/filter on every column. "Download all visible rows" button.

**Source detail (`/sources/{code}`):**
- H1: source name; one-paragraph description (publisher, license, URL, how Mabii ingests, cadence).
- Pipeline status: last successful fetch · last failure · freshness badge.
- All indicators sourced from here as a table.
- Raw-fetch history (paginated): every fetch with timestamp, hash, status.

**Methodology (`/methodology` and `/methodology/{indicator_code}`):**
- Index page lists all indicators with one-line definitions, grouped by topic.
- Per-indicator page: definition, source-by-source notes, reconciliation rules (if any), known limitations, version history.

**Changelog (`/changelog`):**
- Reverse-chronological timeline.
- Each entry: date · indicator · what changed · why · who approved · version diff.

**Status (`/status`):**
- Per-source freshness table.
- Pipeline health metrics.
- Scraper canaries (last run, last value, expected value).
- Recent failures (open + resolved).

**About / Funding (`/about`, `/funding`):**
- Mission, team, board.
- **Full funding disclosure** — every funder + amount + date.
- Two-arm firewall explanation.
- Conflict-of-interest policy.
- Contact.

**API (`/api`):**
- OpenAPI doc rendered (Redoc/Swagger).
- Authentication (free + paid tier).
- Rate limits per tier.
- Provenance contract: every response carries `source`, `raw_ref`, `vintage`, `fetched_at`, `trust_label`, `extraction_method`.
- Example requests + bulk-download recipes.

### 13.3 What this layout deliberately does not have

- No marketing hero, no rotating banner, no "Get started in 3 steps."
- No testimonials, no logo wall, no social proof carousel.
- No newsletter modal, no chat widget, no notification permission prompts.
- No "Mabii Analysis" or "Insights" pages — Mabii does not opine (§2.12).
- No AI-generated commentary anywhere on the public site.

If any of these creep in over time, the site has drifted away from the institutional posture and toward a content/marketing product — which would compromise the trust position.

### 13.4 Routing & URL contract

- URLs are stable and meaningful: `/indicators/mabii.macro.gdp_nominal_usd`, `/sources/world-bank-wdi`, `/topics/banking/solvency`.
- Every URL is citeable: the page at a URL today returns the same data at that URL next year (subject to versioned corrections, which are themselves visible).
- All pages exist at both `/en/...` and `/ar/...`; the root locale-resolves to the user's preference.
- Anything that exists on the site exists in the API at a parallel path.

---

## 14. One-paragraph summary
Mabii is a modular, AI-*assisted-at-onboarding-only*, ingestion-to-API data pipeline on boring, free-tier-friendly technology, organized as a three-tier raw→canonical→published store with a faceted catalog (§6, §7) layered over a canonical observation model. Engineering effort concentrates on resilient ingestion and a deterministic, SQL-only serving path; *value* concentrates on the curation, provenance, trust-scoring, and tagging layer. **Its one durable moat is accuracy and reliability** — clear, consistent tables and a source reference on every number — because it is free to access, free to run, and owns no exclusive data. **Mabii pools data; it never opines** (§2.12, §7): subject browsing is a SQL join over a published facet taxonomy, not an AI-generated view, which means per-query AI cost is zero and the system cannot drift into editorial bias. v1 is **Mabii − T3**: the full architecture minus the single paid tier, launchable for roughly the price of a domain, with free substitutes for every deferred source. It is split into a neutral, eventually revenue-generating **Data Arm** and a firewalled, investigative **Accountability Arm**. Its architecture encodes its values — accuracy-and-verifiability first, raw-immutable for auditability, versioned-published for honest correction, a source on every number, aggregates-not-individuals for privacy, AI-proposes/code-disposes for reliability, pool-don't-opine for honesty, and an arm-firewall for safety. Its website is institutional, plain, table-first, and bilingual — built to look like a statistics office, not a startup. It launches by curating what already exists (earning legitimacy through correctness), then synthesizes, then originates unique data, and ultimately becomes the credible reference source that the existing leverage machinery — IMF, FATF, donors, investors, diaspora — routes its decisions through. In doing so it builds the missing information infrastructure that is the binding constraint on the Lebanese economy.
