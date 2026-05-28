// Mabii cited reference constants — hand-entered, sourced figures with no API.
// Currently: the monthly minimum wage in USD at the parallel rate, which tells
// the wage-collapse story better than any single number.
//
// Sources (cited): Lebanese minimum-wage decrees + parallel FX (lirarate /
// WFP unofficial). Each annual point notes the nominal LBP and the rate used.

import {
  isoDate,
  logConnectorRun,
  mergeObservations,
  parseCodesFilter,
  shouldProcess,
} from "../lib/connector-utils";
import type { Observation } from "../../src/data/types";

const SOURCE_ID = "mabii-reference";

// year → { nominal LBP/month (decree), representative parallel LBP/USD }
const MIN_WAGE: Array<{ year: number; lbp: number; rate: number; note: string }> = [
  { year: 2019, lbp: 675_000, rate: 1_507.5, note: "Decree 675k LBP; peg held at 1,507.5" },
  { year: 2020, lbp: 675_000, rate: 6_000, note: "Decree 675k LBP; parallel ~6,000" },
  { year: 2021, lbp: 675_000, rate: 16_000, note: "Decree 675k LBP; parallel ~16,000" },
  { year: 2022, lbp: 675_000, rate: 30_000, note: "Decree 675k LBP; parallel ~30,000" },
  { year: 2023, lbp: 9_000_000, rate: 89_500, note: "Raised to 9M LBP (Apr 2023); parallel ~89,500" },
  { year: 2024, lbp: 18_000_000, rate: 89_500, note: "Raised to 18M LBP (2024); parallel ~89,500" },
  { year: 2025, lbp: 18_000_000, rate: 89_500, note: "18M LBP; parallel ~89,500" },
  { year: 2026, lbp: 18_000_000, rate: 89_700, note: "18M LBP; parallel ~89,700" },
];

async function run() {
  const fetched_at = isoDate();
  const filter = parseCodesFilter();
  const results: Record<string, { added: number; updated: number; total: number }> = {};

  if (shouldProcess("mabii.employment.minimum_wage_usd", filter)) {
    const obs: Observation[] = MIN_WAGE.map((m) => ({
      indicator_code: "mabii.employment.minimum_wage_usd",
      geography_id: "LBN",
      period_start: `${m.year}-01-01`,
      period_end: `${m.year}-12-31`,
      frequency: "annual",
      value: Math.round((m.lbp / m.rate) * 10) / 10,
      unit: "USD",
      currency: "USD",
      fx_basis: "unofficial parallel rate",
      source_id: SOURCE_ID,
      raw_ref: "reference:minimum_wage.decree",
      trust_label: "reference",
      extraction_method: "manual",
      method_note: m.note,
      fetched_at,
      version: 1,
    }));
    results["mabii.employment.minimum_wage_usd"] = await mergeObservations(
      "mabii.employment.minimum_wage_usd",
      obs
    );
  }

  logConnectorRun(SOURCE_ID, results);
}

run().catch((err) => {
  console.error("[reference] fatal:", err);
  process.exit(1);
});
