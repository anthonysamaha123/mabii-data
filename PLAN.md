# Mabii — Build Plan
**Companion to:** [SPEC.md](./SPEC.md) v1.3
**Status:** Pre-build
**Posture:** Slow is smooth, smooth is fast. Ship nothing that does not meet the Accuracy & Reliability Standard (SPEC §1.5).

This is the executable plan to go from an empty folder to a credible, cited institutional reference site. Each phase has explicit entry conditions, exit criteria, and the decisions that must be made *before* it starts. Effort estimates are rough and assume one senior full-time engineer; halve speed for part-time.

---

## 0. Plan at a glance

| Phase | Goal | Public surface | Rough effort (1 FTE) |
|---|---|---|---|
| **−1 — Pre-engineering** | Decisions, accounts, legal foundation | None | 1–2 weeks |
| **0 — Foundations** | Spine + glass house + onboarding workbench | Skeleton site (about/methodology/funding only) | 4–6 weeks |
| **1 — Aggregate (launch)** | Be useful, cited, trusted | Data Reliability Map + ~15 indicators + open API | 6–10 weeks |
| **2 — Synthesize** | Become an authority | ~75 indicators + T2 scrapes + reconciliation math | 4–6 months |
| **3 — Originate** | Produce unique data + first revenue | Scraped price index, trade-mirror, paid API tier | 6–12 months |
| **4 — Leverage** | Become the reference; stand up Accountability Arm | Citations in policy machinery; firewalled second org | Ongoing |

Total time-to-cited-reference: ~18–24 months of focused work. Time-to-first-public-launch: ~3–4 months.

---

## −1. Pre-engineering — decisions and accounts (1–2 weeks)

Nothing builds until these are settled. Each is a real choice with downstream cost.

### −1.1 Material decisions (block Phase 0)

1. **Polyglot or all-TS.** SPEC §8 recommends Python (Dagster/Prefect, FastAPI). All-TS (Next.js routes + Inngest/Trigger.dev) is faster to ship for an existing TS team and avoids two runtimes. *Recommendation: polyglot (Python pipeline + TS frontend) — the spec's "boring proven tools" principle favors the de-facto data engineering stack here, and the pipeline complexity in Phases 2–3 will outgrow JS-based orchestrators.*
2. **Where Postgres lives.** Options: Supabase (free tier, generous; you already have it in salesbox), Neon (good Postgres, free tier), Railway, Render, self-hosted on a $5 VPS. *Recommendation: Supabase fresh project — not the salesbox project — for v1; migrate if outgrown. The fresh project keeps the glass-house story clean: Mabii data shares no infrastructure with any other business.*
3. **Where raw object storage lives.** Cloudflare R2 (free egress, 10 GB free), Backblaze B2, AWS S3 (with cost discipline), Supabase Storage. *Recommendation: Cloudflare R2 — free egress is genuinely important when the raw store becomes the audit trail and gets occasional bulk pulls.*
4. **Orchestrator.** Dagster (asset-aware, opinionated, great UI) vs Prefect (task-graph oriented, lighter). *Recommendation: Dagster — its asset model maps cleanly onto the canonical observation model, and the per-asset freshness UI is exactly what §5 needs.*
5. **Frontend host.** Vercel (Next.js native), Cloudflare Pages (cheap edge), Netlify. *Recommendation: Vercel — pragmatic given existing org familiarity; switch to Cloudflare Pages if egress becomes an issue.*
6. **AI provider for onboarding.** Anthropic (Claude — best at structured proposals and refusing to fabricate), OpenAI, both. *Recommendation: Anthropic primary, OpenAI fallback. Spend cap per source onboarded.*
7. **Domain.** `mabii.org`? `mabii.lb`? Something else? *Decision required — affects branding and signals. `.org` reads "institution"; `.lb` reads "Lebanese"; both work, pick one. Memory notes mabii.org is already used by another product context, so confirm available.*
8. **Typography family.** Source Serif Pro (serif, FRED-like), IBM Plex Serif (serif, modern), IBM Plex Sans (sans, technical), Inter (sans, neutral). *Recommendation: IBM Plex Serif for body + IBM Plex Sans for tables/numbers. Open-licensed, institutional, bilingual (full Arabic glyph coverage).*
9. **Open source or proprietary code.** Mabii's content is published (CC-BY). Is the *code* open? Going open-source is on-brand for the glass house, attracts contribution, and signals confidence. *Recommendation: code is open source (MIT or Apache-2.0) from day one. Repo public from Phase 0.*

