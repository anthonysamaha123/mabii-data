// Mabii scheduler — dispatcher.
//
// Calls check.ts to compute the due set, then invokes the right connector
// per source with --codes=<indicator_code,...>. Connectors that don't yet
// support the flag will simply fetch their full mapped set (back-compat).
//
// Pure deterministic; never invokes any AI.

import { execSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { indicators } from "../../src/data/catalog/indicators";
import { sources } from "../../src/data/catalog/sources";
import { classifyScheduleStatus } from "../../src/data/schedule";
import type { IndicatorObservationsFile } from "../../src/data/types";

const SOURCE_TO_CONNECTOR: Record<string, string> = {
  "world-bank-wdi": "world-bank",
  "imf-weo": "imf",
  "un-comtrade": "comtrade",
  "fred": "fred",
};

async function readLastFetched(): Promise<Map<string, Map<string, string>>> {
  const result = new Map<string, Map<string, string>>();
  const canonicalDir = path.join(process.cwd(), "data", "canonical");
  let entries: string[] = [];
  try {
    entries = await fs.readdir(canonicalDir);
  } catch {
    return result;
  }
  for (const file of entries) {
    if (!file.endsWith(".json")) continue;
    const text = await fs.readFile(path.join(canonicalDir, file), "utf-8");
    let parsed: IndicatorObservationsFile;
    try { parsed = JSON.parse(text); } catch { continue; }
    const bySource = new Map<string, string>();
    for (const obs of parsed.observations) {
      const prior = bySource.get(obs.source_id);
      if (!prior || obs.fetched_at > prior) bySource.set(obs.source_id, obs.fetched_at);
    }
    result.set(parsed.indicator_code, bySource);
  }
  return result;
}

async function main() {
  const force = process.argv.includes("--force");
  const dryRun = process.argv.includes("--dry-run");
  const sourceLookup = new Map(sources.map((s) => [s.id, s]));
  const lastFetchedByPair = await readLastFetched();
  const now = new Date();

  // Group due (indicator, source) pairs by source so each connector is called once.
  const due = new Map<string, string[]>(); // source_id → list of indicator codes
  for (const ind of indicators) {
    for (const mapping of ind.sources) {
      const source = sourceLookup.get(mapping.source_id);
      if (!source || source.ingestion_status !== "live") continue;
      const last = lastFetchedByPair.get(ind.code)?.get(mapping.source_id);
      const { status } = classifyScheduleStatus(
        mapping.schedule,
        last ? new Date(last) : undefined,
        now
      );
      const shouldRun = force || status === "due" || status === "stale";
      if (shouldRun) {
        const list = due.get(mapping.source_id) ?? [];
        list.push(ind.code);
        due.set(mapping.source_id, list);
      }
    }
  }

  if (due.size === 0) {
    console.log("[scheduler/run] nothing due.");
    return;
  }

  console.log(
    `[scheduler/run] dispatching to ${due.size} source(s):`,
    Array.from(due.entries()).map(([s, codes]) => `${s}=${codes.length}`).join(" ")
  );

  let anyFailure = false;
  for (const [sourceId, codes] of due) {
    const connector = SOURCE_TO_CONNECTOR[sourceId];
    if (!connector) {
      console.warn(
        `[scheduler/run] no connector configured for source "${sourceId}" — skipping`
      );
      continue;
    }
    const codesArg = codes.join(",");
    const cmd = `npx tsx scripts/connectors/${connector}.ts --codes=${codesArg}`;
    console.log(`\n=== ${connector} (${codes.length} indicators) ===`);
    if (dryRun) {
      console.log(`  [dry-run] ${cmd}`);
      continue;
    }
    try {
      execSync(cmd, { stdio: "inherit" });
    } catch (err) {
      anyFailure = true;
      console.error(`[scheduler/run] ${connector} failed:`, err);
    }
  }

  process.exit(anyFailure ? 1 : 0);
}

main().catch((err) => {
  console.error("[scheduler/run] fatal:", err);
  process.exit(2);
});
