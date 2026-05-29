// World Bank Data360 connector — T1, deterministic, no AI, no API key.
// ONE connector for the entire Data360 platform: WDI (1,486 indicators), IMF
// WEO, Health (HNP), Gender, Education, and more — all SDMX-uniform.
//
// A catalog source mapping uses source_id "world-bank-data360" and a native
// code "DATABASE_ID:INDICATOR_ID" (e.g. "WB_HNP:WB_HNP_SP_DYN_IMRT_IN").
// Adding any new Data360 indicator is then a one-line catalog entry.

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

const SOURCE_ID = "world-bank-data360";
const COUNTRY = "LBN";

interface D360Row {
  OBS_VALUE: string;
  TIME_PERIOD: string;
  UNIT_MULT?: number | string;
  UNIT_MEASURE?: string | null;
  FREQ?: string;
  SEX?: string;
  AGE?: string;
  URBANISATION?: string;
  COMP_BREAKDOWN_1?: string;
  COMP_BREAKDOWN_2?: string;
  COMP_BREAKDOWN_3?: string;
}
interface D360Response {
  count: number;
  value: D360Row[];
}

const tot = (v: string | undefined) => v === undefined || v === "_T" || v === "_Z";
function isFullyTotal(r: D360Row): boolean {
  return (
    tot(r.SEX) && tot(r.AGE) && tot(r.URBANISATION) &&
    tot(r.COMP_BREAKDOWN_1) && tot(r.COMP_BREAKDOWN_2) && tot(r.COMP_BREAKDOWN_3)
  );
}

/**
 * One headline row per TIME_PERIOD: prefer the fully-total slice; if a series
 * has no total (e.g. women-in-parliament is inherently SEX=F) but exactly one
 * row that period, take it. Ambiguous multi-slice periods with no total are
 * skipped rather than guessed.
 */
function selectHeadline(rows: D360Row[]): D360Row[] {
  const byPeriod = new Map<string, D360Row[]>();
  for (const r of rows) {
    const arr = byPeriod.get(r.TIME_PERIOD) ?? [];
    arr.push(r);
    byPeriod.set(r.TIME_PERIOD, arr);
  }
  const out: D360Row[] = [];
  for (const group of byPeriod.values()) {
    const total = group.find(isFullyTotal);
    if (total) out.push(total);
    else if (group.length === 1) out.push(group[0]);
    // else: ambiguous (multiple non-total slices) → skip
  }
  return out;
}

async function pullSeries(databaseId: string, indicatorId: string): Promise<D360Row[]> {
  const url =
    `https://data360api.worldbank.org/data360/data` +
    `?DATABASE_ID=${encodeURIComponent(databaseId)}` +
    `&INDICATOR=${encodeURIComponent(indicatorId)}` +
    `&REF_AREA=${COUNTRY}`;
  const data = (await fetchJson(url, { timeoutMs: 45_000 })) as D360Response;
  if (!data?.value) throw new Error(`unexpected Data360 shape for ${indicatorId}`);
  return selectHeadline(data.value);
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

    const [databaseId, indicatorId] = mapping.source_native_code.split(":");
    if (!databaseId || !indicatorId) {
      console.warn(`[data360] ${ind.code}: native code must be "DATABASE:INDICATOR", got "${mapping.source_native_code}"`);
      continue;
    }

    console.log(`[data360] ${ind.code} (${databaseId}:${indicatorId})`);
    let rows: D360Row[];
    try {
      rows = await pullSeries(databaseId, indicatorId);
    } catch (err) {
      console.error(`[data360] failed ${ind.code}:`, err instanceof Error ? err.message : err);
      continue;
    }

    const raw = await writeRaw(SOURCE_ID, rows, `${indicatorId}.json`);
    const observations: Observation[] = [];
    for (const r of rows) {
      const year = Number.parseInt(r.TIME_PERIOD, 10);
      const raw_value = Number.parseFloat(r.OBS_VALUE);
      if (!Number.isFinite(year) || !Number.isFinite(raw_value)) continue;
      const mult = Number(r.UNIT_MULT ?? 0);
      const value = Number.isFinite(mult) && mult !== 0 ? raw_value * 10 ** mult : raw_value;
      const { period_start, period_end } = annualPeriod(year);
      observations.push({
        indicator_code: ind.code,
        geography_id: ind.geography_id,
        period_start,
        period_end,
        frequency: "annual",
        value,
        unit: r.UNIT_MEASURE || ind.default_unit,
        source_id: SOURCE_ID,
        raw_ref: raw.hash,
        trust_label: source.trust_label_default,
        extraction_method: "api",
        fetched_at,
        version: 1,
      });
    }
    if (observations.length) {
      results[ind.code] = await mergeObservations(ind.code, observations);
    } else {
      console.warn(`[data360] no observations for ${ind.code}`);
    }
  }

  logConnectorRun(SOURCE_ID, results);
}

run().catch((err) => {
  console.error("[data360] fatal:", err);
  process.exit(1);
});
