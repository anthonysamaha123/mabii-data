// IMF DataMapper API — T1, deterministic, no AI.
// Public endpoint: https://www.imf.org/external/datamapper/api/v1/{INDICATOR}/{COUNTRY_ISO3}

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

const SOURCE_ID = "imf-weo";
const COUNTRY = "LBN";

interface IMFResponse {
  values: Record<string, Record<string, Record<string, number>>>;
}

/** WEO native unit normalisations: most series are already in target units,
 *  except a few that need scaling for direct comparability with WB. */
function normaliseValue(nativeCode: string, raw: number): number {
  // LP (population) is reported in millions in WEO; convert to absolute persons.
  if (nativeCode === "LP") return raw * 1_000_000;
  // NGDPD is reported in billions of USD in WEO; convert to absolute USD.
  if (nativeCode === "NGDPD") return raw * 1_000_000_000;
  return raw;
}

async function pullSeries(
  nativeCode: string
): Promise<Array<{ year: number; value: number }>> {
  const url = `https://www.imf.org/external/datamapper/api/v1/${encodeURIComponent(
    nativeCode
  )}/${COUNTRY}`;
  const data = (await fetchJson(url)) as IMFResponse;
  const seriesObj = data?.values?.[nativeCode]?.[COUNTRY];
  if (!seriesObj) {
    throw new Error(
      `IMF response missing values.${nativeCode}.${COUNTRY}; got ${JSON.stringify(
        data
      ).slice(0, 200)}`
    );
  }
  return Object.entries(seriesObj)
    .map(([y, v]) => ({ year: Number.parseInt(y, 10), value: v }))
    .filter((r) => Number.isFinite(r.year) && Number.isFinite(r.value));
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

    console.log(`[imf] fetching ${ind.code} (${mapping.source_native_code})`);

    let rows: Array<{ year: number; value: number }>;
    try {
      rows = await pullSeries(mapping.source_native_code);
    } catch (err) {
      console.error(`[imf] failed ${mapping.source_native_code}:`, err);
      continue;
    }

    const filename = `${mapping.source_native_code}.json`;
    const raw = await writeRaw(SOURCE_ID, rows, filename);

    const observations: Observation[] = rows.map((r) => {
      const { period_start, period_end } = annualPeriod(r.year);
      return {
        indicator_code: ind.code,
        geography_id: ind.geography_id,
        period_start,
        period_end,
        frequency: "annual",
        value: normaliseValue(mapping.source_native_code, r.value),
        unit: ind.default_unit,
        source_id: SOURCE_ID,
        raw_ref: raw.hash,
        trust_label: source.trust_label_default,
        extraction_method: "api",
        fetched_at,
        version: 1,
        method_note: mapping.reconciliation_notes,
      };
    });

    const stats = await mergeObservations(ind.code, observations);
    results[ind.code] = stats;
  }

  logConnectorRun(SOURCE_ID, results);
}

run().catch((err) => {
  console.error("[imf] fatal:", err);
  process.exit(1);
});
