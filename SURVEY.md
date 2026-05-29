# Mabii — Community Survey (Lived-Reality Layer)
**Companion to:** [SPEC.md](./SPEC.md) · **Status:** design, pre-build
**Posture:** A *quarantined* layer that captures what official sources structurally cannot — what people and businesses actually pay, earn, and do. Never blended with sourced data. Its whole point is the **gap** between official numbers and lived reality.

---

## 1. Why it exists (and the one rule)

Every institutional source reflects a slice: OLX = asking-price fresh-dollar, WFP = monitored markets, official stats lag or are suppressed, and there is no census since 1932. The survey is the only window into the informal/cash/dollarized economy and into *behaviour* (coping, trust, emigration intent).

**The one rule:** survey data is `self_reported`, lives in its own "Community-reported" section, and is **never co-mingled** with official numbers in the same table without a loud label. The catalogue's trust spine must be unaffected if the survey were deleted tomorrow. A manipulated number with Mabii's name on it is worse than no number.

---

## 2. Question bank → indicators

Each binary/categorical question yields a `% who answered X` indicator, per governorate, per wave. **Direct** = the answer is the metric; **Indirect** = it's a proxy. Tags: `[core]` ship in v1 · `[ext]` later wave · `[⚠]` sensitive, needs legal sign-off.

This is a *bank*, not a single questionnaire — see §2.9 on modular rotation (no respondent answers all of it).

### PEOPLE

**P1 · Income & work**
| Question | Type | Indicator | D/I |
|---|---|---|---|
| How are you paid? `[core]` | fresh-USD / lollar / LBP / mixed | wage-dollarization rate | D |
| Were you paid in full and on time last month? `[core]` | Y/N | wage-payment reliability | D |
| Paid in cash or bank transfer? `[core]` | cash / transfer / both | wage cash-economy share | D |
| Do you have a written employment contract? `[ext]` | Y/N | employment formality | D |
| How many income sources do you have? `[core]` | 1 / 2 / 3+ | multi-jobbing depth | D |
| Public sector, private sector, self-employed, or none? `[core]` | 4-way | sector-of-work mix | D |
| Do you work remotely for a foreign/diaspora employer? `[core]` | Y/N | "freelance-dollar" economy | I |
| Lost a job in the last 12 months? `[core]` | Y/N | job-loss incidence | D |
| Unemployed and actively seeking? `[core]` | Y/N | lived unemployment (vs official) | D |
| Is your real income higher/same/lower than a year ago? `[core]` | 3-way | income trajectory | D |

**P2 · Banking, deposits & savings**
| Question | Type | Indicator | D/I |
|---|---|---|---|
| Can you freely withdraw your bank savings? `[core]` | Y/N | frozen-deposit rate | D |
| Did you lose money to a deposit haircut since 2019? `[core]` | Y/N | crisis-loss incidence | D |
| Do you still keep money in a Lebanese bank? `[core]` | Y/N | debanking rate | D |
| Do you use a fintech/transfer wallet (Whish, OMT…)? `[core]` | Y/N | fintech adoption | I |
| Do you keep savings as cash USD at home? `[core]` | Y/N | cash-hoarding rate | I |
| Do you have any savings at all? `[core]` | Y/N | has-savings rate | D |
| Could you cover a sudden ~$200 emergency? `[core]` | Y/N | financial-resilience rate | I |

**P3 · Spending, coping & deprivation**
| Question | Type | Indicator | D/I |
|---|---|---|---|
| Did income cover expenses last month? `[core]` | Y/N | not-making-ends-meet rate | D |
| Skipped or cut meals due to cost last month? `[core]` | Y/N | food-insecurity rate | D |
| Switched to cheaper food brands to cope? `[ext]` | Y/N | downtrading rate | I |
| Delayed/skipped medical care due to cost (3 mo)? `[core]` | Y/N | health-cost distress | D |
| Skipped buying prescribed medication due to cost? `[ext]` | Y/N | medication-skipping rate | D |
| Behind on rent or a utility bill right now? `[core]` | Y/N | arrears rate | D |
| Sold belongings/assets to cover costs (12 mo)? `[ext]` | Y/N | asset-depletion rate | I |
| Cut a child's schooling/tutoring due to cost? `[ext]` | Y/N | education-erosion rate | D |
| Receive food or cash aid (NGO/UN)? `[core]` | Y/N | aid-dependence rate | D |

