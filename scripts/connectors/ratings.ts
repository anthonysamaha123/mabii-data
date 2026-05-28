// Sovereign credit ratings — manually curated static dataset.
// Worldmonitor-style: when the data volume is small and the source is paid,
// hand-curate a free substitute from the agencies' public press releases.
//
// This connector does no HTTP. It writes one observation per year from a
// fixed table. Update by editing the SP_HISTORY / MOODYS_HISTORY arrays.

import {
  annualPeriod,
  isoDate,
  logConnectorRun,
  mergeObservations,
  parseCodesFilter,
  shouldProcess,
  writeRaw,
} from "../lib/connector-utils";
import { indicators } from "../../src/data/catalog/indicators";
import { sources } from "../../src/data/catalog/sources";
import type { Observation } from "../../src/data/types";

const SOURCE_ID = "sovereign-ratings";

// S&P long-term foreign currency rating ladder.
// Ladder: SD/D=1, CC=2, CCC−=3, CCC=4, CCC+=5, B−=6, B=7, B+=8, BB−=9, BB=10,
// BB+=11, BBB−=12, BBB=13, BBB+=14, A−=15, A=16, A+=17, AA−=18, AA=19, AA+=20,
// AAA−=21, AAA=22.
//
// Moody's mapped to the same scale via standard correspondence:
// C=1, Ca=2, Caa3=3, Caa2=4, Caa1=5, B3=6, B2=7, B1=8, Ba3=9, Ba2=10,
// Ba1=11, Baa3=12, Baa2=13, Baa1=14, A3=15, A2=16, A1=17, Aa3=18, Aa2=19,
// Aa1=20, Aaa=22 (no Aaa−).
//
// Year = end-of-year rating (last public action that year, or carry-forward).
// Hand-curated from S&P / Moody's public press releases.

interface RatingPoint {
  year: number;
  step: number;
  label: string;
}

const SP_HISTORY: RatingPoint[] = [
  { year: 2015, step: 6, label: "B-" },
  { year: 2016, step: 6, label: "B-" },
  { year: 2017, step: 6, label: "B-" },
  { year: 2018, step: 6, label: "B-" },
  { year: 2019, step: 3, label: "CCC-" }, // August + November downgrades
  { year: 2020, step: 1, label: "SD" }, // March 2020 default
  { year: 2021, step: 1, label: "SD" },
  { year: 2022, step: 1, label: "SD" },
  { year: 2023, step: 1, label: "SD" },
  { year: 2024, step: 1, label: "SD" },
  { year: 2025, step: 1, label: "SD" },
];

const MOODYS_HISTORY: RatingPoint[] = [
  { year: 2015, step: 7, label: "B2" },
  { year: 2016, step: 7, label: "B2" },
  { year: 2017, step: 6, label: "B3" },
  { year: 2018, step: 6, label: "B3" },
  { year: 2019, step: 5, label: "Caa1" },
  { year: 2020, step: 1, label: "C" }, // July 2020 downgrade
  { year: 2021, step: 1, label: "C" },
  { year: 2022, step: 1, label: "C" },
  { year: 2023, step: 1, label: "C" },
  { year: 2024, step: 1, label: "C" },
  { year: 2025, step: 1, label: "C" },
];

const HISTORY_BY_CODE: Record<string, { native: string; history: RatingPoint[] }> = {
  "mabii.governance.sp_sovereign_rating": {
    native: "sp.lebanon.lt_fc",
    history: SP_HISTORY,
  },
  "mabii.governance.moodys_sovereign_rating": {
    native: "moodys.lebanon.lt_fc",
    history: MOODYS_HISTORY,
  },
};

async function run() {
  const source = sources.find((s) => s.id === SOURCE_ID)!;
  const fetched_at = isoDate();
  const filter = parseCodesFilter();
  const results: Record<string, { added: number; updated: number; total: number }> = {};

  for (const ind of indicators) {
    const mapping = ind.sources.find((s) => s.source_id === SOURCE_ID);
    if (!mapping) continue;
    if (!shouldProcess(ind.code, filter)) continue;
    const entry = HISTORY_BY_CODE[ind.code];
    if (!entry) continue;

    // Persist a tiny "raw" snapshot for the audit trail — the hardcoded array itself.
    const raw = await writeRaw(SOURCE_ID, entry.history, `${entry.native}.json`);

    const observations: Observation[] = entry.history.map((pt) => {
      const { period_start, period_end } = annualPeriod(pt.year);
      return {
        indicator_code: ind.code,
        geography_id: ind.geography_id,
        period_start,
        period_end,
        frequency: "annual",
        value: pt.step,
        unit: ind.default_unit,
        source_id: SOURCE_ID,
        raw_ref: raw.hash,
        trust_label: source.trust_label_default,
        extraction_method: "manual",
        method_note: `Rating: ${pt.label}`,
        fetched_at,
        version: 1,
      };
    });

    console.log(`[ratings] ${ind.code}: ${observations.length} hand-curated points`);
    const stats = await mergeObservations(ind.code, observations);
    results[ind.code] = stats;
  }

  logConnectorRun(SOURCE_ID, results);
}

run().catch((err) => {
  console.error("[ratings] fatal:", err);
  process.exit(1);
});
