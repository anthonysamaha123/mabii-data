import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

// Survey storage seam.
// The whole submission + anti-abuse pipeline talks to this interface only.
// FileSurveyStore is the dev/low-volume implementation (append-only JSONL +
// small JSON indexes). When you provision Postgres/Supabase, write a
// PgSurveyStore implementing the same interface and swap getSurveyStore().
//
// PRIVACY: no PII is ever stored. IP/UA are used transiently to compute a
// salted dedup hash, then discarded — only the hash is persisted, for the
// current wave's dedup window.

export interface SubmissionRecord {
  id: string;
  wave: string;
  respondent: "person" | "business";
  governorate: string;
  anchors: Record<string, string>;
  module_id: string;
  answers: Record<string, string>;
  submitted_at: string;
  integrity: Record<string, unknown>;
}

export interface SurveyStore {
  /** Returns true if this dedup hash is NEW for the wave (and records it); false if already seen. */
  recordDedup(wave: string, dedupHash: string): Promise<boolean>;
  /** How many submissions this ipHash has made within the window (for velocity capping). */
  ipVelocity(ipHash: string, windowMs: number): Promise<number>;
  /** Records an ipHash hit at now (for velocity). */
  noteIp(ipHash: string): Promise<void>;
  saveSubmission(rec: SubmissionRecord): Promise<void>;
  loadSubmissions(wave?: string): Promise<SubmissionRecord[]>;
}

const ROOT = path.join(process.cwd(), "data", "survey");
const SUB_DIR = path.join(ROOT, "submissions");
const DEDUP_DIR = path.join(ROOT, "dedup");
const VELOCITY_FILE = path.join(ROOT, "velocity.json");

async function ensure(p: string) {
  await fs.mkdir(p, { recursive: true });
}

class FileSurveyStore implements SurveyStore {
  async recordDedup(wave: string, dedupHash: string): Promise<boolean> {
    await ensure(DEDUP_DIR);
    const f = path.join(DEDUP_DIR, `${wave}.json`);
    let set: string[] = [];
    try {
      set = JSON.parse(await fs.readFile(f, "utf-8"));
    } catch {
      /* first */
    }
    if (set.includes(dedupHash)) return false;
    set.push(dedupHash);
    await fs.writeFile(f, JSON.stringify(set), "utf-8");
    return true;
  }

  async ipVelocity(ipHash: string, windowMs: number): Promise<number> {
    const now = Date.now();
    let entries: Array<{ h: string; t: number }> = [];
    try {
      entries = JSON.parse(await fs.readFile(VELOCITY_FILE, "utf-8"));
    } catch {
      /* none */
    }
    return entries.filter((e) => e.h === ipHash && now - e.t < windowMs).length;
  }

  async noteIp(ipHash: string): Promise<void> {
    await ensure(ROOT);
    const now = Date.now();
    let entries: Array<{ h: string; t: number }> = [];
    try {
      entries = JSON.parse(await fs.readFile(VELOCITY_FILE, "utf-8"));
    } catch {
      /* none */
    }
    // prune anything older than 24h to keep the file small
    entries = entries.filter((e) => now - e.t < 24 * 3600 * 1000);
    entries.push({ h: ipHash, t: now });
    await fs.writeFile(VELOCITY_FILE, JSON.stringify(entries), "utf-8");
  }

  async saveSubmission(rec: SubmissionRecord): Promise<void> {
    await ensure(SUB_DIR);
    const f = path.join(SUB_DIR, `${rec.wave}.jsonl`);
    await fs.appendFile(f, JSON.stringify(rec) + "\n", "utf-8");
  }

  async loadSubmissions(wave?: string): Promise<SubmissionRecord[]> {
    await ensure(SUB_DIR);
    const files = wave ? [`${wave}.jsonl`] : await fs.readdir(SUB_DIR);
    const out: SubmissionRecord[] = [];
    for (const file of files) {
      if (!file.endsWith(".jsonl")) continue;
      let text = "";
      try {
        text = await fs.readFile(path.join(SUB_DIR, file), "utf-8");
      } catch {
        continue;
      }
      for (const line of text.split("\n")) {
        if (!line.trim()) continue;
        try {
          out.push(JSON.parse(line));
        } catch {
          /* skip malformed */
        }
      }
    }
    return out;
  }
}

// ── Supabase/Postgres adapter ────────────────────────────────────────
// Active when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set (production).
// Uses the service role (server-side only) which bypasses RLS — the tables
// have no public write policies, so only this path can write.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

class PgSurveyStore implements SurveyStore {
  private sb: SupabaseClient;
  constructor(url: string, serviceKey: string) {
    this.sb = createClient(url, serviceKey, { auth: { persistSession: false } });
  }

  async recordDedup(wave: string, dedupHash: string): Promise<boolean> {
    const { error } = await this.sb
      .from("survey_dedup")
      .insert({ wave, dedup_hash: dedupHash });
    if (!error) return true;
    if (error.code === "23505") return false; // unique violation = already seen
    throw new Error(`dedup insert failed: ${error.message}`);
  }

  async ipVelocity(ipHash: string, windowMs: number): Promise<number> {
    const since = new Date(Date.now() - windowMs).toISOString();
    const { count, error } = await this.sb
      .from("survey_velocity")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("ts", since);
    if (error) throw new Error(`velocity query failed: ${error.message}`);
    return count ?? 0;
  }

  async noteIp(ipHash: string): Promise<void> {
    await this.sb.from("survey_velocity").insert({ ip_hash: ipHash });
  }

  async saveSubmission(rec: SubmissionRecord): Promise<void> {
    const { error } = await this.sb.from("survey_submission").insert({
      id: rec.id,
      wave: rec.wave,
      respondent: rec.respondent,
      governorate: rec.governorate,
      anchors: rec.anchors,
      module_id: rec.module_id,
      answers: rec.answers,
      integrity: rec.integrity,
      submitted_at: rec.submitted_at,
    });
    if (error) throw new Error(`submission insert failed: ${error.message}`);
  }

  async loadSubmissions(wave?: string): Promise<SubmissionRecord[]> {
    let q = this.sb.from("survey_submission").select("*");
    if (wave) q = q.eq("wave", wave);
    const { data, error } = await q;
    if (error) throw new Error(`submission load failed: ${error.message}`);
    return (data ?? []).map((r) => ({
      id: r.id,
      wave: r.wave,
      respondent: r.respondent,
      governorate: r.governorate,
      anchors: r.anchors ?? {},
      module_id: r.module_id ?? "core",
      answers: r.answers ?? {},
      submitted_at: r.submitted_at,
      integrity: r.integrity ?? {},
    }));
  }
}

let _store: SurveyStore | null = null;

export function getSurveyStore(): SurveyStore {
  if (_store) return _store;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  _store = url && key ? new PgSurveyStore(url, key) : new FileSurveyStore();
  return _store;
}

/** Which backend is active — for /status + ops visibility. */
export function activeStoreKind(): "postgres" | "file" {
  return process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? "postgres"
    : "file";
}
