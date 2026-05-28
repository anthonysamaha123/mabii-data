// Banque du Liban (BDL) interim balance-sheet connector.
// T2, deterministic — NO AI. The published Excel is structured per row.
//
// Flow:
//   1. Scrape https://www.bdl.gov.lb/bdlbalancesheet.php for the latest XLSX URL.
//   2. Download the XLSX (single-sheet, ~30 labelled rows).
//   3. Match rows by label, extract the current period value, write observations.
//
// Excel serial-date in row 5 is parsed to the observation period.

import * as XLSX from "xlsx";
import {
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

const SOURCE_ID = "bdl";
const INDEX_URL = "https://www.bdl.gov.lb/bdlbalancesheet.php";

// Maps Mabii indicator codes → exact (or trimmed) BDL balance-sheet labels.
// Labels come from the first column of BDL's XLSX, case-insensitively matched
// at the start of the cell. BDL is consistent across releases.
const LABEL_BY_CODE: Record<string, RegExp> = {
  "mabii.monetary.bdl_gold_thousand_lbp": /^gold\b/i,
  "mabii.monetary.bdl_foreign_reserve_assets_thousand_lbp": /^foreign\s+reserve\s+assets/i,
  "mabii.monetary.bdl_currency_in_circulation_thousand_lbp":
    /^currency\s+in\s+circulation/i,
  "mabii.monetary.bdl_financial_sector_deposits_thousand_lbp":
    /^financial\s+sector\s+deposits/i,
  "mabii.monetary.bdl_public_sector_deposits_thousand_lbp":
    /^public\s+sector\s+deposits/i,
};

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(45_000),
    headers: { "user-agent": "Mabii/0.1 (https://mabii.org)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(60_000),
    headers: { "user-agent": "Mabii/0.1 (https://mabii.org)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

/** Find the latest balance-sheet XLSX URL on the index page. */
async function findLatestXlsxUrl(): Promise<string> {
  const html = await fetchText(INDEX_URL);
  const m = html.match(/https?:\/\/[^"'\s]+BDLInterimBalSheet[^"'\s]+\.xlsx/i);
  if (!m) throw new Error("Could not find BDLInterimBalSheet xlsx link on index page");
  return m[0];
}

/** Excel serial date (days since 1899-12-30) → ISO date string. */
function excelSerialToDate(serial: number): { period_start: string; period_end: string } {
  const epoch = Date.UTC(1899, 11, 30);
  const ms = epoch + serial * 24 * 3600 * 1000;
  const d = new Date(ms);
  const iso = d.toISOString().slice(0, 10);
  // Treat each BDL release as a snapshot for the month containing the release date.
  const monthStart = `${iso.slice(0, 7)}-01`;
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  const monthEnd = last.toISOString().slice(0, 10);
  return { period_start: monthStart, period_end: monthEnd };
}

interface ExtractedRow { code: string; label: string; value: number }

function parseBalanceSheet(xlsxBytes: Uint8Array): {
  period: { period_start: string; period_end: string };
  rows: ExtractedRow[];
} {
  const wb = XLSX.read(xlsxBytes, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const grid = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" }) as unknown as Array<unknown[]>;

  // Find the row that has a numeric Excel-serial date in col 1 — that's the period header.
  let periodSerial = 0;
  for (let i = 0; i < Math.min(grid.length, 10); i += 1) {
    const cell = grid[i][1];
    if (typeof cell === "number" && cell > 30000) {
      periodSerial = cell;
      break;
    }
    if (typeof cell === "string" && /^\d{5}$/.test(cell.trim())) {
      const n = Number.parseInt(cell.trim(), 10);
      if (n > 30000) {
        periodSerial = n;
        break;
      }
    }
  }
  if (periodSerial === 0) {
    throw new Error("Could not find period header (Excel serial date) in BDL sheet");
  }

  const period = excelSerialToDate(periodSerial);
  const rows: ExtractedRow[] = [];

  for (const [code, pattern] of Object.entries(LABEL_BY_CODE)) {
    const matchRow = grid.find((r) => {
      const label = typeof r[0] === "string" ? r[0] : "";
      return pattern.test(label.trim());
    });
    if (!matchRow) {
      console.warn(`[bdl] label not found: ${pattern}`);
      continue;
    }
    const raw = matchRow[1];
    const value = typeof raw === "number" ? raw : Number.parseFloat(String(raw));
    if (!Number.isFinite(value)) {
      console.warn(`[bdl] value not numeric for ${code}: ${raw}`);
      continue;
    }
    rows.push({ code, label: String(matchRow[0]).trim(), value });
  }
  return { period, rows };
}

async function run() {
  const source = sources.find((s) => s.id === SOURCE_ID)!;
  const fetched_at = isoDate();
  const filter = parseCodesFilter();
  const results: Record<string, { added: number; updated: number; total: number }> = {};

  let xlsxUrl: string;
  try {
    xlsxUrl = await findLatestXlsxUrl();
    console.log(`[bdl] latest XLSX: ${xlsxUrl}`);
  } catch (err) {
    console.error("[bdl] index scrape failed:", err);
    process.exit(1);
  }

  let xlsxBytes: Uint8Array;
  try {
    xlsxBytes = await fetchBytes(xlsxUrl);
  } catch (err) {
    console.error("[bdl] xlsx download failed:", err);
    process.exit(1);
  }

  const raw = await writeRaw(SOURCE_ID, Array.from(xlsxBytes).slice(0, 256), "balance-sheet-meta.json");
  // Also persist the actual XLSX for audit trail.
  await writeRaw(SOURCE_ID, xlsxBytes.toString(), "balance-sheet.xlsx.txt");

  const { period, rows } = parseBalanceSheet(xlsxBytes);
  console.log(`[bdl] period: ${period.period_start}..${period.period_end}, rows: ${rows.length}`);

  for (const ind of indicators) {
    const mapping = ind.sources.find((s) => s.source_id === SOURCE_ID);
    if (!mapping) continue;
    if (!shouldProcess(ind.code, filter)) continue;

    const extracted = rows.find((r) => r.code === ind.code);
    if (!extracted) {
      console.warn(`[bdl] no extraction for ${ind.code}`);
      continue;
    }

    const observation: Observation = {
      indicator_code: ind.code,
      geography_id: ind.geography_id,
      period_start: period.period_start,
      period_end: period.period_end,
      frequency: "monthly",
      value: extracted.value,
      unit: ind.default_unit,
      source_id: SOURCE_ID,
      raw_ref: raw.hash,
      trust_label: source.trust_label_default,
      extraction_method: "scrape",
      method_note: `Matched label: "${extracted.label}"`,
      fetched_at,
      version: 1,
    };

    const stats = await mergeObservations(ind.code, [observation]);
    results[ind.code] = stats;
  }

  logConnectorRun(SOURCE_ID, results);
}

run().catch((err) => {
  console.error("[bdl] fatal:", err);
  process.exit(1);
});
