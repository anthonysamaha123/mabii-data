// UNHCR Refugee Data Finder connector (registered as source `hdx`).
// Deterministic — no AI.
//
// The public population endpoint returns a ZIP containing population.csv and
// footnotes.csv. We fetch the ZIP, unzip in memory, parse the CSV, and
// aggregate refugees across countries of origin (coo) for Lebanon as country
// of asylum (coa=LBN).

import { unzipSync, strFromU8 } from "fflate";
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

const SOURCE_ID = "hdx";
const COUNTRY_ISO3 = "LBN";

async function downloadZip(): Promise<Uint8Array> {
  const currentYear = new Date().getUTCFullYear();
  // Counter-intuitively, the UNHCR API returns empty CSVs when filtered by
  // coa=LBN alone. The combination coa_all=true&residence_country=LBN
  // returns the full global table including Lebanon-as-asylum rows; we
  // filter client-side.
  const url = `https://api.unhcr.org/population/v1/population/?yearFrom=2000&yearTo=${currentYear}&download=true&coa_all=true&residence_country=${COUNTRY_ISO3}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(60_000),
    headers: {
      "user-agent": "Mabii/0.1 (https://mabii.org; contact: hello@mabii.org)",
      accept: "application/zip,application/octet-stream",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const ab = await res.arrayBuffer();
  return new Uint8Array(ab);
}

// Column indices in UNHCR population.csv (stable):
//   0=Year, 1=Country of origin (name), 2=Country of origin (ISO),
//   3=Country of asylum (name), 4=Country of asylum (ISO),
//   5=Refugees under UNHCR's mandate
function parsePopulationCsv(csv: string): Array<{ year: number; value: number }> {
  const lines = csv.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return [];

  // Aggregate rows have coo_iso === "-" — those are sums across origins.
  const rows: Array<{ year: number; value: number }> = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split(",");
    if (cols.length < 6) continue;
    if (cols[4]?.trim() !== COUNTRY_ISO3) continue;
    if (cols[2]?.trim() !== "-") continue; // we want the aggregate-origin row
    const year = Number.parseInt(cols[0], 10);
    const value = Number.parseInt(cols[5], 10);
    if (!Number.isFinite(year) || !Number.isFinite(value)) continue;
    rows.push({ year, value });
  }
  return rows.sort((a, b) => a.year - b.year);
}

async function pullRefugees(): Promise<{
  rows: Array<{ year: number; value: number }>;
  csvText: string;
}> {
  const zipBytes = await downloadZip();
  const entries = unzipSync(zipBytes);
  const popKey = Object.keys(entries).find((k) => /population\.csv$/i.test(k));
  if (!popKey) {
    throw new Error(
      `population.csv not found in ZIP; entries: ${Object.keys(entries).join(", ")}`
    );
  }
  const csvText = strFromU8(entries[popKey]);
  return { rows: parsePopulationCsv(csvText), csvText };
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
    let payload: { rows: Array<{ year: number; value: number }>; csvText: string };
    try {
      payload = await pullRefugees();
    } catch (err) {
      console.error(`[hdx] failed ${ind.code}:`, err);
      continue;
    }
    if (payload.rows.length === 0) {
      console.warn(`[hdx] empty data for ${ind.code}`);
      continue;
    }

    const raw = await writeRaw(SOURCE_ID, payload.csvText, "population.csv");
    const observations: Observation[] = payload.rows.map((r) => {
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
