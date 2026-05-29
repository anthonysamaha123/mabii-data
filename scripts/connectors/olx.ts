// OLX Lebanon connector — T5, modeled. RECURRING (weekly).
//
// OLX server-renders listing cards into the category page HTML. We fetch N
// pages per category, segment by /ad/…ID.html anchors, and extract structured
// detail per card:
//   • properties: price + AREA (m²) + governorate → absolute median AND median
//     price-per-m², per governorate.
//   • cars: price + MAKE + YEAR → national median AND a (make, year) breakdown.
// Per OLX ToS we store only aggregates, never raw listings. Each run is a
// point-in-time snapshot; time series (change) accrues across weekly waves.

import {
  isoDate,
  logConnectorRun,
  mergeObservations,
  parseCodesFilter,
  shouldProcess,
  writeRaw,
} from "../lib/connector-utils";
import { promises as fs } from "node:fs";
import path from "node:path";
import { sources } from "../../src/data/catalog/sources";
import type { Observation } from "../../src/data/types";

const SOURCE_ID = "olx-lebanon";
const PAGES = 12;

const RENT_URL = "https://www.olx.com.lb/properties/apartments-villas-for-rent/";
const SALE_URL = "https://www.olx.com.lb/properties/apartments-villas-for-sale/";
const CARS_URL = "https://www.olx.com.lb/vehicles/cars-for-sale/";

const AREA_TO_GOV: Array<[RegExp, string]> = [
  [/\bbeirut\b|achrafieh|ashrafieh|hamra|verdun|koraytem|mar elias|ras beirut|manara|badaro|sodeco|gemmayze|mar mikhael|clemenceau|raouche|tallet el khayat|mazraa|qoreitem/, "LBN-BA"],
  [/mount lebanon|metn|matn|keserwan|kesrwan|kesrouan|baabda|aley|chouf|shouf|jbeil|byblos|jounieh|antelias|dbayeh|zalka|jdeideh|sin el fil|mansourieh|mtayleb|rabieh|broumana|beit mery|dbaye|adma|kaslik|zouk|ballouneh|hazmieh|fanar|naccache|rmeil/, "LBN-ML"],
  [/\bnorth\b|tripoli|koura|zgharta|batroun|bcharre|bsharri|minieh|dannieh|danniyeh|amioun|chekka|kfaraabida/, "LBN-NO"],
  [/\bakkar\b|halba|qoubaiyat/, "LBN-AK"],
  [/\bbekaa\b|beqaa|zahle|zahleh|chtaura|chtoura|west bekaa|rashaya|jib jannine/, "LBN-BK"],
  [/baalbek|baalbeck|hermel|deir el ahmar/, "LBN-BH"],
  [/\bsouth\b|saida|sidon|tyre|sour|jezzine|ghazieh/, "LBN-SO"],
  [/nabatieh|nabatiyeh|marjeyoun|hasbaya|bint jbeil|tebnine/, "LBN-NA"],
];

// Common car makes in Lebanon (matched against the slug, lower-cased).
const MAKES: Array<[RegExp, string]> = [
  [/\btoyota\b/, "Toyota"], [/\bnissan\b/, "Nissan"], [/\bhonda\b/, "Honda"],
  [/\bhyundai\b/, "Hyundai"], [/\bkia\b/, "Kia"], [/\bbmw\b/, "BMW"],
  [/\bmercedes\b|\bbenz\b/, "Mercedes"], [/\baudi\b/, "Audi"],
  [/\b(volkswagen|vw)\b/, "Volkswagen"], [/\bford\b/, "Ford"],
  [/\bchevrolet\b|\bchevy\b/, "Chevrolet"], [/\bjeep\b/, "Jeep"],
  [/\b(range rover|range-rover|land rover|land-rover)\b/, "Land Rover"],
  [/\bporsche\b/, "Porsche"], [/\bmazda\b/, "Mazda"], [/\bmitsubishi\b/, "Mitsubishi"],
  [/\bpeugeot\b/, "Peugeot"], [/\brenault\b/, "Renault"], [/\bcitroen\b/, "Citroen"],
  [/\bdodge\b/, "Dodge"], [/\bgmc\b/, "GMC"], [/\blexus\b/, "Lexus"],
  [/\binfiniti\b/, "Infiniti"], [/\bmini\b/, "Mini"], [/\bfiat\b/, "Fiat"],
  [/\bsuzuki\b/, "Suzuki"], [/\btesla\b/, "Tesla"], [/\bvolvo\b/, "Volvo"],
  [/\bjaguar\b/, "Jaguar"], [/\bcadillac\b/, "Cadillac"], [/\bsubaru\b/, "Subaru"],
  [/\bskoda\b/, "Skoda"], [/\bseat\b/, "Seat"], [/\bopel\b/, "Opel"],
  [/\bdaihatsu\b/, "Daihatsu"], [/\bchrysler\b/, "Chrysler"], [/\bacura\b/, "Acura"],
];

