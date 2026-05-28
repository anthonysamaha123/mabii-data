import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  IndicatorObservationsFile,
  Observation,
} from "@/data/types";

const DATA_ROOT = path.join(process.cwd(), "data");
const CANONICAL_DIR = path.join(DATA_ROOT, "canonical");

let cache: Map<string, IndicatorObservationsFile> | null = null;
let cacheBuiltAt = 0;
const CACHE_TTL_MS = 60_000;

async function loadAll(): Promise<Map<string, IndicatorObservationsFile>> {
  const now = Date.now();
  if (cache && now - cacheBuiltAt < CACHE_TTL_MS) return cache;

  const next = new Map<string, IndicatorObservationsFile>();
  let entries: string[] = [];
  try {
    entries = await fs.readdir(CANONICAL_DIR);
  } catch {
    // No data yet — return empty cache; pages handle this gracefully.
    cache = next;
    cacheBuiltAt = now;
    return next;
  }

  for (const file of entries) {
    if (!file.endsWith(".json")) continue;
    const filePath = path.join(CANONICAL_DIR, file);
    try {
      const text = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(text) as IndicatorObservationsFile;
      next.set(parsed.indicator_code, parsed);
    } catch (err) {
      // Skip malformed files but never silently drop in production logs.
      console.warn(`[store] Skipping ${file}:`, err);
    }
  }

  cache = next;
  cacheBuiltAt = now;
  return next;
}

export async function getObservations(
  indicator_code: string
): Promise<Observation[]> {
  const all = await loadAll();
  return all.get(indicator_code)?.observations ?? [];
}

export async function getLatestObservationPerSource(
  indicator_code: string
): Promise<Observation[]> {
  const obs = await getObservations(indicator_code);
  const bySource = new Map<string, Observation>();
  for (const o of obs) {
    const existing = bySource.get(o.source_id);
    if (!existing || o.period_end > existing.period_end) {
      bySource.set(o.source_id, o);
    }
  }
  return Array.from(bySource.values()).sort((a, b) =>
    a.source_id.localeCompare(b.source_id)
  );
}

export async function getLatestObservation(
  indicator_code: string,
  preferredSourceId?: string
): Promise<Observation | undefined> {
  const obs = await getObservations(indicator_code);
  if (obs.length === 0) return undefined;
  if (preferredSourceId) {
    const fromPreferred = obs
      .filter((o) => o.source_id === preferredSourceId)
      .sort((a, b) => b.period_end.localeCompare(a.period_end));
    if (fromPreferred.length > 0) return fromPreferred[0];
  }
  return obs
    .slice()
    .sort((a, b) => b.period_end.localeCompare(a.period_end))[0];
}

/**
 * Multi-source pivot: returns rows indexed by period, with one column per source.
 * The display engine for the indicator detail page.
 */
export interface PivotRow {
  period_start: string;
  period_end: string;
  bySource: Record<string, Observation | undefined>;
  range?: { min: number; max: number; spreadPct: number };
}

export async function getMultiSourcePivot(
  indicator_code: string
): Promise<PivotRow[]> {
  const obs = await getObservations(indicator_code);
  const byPeriod = new Map<string, PivotRow>();

  for (const o of obs) {
    const key = `${o.period_start}|${o.period_end}`;
    let row = byPeriod.get(key);
    if (!row) {
      row = {
        period_start: o.period_start,
        period_end: o.period_end,
        bySource: {},
      };
      byPeriod.set(key, row);
    }
    row.bySource[o.source_id] = o;
  }

  // Compute deterministic divergence per row.
  for (const row of byPeriod.values()) {
    const values = Object.values(row.bySource)
      .filter((o): o is Observation => Boolean(o))
      .map((o) => o.value);
    if (values.length >= 2) {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const center = (Math.abs(min) + Math.abs(max)) / 2 || 1;
      const spreadPct = ((max - min) / center) * 100;
      row.range = { min, max, spreadPct };
    }
  }

  return Array.from(byPeriod.values()).sort((a, b) =>
    b.period_end.localeCompare(a.period_end)
  );
}

export async function listIndicatorsWithData(): Promise<string[]> {
  const all = await loadAll();
  return Array.from(all.keys());
}

export async function getLastFetchedAtForSource(
  source_id: string
): Promise<string | undefined> {
  const all = await loadAll();
  let latest: string | undefined;
  for (const file of all.values()) {
    for (const o of file.observations) {
      if (o.source_id === source_id) {
        if (!latest || o.fetched_at > latest) latest = o.fetched_at;
      }
    }
  }
  return latest;
}

/** Latest fetched_at per (indicator_code, source_id). Used by the status page. */
export async function getLastFetchedMap(): Promise<
  Map<string, Map<string, string>>
> {
  const all = await loadAll();
  const result = new Map<string, Map<string, string>>();
  for (const [code, file] of all) {
    const bySource = new Map<string, string>();
    for (const obs of file.observations) {
      const prior = bySource.get(obs.source_id);
      if (!prior || obs.fetched_at > prior) {
        bySource.set(obs.source_id, obs.fetched_at);
      }
    }
    result.set(code, bySource);
  }
  return result;
}

export interface GeographyBreakdownRow {
  geography_id: string;
  observation: Observation;
}

/**
 * How many distinct geographies an indicator covers. >1 means it's a
 * subnational indicator (e.g. Places counts per governorate) and should be
 * rendered as a by-geography breakdown rather than a time-series pivot.
 */
export async function countDistinctGeographies(
  indicator_code: string
): Promise<number> {
  const obs = await getObservations(indicator_code);
  return new Set(obs.map((o) => o.geography_id)).size;
}

/**
 * Latest observation per geography for an indicator (most recent period each).
 * Sorted by value descending. Used for the by-geography breakdown view.
 */
export async function getGeographyBreakdown(
  indicator_code: string
): Promise<GeographyBreakdownRow[]> {
  const obs = await getObservations(indicator_code);
  const latestByGeo = new Map<string, Observation>();
  for (const o of obs) {
    const prior = latestByGeo.get(o.geography_id);
    if (!prior || o.period_end > prior.period_end) {
      latestByGeo.set(o.geography_id, o);
    }
  }
  return Array.from(latestByGeo.entries())
    .map(([geography_id, observation]) => ({ geography_id, observation }))
    .sort((a, b) => b.observation.value - a.observation.value);
}

export function clearStoreCache() {
  cache = null;
}