**P4 · Debt & informal credit**
| Question | Type | Indicator | D/I |
|---|---|---|---|
| Borrowed money to cover basics last month? `[core]` | Y/N | distress-borrowing rate | D |
| Buy groceries on shop-tab/credit? `[core]` | Y/N | informal-credit reliance | I |
| Owe money to family/friends right now? `[ext]` | Y/N | informal-debt prevalence | I |
| Have any formal loan (bank/MFI)? `[ext]` | Y/N | formal-credit penetration | D |

**P5 · Housing**
| Question | Type | Indicator | D/I |
|---|---|---|---|
| Do you own or rent your home? `[core]` | own / rent / other | tenure mix | D |
| If renting, is rent in USD or LBP? `[core]` | USD / LBP | rent-dollarization rate | D |
| Monthly rent you actually pay? `[core]` | bucketed $ | **community rent-paid** (÷ OLX divergence) | D |
| Old (pre-2019) lease or new lease? `[core]` | old / new | two-rental-markets split | D |
| Did your rent rise in the last year? `[ext]` | Y/N | rent-pressure rate | D |
| Share housing to cut costs? `[ext]` | Y/N | cost-sharing rate | I |

**P6 · Electricity, utilities & infrastructure**
| Question | Type | Indicator | D/I |
|---|---|---|---|
| Hours of *state* electricity per day? `[core]` | 0–4 / 4–8 / 8–16 / 16–24 | grid-failure reality | D |
| Subscribe to a private generator? `[core]` | Y/N | generator-reliance rate | D |
| Monthly generator/solar cost? `[core]` | bucketed $ | the "second electricity bill" | D |
| Installed solar in the last 2 years? `[core]` | Y/N | solar-adoption rate | D |
| Reliable home internet? `[ext]` | Y/N | connectivity rate | D |
| Rely on trucked/bottled water? `[ext]` | Y/N | water-insecurity rate | I |

**P7 · Remittances & diaspora**
| Question | Type | Indicator | D/I |
|---|---|---|---|
| Receive money from relatives abroad? `[core]` | Y/N | remittance-receiving rate | D |
| Are remittances essential to cover basics? `[core]` | Y/N | remittance-dependence depth | D |
| Immediate family who emigrated since 2019? `[core]` | Y/N | realized brain-drain | I |
| Do you send money abroad? `[ext]` | Y/N | outbound-transfer rate | D |

**P8 · Sentiment, trust & social finance (behavioural)**
| Question | Type | Indicator | D/I |
|---|---|---|---|
| Do you trust banks with your money? `[core]` | Y/N | bank-trust index | D |
| Would you keep *new* savings in LBP? `[core]` | Y/N | currency-confidence index | I |
| Trust the government to manage the economy? `[ext]` | Y/N | institutional-trust index | D |
| Financially better/same/worse than a year ago? `[core]` | 3-way | household sentiment | D |
| Expect your finances to improve next year? `[core]` | Y/N | household optimism | D |
| Seriously considering emigrating in 12 months? `[core]` | Y/N | emigration-intent rate | D |
| Deferred a major purchase due to uncertainty? `[ext]` | Y/N | precautionary-deferral rate | I |
| Prefer USD pay even at a lower nominal amount? `[ext]` | Y/N | dollarization preference | I |

**P9 · Anchors (used for weighting AND as segmentation dimensions)**
age band · governorate · gender (optional) · employment status · household-size band · **education level** · **field/sector of work**. These are how every numeric answer gets sliced (§2.11).

### BUSINESSES

**B1 · Banking & credit**
| Question | Type | Indicator | D/I |
|---|---|---|---|
| Can your business access its bank deposits? `[core]` | Y/N | **frozen-business-deposit rate** (flagship) | D |
| Did the business lose deposits to the crisis? `[core]` | Y/N | business crisis-loss | D |
| Do you use a Lebanese business bank account? `[core]` | Y/N | business debanking | D |
| Could you get a bank loan if you needed one? `[core]` | Y/N | credit-access rate (~0 = the story) | D |
| Carrying debt you can't service? `[ext]` | Y/N | distressed-debt rate | D |

