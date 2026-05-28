// Google Places API connector — T5, modeled trust label.
//
// Snapshots the Lebanese business landscape across 10 categories × 8 governorates.
// Per ToS we publish ONLY aggregates (count + median rating); raw place lists
// are never persisted beyond this script run (the inventory dump in raw/ is a
// counts-only manifest, not a place list).
//
// Cost: ~25 queries × 1-3 pages × $0.032/1k ≈ $0.001-0.003 per snapshot.

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
import { governorates } from "../../src/data/catalog/geographies";
import type { Observation } from "../../src/data/types";

const SOURCE_ID = "google-places";
const API_URL = "https://places.googleapis.com/v1/places:searchText";
const API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";

// Category config — one row per (Mabii category, search-term, post-filter, indicator codes)
interface CategoryDef {
  /** Mabii canonical category */
  code: string;
  /** Term to send to Places `textQuery` */
  searchTerm: string;
  /** Optional regex applied to displayName for Lebanon-specific buckets */
  keywordFilter?: RegExp;
  /** Optional restriction on Places `primaryType` */
  acceptedPrimaryTypes?: string[];
  /** Mabii indicator code for the COUNT observation */
  countIndicator: string;
  /** Mabii indicator code for the MEDIAN-RATING observation */
  ratingIndicator: string;
}

const CATEGORIES: CategoryDef[] = [
  {
    code: "pharmacy",
    searchTerm: "pharmacy",
    countIndicator: "mabii.health.places_pharmacy_count",
    ratingIndicator: "mabii.health.places_pharmacy_median_rating",
  },
  {
    code: "hospital",
    searchTerm: "hospital",
    countIndicator: "mabii.health.places_hospital_count",
    ratingIndicator: "mabii.health.places_hospital_median_rating",
  },
  {
    code: "bank_branch",
    searchTerm: "bank branch",
    acceptedPrimaryTypes: ["bank"],
    countIndicator: "mabii.monetary.places_bank_branch_count",
    ratingIndicator: "mabii.monetary.places_bank_branch_median_rating",
  },
  {
    code: "money_exchange",
    searchTerm: "money exchange sarrafa",
    // Filter by name to weed out actual banks
    keywordFilter: /\b(exchange|sarrafa|sarraf|forex|change|currency)\b|صراف/i,
    countIndicator: "mabii.monetary.places_money_exchange_count",
    ratingIndicator: "mabii.monetary.places_money_exchange_median_rating",
  },
  {
    code: "restaurant",
    searchTerm: "restaurant",
    countIndicator: "mabii.hospitality.places_restaurant_count",
    ratingIndicator: "mabii.hospitality.places_restaurant_median_rating",
  },
  {
    code: "cafe",
    searchTerm: "cafe coffee shop",
    countIndicator: "mabii.hospitality.places_cafe_count",
    ratingIndicator: "mabii.hospitality.places_cafe_median_rating",
  },
  {
    code: "hotel",
    searchTerm: "hotel",
    countIndicator: "mabii.hospitality.places_hotel_count",
    ratingIndicator: "mabii.hospitality.places_hotel_median_rating",
  },
  {
    code: "supermarket",
    searchTerm: "supermarket grocery",
    countIndicator: "mabii.retail.places_supermarket_count",
    ratingIndicator: "mabii.retail.places_supermarket_median_rating",
  },
  {
    code: "gas_station",
    searchTerm: "gas station petrol",
    countIndicator: "mabii.retail.places_gas_station_count",
    ratingIndicator: "mabii.retail.places_gas_station_median_rating",
  },
  {
    code: "generator_shop",
    searchTerm: "generator solar power Lebanon",
    keywordFilter: /\b(generator|solar|inverter|ups|battery)\b|مولد|طاقة|شمسي/i,
    countIndicator: "mabii.environment.places_generator_shop_count",
    ratingIndicator: "mabii.environment.places_generator_shop_median_rating",
  },
];

interface PlaceResult {
  id: string;
  displayName?: { text: string };
  primaryType?: string;
  types?: string[];
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
}

interface SearchResponse {
  places?: PlaceResult[];
  nextPageToken?: string;
}

