// UN Comtrade connector — T1, deterministic, no AI.
// Public endpoint: https://comtradeapi.un.org/public/v1/preview/{typeCode}/{freqCode}/{clCode}
// We pull Lebanon (842 in UN M49) headline goods totals (HS '__TOTAL') for export and import.

import {
  annualPeriod,
  fetchJson,
  isoDate,
  logConnectorRun,
  mergeObservations,
  writeRaw,
} from "../lib/connector-utils";
import { indicators } from "../../src/data/catalog/indicators";
import { sources } from "../../src/data/catalog/sources";
import type { Observation } from "../../src/data/types";

const SOURCE_ID = "un-comtrade";
const LEBANON_M49 = "422";

interface ComtradeRow {
  period: number;
  reporterCode: number;
  flowCode: string;
  cmdCode: string;
  primaryValue: number;
}
interface ComtradeResponse {
  count: number;
  data?: ComtradeRow[];
}

// flow codes: X = export, M = import.
// Comtrade preview rejects period=all; needs explicit comma-separated years
// (and caps the range per call). Pulling 2005→current year in two chunks.
async function pullSeries(flowCode: "X" | "M"): Promise<ComtradeRow[]> {
  const currentYear = new Date().getUTCFullYear();
  const chunks: number[][] = [];
  let buf: number[] = [];
  for (let y = 2005; y <= currentYear; y += 1) {
    buf.push(y);
    if (buf.length === 10) {
      chunks.push(buf);
      buf = [];
    }
  }
  if (buf.length > 0) chunks.push(buf);

  const all: ComtradeRow[] = [];
  for (const chunk of chunks) {
    const period = chunk.join(",");
    // partnerCode=0 → "World" (sum across all partners). Without this filter
    // the endpoint returns per-partner rows, which our key collapses incorrectly.
    const url = `https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=${LEBANON_M49}&flowCode=${flowCode}&cmdCode=TOTAL&partnerCode=0&partner2Code=0&period=${period}`;
    const data = (await fetchJson(url, { timeoutMs: 60_000 })) as ComtradeResponse;
    if (data.data) all.push(...data.data);
  }
  return all;
}

async function run() {
  const source = sources.find((s) => s.id === SOURCE_ID)!;
  const fetched_at = isoDate();
  const results: Record<
    string,
    { added: number; updated: number; total: number }
  > = {};

  // Map indicator codes to comtrade flow codes
  const flowByIndicator: Record<string, "X" | "M"> = {
    "mabii.trade.exports_goods_usd": "X",
    "mabii.trade.imports_goods_usd": "M",
  };

  for (const ind of indicators) {
    const mapping = ind.sources.find((s) => s.source_id === SOURCE_ID);
    if (!mapping) continue;
    const flow = flowByIndicator[ind.code];
    if (!flow) continue;

    console.log(`[comtrade] fetching ${ind.code} (flow=${flow})`);
    let rows: ComtradeRow[];
    try {
      rows = await pullSeries(flow);
    } catch (err) {
      console.error(`[comtrade] failed for ${ind.code}:`, err);
      continue;
    }
    if (rows.length === 0) {
      console.warn(`[comtrade] empty response for ${ind.code}`);
      continue;
    }

    const raw = await writeRaw(SOURCE_ID, rows, `${flow}_TOTAL.json`);

    const observations: Observation[] = rows
      .filter((r) => Number.isFinite(r.primaryValue))
      .map((r) => {
        const year = r.period;
        const { period_start, period_end } = annualPeriod(year);
        return {
          indicator_code: ind.code,
          geography_id: ind.geography_id,
          period_start,
          period_end,
          frequency: "annual",
          value: r.primaryValue,
          unit: "USD",
          source_id: SOURCE_ID,
          raw_ref: raw.hash,
          trust_label: source.trust_label_default,
          extraction_method: "api",
          fetched_at,
          version: 1,
        };
      });

    const stats = await mergeObservations(ind.code, observations);
    results[ind.code] = stats;
  }

  logConnectorRun(SOURCE_ID, results);
}

run().catch((err) => {
  console.error("[comtrade] fatal:", err);
  process.exit(1);
});
