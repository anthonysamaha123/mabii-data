// WHO Global Health Observatory connector — T1, deterministic, no AI.
// Endpoint: https://ghoapi.azureedge.net/api/{INDICATOR}?$filter=SpatialDim eq 'LBN'

import {
  annualPeriod,
  fetchJson,
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

const SOURCE_ID = "who-gho";
const COUNTRY_ISO3 = "LBN";

interface GhoRow {
  IndicatorCode: string;
  SpatialDim: string;
  TimeDimType: string;
  TimeDim: number;
  NumericValue: number | null;
  Dim1?: string | null;
  Dim2?: string | null;
}

interface GhoResponse {
  value: GhoRow[];
}

async function pullSeries(nativeCode: string): Promise<Array<{ year: number; value: number }>> {
  const filter = `SpatialDim eq '${COUNTRY_ISO3}'`;
  const url = `https://ghoapi.azureedge.net/api/${encodeURIComponent(nativeCode)}?$filter=${encodeURIComponent(filter)}`;
  const data = (await fetchJson(url, { timeoutMs: 45_000 })) as GhoResponse;
  if (!data?.value?.length) return [];

  // Some indicators are disaggregated by Dim1 (SEX, AGEGROUP). Prefer rows
  // where Dim1 is the totals/aggregate value; if Dim1 isn't present or has
  // no "BTSX"/total marker, just use the first matching row per year.
  const byYear = new Map<number, number>();
  // Prefer Dim1 === 'BTSX' (both sexes) when present
  const preferred = data.value.filter((r) => r.Dim1 === "BTSX" || r.Dim1 == null);
  const rows = preferred.length > 0 ? preferred : data.value;

  for (const row of rows) {
    if (row.TimeDimType !== "YEAR") continue;
    if (row.NumericValue == null || !Number.isFinite(row.NumericValue)) continue;
    const yr = Number(row.TimeDim);
    if (!Number.isFinite(yr)) continue;
    // First-wins per year (preferred rows come first)
    if (!byYear.has(yr)) byYear.set(yr, row.NumericValue);
  }
  return Array.from(byYear.entries())
    .map(([year, value]) => ({ year, value }))
    .sort((a, b) => a.year - b.year);
}

async function run() {
  const source = sources.find((s) => s.id === SOURCE_ID)!;
  const fetched_at = isoDate();
  const filter = parseCodesFilter();
  const results: Record<string, { added: number; updated: number; total: number }> = {};

  for (const ind of indicators) {
    const mapping = ind.sources.find((s) => s.source_id === SOURCE_ID);
    if (!mapping) continue;
    if (!shouldProcess(ind.code, filter)) continue;

    console.log(`[who] fetching ${ind.code} (${mapping.source_native_code})`);
    let rows: Array<{ year: number; value: number }>;
    try {
      rows = await pullSeries(mapping.source_native_code);
    } catch (err) {
      console.error(`[who] failed ${mapping.source_native_code}:`, err);
      continue;
    }
    if (rows.length === 0) {
      console.warn(`[who] empty response for ${mapping.source_native_code}`);
      continue;
    }

    const raw = await writeRaw(SOURCE_ID, rows, `${mapping.source_native_code}.json`);
    const observations: Observation[] = rows.map((r) => {
      const { period_start, period_end } = annualPeriod(r.year);
      return {
        indicator_code: ind.code,
        geography_id: ind.geography_id,
        period_start,
        period_end,
        frequency: "annual",
        value: r.value,
        unit: ind.default_unit,
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
  console.error("[who] fatal:", err);
  process.exit(1);
});