async function searchTextPaginated(textQuery: string): Promise<PlaceResult[]> {
  const all: PlaceResult[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < 3; page += 1) {
    const body: Record<string, unknown> = {
      textQuery,
      regionCode: "lb",
      maxResultCount: 20,
    };
    if (pageToken) body.pageToken = pageToken;

    const res = await fetch(API_URL, {
      method: "POST",
      signal: AbortSignal.timeout(30_000),
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.primaryType,places.types,places.rating,places.userRatingCount,places.businessStatus,nextPageToken",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
    }
    const data = (await res.json()) as SearchResponse;
    if (data.places) all.push(...data.places);
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
    // Google requires a small delay before honouring nextPageToken
    await new Promise((r) => setTimeout(r, 1500));
  }
  return all;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function filterPlaces(places: PlaceResult[], cat: CategoryDef): PlaceResult[] {
  return places.filter((p) => {
    if (p.businessStatus && p.businessStatus !== "OPERATIONAL") return false;
    if (cat.acceptedPrimaryTypes && p.primaryType && !cat.acceptedPrimaryTypes.includes(p.primaryType)) {
      // Skip places whose primary type doesn't match (e.g. ATMs returned for bank_branch search)
      return false;
    }
    if (cat.keywordFilter) {
      const name = p.displayName?.text ?? "";
      if (!cat.keywordFilter.test(name)) return false;
    }
    return true;
  });
}

function monthPeriod(d = new Date()): { period_start: string; period_end: string } {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const end = `${y}-${String(m + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { period_start: start, period_end: end };
}

async function run() {
  if (!API_KEY) {
    console.error("[google-places] GOOGLE_PLACES_API_KEY is not set");
    process.exit(2);
  }
  const source = sources.find((s) => s.id === SOURCE_ID)!;
  const fetched_at = isoDate();
  const filter = parseCodesFilter();
  const results: Record<string, { added: number; updated: number; total: number }> = {};
  const { period_start, period_end } = monthPeriod();

  // Inventory of counts per (category, governorate) — for the audit trail.
  const inventory: Array<{ category: string; gov: string; count: number; rated: number; median_rating: number | null }> = [];

  for (const cat of CATEGORIES) {
    const countObs: Observation[] = [];
    const ratingObs: Observation[] = [];

    for (const gov of governorates) {
      const query = `${cat.searchTerm} in ${gov.name_en} Governorate, Lebanon`;
      let raw: PlaceResult[];
      try {
        raw = await searchTextPaginated(query);
      } catch (err) {
        console.error(`[google-places] ${cat.code}/${gov.id} failed:`, err instanceof Error ? err.message : err);
        continue;
      }
      const filtered = filterPlaces(raw, cat);
      const ratings = filtered.map((p) => p.rating).filter((r): r is number => typeof r === "number");
      const med = median(ratings);
      const count = filtered.length;

      inventory.push({ category: cat.code, gov: gov.id, count, rated: ratings.length, median_rating: med });
      console.log(`[google-places] ${cat.code.padEnd(16)} ${gov.id} count=${count.toString().padStart(3)} rated=${ratings.length.toString().padStart(3)} median=${med?.toFixed(2) ?? "—"}`);

      // Places returns at most 60 results per text query (3 pages × 20).
      // When we hit that cap the count is CENSORED — a floor, not a true count.
      // Flag it honestly so dense categories aren't mistaken for full enumerations.
      const censored = count >= 60;
      const baseObs = {
        geography_id: gov.id,
        period_start,
        period_end,
        frequency: "monthly" as const,
        source_id: SOURCE_ID,
        trust_label: source.trust_label_default,
        extraction_method: "api" as const,
        fetched_at,
        version: 1,
      };

      if (shouldProcess(cat.countIndicator, filter)) {
        countObs.push({
          ...baseObs,
          indicator_code: cat.countIndicator,
          value: count,
          unit: "count",
          confidence: censored ? 0.3 : 1,
          method_note: censored
            ? `CENSORED: ≥60 businesses returned (Places page cap). True count is higher; treat as a floor.`
            : `Full enumeration within Places coverage (${count} businesses).`,
          raw_ref: "", // assigned after raw write
        });
      }
      if (shouldProcess(cat.ratingIndicator, filter) && med !== null && ratings.length >= 3) {
        ratingObs.push({
          ...baseObs,
          indicator_code: cat.ratingIndicator,
          value: med,
          unit: "rating",
          confidence: Math.min(1, ratings.length / 30),
          raw_ref: "",
          method_note: `sample_size=${ratings.length} (min 3 to publish)`,
        });
      }
    }

    // Stage write so all obs in this category share the same raw_ref
    const rawForCat = await writeRaw(SOURCE_ID, inventory, `inventory-${cat.code}.json`);
    for (const o of countObs) o.raw_ref = rawForCat.hash;
    for (const o of ratingObs) o.raw_ref = rawForCat.hash;

    if (countObs.length > 0) results[cat.countIndicator] = await mergeObservations(cat.countIndicator, countObs);
    if (ratingObs.length > 0) results[cat.ratingIndicator] = await mergeObservations(cat.ratingIndicator, ratingObs);
  }

  logConnectorRun(SOURCE_ID, results);
}

run().catch((err) => {
  console.error("[google-places] fatal:", err);
  process.exit(1);
});
