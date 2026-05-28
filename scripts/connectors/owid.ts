// OWID (Our World in Data) connector — T1, deterministic, no AI.
// Endpoint: https://ourworldindata.org/grapher/{slug}.csv?country=LBN
// Each chart is one indicator; values come as a per-country CSV.

import {
  annualPeriod,
  fetchJson as _unused,
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

void _unused;

const SOURCE_ID = "owid";
const COUNTRY_ISO3 = "LBN";

async function fetchCsv(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(45_000),
    headers: {
      "user-agent": "Mabii/0.1 (https://mabii.org; contact: hello@mabii.org)",
      accept: "text/csv",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/**
 * Parse OWID CSV. Header is typically: Entity,Code,Year,<value_col>
 * (some charts have more columns, in which case we still expect Code + Year + a numeric value column).
 * Filters to Lebanon and returns [{year, value}].
 */
function parseOwidCsv(csv: string): Array<{ year: number; value: number }> {
  const lines = csv.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const headerCols = lines[0].split(",").map((c) => c.trim());
  const codeIdx = headerCols.indexOf("Code");
  const yearIdx = headerCols.indexOf("Year");
  if (codeIdx === -1 || yearIdx === -1) return [];

  // pick the first column that's not Entity/Code/Year — that's the value column
  const valueIdx = headerCols.findIndex((c, i) => i !== codeIdx && i !== yearIdx && c !== "Entity");
  if (valueIdx === -1) return [];

  const rows: Array<{ year: number; value: number }> = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split(",");
    if (cols[codeIdx]?.trim() !== COUNTRY_ISO3) continue;
    const year = Number.parseInt(cols[yearIdx], 10);
    const value = Number.parseFloat(cols[valueIdx]);
    if (!Number.isFinite(year) || !Number.isFinite(value)) continue;
    rows.push({ year, value });
  }
  return rows.sort((a, b) => a.year - b.year);
}

async function pullSeries(slug: string): Promise<Array<{ year: number; value: number }>> {
  const url = `https://ourworldindata.org/grapher/${encodeURIComponent(slug)}.csv?country=${COUNTRY_ISO3}`;
  const csv = await fetchCsv(url);
  return parseOwidCsv(csv);
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

    console.log(`[owid] fetching ${ind.code} (${mapping.source_native_code})`);
    let rows: Array<{ year: number; value: number }>;
    try {
      rows = await pullSeries(mapping.source_native_code);
    } catch (err) {
      console.error(`[owid] failed ${mapping.source_native_code}:`, err);
      continue;
    }
    if (rows.length === 0) {
      console.warn(`[owid] empty response for ${mapping.source_native_code}`);
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
  console.error("[owid] fatal:", err);
  process.exit(1);
});