**B2 · Pricing & currency**
| Question | Type | Indicator | D/I |
|---|---|---|---|
| Do you price mainly in USD or LBP? `[core]` | USD / LBP / both | pricing-dollarization rate | D |
| Did you change prices in the last month? `[core]` | Y/N | price-change pulse (inflation) | D |
| Payment accepted: cash-USD / LBP / card / app? `[core]` | multi | payment-mix | D |
| Re-peg prices to the parallel rate daily? `[ext]` | Y/N | rate-pass-through speed | I |

**B3 · Costs & operations**
| Question | Type | Indicator | D/I |
|---|---|---|---|
| Run on a private generator? `[core]` | Y/N | firm generator-reliance | D |
| Is electricity among your top-3 costs? `[core]` | Y/N | energy-cost burden | I |
| Import most of your inputs? `[core]` | Y/N | import-dependence | D |
| Supply disruptions in the last 3 months? `[ext]` | Y/N | supply-stress rate | D |
| Pay suppliers in fresh USD? `[ext]` | Y/N | supplier-dollarization | I |

**B4 · Employment & wages**
| Question | Type | Indicator | D/I |
|---|---|---|---|
| Hired / held / laid off staff in last 6 months? `[core]` | 3-way | employment direction (real-time) | D |
| Cut wages in the last year? `[ext]` | Y/N | wage-cut incidence | D |
| Pay staff in fresh USD? `[core]` | Y/N | firm wage-dollarization | D |
| Struggle to find/retain staff (emigration)? `[core]` | Y/N | labour-supply squeeze | I |

**B5 · Performance & outlook (behavioural)**
| Question | Type | Indicator | D/I |
|---|---|---|---|
| Revenue better/same/worse vs a year ago? `[core]` | 3-way | business-cycle sentiment | D |
| Operating at profit / breakeven / loss? `[core]` | 3-way | profitability mix | D |
| Customer demand up/same/down? `[core]` | 3-way | demand pulse | D |
| Plan to expand / hold / downsize next 6 mo? `[core]` | 3-way | investment intent | D |
| Considered closing or relocating abroad? `[ext]` | Y/N | exit-intent rate | I |

**B6 · Coarse anchors** sector bucket · governorate · size band (micro/small/medium) · years operating.
`[⚠ defer]` registration / VAT status (informality) — anonymous-aggregate likely fine but needs legal sign-off.

### 2.7 Derived composite indices (the moat — SPEC Layer 3)
Built deterministically from the above, each a 0–100 index with published weights:
- **Household Financial Distress Index** — frozen deposits + income-didn't-cover + skipped meals + delayed healthcare + arrears + distress-borrowing.
- **Household Coping Index** — generator reliance + downtrading + asset depletion + aid dependence.
- **Currency-Confidence Index** — keep-LBP-savings + trust-banks + USD-pay-preference (inverted).
- **Business Confidence Index** — revenue direction + demand + hiring + expansion intent + profitability.
- **Business Distress Index** — frozen deposits + can't-service-debt + supply stress + wage cuts.
- Standalone headline rates: **debanking rate**, **wage-dollarization rate**, **emigration-intent rate**, **food-insecurity rate**, **frozen-business-deposit rate**.

### 2.8 Divergence pairs (the killer feature)
Each community number shown beside its institutional counterpart; the gap is the insight:
- community **rent paid** ↔ OLX **rent asked**
- median **reported income** ↔ official **minimum wage**
- **food-insecurity rate** ↔ WFP **food-basket cost / min wage**
- lived **unemployment** ↔ World Bank **unemployment**
- **generator-reliance rate** ↔ Places **generator-shop density**
- business **deposit access** ↔ (no official equivalent — pure gap)

