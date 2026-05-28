// Affordability derive step — SPEC Layer 3 (processing / derived).
// Pure deterministic combination of already-ingested observations:
//   food_basket_pct_min_wage = food_basket_usd ÷ minimum_wage_usd × 100
// per governorate per month. Trust = modeled (inherits the weakest input).
// No network, no AI — reads canonical store, writes a derived series.

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  isoDate,
  logConnectorRun,
  mergeObservations,
} from "../lib/connector-utils";
import type { IndicatorObservationsFile, Observation } from "../../src/data/types";

const CANON = path.join(process.cwd(), "data", "canonical");

async function readObs(code: string): Promise<Observation[]> {
  try {
    const f = JSON.parse(
      await fs.readFile(path.join(CANON, `${code}.json`), "utf-8")
    ) as IndicatorObservationsFile;
    return f.observations;
  } catch {
    return [];
  }
}

// Nominal monthly minimum wage in LBP by year (mirrors reference.ts decrees).
// We compute the ratio in LBP so FX cancels entirely — no "which dollar" trap.
const MIN_WAGE_LBP: Array<{ from: string; lbp: number }> = [
  { from: "2012-01", lbp: 675_000 },
  { from: "2023-04", lbp: 9_000_000 },
  { from: "2024-04", lbp: 18_000_000 },
];

function minWageLbpFor(ym: string): number {
  let val = MIN_WAGE_LBP[0].lbp;
  for (const m of MIN_WAGE_LBP) if (ym >= m.from) val = m.lbp;
  return val;
}

async function run() {
  const fetched_at = isoDate();
  // Use the REAL nominal LBP basket (WFP raw prices), not a USD reconstruction.
  const basket = await readObs("mabii.prices.food_basket_lbp");

  if (basket.length === 0) {
    console.error("[affordability] missing input mabii.prices.food_basket_lbp. Run wfp first.");
    process.exit(1);
  }

  const out: Observation[] = [];
  for (const b of basket) {
    const ym = b.period_end.slice(0, 7);
    const basketLbp = b.value; // already nominal LBP
    const wageLbp = minWageLbpFor(ym);
    if (wageLbp <= 0) continue;
    const pct = Math.round((basketLbp / wageLbp) * 1000) / 10;
    out.push({
      indicator_code: "mabii.social.food_basket_pct_min_wage",
      geography_id: b.geography_id,
      period_start: b.period_start,
      period_end: b.period_end,
      frequency: "monthly",
      value: pct,
      unit: "%",
      source_id: "mabii-reference",
      raw_ref: `derived:${b.raw_ref}`,
      trust_label: "modeled",
      extraction_method: "derived",
      method_note: `basket≈${Math.round(basketLbp).toLocaleString()} LBP ÷ min wage ${wageLbp.toLocaleString()} LBP (computed in LBP; FX-independent)`,
      fetched_at,
      version: 1,
    });
  }

  const stats = await mergeObservations("mabii.social.food_basket_pct_min_wage", out);
  logConnectorRun("derive/affordability", {
    "mabii.social.food_basket_pct_min_wage": stats,
  });
}

run().catch((err) => {
  console.error("[affordability] fatal:", err);
  process.exit(1);
});
