// Mabii scheduler — pure deterministic, no AI.
//
// Reads the indicator catalogue + the per-(indicator, source) last_fetched_at
// in data/canonical/, and prints what needs to be refreshed today.
//
// Two modes:
//   --json   : emit machine-readable JSON (one row per due item)
//   --table  : emit a human-readable table (default)
//
// Exit codes:
//   0  — nothing due
//   1  — one or more items are due; run.ts will dispatch them
//   2  — invocation error

import { promises as fs } from "node:fs";
import path from "node:path";
import { indicators } from "../../src/data/catalog/indicators";
import { sources } from "../../src/data/catalog/sources";
import {
  classifyScheduleStatus,
  describeCadence,
  type ScheduleStatus,
} from "../../src/data/schedule";
import type { IndicatorObservationsFile } from "../../src/data/types";

interface Item {
  indicator_code: string;
  source_id: string;
  cadence: string;
  status: ScheduleStatus;
  last_fetched_at: string | null;
  next_expected: string | null;
  age_days: number | null;
}

async function readLastFetched(): Promise<Map<string, Map<string, string>>> {
  // returns: indicator_code -> source_id -> latest fetched_at
  const result = new Map<string, Map<string, string>>();
  const canonicalDir = path.join(process.cwd(), "data", "canonical");
  let entries: string[] = [];
  try {
    entries = await fs.readdir(canonicalDir);
  } catch {
    return result; // no data yet
  }
  for (const file of entries) {
    if (!file.endsWith(".json")) continue;
    const text = await fs.readFile(path.join(canonicalDir, file), "utf-8");
    let parsed: IndicatorObservationsFile;
    try {
      parsed = JSON.parse(text);
    } catch {
      continue;
    }
    const bySource = new Map<string, string>();
    for (const obs of parsed.observations) {
      const prior = bySource.get(obs.source_id);
      if (!prior || obs.fetched_at > prior) bySource.set(obs.source_id, obs.fetched_at);
    }
    result.set(parsed.indicator_code, bySource);
  }
  return result;
}

async function computeDue(now = new Date()): Promise<Item[]> {
  const lastFetchedByPair = await readLastFetched();
  const sourceLookup = new Map(sources.map((s) => [s.id, s]));
  const items: Item[] = [];

  for (const ind of indicators) {
    for (const mapping of ind.sources) {
      const source = sourceLookup.get(mapping.source_id);
      if (!source) continue;
      // Only schedule live sources. Planned/scrape-needed/etc. are visible but never auto-fetched.
      if (source.ingestion_status !== "live") continue;

      const lastStr = lastFetchedByPair.get(ind.code)?.get(mapping.source_id);
      const last = lastStr ? new Date(lastStr) : undefined;
      const { status, expectedNext, ageDays } = classifyScheduleStatus(
        mapping.schedule,
        last,
        now
      );

      items.push({
        indicator_code: ind.code,
        source_id: mapping.source_id,
        cadence: describeCadence(mapping.schedule),
        status,
        last_fetched_at: lastStr ?? null,
        next_expected: expectedNext?.toISOString().slice(0, 10) ?? null,
        age_days: ageDays ?? null,
      });
    }
  }

  return items;
}

function printTable(items: Item[]) {
  const widths = {
    indicator: 50,
    source: 18,
    status: 10,
    cadence: 32,
    next: 12,
    age: 6,
  };
  const pad = (s: string, n: number) => s.padEnd(n).slice(0, n);
  const header = [
    pad("INDICATOR", widths.indicator),
    pad("SOURCE", widths.source),
    pad("STATUS", widths.status),
    pad("CADENCE", widths.cadence),
    pad("NEXT", widths.next),
    pad("AGE", widths.age),
  ].join("  ");
  console.log(header);
  console.log("-".repeat(header.length));
  for (const i of items) {
    console.log(
      [
        pad(i.indicator_code, widths.indicator),
        pad(i.source_id, widths.source),
        pad(i.status, widths.status),
        pad(i.cadence, widths.cadence),
        pad(i.next_expected ?? "—", widths.next),
        pad(i.age_days === null ? "—" : `${i.age_days}d`, widths.age),
      ].join("  ")
    );
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const all = await computeDue();
  const due = all.filter((i) => i.status === "due" || i.status === "stale");

  if (args.has("--json")) {
    process.stdout.write(JSON.stringify({ all, due }, null, 2));
  } else {
    printTable(all);
    console.log("");
    console.log(
      `Summary: ${due.length} due / ${all.length} live indicator-source pairs`
    );
  }

  process.exit(due.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("[scheduler/check] fatal:", err);
  process.exit(2);
});