### 2.9 Modular rotation (managing survey fatigue)
No one answers ~50 questions. Each submission =
1. **Anchors** (≤5, every wave) — for weighting + suppression.
2. **Core block** (~8 fast `[core]` questions, every wave) — the headline series with continuous time coverage.
3. **One rotating module** (~5 `[ext]` questions, drawn from a rotating domain) — deeper coverage at lower frequency.

This keeps any single form to ~15 questions (≈2 min), preserves continuous core trends, and still covers the full bank across waves. n-thresholds (§3) apply per question, so rotating-module indicators simply update on a slower cadence and are labelled with their wave.

### 2.10 Numeric & banded questions (averages, not just %)
Beyond yes/no, ask **banded numerics** — bands, never exact values, for privacy, anti-gaming, and better response quality. Each yields a **mean/median per segment**.

**People**
| Question | Captured as | Yields |
|---|---|---|
| Monthly income + currency | band (<$200 / 200–500 / 500–1k / 1k–2k / 2k–4k / 4k+) | average & distribution of income |
| Age | band | segmentation dimension |
| Household size | band | per-capita calcs |
| **Spending diary** — approx monthly spend on food · rent · electricity+generator · transport/fuel · health · education · communications · other | band per category | **average spend per category + spending shares** = a crowd-built consumption basket |
| What you could save last month | band | savings-capacity distribution |

**Business**
| Question | Captured as | Yields |
|---|---|---|
| Monthly revenue | band | average revenue by sector/size |
| Number of employees | band | headcount distribution |
| Profit margin | band, or profit/breakeven/loss | margin distribution |
| Energy share of costs | band (%) | energy-burden distribution |
| Share of revenue in USD | band (%) | revenue-dollarization |

**Numeric hygiene:** report **median + trimmed mean** (income/spend are right-skewed), winsorize at P1/P99, bands themselves cap outliers and gaming, and require **n ≥ 30** per published mean.

The spending diary is the highest-value piece: summing the category bands gives a **household monthly outlay**, and the category shares give **live CPI weights** — a direct, current alternative to the official basket frozen at 2004–05 (SPEC Phase-3 "scraped price index" goal, reached from the demand side).

