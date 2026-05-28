// FRED (St. Louis Fed) connector — T1, deterministic, no AI.
// Requires FRED_API_KEY env var. https://fred.stlouisfed.org/docs/api/fred/

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

const SOURCE_ID = "fred";

interface FredObservation {
  date: string;
  value: string;
}
interface FredResponse {
  observations: FredObservation[];
}

const API_KEY = process.env.FRED_API_KEY ?? "";

async function pullSeries(nativeCode: string): Promise<FredObservation[]> {
  if (!API_KEY) {
    throw new Error(
      "FRED_API_KEY is not set. Get a free key at https://fred.stlouisfed.org/docs/api/api_key.html"
    );
  }
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${encodeURIComponent(
    nativeCode
  )}&api_key=${API_KEY}&file_type=json`;
  const data = (await fetchJson(url)) as FredResponse;
  return data.observations.filter((o) => o.value !== "." && o.value !== "");
}

async function run() {
  const source = sources.find((s) => s.id === SOURCE_ID)!;
  const fetched_at = isoDate();
  const filter = parseCodesFilter();
  const results: Record<
    string,
    { added: number; updated: number; total: number }
  > = {};

  for (const ind of indicators) {
    const mapping = ind.sources.find((s) => s.source_id === SOURCE_ID);
    if (!mapping) continue;
    if (!shouldProcess(ind.code, filter)) continue;

    console.log(`[fred] fetching ${ind.code} (${mapping.source_native_code})`);
    let rows: FredObservation[];
    try {
      rows = await pullSeries(mapping.source_native_code);
    } catch (err) {
      console.error(`[fred] failed ${mapping.source_native_code}:`, err);
      continue;
    }

    const raw = await writeRaw(
      SOURCE_ID,
      rows,
      `${mapping.source_native_code}.json`
    );

    const observations: Observation[] = rows.map((row) => {
      const year = Number.parseInt(row.date.slice(0, 4), 10);
      const { period_start, period_end } = annualPeriod(year);
      return {
        indicator_code: ind.code,
        geography_id: ind.geography_id,
        period_start,
        period_end,
        frequency: "annual",
        value: Number.parseFloat(row.value),
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

if (!API_KEY) {
  console.log(
    "[fred] skipping — FRED_API_KEY not set. Set it in .env.local to enable this connector."
  );
} else {
  run().catch((err) => {
    console.error("[fred] fatal:", err);
    process.exit(1);
  });
}