### −1.2 Legal / governance foundation (parallel)

- Pick incorporation jurisdiction (non-Lebanese strongly suggested for Data Arm — Cyprus, France, Switzerland, UK, Estonia are common picks for foundations).
- Engage counsel for: data-source ToS review (especially scraping), data protection (GDPR for diaspora users), nonprofit/foundation formation.
- Open separate banking, separate identity, separate cloud accounts for the Data Arm vs. anything personal. The firewall starts here.
- Draft a one-page conflict-of-interest policy and funding-disclosure policy *before* taking the first dollar.

### −1.3 Accounts to provision (cheap or free)

Domain registrar · Cloudflare (DNS, R2, Pages) · Supabase (DB) · Vercel (frontend) · GitHub (code + free CI cron) · Anthropic API · OpenAI API (fallback) · Sentry (free tier monitoring) · Resend or Postmark (transactional email) · status-page hosting (or roll our own).

---

## Phase 0 — Foundations (4–6 weeks)

**Goal:** the spine. No real public data yet. Internal tooling and the glass house exist. The site looks institutional even when it has nothing in it.

### Entry conditions
All §−1.1 decisions made. Accounts provisioned. Repo created and public.

### Workstreams (mostly serial; frontend can parallel after schema is settled)

**0a — Infrastructure**
- Provision Supabase project, Cloudflare R2 bucket, Vercel project, Anthropic key.
- Set up two environments: `production` and `preview`.
- Secrets management via Vercel + Supabase native; no `.env` in git.
- Sentry wired to both backend and frontend.
- Status page scaffold (can be a static page in Phase 0; real metrics in Phase 1).

**0b — Data model (the canonical layer)**
- Implement schema from SPEC §6: `observation`, `indicator`, `indicator_facet`, `indicator_source_mapping`, `source`, `raw_fetch`, `geography`, `revision_log`, `facet_vocabulary`.
- Migrations versioned in repo. Forward-only.
- Seed `geography` with Lebanon + governorates + districts.
- Seed `facet_vocabulary` v1 (see workstream 0c).
- Write integration tests against a real test DB — no mocks.

**0c — Facet vocabulary v1 (design artifact)**
- Lock the v1 list of `facet_type`s (≈10) and the starting `facet_value`s per type (≈50–80 total). Examples: `topic ∈ {banking, fiscal, monetary, trade, demographic, energy, real_estate, employment, external_finance, prices}`; `subtopic ∈ {solvency, liquidity, credit_quality, ...}`; `frequency ∈ {daily, weekly, monthly, quarterly, annual}`; etc.
- Publish the vocabulary as part of the site (bilingual). Versioned.
- This is an editorial deliverable, not just code. Get a domain expert to review before locking v1.

**0d — Onboarding workbench (the internal admin UI)**
The single most important Phase 0 deliverable. Without this the catalog grows at code-commit speed instead of AI-assisted speed.
- Authenticated admin route (Supabase Auth, one or two seeded users).
- "Add a source" flow: upload sample payload → AI proposes schema mapping → human approves/edits → mapping saved.
- "Tag an indicator" flow: pick indicator → AI proposes facet tags + bilingual names → human approves/edits.
- "Match indicators across sources" flow: review AI-proposed `indicator_source_mapping` rows, approve/reject.
- "Review queue" for AI-extracted observations awaiting sample audit.
- Every action logged with actor + timestamp + before/after.