function mapGov(s: string): string | null {
  const h = s.toLowerCase();
  for (const [re, g] of AREA_TO_GOV) if (re.test(h)) return g;
  return null;
}
function mapMake(slug: string): string | null {
  const h = slug.toLowerCase();
  for (const [re, m] of MAKES) if (re.test(h)) return m;
  return null;
}

async function fetchPage(url: string, page: number): Promise<string | null> {
  const u = page <= 1 ? url : `${url}?page=${page}`;
  try {
    const res = await fetch(u, {
      signal: AbortSignal.timeout(30_000),
      headers: {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        accept: "text/html",
      },
    });
    return await res.text();
  } catch {
    return null;
  }
}

function trimmedMedian(values: number[]): { median: number; n: number } | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  if (s.length < 5) return { median: s[Math.floor(s.length / 2)], n: s.length };
  const lo = Math.floor(s.length * 0.05);
  const hi = Math.ceil(s.length * 0.95);
  const t = s.slice(lo, hi);
  const mid = Math.floor(t.length / 2);
  const median = t.length % 2 === 0 ? (t[mid - 1] + t[mid]) / 2 : t[mid];
  return { median, n: t.length };
}

function weekPeriod(d = new Date()) {
  const day = (d.getUTCDay() + 6) % 7;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
  const sunday = new Date(monday.getTime() + 6 * 86400_000);
  return { period_start: monday.toISOString().slice(0, 10), period_end: sunday.toISOString().slice(0, 10) };
}

interface PropCard { price: number; area: number | null; gov: string | null }
interface CarCard { price: number; make: string | null; year: number | null }

