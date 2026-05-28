// Central Administration of Statistics — monthly CPI XLSX connector.
// T2 source, deterministic — NO AI. CAS publishes a structured Excel file
// at a fully date-templated URL:
//   http://cas.gov.lb/images/PDFs/CPI/{YYYY}/{N}-CPI_{MONTH}{YYYY}.xlsx
// Each release contains the 12 expenditure divisions (COICOP-like) plus
// the overall index. We walk every month from 2019-01 to the current month
// and write one observation per (indicator, month).

import * as XLSX from "xlsx";
import {
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

const SOURCE_ID = "cas";

const MONTHS = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
] as const;

function urlFor(year: number, month1to12: number): string {
  const name = MONTHS[month1to12 - 1];
  return `http://cas.gov.lb/images/PDFs/CPI/${year}/${month1to12}-CPI_${name}${year}.xlsx`;
}

function monthPeriod(year: number, month1to12: number) {
  const start = `${year}-${String(month1to12).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
  const end = `${year}-${String(month1to12).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { period_start: start, period_end: end };
}

async function fetchXlsxBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(30_000),
      headers: { "user-agent": "Mabii/0.1 (https://mabii.org)" },
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    // CAS sometimes returns HTML 404 pages with 200 status — sniff by content-type.
    if (!/sheet|xlsx|octet-stream/.test(ct)) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

// Maps Mabii indicator codes → regex matched against the first column.
// Patterns chosen to be loose enough for label drift but specific enough not to collide.
const LABEL_PATTERNS: Record<string, RegExp> = {
  // Headline row is literally "Consumer price index" with no suffix.
  "mabii.prices.cas_cpi_overall": /^\s*consumer\s+price\s+index\s*$/i,
  "mabii.prices.cas_cpi_food_beverages": /food\b.*non[-\s]?alcoholic/i,
  "mabii.prices.cas_cpi_alcohol_tobacco": /^alcohol/i,
  "mabii.prices.cas_cpi_clothing_footwear": /^clothing/i,
  "mabii.prices.cas_cpi_housing": /^housing/i,
  "mabii.prices.cas_cpi_furnishings": /^furnish/i,
  "mabii.prices.cas_cpi_health": /^health\b/i,
  // CAS labels this "Transportation" (not "Transport").
  "mabii.prices.cas_cpi_transport": /^transport/i,
  "mabii.prices.cas_cpi_communications": /^communication/i,
  "mabii.prices.cas_cpi_recreation": /^recreation/i,
  "mabii.prices.cas_cpi_education": /^education\b/i,
  "mabii.prices.cas_cpi_restaurants_hotels": /^restaurants?\b/i,
  "mabii.prices.cas_cpi_misc": /^miscellaneous/i,
};

interface ParsedMonth {
  url: string;
  year: number;
  month: number;
  values: Map<string, number>; // indicator_code → index value
}

/**
 * Parse one CAS monthly XLSX. The 'CPI_monthly' sheet has a header row whose
 * cells include "<MonthName> index <year>" — that is the column with the
 * current month's level. We locate it heuristically.
 */
function parseCasMonth(xlsxBytes: Uint8Array, year: number, month: number): Map<string, number> {
  const wb = XLSX.read(xlsxBytes, { type: "buffer" });
  const sheetName = wb.SheetNames.find((n) => /cpi_?monthly/i.test(n)) ?? wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });

  // Find header row — has "Expenditure Divisions" in col 0 OR contains "Monthly Change".
  let headerRow = -1;
  for (let i = 0; i < Math.min(grid.length, 15); i += 1) {
    const c0 = String(grid[i][0] ?? "");
    const joined = grid[i].map((c) => String(c ?? "")).join(" ");
    if (/expenditure divisions/i.test(c0) || /monthly change/i.test(joined)) {
      headerRow = i;
      break;
    }
  }
  if (headerRow === -1) return new Map();

  // The "current month index" column is the one whose header contains
  // both the month's name and the year. Fall back to col 2 (typical position).
  const header = grid[headerRow].map((c) => String(c ?? ""));
  const monthName = MONTHS[month - 1].slice(0, 3).toLowerCase(); // JAN, FEB...
  let valueCol = header.findIndex(
    (h) => new RegExp(monthName, "i").test(h) && new RegExp(String(year)).test(h)
  );
  if (valueCol === -1) valueCol = 2; // typical position right after "Monthly Change"

  const result = new Map<string, number>();
  for (let i = headerRow + 1; i < grid.length; i += 1) {
    const label = String(grid[i][0] ?? "").trim();
    if (!label) continue;
    for (const [code, pattern] of Object.entries(LABEL_PATTERNS)) {
      if (result.has(code)) continue;
      if (pattern.test(label)) {
        const raw = grid[i][valueCol];
        const value = typeof raw === "number" ? raw : Number.parseFloat(String(raw));
        if (Number.isFinite(value)) result.set(code, value);
        break;
      }
    }
  }
  return result;
}

