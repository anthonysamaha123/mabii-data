// World Bank WDI connector — T1, deterministic, no AI.
// API docs: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392

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

const SOURCE_ID = "world-bank-wdi";
const COUNTRY = "LBN";

interface WBObservation {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit: string;
  obs_status: string;
  decimal: number;
}

type WBResponse = [Record<string, unknown>, WBObservation[]];

async function pullSeries(nativeCode: string): Promise<WBObservation[]> {
  const url = `https://api.worldbank.org/v2/country/${COUNTRY}/indicator/${encodeURIComponent(
    nativeCode
  )}?format=json&per_page=20000`;
  const data = (await fetchJson(url)) as WBResponse;
  if (!Array.isArray(data) || data.length !== 2 || !Array.isArray(data[1])) {
    throw new Error(`Unexpected WB response shape for ${nativeCode}`);
  }
  return data[1].filter((o) => o.value !== null);
}

async function run() {
  const source = sources.find((s) => s.id === SOURCE_ID)!;
  const fetched_at = isoDate();
  const results: Record<
    string,
    { added: number; updated: number; total: number }
  > = {};

  for (const ind of indicators) {
    const mapping = ind.sources.find((s) => s.source_id === SOURCE_ID);
    if (!mapping) continue;

    console.log(`[world-bank] fetching ${ind.code} (${mapping.source_native_code})`);

    let rows: WBObservation[];
    try {
      rows = await pullSeries(mapping.source_native_code);
    } catch (err) {
      console.error(
        `[world-bank] failed to fetch ${mapping.source_native_code}:`,
        err
      );
      continue;
    }

    const filename = `${mapping.source_native_code}.json`;
    const raw = await writeRaw(SOURCE_ID, rows, filename);

    const observations: Observation[] = rows.map((row) => {
      const year = Number.parseInt(row.date, 10);
      const { period_start, period_end } = annualPeriod(year);
      return {
        indicator_code: ind.code,
        geography_id: ind.geography_id,
        period_start,
        period_end,
        frequency: "annual",
        value: row.value as number,
        unit: row.unit || ind.default_unit,
        source_id: SOURCE_ID,
        raw_ref: raw.hash,
        trust_label: source.trust_label_default,
        extraction_method: "api",
        vintage: undefined,
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
  console.error("[world-bank] fatal:", err);
  process.exit(1);
});
