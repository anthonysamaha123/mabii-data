// UNHCR Refugee Data Finder connector (registered as source `hdx`).
// Deterministic JSON API — no AI.
// Endpoint: https://api.unhcr.org/population/v1/population/?coa=LBN&yearFrom=2000&yearTo={current}

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

const SOURCE_ID = "hdx";
const COUNTRY_ISO3 = "LBN";

interface UnhcrItem {
  year: string;
  coo: string | null;
  coa: string;
  refugees: string | number | null;
}

interface UnhcrResponse {
  items: UnhcrItem[];
}

/** Fetch UNHCR aggregated refugee population for Lebanon as country of asylum. */
async function pullRefugees(): Promise<Array<{ year: number; value: number }>> {
  const currentYear = new Date().getUTCFullYear();
  const url = `https://api.unhcr.org/population/v1/population/?coa=${COUNTRY_ISO3}&yearFrom=2000&yearTo=${currentYear}&download=false`;
  const data = (await fetchJson(url, { timeoutMs: 45_000 })) as UnhcrResponse;
  if (!data?.items?.length) {
    throw new Error(`UNHCR returned no items for ${COUNTRY_ISO3}`);
  }
  // Aggregate per year (sum across countries of origin)
  const byYear = new Map<number, number>();
  for (const row of data.items) {
    const yr = Number.parseInt(row.year, 10);
    if (!Number.isFinite(yr)) continue;
    const raw = typeof row.refugees === "string" ? Number.parseInt(row.refugees, 10) : row.refugees;
    if (raw === null || !Number.isFinite(raw)) continue;
    byYear.set(yr, (byYear.get(yr) ?? 0) + raw);
  }
  return Array.from(byYear.entries())
    .map(([year, value]) => ({ year, value }))
    .filter((r) => r.value > 0)
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
    if (mapping.source_native_code !== "unhcr.population.refugees") continue;

    console.log(`[hdx] fetching ${ind.code} (${mapping.source_native_code})`);
    let rows: Array<{ year: number; value: number }>;
    try {
      rows = await pullRefugees();
    } catch (err) {
      console.error(`[hdx] failed ${ind.code}:`, err);
      continue;
    }

    const raw = await writeRaw(SOURCE_ID, rows, "refugees.json");
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
  console.error("[hdx] fatal:", err);
  process.exit(1);
});
