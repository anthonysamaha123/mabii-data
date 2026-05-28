// WFP Food Prices (HDX) connector — T1, deterministic, no AI.
// Builds a transparent essential-staples basket per governorate + the
// unofficial (parallel) exchange-rate series. USD values are at WFP's own
// unofficial FX — the rate people actually transact at.

import {
  isoDate,
  logConnectorRun,
  mergeObservations,
  parseCodesFilter,
  shouldProcess,
  writeRaw,
} from "../lib/connector-utils";
import { sources } from "../../src/data/catalog/sources";
import { getGeography } from "../../src/data/catalog/geographies";
import type { Observation } from "../../src/data/types";

const SOURCE_ID = "wfp";
const CSV_URL =
  "https://data.humdata.org/dataset/db0b4fb1-ce11-458e-94e0-3342365a117a/resource/772bc34e-1327-4ada-b2eb-e72020a546f2/download/wfp_food_prices_lbn.csv";

// WFP admin1 label → Mabii governorate id.
const ADMIN1_TO_GOV: Record<string, string> = {
  Beirut: "LBN-BA",
  "Mount Lebanon": "LBN-ML",
  North: "LBN-NO",
  Akkar: "LBN-AK",
  Bekaa: "LBN-BK",
  "Baalbek-El Hermel": "LBN-BH",
  South: "LBN-SO",
  "El Nabatieh": "LBN-NA",
};

// The 10 basket staples — matched on commodity name (start-anchored, case-insensitive).
const BASKET: RegExp[] = [
  /^bread \(pita\)/i,
  /^rice/i,
  /^bulgur/i,
  /^pasta/i,
  /^lentils/i,
  /^chickpeas/i,
  /^oil \(sunflower\)/i,
  /^sugar/i,
  /^eggs/i,
  /^milk \(powder\)/i,
];
const MIN_STAPLES_FOR_BASKET = 8; // require ≥8/10 present to publish a basket value