async function walkMonths(): Promise<ParsedMonth[]> {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  const startYear = 2019;
  const fetches: Promise<ParsedMonth | null>[] = [];
  const sourceFreshness: Array<{ year: number; month: number; url: string }> = [];

  for (let y = startYear; y <= currentYear; y += 1) {
    const endMonth = y === currentYear ? currentMonth : 12;
    for (let m = 1; m <= endMonth; m += 1) {
      const url = urlFor(y, m);
      sourceFreshness.push({ year: y, month: m, url });
      fetches.push(
        (async () => {
          const bytes = await fetchXlsxBytes(url);
          if (!bytes) return null;
          try {
            const values = parseCasMonth(bytes, y, m);
            if (values.size === 0) return null;
            return { url, year: y, month: m, values };
          } catch (err) {
            console.warn(`[cas] parse failed for ${url}:`, err instanceof Error ? err.message : err);
            return null;
          }
        })()
      );
    }
  }

  // Run in batches of 8 to be polite to cas.gov.lb.
  const batchSize = 8;
  const results: ParsedMonth[] = [];
  for (let i = 0; i < fetches.length; i += batchSize) {
    const batch = await Promise.all(fetches.slice(i, i + batchSize));
    for (const r of batch) if (r) results.push(r);
  }
  const ok = results.length;
  const tried = sourceFreshness.length;
  console.log(`[cas] fetched ${ok}/${tried} monthly XLSX releases`);
  return results;
}

async function run() {
  const source = sources.find((s) => s.id === SOURCE_ID)!;
  const fetched_at = isoDate();
  const filter = parseCodesFilter();
  const results: Record<string, { added: number; updated: number; total: number }> = {};

  const months = await walkMonths();
  if (months.length === 0) {
    console.error("[cas] no months returned data — check URL pattern / network");
    process.exit(1);
  }

  // Persist a small inventory of which months we successfully parsed.
  const inventory = months.map((m) => ({ year: m.year, month: m.month, url: m.url, keys: Array.from(m.values.keys()) }));
  const raw = await writeRaw(SOURCE_ID, inventory, "inventory.json");

  // Build observations per indicator.
  const byCode = new Map<string, Observation[]>();
  for (const ind of indicators) {
    const mapping = ind.sources.find((s) => s.source_id === SOURCE_ID);
    if (!mapping) continue;
    if (!shouldProcess(ind.code, filter)) continue;

    const obsList: Observation[] = [];
    for (const m of months) {
      const value = m.values.get(ind.code);
      if (value === undefined || !Number.isFinite(value)) continue;
      const { period_start, period_end } = monthPeriod(m.year, m.month);
      obsList.push({
        indicator_code: ind.code,
        geography_id: ind.geography_id,
        period_start,
        period_end,
        frequency: "monthly",
        value,
        unit: ind.default_unit,
        source_id: SOURCE_ID,
        raw_ref: raw.hash,
        trust_label: source.trust_label_default,
        extraction_method: "scrape",
        fetched_at,
        version: 1,
      });
    }
    byCode.set(ind.code, obsList);
  }

  for (const [code, obs] of byCode) {
    if (obs.length === 0) {
      console.warn(`[cas] no observations parsed for ${code}`);
      continue;
    }
    const stats = await mergeObservations(code, obs);
    results[code] = stats;
  }

  logConnectorRun(SOURCE_ID, results);
}

run().catch((err) => {
  console.error("[cas] fatal:", err);
  process.exit(1);
});