**0e — Public site chassis**
- Next.js project with full bilingual AR/EN scaffold + RTL.
- Institutional typography (IBM Plex serif + sans, or chosen alternative).
- Table primitive (the most-used UI component sitewide) with: source-link icon, vintage badge, tabular figures, sortable columns.
- Header, footer, page templates per SPEC §13.
- These pages are real and shipped in Phase 0 (with placeholder content where data isn't ready):
  - `/` — home (placeholder data, but real layout)
  - `/about`, `/funding` (with the funding-disclosure framework, even if the list is empty)
  - `/methodology` (the framework, per-indicator pages added later)
  - `/methodology/accuracy-standard` (SPEC §1.5 published as a real page)
  - `/methodology/facet-vocabulary` (the v1 vocabulary)
  - `/status` (skeleton)
  - `/changelog` (empty)
- Accessibility baseline: WCAG 2.1 AA. Lighthouse a11y ≥ 95.

**0f — Connector framework**
- Define the `Connector` interface: `fetch()`, `parse()`, `schedule`, `source_metadata`.
- Implement one toy connector end-to-end (e.g. a single World Bank Lebanon series — `NY.GDP.MKTP.CD`) to prove the path raw → canonical → published.
- Wire to Dagster; first scheduled run on cron.
- Raw payload writes to R2 with hash + ETag; canonical writes to Postgres; validation gate runs; observation lands.

**0g — Observability**
- Per-source freshness metrics emitted by Dagster.
- Sentry error capture across pipeline + site.
- Structured logs (JSON) to Supabase or a free tier of Better Stack / Axiom.
- A "/status" page that reads real metrics by end of Phase 0 (even if there's one source).

**0h — CI/CD + repo hygiene**
- GitHub Actions: lint, typecheck, unit tests, schema-migration check on every PR.
- Branch protection on `main`; review required.
- Pre-commit hooks for formatting.
- A `CONTRIBUTING.md` and a `SECURITY.md` (even sparse) signal seriousness.

### Exit criteria (must all be true)
- Schema deployed; all tables exist; integration tests pass against a real DB.
- Facet vocabulary v1 is reviewed by at least one domain expert and published bilingually on the site.
- Onboarding workbench can: onboard a new source end-to-end (AI proposal → human approval → live ingestion) in a real session, not a demo script.
- Toy connector runs daily, writes to RAW + CANONICAL + PUBLISHED with full provenance, and shows up on `/status` with last-fetched time.
- Public site live at the chosen domain. Lighthouse: a11y ≥ 95, performance ≥ 90, SEO ≥ 95. Bilingual works in both directions; RTL is correct (manually verified by an Arabic-native reviewer).
- Repo is public; license is set; CI is green on `main`.
- Funding-disclosure page exists and either lists current funders or states "no funding received as of [date]" — honest from day one.

### Decisions to make during Phase 0
- Authentication model for the workbench (Supabase Auth + email allowlist is sufficient — no real user system yet).
- Logging retention policy.
- Backup cadence for the canonical Postgres (suggest: daily, 30 days; weekly, 1 year). Raw R2 is already append-only.

### Risks
- **Scope creep into building "the dashboard" too early.** Phase 0 has no public data display beyond a placeholder. Don't build chart components yet.
- **Workbench under-investment.** Tempting to skip ("I'll just SQL-insert"). Doing so caps catalog growth at engineer speed forever. *Build the workbench.*
- **Bilingual deferred.** "Ship English first, add Arabic later" never happens. Build both from day one — the layout and translation memory costs balloon if retrofitted.

---

## Phase 1 — Aggregate (the free launch) (6–10 weeks)

**Goal:** the first public launch with real, useful, citeable data. Modest in coverage. Uncompromising in discipline. Mabii positions as the meta-authority on Lebanese data before producing any of its own.

### Entry conditions
Phase 0 exit criteria all met. At least one domain expert has reviewed the facet vocabulary. The workbench has been used to onboard at least 3 sources in dry-run.

### Workstreams

**1a — Data Reliability Map (flagship)**
- A curated catalog of *every known Lebanese economic data source*, scored on dimensions: freshness, frequency, completeness, methodology transparency, machine-readability, access cost.
- Pure metadata — no values pulled. Zero pipeline risk; immediate authority play.
- Each source has a page: what they publish, when, how, our score, why.
- Lives at `/sources/reliability-map`. Linked from home.

**1b — T1 connectors (5–8 real ones)**
Build, in order:
1. World Bank WDI — Lebanon indicators
2. IMF SDMX — WEO, IFS, BOP
3. FRED — Lebanon-relevant macro
4. UN Comtrade — Lebanon trade
5. HDX — humanitarian / OCHA data
6. UNCTAD — investment / shipping
7. WorldPop / VIIRS — population / night-lights (geospatial toolchain stub)
8. UN ESCWA — regional comparators

Each connector: scheduled, change-detecting, alerting, with sample-audited mappings approved via the workbench.

**1c — Hand-verified v1 indicator set (~15)**
Editorial selection across topics, chosen to demonstrate cross-source pooling. Example set:
- GDP (nominal USD), GDP (real growth %), CPI (official), USD/LBP (parallel + official + indicative), policy rate, broad money M3, bank deposits, bank lending to private sector, current account balance, exports of goods, imports of goods, trade balance, public debt / GDP, FX reserves, remittances inflows.

Each indicator: full faceting, bilingual metadata, methodology page, sources matched, divergence display where multi-source, downloadable as CSV/JSON.

**1d — Indicator detail page (real)**
The canonical multi-source table view shipped per SPEC §13. Every plotted point traceable to its source. Download row works. Methodology section reads from the indicator's methodology page. "Cite this" block emits a citation with the indicator code + version + retrieval date.

**1e — Faceted browse (real)**
`/topics/{topic}` and `/browse?facet=...` shipped. SPEC §7's pure-SQL query model in production. Left-rail facet picker. Right-pane result table. Apply / clear / download.

**1f — Search (minimum viable)**
Postgres full-text search over indicator names + definitions + facet values + source descriptions. Results link to filtered facet queries. No LLM at this stage.

**1g — Open API**
- Read-only, free, OpenAPI-documented at `/api/docs`.
- Endpoints: `/api/v1/indicators`, `/api/v1/indicators/{code}`, `/api/v1/observations?...facets...`, `/api/v1/sources`, `/api/v1/topics`.
- Every response carries provenance (`source_id`, `raw_ref`, `vintage`, `fetched_at`, `trust_label`).
- Rate limit: 60 req/min per IP, no auth required. (Auth added in Phase 3 for paid tiers.)
- Versioned: `/api/v1/` — never break a stable path.

**1h — Bulk exports**
CSV/JSON download per indicator and per query result. SDMX deferred to Phase 2 (it's the right export for multilateral consumers, but it's heavy and underused early).

**1i — Status page (real)**
Per-source last-fetched, expected-next, status (green/amber/red), failure log. Public.

**1j — Changelog (first entries)**
The initial publication is itself a changelog entry. Every corrected value thereafter is a new entry with diff.

**1k — Soft launch + feedback loop**
- Show to ~10 trusted reviewers (a journalist, a banker, a researcher, a diaspora investor, a multilateral staffer) before public announce.
- Capture and fix the top issues. *Real* feedback before *real* launch.
- Public announce when the soft-launch sign-off threshold is met (no top-priority issues outstanding).

### Exit criteria
- ~15 indicators live; every one has full faceting, bilingual metadata, methodology, and a source-link on every value.
- 5–8 T1 connectors running on schedule; freshness visible on `/status`.
- Data Reliability Map shipped.
- Open API live and documented; at least one external developer has successfully used it.
- Soft launch reviewers have signed off. Public announce executed.
- Citation infrastructure in place: every page has a citation block.
- First citation captured in the wild (a blog, a tweet, a tool, anything). If zero citations after 30 days post-launch, *this is the cheapest possible signal to rethink* before investing further (SPEC §10 cost reality).

### Decisions during Phase 1
- Final v1 indicator list (editorial — 15 is the suggestion, not a mandate).
- Open data license — likely **CC-BY 4.0** for Mabii-curated metadata and derived indicators; sources retain their own license.
- Citation format — proposed: `Mabii (YYYY). {Indicator name} [{indicator code}]. Retrieved {date} from {URL}.`
- Free API rate limit (60/min suggested; tune after launch).

### Risks
- **Premature scaling.** The pull to "add more indicators" is constant. Resist. 15 done impeccably > 50 done sloppily.
- **Translation quality.** AI-drafted Arabic without human review will fail bilingual users. Budget for an Arabic-native review pass before public launch.
- **Scraper inclusion too early.** Phase 1 is T1 only. Any scraper added here will dominate maintenance cost during launch — exactly when you need to be polishing, not firefighting. Hold scrapers for Phase 2.

---

## Phase 2 — Synthesize (4–6 months)

**Goal:** Mabii becomes an authority. T2 (scraped / PDF) sources come online, dramatically expanding coverage but also dramatically expanding maintenance load. Reconciliation math is live and visible.

### Entry conditions
Phase 1 launched and stable for 4+ weeks. At least one external citation captured. No top-priority issues from soft-launch reviewers outstanding.

### Workstreams

**2a — T2 connectors (prioritized)**
Build, in order of value × tractability:
1. **BDL (Banque du Liban)** — balance sheet, monetary statistics, FX, exchange rate history. PDF-heavy. Highest-value single source.
2. **CAS (Central Administration of Statistics)** — CPI, demographic data. PDF + scrape.
3. **Ministry of Finance** — budget execution, debt stock. PDF.
4. **ABL (Association of Banks)** — aggregated banking sector data. PDF.
5. **Lebanese Customs** — trade in detail. Web portal.
6. **Beirut Stock Exchange** — listed bank earnings.
7. **Port of Beirut** — TEU throughput as activity proxy.
8. **IDAL** — FDI inflows.
9. **Bank research desks** (Byblos, BLOMINVEST, Credit Libanais, Bankmed) — periodic PDFs. AI-heavy onboarding.

Each requires: AI-assisted PDF extraction → review queue → sample audit → ongoing change detection → freshness alerts.

**2b — Scraper rot defense**
- Change-detection via content hashing for every scrape.
- Scraper canaries: known-stable values fetched on a separate smoke schedule.
- Per-connector failure budget and auto-pause if breach.
- Freshness alerts piped to email + Slack.

**2c — Reconciliation math (live)**
- Per-indicator divergence statistics computed automatically.
- Divergence column visible on every multi-source indicator detail page.
- Threshold-based flagging (configurable per indicator).
- No editorial — math only.

**2d — Faceted vocabulary v2**
- Expand from ~80 values to ~150.
- "Request a facet" public backlog (e.g. via GitHub issues if repo is open).
- Quarterly editorial review committed and executed.

**2e — Cross-source mapping density**
- Most indicators now have ≥ 2 sources mapped.
- Same-indicator matching workflow is mature; AI proposals approved at high accuracy.

**2f — Bilingual quality pass**
- Arabic-native reviewer (paid contract or volunteer) reviews every public page.
- Translation memory established so corrections persist.

**2g — Citation outreach (low-volume, high-quality)**
- Targeted sends to specific researchers, journalists, multilateral country teams.
- Track inbound references via referer logs (privacy-respecting; no third-party trackers — see cross-cutting §C).
- Quarterly citation report (internal).

**2h — Ops maturity**
- On-call rotation (even if 1 person — runbook + pager hygiene).
- Runbooks for every common failure mode (connector down, DB slow, scraper rot, AI quota exhausted).
- Post-mortem template + commitment to publish public post-mortems for any data-correctness incident.

**2i — SDMX export (now)**
- SDMX is the lingua franca of multilateral data consumers; shipping it signals seriousness and unlocks the IMF/WB-team audience.

**2j — Periodic "State of the Data" note (optional, narrow)**
- If shipped: quarterly, authored by named person, narrowly scoped to "what changed in our catalog, what got better/worse upstream." Not an economic opinion piece — strictly meta-data.
- *Recommendation: defer to Phase 3 or skip entirely. The changelog page, kept beautiful and public, is sufficient.*

### Exit criteria
- ~75 indicators live (5x Phase 1).
- All major T2 sources have at least one indicator mapped and running.
- Divergence math live on every multi-source indicator.
- Public referer log shows ≥ 25 distinct external referers in the past 90 days.
- A post-mortem has been written for at least one real incident (proof the discipline is real, not aspirational).
- Sample-audit error rate on AI extractions published quarterly. Trending down or stable.

### Decisions during Phase 2
- Paid tier — when to introduce. Likely late Phase 2 / early Phase 3.
- "State of the Data" — publish or skip.
- Second engineer — hire trigger (suggest: when post-mortem cadence exceeds one per month or T2 maintenance consumes >40% of available time).

### Risks
- **Scraper rot dominates time.** Inevitable. Mitigation: keep T1 / T2 ratio honest in time tracking; pause T2 expansion if T1 freshness degrades.
- **Onboarding velocity tempts shortcuts.** Tempting to skip the sample audit step. Don't. The measured error rate is the moat.
- **Bilingual debt accrues.** New indicators ship in English first "to save time," then never get Arabic. *No indicator ships without Arabic metadata, period.*

---

## Phase 3 — Originate (6–12 months)

**Goal:** Mabii produces things nobody else has. First revenue arrives.

### Entry conditions
Phase 2 exit criteria met. Pipeline maintenance is sustainable (not in firefight mode). Audience signal is real (citation count, API usage).

### Workstreams

**3a — Scraped price index (the flagship originated indicator)**
- The methodology is the product. Site selection (which e-commerce / classifieds / fuel / rent sources), basket construction, weighting, validation, monthly publication cadence.
- Publish a methodology paper (real document, peer-reviewable).
- Acknowledge limitations honestly; sample-audit against any available ground truth.
- Shipped as a regular indicator with `extraction_method = derived` and `trust_label = modeled`.

**3b — Trade-mirror analysis**
- Per-commodity, per-partner: compare Lebanese customs vs. partner-country Comtrade.
- Surface gaps (potential misinvoicing) with deterministic math, not interpretation.
- Methodology page; downloadable per-commodity time series.

**3c — Satellite / ad-audience proxies**
- VIIRS night-lights as economic activity proxy.
- Meta/Google ad-audience as population/age/connectivity proxy.
- GDAL/rasterio toolchain online.
- Each shipped as a derived indicator with documented method.

**3d — Composite nowcasts**
- One headline: quarterly GDP nowcast from high-frequency signals (port throughput, customs, electricity if available, night-lights, ad audience).
- Strictly a quantitative output with confidence interval; never narrative.

**3e — Paid API tier launch**
- Stripe integration; API keys; tier gating; rate limit by tier; billing webhooks; tax handling.
- Pricing: research at launch. Suggested starting points: free (60/min, public data only) · researcher ($29/mo, 600/min, full historical, derived indicators) · institutional ($299/mo, 6000/min, SLA, support).
- Pricing must be public.

**3f — First paying customers**
- Direct outreach to identified-need accounts: bank research desks, country-team analysts at multilaterals, risk firms, diligence firms.
- 10–25 paying accounts is the realistic Phase 3 target.

**3g — Methodology peer review**
- For each originated indicator, get at least one credentialed external reviewer to publicly comment on the methodology.
- Critical for credibility of derived/modeled indicators.

### Exit criteria
- Price index publishing monthly with documented method.
- Trade-mirror live with quarterly updates.
- Paid API has ≥ 10 paying accounts.
- Recurring revenue covers paid hosting + a part-time second engineer.
- One originated indicator has been cited by an external authority (an analyst note, a paper, a press article).

### Decisions during Phase 3
- Hosting upgrade — likely needed (paid Postgres, paid Vercel, etc.).
- Second engineer — full-time or contract?
- Whether to take grant funding now (with full disclosure) to fund the originated-indicator methodology work.

### Risks
- **Methodology controversy.** A wrong/contested price index is *worse* than no price index. Sample audit, peer review, and the "honest limitation flags" are the only defenses.
- **Pricing too low / too high.** Pricing is its own discipline. Don't anchor on intuition; ask 5 prospective paying customers what they pay for comparable.
- **Revenue capture distorts editorial.** If a paying customer asks for an indicator that's nice for them but off-mission, do not build it. Codify this in a "what we build / don't build" policy before the first paying customer.

---

## Phase 4 — Leverage (ongoing)

**Goal:** Mabii becomes the credible reference source that policy machinery routes through. The Accountability Arm stands up, firewalled.

### Workstreams (illustrative, not exhaustive)

- **Multilateral integration:** formal data partnerships with WB, IMF country team, ESCWA. Mabii becomes a fed source, not just a relay.
- **Donor / reconstruction-fund integration:** when (if) reconstruction funding flows, Mabii's data is the basis for tranche conditions.
- **Accountability Arm separately incorporated:** different legal entity, different jurisdiction, different brand, different staff. Different cloud accounts. The firewall is real.
- **First investigative outputs from the Accountability Arm.** Strictly editorial-separated from the Data Arm.
- **Funding maturity:** mix of earned revenue + institutional grants + diaspora recurring donors. No single funder above 25% of revenue.

### Exit criteria
There isn't really one. Phase 4 is steady-state operation with growth. The "exit" is institutional permanence — Mabii outlives any single founder, funder, or political cycle.

---

## Cross-cutting workstreams (run continuously from Phase 0)

### A. Security
- Secrets in vault (Vercel + Supabase native); never in repo; never in client.
- Least-privilege DB roles. Public site reads via a restricted role; workbench writes via a separate role.
- Backup discipline: Postgres daily snapshots, 30-day retention; weekly full backups, 1-year retention. R2 is append-only — sufficient.
- Disaster recovery runbook tested at least once per year. "Restore from backup to a parallel environment in <4 hours."
- 2FA enforced on all admin accounts.
- Public security policy at `/security.txt`.
- When the Accountability Arm exists: separately incorporated, separate cloud accounts, separate identity provider, separate everything.

### B. Legal / compliance
- Source ToS review before scraping. Document each source's terms; if scraping is contested, fall back to PDF download from a publicly accessible release page.
- GDPR baseline: data subject rights for any user accounts (even if just admins); minimal cookies; no third-party trackers on public pages.
- Funding-source vetting: a one-page policy. No money from any entity Mabii might investigate or report on.

### C. Privacy & analytics
- No third-party analytics on the public site. No Google Analytics, no Mixpanel, no Hotjar.
- Self-hosted Plausible or Umami for aggregate metrics (page views, referers) — no per-user tracking.
- Server logs retained 30 days, aggregated thereafter.
- Per SPEC §2.8: aggregates, not individuals.

### D. Accessibility
- WCAG 2.1 AA from day one. Lighthouse a11y ≥ 95 in CI.
- Keyboard-navigable everything.
- Tables have proper headers and captions; charts have text equivalents.
- Color contrast tested in both light and dark modes.

### E. Performance budget
- Indicator detail page first-contentful-paint < 1.5s on a 3G simulated connection.
- API p95 latency < 300ms for queries within a single year of data.
- Page weight < 500KB initial load (achievable with a table-first, image-free design).

### F. Quality gates (CI-enforced)
- Lint, typecheck, unit tests, integration tests on every PR.
- Schema migration check (no destructive migrations without explicit approval).
- Accessibility (axe-core) check in CI.
- Visual regression for the table primitive (it's used everywhere; regression here breaks the whole site).

### G. Ops cadence
- **Daily:** automated freshness check + alerts.
- **Weekly:** workbench session (process the review queue; onboard 1–2 new indicators).
- **Monthly:** sample audit of AI-extracted observations; publish error rate.
- **Quarterly:** facet vocabulary review; "what got cited" report; backups DR drill.
- **Annually:** funding-disclosure refresh; governance review.

### H. Funding
Parallel to engineering. Roughly:
- **Phase 0–1:** founder time + ~$0–500 cash (domain + occasional AI spend). Optional: diaspora seed campaign (small, validates demand).
- **Phase 2:** seek small grants from open-data funders (NED, Hewlett, Open Society, Hivos, OCCRP-adjacent). Diaspora recurring donors live.
- **Phase 3:** earned revenue from paid API starts. Grant funding for the originated-indicator methodology work.
- **Phase 4:** mixed: earned + grants + diaspora. Cap any single source at 25%.

Every dollar disclosed on `/funding` with date and amount.

### I. Hiring
- **Phase 0–1:** 1 FTE engineer (founder).
- **Phase 2:** add part-time Arabic-native reviewer (~10 hrs/wk). Domain advisor (volunteer) on retainer.
- **Phase 3:** second engineer (full-time or strong contract). Begin board recruitment.
- **Phase 4:** small team (3–5). Accountability Arm has its own separate team.

### J. Communications
- **No public marketing.** No social media presence beyond a low-volume professional account (LinkedIn or BlueSky for changelog-style posts).
- **No newsletter for the first 12 months.** Citation infrastructure is the signal, not promotion.
- **Soft launch and public launch are the only two "comms events" through Phase 1.**
- **Direct outbound** to specific researchers/journalists/analysts on a known-need basis. Personalized, low-volume.

---

## Definitions of "done" (used in every phase)

A workstream is done when:
1. Code is merged to `main` with passing CI.
2. The associated public-facing page (if any) is live at its production URL.
3. The associated docs/methodology page exists and links to the implementation.
4. At least one external person has used it without an engineer holding their hand.
5. There is an alert / monitor / dashboard for its ongoing health (if applicable).
6. There is a runbook for its most likely failure mode.

If any of 1–6 are missing, the workstream is in progress, not done.

---

## Honest caveats

- **Effort estimates are rough.** "4–6 weeks for Phase 0" assumes one senior full-time generalist who has shipped a comparable system before. New-to-the-stack: double it. Part-time: triple it.
- **Phase 2 is the highest-variance phase.** T2 scrapers can take 1 day or 1 month per source depending on the source's hostility to scraping and PDF layout drift. Plan reserves accordingly.
- **Phase 3's revenue numbers are aspirational, not promised.** 10 paying accounts at Phase 3 exit is a target; missing it does not invalidate the project — it does invalidate the paid-tier strategy and pushes toward grant-only funding.
- **The Accountability Arm is intentionally vague in this plan.** It is a separate organization with separate everything. This plan covers the Data Arm; the Accountability Arm gets its own plan when Phase 4 is reached.

---

## What is *not* in this plan (deliberately)

- AI-composed dashboards or topic narratives (forbidden by SPEC §2.12).
- "Mabii Analysis" or "Mabii Insights" pages (Mabii does not opine).
- Social-share buttons, growth hacks, gamification, badges, leaderboards.
- A mobile app (the website is responsive; that is sufficient).
- Real-time push notifications to public users.
- A user-generated-content layer.
- AI in the public request path, ever.

If any of these appear in a future phase, the plan has drifted away from the institutional posture and must be rejustified against §1.5 and §2.12 before proceeding.