function parseLine(l: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (const ch of l) {
    if (ch === '"') q = !q;
    else if (ch === "," && !q) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

async function fetchCsv(): Promise<string> {
  const res = await fetch(CSV_URL, {
    signal: AbortSignal.timeout(60_000),
    headers: { "user-agent": "Mabii/0.1 (https://mabii.org)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for WFP CSV`);
  return res.text();
}

async function run() {
  const source = sources.find((s) => s.id === SOURCE_ID)!;
  const fetched_at = isoDate();
  const filter = parseCodesFilter();
  const results: Record<string, { added: number; updated: number; total: number }> = {};

  const csv = await fetchCsv();
  const lines = csv.split("\n").filter(Boolean);
  const hdr = parseLine(lines[0]).map((x) => x.trim());
  const I = {
    date: hdr.indexOf("date"),
    admin1: hdr.indexOf("admin1"),
    commodity: hdr.indexOf("commodity"),
    unit: hdr.indexOf("unit"),
    currency: hdr.indexOf("currency"),
    price: hdr.indexOf("price"),
    usd: hdr.indexOf("usdprice"),
  };
  const rows = lines.slice(2).map(parseLine); // row 1 is the HXL tag row

  const rawRef = await writeRaw(SOURCE_ID, { url: CSV_URL, rows: rows.length, fetched_at }, "wfp-meta.json");

  // ── Basket: group by (gov, date) → sum one unit of each matched staple ──
  // We sum BOTH the raw LBP price (the real transacted price — ground truth)
  // and WFP's usdprice (for display). The affordability ratio is computed from
  // LBP downstream so it's FX-independent and immune to WFP's early-crisis
  // USD-conversion artifacts.
  const basket = new Map<string, { usd: number; lbp: number; matched: Set<number> }>();
  // FX: date → lbp per usd
  const fx = new Map<string, number>();

  for (const r of rows) {
    const date = r[I.date];
    if (!date) continue;
    const commodity = r[I.commodity] ?? "";

    if (/^exchange rate/i.test(commodity)) {
      const lbp = Number.parseFloat(r[I.price]);
      if (Number.isFinite(lbp)) fx.set(date, lbp);
      continue;
    }

    const gov = ADMIN1_TO_GOV[r[I.admin1]];
    if (!gov) continue;
    const usd = Number.parseFloat(r[I.usd]);
    const lbp = Number.parseFloat(r[I.price]);
    if (!Number.isFinite(usd) || !Number.isFinite(lbp)) continue;
    const stapleIdx = BASKET.findIndex((re) => re.test(commodity));
    if (stapleIdx === -1) continue;

    const key = `${gov}|${date}`;
    const cell = basket.get(key) ?? { usd: 0, lbp: 0, matched: new Set<number>() };
    if (!cell.matched.has(stapleIdx)) {
      cell.matched.add(stapleIdx);
      cell.usd += usd;
      cell.lbp += lbp;
    }
    basket.set(key, cell);
  }

  // ── Emit basket observations (governorate, monthly) — USD and LBP ──
  {
    const usdObs: Observation[] = [];
    const lbpObs: Observation[] = [];
    for (const [key, cell] of basket) {
      if (cell.matched.size < MIN_STAPLES_FOR_BASKET) continue;
      const [gov, date] = key.split("|");
      if (!getGeography(gov)) continue;
      const ym = date.slice(0, 7);
      const lastDay = new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0)).getUTCDate();
      const base = {
        geography_id: gov,
        period_start: `${ym}-01`,
        period_end: `${ym}-${String(lastDay).padStart(2, "0")}`,
        frequency: "monthly" as const,
        source_id: SOURCE_ID,
        raw_ref: rawRef.hash,
        trust_label: "proxy" as const,
        extraction_method: "api" as const,
        fetched_at,
        version: 1,
        method_note: `basket of ${cell.matched.size}/10 staples, one unit each`,
      };
      usdObs.push({
        ...base,
        indicator_code: "mabii.prices.food_basket_usd",
        value: Math.round(cell.usd * 100) / 100,
        unit: "USD",
        currency: "USD",
        fx_basis: "unofficial parallel rate (WFP)",
      });
      lbpObs.push({
        ...base,
        indicator_code: "mabii.prices.food_basket_lbp",
        value: Math.round(cell.lbp),
        unit: "LBP",
        currency: "LBP",
      });
    }
    if (shouldProcess("mabii.prices.food_basket_usd", filter) && usdObs.length)
      results["mabii.prices.food_basket_usd"] = await mergeObservations("mabii.prices.food_basket_usd", usdObs);
    if (shouldProcess("mabii.prices.food_basket_lbp", filter) && lbpObs.length)
      results["mabii.prices.food_basket_lbp"] = await mergeObservations("mabii.prices.food_basket_lbp", lbpObs);
  }

  // ── Emit FX series (national, monthly) ──
  if (shouldProcess("mabii.monetary.parallel_exchange_rate_lbp", filter)) {
    const obs: Observation[] = [];
    for (const [date, lbp] of fx) {
      const ym = date.slice(0, 7);
      const lastDay = new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0)).getUTCDate();
      obs.push({
        indicator_code: "mabii.monetary.parallel_exchange_rate_lbp",
        geography_id: "LBN",
        period_start: `${ym}-01`,
        period_end: `${ym}-${String(lastDay).padStart(2, "0")}`,
        frequency: "monthly",
        value: lbp,
        unit: "LBP",
        source_id: SOURCE_ID,
        raw_ref: rawRef.hash,
        trust_label: "proxy",
        extraction_method: "api",
        fetched_at,
        version: 1,
      });
    }
    if (obs.length) results["mabii.monetary.parallel_exchange_rate_lbp"] = await mergeObservations("mabii.monetary.parallel_exchange_rate_lbp", obs);
  }

  logConnectorRun(SOURCE_ID, results);
}

run().catch((err) => {
  console.error("[wfp] fatal:", err);
  process.exit(1);
});
