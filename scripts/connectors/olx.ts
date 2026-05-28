// OLX Lebanon connector — T5, modeled. RECURRING (weekly).
//
// OLX server-renders listing cards into the category page HTML (for SEO).
// We fetch N pages per category, segment by /ad/…ID.html anchors, extract the
// asking price (USD) and the location, map location → governorate, and publish
// the OUTLIER-TRIMMED MEDIAN per governorate (rent/sale) or nationally (cars).
//
// Per OLX ToS we never store or republish raw listings — only the aggregate
// median + sample size per period. Each run is a point-in-time snapshot; the
// time series accumulates from repeated weekly runs (rides the scheduler/cron).

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

const SOURCE_ID = "olx-lebanon";
const PAGES_PER_CATEGORY = 12;

interface CategoryDef {
  indicatorCode: string;
  url: string;
  level: "governorate" | "country";
  // sane price band (USD) to drop obvious junk before trimming
  min: number;
  max: number;
}

const CATEGORIES: CategoryDef[] = [
  {
    indicatorCode: "mabii.real_estate.rent_median_usd",
    url: "https://www.olx.com.lb/properties/apartments-villas-for-rent/",
    level: "governorate",
    min: 100,
    max: 25_000,
  },
  {
    indicatorCode: "mabii.real_estate.sale_price_median_usd",
    url: "https://www.olx.com.lb/properties/apartments-villas-for-sale/",
    level: "governorate",
    min: 10_000,
    max: 15_000_000,
  },
  {
    indicatorCode: "mabii.transport.used_car_median_price_usd",
    url: "https://www.olx.com.lb/vehicles/cars-for-sale/",
    level: "country",
    min: 500,
    max: 500_000,
  },
];

// OLX area / district name → Mabii governorate id. First keyword hit wins.
// Lower-cased matching against card text + slug.
const AREA_TO_GOV: Array<[RegExp, string]> = [
  [/\bbeirut\b|achrafieh|ashrafieh|hamra|verdun|koraytem|mar elias|ras beirut|manara|badaro|sodeco|gemmayze|mar mikhael|clemenceau|raouche|tallet el khayat|mazraa|qoreitem/, "LBN-BA"],
  [/mount lebanon|metn|matn|keserwan|kesrwan|kesrouan|baabda|aley|chouf|shouf|jbeil|byblos|jounieh|antelias|dbayeh|zalka|jdeideh|sin el fil|mansourieh|mtayleb|rabieh|broumana|beit mery|dbaye|adma|kaslik|zouk|ballouneh|hazmieh|fanar|naccache|rmeil/, "LBN-ML"],
  [/\bnorth\b|tripoli|koura|zgharta|batroun|bcharre|bsharri|minieh|dannieh|danniyeh|amioun|chekka|kfaraabida/, "LBN-NO"],
  [/\bakkar\b|halba|qoubaiyat/, "LBN-AK"],
  [/\bbekaa\b|beqaa|zahle|zahleh|chtaura|chtoura|west bekaa|rashaya|jib jannine/, "LBN-BK"],
  [/baalbek|baalbeck|hermel|deir el ahmar/, "LBN-BH"],
  [/\bsouth\b|saida|sidon|tyre|sour|jezzine|nabatieh adjacent|ghazieh/, "LBN-SO"],
  [/nabatieh|nabatiyeh|marjeyoun|hasbaya|bint jbeil|tebnine/, "LBN-NA"],
];

function mapGovernorate(haystack: string): string | null {
  const h = haystack.toLowerCase();
  for (const [re, gov] of AREA_TO_GOV) {
    if (re.test(h)) return gov;
  }
  return null;
}

async function fetchPage(url: string, page: number): Promise<string | null> {
  const fullUrl = page <= 1 ? url : `${url}?page=${page}`;
  try {
    const res = await fetch(fullUrl, {
      signal: AbortSignal.timeout(30_000),
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        accept: "text/html",
      },
    });
    if (!res.ok && res.status !== 404) return null;
    const html = await res.text();
    // A real listing page is large; the bare 404 shell is ~137KB with no cards.
    return html;
  } catch {
    return null;
  }
}

interface ParsedCard {
  id: string;
  price: number;
  gov: string | null;
}