function parseProps(html: string, min: number, max: number): PropCard[] {
  const out: PropCard[] = [];
  const seen = new Set<string>();
  for (const part of html.split(/href="\/ad\//).slice(1)) {
    const idm = part.match(/^([^"]*?)-ID(\d+)\.html/);
    if (!idm) continue;
    const id = idm[2];
    if (seen.has(id)) continue;
    const slug = idm[1];
    const chunk = part.slice(0, 2600);
    const text = chunk.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&");
    const pm = text.match(/(?:USD|\$)\s?([0-9][0-9,]{2,})/);
    if (!pm) continue;
    const price = Number.parseInt(pm[1].replace(/,/g, ""), 10);
    if (!Number.isFinite(price) || price < min || price > max) continue;
    const am = text.match(/([0-9]{2,4})\s?(?:m2|sqm|m²|متر)/i);
    let area: number | null = null;
    if (am) {
      const a = Number.parseInt(am[1], 10);
      if (a >= 20 && a <= 2000) area = a; // sane apartment/villa range
    }
    const gov = mapGov(`${text} ${decodeURIComponent(slug)}`);
    seen.add(id);
    out.push({ price, area, gov });
  }
  return out;
}

function parseCars(html: string, min: number, max: number): CarCard[] {
  const out: CarCard[] = [];
  const seen = new Set<string>();
  for (const part of html.split(/href="\/ad\//).slice(1)) {
    const idm = part.match(/^([^"]*?)-ID(\d+)\.html/);
    if (!idm) continue;
    const id = idm[2];
    if (seen.has(id)) continue;
    const slug = decodeURIComponent(idm[1]);
    const chunk = part.slice(0, 2600);
    const text = chunk.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&");
    const pm = text.match(/(?:USD|\$)\s?([0-9][0-9,]{2,})/);
    if (!pm) continue;
    const price = Number.parseInt(pm[1].replace(/,/g, ""), 10);
    if (!Number.isFinite(price) || price < min || price > max) continue;
    const ym = `${slug} ${text}`.match(/\b(19[89]\d|20[0-2]\d)\b/);
    const year = ym ? Number.parseInt(ym[1], 10) : null;
    const make = mapMake(slug);
    seen.add(id);
    out.push({ price, make, year });
  }
  return out;
}

async function fetchAll<T>(url: string, parse: (h: string) => T[]): Promise<{ rows: T[]; pages: number }> {
  const rows: T[] = [];
  let pages = 0;
  for (let p = 1; p <= PAGES; p += 1) {
    const html = await fetchPage(url, p);
    if (!html) break;
    const cards = parse(html);
    if (cards.length === 0) break;
    rows.push(...cards);
    pages += 1;
    await new Promise((r) => setTimeout(r, 800));
  }
  return { rows, pages };
}

async function run() {
  const source = sources.find((s) => s.id === SOURCE_ID)!;
  const fetched_at = isoDate();
  const filter = parseCodesFilter();
  const { period_start, period_end } = weekPeriod();
  const results: Record<string, { added: number; updated: number; total: number }> = {};

  const baseObs = (code: string, gov: string, value: number, unit: string, n: number): Observation => ({
    indicator_code: code, geography_id: gov, period_start, period_end,
    frequency: "weekly", value, unit, source_id: SOURCE_ID, raw_ref: "",
    trust_label: "modeled", extraction_method: "scrape",
    confidence: Math.min(1, n / 50), method_note: `sample_size=${n} (P5–P95 trimmed)`,
    fetched_at, version: 1,
  });

  // ── PROPERTIES (rent + sale): absolute median + per-m² median, per gov ──
  for (const cfg of [
    { url: RENT_URL, min: 100, max: 25_000, absCode: "mabii.real_estate.rent_median_usd", sqmCode: "mabii.real_estate.rent_per_sqm_usd" },
    { url: SALE_URL, min: 10_000, max: 15_000_000, absCode: "mabii.real_estate.sale_price_median_usd", sqmCode: "mabii.real_estate.sale_per_sqm_usd" },
  ]) {
    const { rows, pages } = await fetchAll(cfg.url, (h) => parseProps(h, cfg.min, cfg.max));
    console.log(`[olx] ${cfg.absCode}: ${pages} pages, ${rows.length} listings (${rows.filter((r) => r.area).length} with area)`);
    const raw = await writeRaw(SOURCE_ID, { absCode: cfg.absCode, n: rows.length, withArea: rows.filter((r) => r.area).length }, `audit-${cfg.absCode}.json`);

    const byGov = new Map<string, { prices: number[]; perSqm: number[] }>();
    for (const r of rows) {
      if (!r.gov) continue;
      const c = byGov.get(r.gov) ?? { prices: [], perSqm: [] };
      c.prices.push(r.price);
      if (r.area) c.perSqm.push(r.price / r.area);
      byGov.set(r.gov, c);
    }
    const absObs: Observation[] = [];
    const sqmObs: Observation[] = [];
    for (const [gov, c] of byGov) {
      const a = trimmedMedian(c.prices);
      if (a && a.n >= 3 && shouldProcess(cfg.absCode, filter)) {
        const o = baseObs(cfg.absCode, gov, Math.round(a.median), "USD", a.n); o.raw_ref = raw.hash; absObs.push(o);
      }
      const s = trimmedMedian(c.perSqm);
      if (s && s.n >= 3 && shouldProcess(cfg.sqmCode, filter)) {
        const o = baseObs(cfg.sqmCode, gov, Math.round(s.median * 10) / 10, "USD/m²", s.n); o.raw_ref = raw.hash; sqmObs.push(o);
      }
    }
    if (absObs.length) results[cfg.absCode] = await mergeObservations(cfg.absCode, absObs);
    if (sqmObs.length) results[cfg.sqmCode] = await mergeObservations(cfg.sqmCode, sqmObs);
  }

  // ── CARS: national median (indicator) + (make, year) breakdown (dataset) ──
  {
    const { rows, pages } = await fetchAll(CARS_URL, (h) => parseCars(h, 500, 500_000));
    console.log(`[olx] cars: ${pages} pages, ${rows.length} listings (${rows.filter((r) => r.make && r.year).length} with make+year)`);
    const raw = await writeRaw(SOURCE_ID, { n: rows.length }, "audit-cars.json");

    const code = "mabii.transport.used_car_median_price_usd";
    if (shouldProcess(code, filter)) {
      const nat = trimmedMedian(rows.map((r) => r.price));
      if (nat) {
        const o = baseObs(code, "LBN", Math.round(nat.median), "USD", nat.n); o.raw_ref = raw.hash;
        results[code] = await mergeObservations(code, [o]);
      }
    }

    // (make, year) breakdown → committable dataset accumulating per wave.
    const groups = new Map<string, number[]>();
    for (const r of rows) {
      if (!r.make || !r.year) continue;
      const key = `${r.make}|${r.year}`;
      const arr = groups.get(key) ?? [];
      arr.push(r.price);
      groups.set(key, arr);
    }
    const breakdownRows: Array<Record<string, unknown>> = [];
    for (const [key, prices] of groups) {
      const m = trimmedMedian(prices);
      if (!m || m.n < 4) continue; // need a few of the same make+year
      const [make, year] = key.split("|");
      breakdownRows.push({ make, year: Number(year), period_start, period_end, median_usd: Math.round(m.median), n: m.n });
    }
    await mergeBreakdown("used_car_by_make_year", breakdownRows, ["make", "year", "period_end"]);
    console.log(`[olx] car (make,year) cells published: ${breakdownRows.length}`);
  }

  logConnectorRun(SOURCE_ID, results);
}

// Append/merge rows into a committable derived dataset (time series accrues).
async function mergeBreakdown(name: string, rows: Array<Record<string, unknown>>, keyFields: string[]) {
  const dir = path.join(process.cwd(), "data", "derived");
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${name}.json`);
  let existing: { rows: Array<Record<string, unknown>>; built_at: string } = { rows: [], built_at: "" };
  try { existing = JSON.parse(await fs.readFile(file, "utf-8")); } catch { /* first */ }
  const key = (r: Record<string, unknown>) => keyFields.map((k) => r[k]).join("|");
  const map = new Map<string, Record<string, unknown>>();
  for (const r of existing.rows) map.set(key(r), r);
  for (const r of rows) map.set(key(r), r);
  const merged = { built_at: isoDate(), rows: Array.from(map.values()).sort((a, b) => key(a).localeCompare(key(b))) };
  await fs.writeFile(file, JSON.stringify(merged, null, 2), "utf-8");
}

run().catch((err) => {
  console.error("[olx] fatal:", err);
  process.exit(1);
});
