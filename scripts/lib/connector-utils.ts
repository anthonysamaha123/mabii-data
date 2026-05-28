// Shared utilities for connectors. Deterministic, no AI.
// Every fetched payload is hashed and stored verbatim before any parsing.

import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  Observation,
  IndicatorObservationsFile,
} from "../../src/data/types";

const DATA_ROOT = path.join(process.cwd(), "data");
const RAW_ROOT = path.join(DATA_ROOT, "raw");
const CANONICAL_ROOT = path.join(DATA_ROOT, "canonical");

export async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function isoDate(): string {
  return new Date().toISOString();
}

export function isoDateOnly(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Parse `--codes=a,b,c` out of process.argv (or `--code=a`).
 * Returns an empty Set when no filter is provided — caller treats this as "run all".
 */
export function parseCodesFilter(argv = process.argv.slice(2)): Set<string> {
  const set = new Set<string>();
  for (const arg of argv) {
    if (arg.startsWith("--codes=") || arg.startsWith("--code=")) {
      const value = arg.split("=", 2)[1];
      for (const code of value.split(",")) {
        const trimmed = code.trim();
        if (trimmed) set.add(trimmed);
      }
    }
  }
  return set;
}

/** True if the indicator should be processed given the active filter. */
export function shouldProcess(
  indicator_code: string,
  filter: Set<string>
): boolean {
  return filter.size === 0 || filter.has(indicator_code);
}

export interface RawWriteResult {
  hash: string;
  relativePath: string;
  isNew: boolean;
}

export async function writeRaw(
  source_id: string,
  payload: unknown,
  filename: string
): Promise<RawWriteResult> {
  const stable = JSON.stringify(payload);
  const hash = sha256(stable);
  const today = isoDateOnly();
  const dir = path.join(RAW_ROOT, source_id, today);
  await ensureDir(dir);
  const relativePath = path
    .join("raw", source_id, today, filename)
    .replace(/\\/g, "/");
  const filePath = path.join(DATA_ROOT, relativePath);

  let isNew = true;
  try {
    const existing = await fs.readFile(filePath, "utf-8");
    const existingHash = sha256(existing);
    if (existingHash === hash) isNew = false;
  } catch {
    // file does not exist — that's fine
  }

  if (isNew) {
    await fs.writeFile(filePath, stable, "utf-8");
  }

  return { hash, relativePath, isNew };
}

export async function fetchJson(
  url: string,
  init?: RequestInit & { timeoutMs?: number; retries?: number }
): Promise<unknown> {
  const timeoutMs = init?.timeoutMs ?? 45_000;
  const retries = init?.retries ?? 2;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          "user-agent":
            "Mabii/0.1 (https://mabii.org; contact: hello@mabii.org)",
          accept: "application/json",
          ...(init?.headers ?? {}),
        },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
          `HTTP ${res.status} for ${url}${body ? `: ${body.slice(0, 200)}` : ""}`
        );
      }
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const backoff = 1000 * (attempt + 1);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
  }
  throw lastErr;
}

export async function mergeObservations(
  indicator_code: string,
  newObservations: Observation[]
): Promise<{ added: number; updated: number; total: number }> {
  await ensureDir(CANONICAL_ROOT);
  const file = path.join(CANONICAL_ROOT, `${indicator_code}.json`);

  let existing: IndicatorObservationsFile = {
    indicator_code,
    observations: [],
    built_at: isoDate(),
  };
  try {
    const text = await fs.readFile(file, "utf-8");
    existing = JSON.parse(text);
  } catch {
    // first write
  }

  // Key: (source_id, period_start, period_end). Latest fetched wins on collision.
  const key = (o: Observation) =>
    `${o.source_id}|${o.period_start}|${o.period_end}`;

  const map = new Map<string, Observation>();
  for (const o of existing.observations) map.set(key(o), o);

  let added = 0;
  let updated = 0;
  for (const o of newObservations) {
    const k = key(o);
    const prior = map.get(k);
    if (!prior) {
      map.set(k, { ...o, version: 1 });
      added += 1;
    } else if (prior.value !== o.value || prior.raw_ref !== o.raw_ref) {
      map.set(k, { ...o, version: prior.version + 1 });
      updated += 1;
    } else {
      // Same value, same raw ref: just refresh fetched_at to record liveness
      map.set(k, { ...prior, fetched_at: o.fetched_at });
    }
  }

  const merged: IndicatorObservationsFile = {
    indicator_code,
    built_at: isoDate(),
    observations: Array.from(map.values()).sort((a, b) => {
      if (a.period_end !== b.period_end)
        return a.period_end.localeCompare(b.period_end);
      return a.source_id.localeCompare(b.source_id);
    }),
  };

  await fs.writeFile(file, JSON.stringify(merged, null, 2), "utf-8");

  return { added, updated, total: merged.observations.length };
}

export function annualPeriod(year: number): {
  period_start: string;
  period_end: string;
} {
  return {
    period_start: `${year}-01-01`,
    period_end: `${year}-12-31`,
  };
}

export function logConnectorRun(
  source_id: string,
  results: Record<string, { added: number; updated: number; total: number }>
) {
  const lines: string[] = [];
  lines.push(`[${source_id}] ran at ${isoDate()}`);
  let totalAdded = 0;
  let totalUpdated = 0;
  for (const [code, stats] of Object.entries(results)) {
    lines.push(
      `  ${code}: +${stats.added} added, ${stats.updated} updated, ${stats.total} total`
    );
    totalAdded += stats.added;
    totalUpdated += stats.updated;
  }
  lines.push(`  TOTAL: +${totalAdded} added, ${totalUpdated} updated`);
  console.log(lines.join("\n"));
}