function parseCards(html: string, cat: CategoryDef): ParsedCard[] {
  const parts = html.split(/href="\/ad\//).slice(1);
  const cards: ParsedCard[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    const idm = part.match(/^([^"]*?)-ID(\d+)\.html/);
    if (!idm) continue;
    const id = idm[2];
    if (seen.has(id)) continue;
    const slug = idm[1];
    // Card chunk = everything up to the next anchor (split already bounds it),
    // capped to keep regex cheap.
    const chunk = part.slice(0, 2500);
    const textChunk = chunk.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&");
    const priceMatch = textChunk.match(/(?:USD|\$)\s?([0-9][0-9,]{2,})/);
    if (!priceMatch) continue;
    const price = Number.parseInt(priceMatch[1].replace(/,/g, ""), 10);
    if (!Number.isFinite(price) || price < cat.min || price > cat.max) continue;
    const gov = cat.level === "governorate"
      ? mapGovernorate(`${textChunk} ${decodeURIComponent(slug)}`)
      : null;
    seen.add(id);
    cards.push({ id, price, gov });
  }
  return cards;
}

/** Outlier-trimmed (P5–P95) median. */
function trimmedMedian(values: number[]): { median: number; n: number } | null {
  if (values.length < 5) {
    if (values.length === 0) return null;
    const s = [...values].sort((a, b) => a - b);
    return { median: s[Math.floor(s.length / 2)], n: values.length };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const lo = Math.floor(sorted.length * 0.05);
  const hi = Math.ceil(sorted.length * 0.95);
  const trimmed = sorted.slice(lo, hi);
  const mid = Math.floor(trimmed.length / 2);
  const median =
    trimmed.length % 2 === 0
      ? (trimmed[mid - 1] + trimmed[mid]) / 2
      : trimmed[mid];
  return { median: Math.round(median), n: trimmed.length };
}

function weekPeriod(d = new Date()): { period_start: string; period_end: string } {
  // ISO week: Monday start. We label by the Monday of the current week.
  const day = (d.getUTCDay() + 6) % 7; // 0 = Monday
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
  const sunday = new Date(monday.getTime() + 6 * 86400_000);
  return {
    period_start: monday.toISOString().slice(0, 10),
    period_end: sunday.toISOString().slice(0, 10),
  };
}

async function run() {
  const source = sources.find((s) => s.id === SOURCE_ID)!;
  const fetched_at = isoDate();
  const filter = parseCodesFilter();
  const { period_start, period_end } = weekPeriod();
  const results: Record<string, { added: number; updated: number; total: number }> = {};
  const auditLog: Array<{ category: string; pages: number; listings: number; perGov: Record<string, number> }> = [];

  for (const cat of CATEGORIES) {
    if (!shouldProcess(cat.indicatorCode, filter)) continue;

    const all: ParsedCard[] = [];
    let pagesFetched = 0;
    for (let p = 1; p <= PAGES_PER_CATEGORY; p += 1) {
      const html = await fetchPage(cat.url, p);
      if (!html) break;
      const cards = parseCards(html, cat);
      if (cards.length === 0) break; // ran past the last page
      all.push(...cards);
      pagesFetched += 1;
      await new Promise((r) => setTimeout(r, 800)); // be polite
    }

    // De-dup across pages by id
    const byId = new Map<string, ParsedCard>();
    for (const c of all) byId.set(c.id, c);
    const cards = [...byId.values()];

    console.log(`[olx] ${cat.indicatorCode}: ${pagesFetched} pages, ${cards.length} listings`);

    const observations: Observation[] = [];
    const perGovCount: Record<string, number> = {};

    if (cat.level === "country") {
      const t = trimmedMedian(cards.map((c) => c.price));
      if (t) {
        observations.push({
          indicator_code: cat.indicatorCode,
          geography_id: "LBN",
          period_start,
          period_end,
          frequency: "weekly",
          value: t.median,
          unit: "USD",
          source_id: SOURCE_ID,
          raw_ref: "",
          trust_label: source.trust_label_default,
          extraction_method: "scrape",
          confidence: Math.min(1, t.n / 100),
          method_note: `national median; sample_size=${t.n} (P5–P95 trimmed)`,
          fetched_at,
          version: 1,
        });
        perGovCount["LBN"] = t.n;
      }
    } else {
      const byGov = new Map<string, number[]>();
      for (const c of cards) {
        if (!c.gov) continue;
        const arr = byGov.get(c.gov) ?? [];
        arr.push(c.price);
        byGov.set(c.gov, arr);
      }
      for (const [gov, prices] of byGov) {
        const t = trimmedMedian(prices);
        if (!t || t.n < 3) continue; // need a minimum sample to publish
        observations.push({
          indicator_code: cat.indicatorCode,
          geography_id: gov,
          period_start,
          period_end,
          frequency: "weekly",
          value: t.median,
          unit: "USD",
          source_id: SOURCE_ID,
          raw_ref: "",
          trust_label: source.trust_label_default,
          extraction_method: "scrape",
          confidence: Math.min(1, t.n / 30),
          method_note: `median for ${gov}; sample_size=${t.n} (P5–P95 trimmed, min 3)`,
          fetched_at,
          version: 1,
        });
        perGovCount[gov] = t.n;
      }
    }

    // Audit trail = counts only (no raw listings, per ToS).
    auditLog.push({ category: cat.indicatorCode, pages: pagesFetched, listings: cards.length, perGov: perGovCount });
    const raw = await writeRaw(SOURCE_ID, auditLog, `audit-${cat.indicatorCode}.json`);
    for (const o of observations) o.raw_ref = raw.hash;

    if (observations.length > 0) {
      results[cat.indicatorCode] = await mergeObservations(cat.indicatorCode, observations);
    } else {
      console.warn(`[olx] no publishable observations for ${cat.indicatorCode}`);
    }
  }

  logConnectorRun(SOURCE_ID, results);
}

run().catch((err) => {
  console.error("[olx] fatal:", err);
  process.exit(1);
});