### 2.11 Segmented indicators & the small-cell rule (the cross-tab engine)
The leap from "% who…" to **"average X by Y"**. Any numeric/categorical answer can be sliced by the segmentation dimensions: governorate · age band · education · field/sector · employment status · (business: sector, size). That yields families like:
- average **income by sector**, **by education**, **by age band**, **by governorate**
- **spending share on food by income band** (Engel's law, live)
- business **margin by sector × size**
- **emigration-intent by age × education** (exactly *who* is leaving)

**The hard rule — curse of dimensionality + re-identification:** publish **1-way marginals and 2-way cross-tabs only**, never the full cube. Income × sector × age × education × governorate is thousands of cells, each near-empty even at 1,000/region, and small cells re-identify people. So: 1-way always; **2-way only where every cell ≥ n_min**; 3-way+ used internally (for weighting) but **never published**. Every published cell carries its n and is suppressed below threshold.

### 2.12 Regional → national (the aggregation model)
The "1,000 per region → regional picture → national picture" instinct is right, with one correction: **the national figure is a population-weighted roll-up of the regional ones, not a raw pool.** Beirut will flood with responses, Akkar will trickle — raw pooling would over-represent the loud regions. So:
1. Publish a **regional** figure once that governorate clears n_min (a few hundred gives usable proportions; ~1,000 gives tight CIs and reliable 2-way cross-tabs).
2. Weight each region by its **OCHA population share** → the **national** figure.
3. Show n + CI on every map cell; grey out governorates still below threshold as "insufficient sample" rather than guessing.

The **map is the product**: a Lebanon choropleth per indicator, each governorate shaded by its value (greyed where n too low), with an honest weighted national headline above it.

---

## 3. Anti-abuse pipeline (six layers)

Assume bad actors (landlord lobbies, political operators, bots). Defence in depth:

1. **Entry gate** — Cloudflare Turnstile (privacy-preserving, no account), honeypot fields, server-issued single-use submit token, minimum completion time (reject < ~8 s).
2. **Privacy-preserving uniqueness** — `dedup_hash = HMAC(wave_salt, IP + coarse-UA)`; salt rotates per wave; hash retained only for the wave's dedup window then discarded; **never joined to the answer record in storage**. Limit: 1 person + 1 business submission per hash per wave; IP velocity cap per hour.
3. **Response validation** — cross-question consistency (reject contradictions), straight-lining detection, required anchors present.
4. **Statistical / wave defence** — publish a cell only at **n ≥ 30**; per-wave anomaly detection (z-score on answer-share + submission velocity vs prior waves and vs other governorates); proportions published with a **Wilson confidence interval**.
5. **Weighting** *(v2)* — post-stratify ("rake") anchors to known population marginals (OCHA population) to dampen self-selection; publish **both raw and weighted**, always with unweighted n.
6. **Governance** — anomalous waves route to a human review queue before publish (mirrors the AI sample-audit); public wave changelog + retraction log.

---

## 4. Privacy & safety (non-negotiable, Lebanon context)

- **Zero PII.** No name, email, phone, precise location, or stored clear IP.
- **Geo = governorate** (district only where n is large); suppress any cell below threshold.
- **Businesses:** broad sector buckets, governorate-level only, aggressive small-cell suppression (sector × gov × size can re-identify a single firm).
- `dedup_hash` salted, rotated, short-retention, never linked to published aggregates.
- Hosting outside Lebanon, encrypted at rest (SPEC §security). **Legal review before launch.**
- Strictly economic/behavioural — no political identification, no investigative content (that is the firewalled Accountability Arm, SPEC §7).

---

## 5. Data model

- New trust label: **`self_reported`** (extend the enum).
- Private `survey_response`: `{ wave_id, type: person|business, governorate, anchors{age_band, education, sector, …}, module_id, answers{}, submitted_at, integrity_flags }` — never exposed; only aggregates published.
- Published aggregate per (question→indicator, **segment**, wave): for proportions → `proportion, n, ci_low, ci_high`; for numerics → `median, trimmed_mean, p25, p75, n`. `segment` is the cross-tab key (1-way or 2-way: e.g. `{governorate}` or `{sector, size}`), always carrying `n` and suppressed below threshold.
- National rows are population-weighted roll-ups (flagged `weighted: true`); regional rows are raw-with-CI.
- Indicator metadata gains optional `divergence_pair` (link to the institutional counterpart) and `module_id` (rotating question).

---

## 6. Rendering

- **Contribute surface** — short, mobile-first, bilingual, ~15 questions (anchors + core + one module), progress bar, no PII, Turnstile. Branches "resident" vs "business".
- **Community-reported section** — visually distinct from the sourced catalogue; every value shows **n + confidence band + "self-reported, may not be representative"**.
- **Divergence cards** — official vs lived, side by side, gap called out.
- **Index dials** — the composite indices as simple 0–100 gauges over time.

---

## 7. Cadence & v1 cut

- **Wave-based:** monthly. Core block every wave (continuous trend); modules rotate.
- **v1 ships:** people + business, `[core]` questions only; modular rotation scaffold; Turnstile + honeypot + dedup-hash + consistency + n≥30 + Wilson CI; raw (unweighted) only; quarantined section; 3–4 divergence cards; 2 composite indices (Household Distress, Business Confidence).
- **v2:** `[ext]` modules, weighting, sensitive `[⚠]` questions, remaining composites.
- **Gate:** does NOT go live until legal review is done and anti-abuse layers 1–4 are working. Half-measures here are worse than not shipping.

---

## 8. Honest risk register

| Risk | Mitigation |
|---|---|
| Coordinated stuffing skews a number | n≥30, wave anomaly detection, human review, Wilson CI, dedup-hash + Turnstile |
| Self-selection (non-representative) | stated as a feature; raw n always shown; weighting in v2; never claim representativeness |
| Re-identification (esp. business) | governorate-only, broad buckets, small-cell suppression, zero PII |
| Contaminating the catalogue's trust | hard quarantine: separate section, `self_reported` label, deletable without affecting the spine |
| Becoming a politicised UGC platform | strictly economic/behavioural questions; no political ID; firewall from Accountability Arm |
| Survey fatigue → low completion | modular rotation: ≤15 questions per submission (~2 min) |
