// ILOSTAT connector — T1, deterministic, no AI.
// SDMX-CSV bulk endpoint: https://www.ilo.org/sdmx/rest/data/ILO,DF_{flow},latest/{key}?format=csv
// Native code format in catalog: "{flow}/{key}"  (e.g. "EAP_DWAP_SEX_AGE_RT/A.LBN.SEX_T.AGE_AGGREGATE_Y15+")

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

const SOURCE_ID = "ilostat";

async function fetchCsv(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(60_000),
    headers: {
      "user-agent": "Mabii/0.1 (https://mabii.org; contact: hello@mabii.org)",
      accept: "text/csv,application/vnd.sdmx.data+csv",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/** Parse SDMX-CSV from ILO. Returns annual aggregate rows for Lebanon. */
function parseIloCsv(csv: string): Array<{ year: number; value: number }> {
  const lines = csv.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((c) => c.replace(/"/g, "").trim());
  const periodIdx = header.findIndex((c) => /^TIME_PERIOD$|^Time Period$/i.test(c));
  const valueIdx = header.findIndex((c) => /^OBS_VALUE$|^Obs Value$/i.test(c));
  if (periodIdx === -1 || valueIdx === -1) return [];

  const rows: Array<{ year: number; value: number }> = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split(",").map((c) => c.replace(/"/g, "").trim());
    const period = cols[periodIdx];
    const year = Number.parseInt(period?.slice(0, 4) ?? "", 10);
    const value = Number.parseFloat(cols[valueIdx]);
    if (!Number.isFinite(year) || !Number.isFinite(value)) continue;
    rows.push({ year, value });
  }
  return rows.sort((a, b) => a.year - b.year);
}

async function pullSeries(nativeCode: string): Promise<Array<{ year: number; value: number }>> {
  const [flow, key] = nativeCode.split("/", 2);
  if (!flow || !key) {
    throw new Error(`ILO native code must be "flow/key"; got "${nativeCode}"`);
  }
  const url = `https://www.ilo.org/sdmx/rest/data/ILO,DF_${flow},latest/${key}?format=csv&startPeriod=2000`;
  const csv = await fetchCsv(url);
  return parseIloCsv(csv);
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

    console.log(`[ilostat] fetching ${ind.code} (${mapping.source_native_code})`);
    let rows: Array<{ year: number; value: number }>;
    try {
      rows = await pullSeries(mapping.source_native_code);
    } catch (err) {
      console.error(`[ilostat] failed ${mapping.source_native_code}:`, err);
      continue;
    }
    if (rows.length === 0) {
      console.warn(`[ilostat] empty response for ${mapping.source_native_code}`);
      continue;
    }

    const safeFilename = mapping.source_native_code.replace(/[^\w-]/g, "_") + ".json";
    const raw = await writeRaw(SOURCE_ID, rows, safeFilename);
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
  console.error("[ilostat] fatal:", err);
  process.exit(1);
});
