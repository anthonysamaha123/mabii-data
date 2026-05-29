import "server-only";
import crypto from "node:crypto";
import { surveyQuestions, type Respondent } from "@/data/survey/questions";

// Anti-abuse primitives (SURVEY.md §3). Pure-ish (crypto + schema only).

const BASE_SALT = process.env.SURVEY_HMAC_SALT ?? "mabii-dev-salt-not-for-production";
const TOKEN_SECRET = process.env.SURVEY_TOKEN_SECRET ?? BASE_SALT;

// ── Timing token: signed issuedAt, prevents instant-bot submits + simple replay
export function issueToken(now = Date.now()): string {
  const nonce = crypto.randomBytes(8).toString("hex");
  const payload = `${now}.${nonce}`;
  const sig = crypto.createHmac("sha256", TOKEN_SECRET).update(payload).digest("hex").slice(0, 32);
  return `${payload}.${sig}`;
}

export interface TimingCheck {
  ok: boolean;
  reason?: string;
}

export function verifyToken(
  token: string,
  now = Date.now(),
  minMs = 8_000,
  maxMs = 2 * 3600 * 1000
): TimingCheck {
  const parts = (token ?? "").split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed_token" };
  const [tsStr, nonce, sig] = parts;
  const expected = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(`${tsStr}.${nonce}`)
    .digest("hex")
    .slice(0, 32);
  if (sig !== expected) return { ok: false, reason: "bad_token_signature" };
  const issuedAt = Number.parseInt(tsStr, 10);
  if (!Number.isFinite(issuedAt)) return { ok: false, reason: "bad_token_ts" };
  const age = now - issuedAt;
  if (age < minMs) return { ok: false, reason: "too_fast" };
  if (age > maxMs) return { ok: false, reason: "token_expired" };
  return { ok: true };
}

// ── Per-wave dedup hash from IP + UA. Never store IP/UA themselves.
export function waveSalt(wave: string): string {
  return crypto.createHmac("sha256", BASE_SALT).update(wave).digest("hex");
}

export function dedupHash(wave: string, ip: string, ua: string): string {
  return crypto
    .createHmac("sha256", waveSalt(wave))
    .update(`${ip}|${ua}`)
    .digest("hex");
}

export function ipHash(ip: string): string {
  return crypto.createHmac("sha256", BASE_SALT).update(ip).digest("hex").slice(0, 24);
}

// ── Response validation against the schema
export interface ValidationResult {
  ok: boolean;
  errors: string[];
  flags: string[];
}

export function validateSubmission(
  respondent: Respondent,
  answers: Record<string, string>
): ValidationResult {
  const errors: string[] = [];
  const flags: string[] = [];

  const mine = surveyQuestions.filter((q) => q.respondent === respondent);
  const byId = new Map(mine.map((q) => [q.id, q]));

  // 1. Every submitted answer must be a known question for this respondent with a valid option value.
  for (const [qid, val] of Object.entries(answers)) {
    const q = byId.get(qid);
    if (!q) {
      errors.push(`unknown_question:${qid}`);
      continue;
    }
    const validValues = (q.options ?? []).map((o) => o.value);
    if (validValues.length && !validValues.includes(val)) {
      errors.push(`invalid_value:${qid}`);
    }
  }

  // 2. Required anchors present (governorate + at least the type-specific anchor set).
  const requiredAnchors = mine.filter((q) => q.block === "anchor").map((q) => q.id);
  const missingAnchors = requiredAnchors.filter((id) => !answers[id]);
  if (missingAnchors.length === requiredAnchors.length) {
    errors.push("no_anchors"); // nothing identifying the segment at all → useless + suspicious
  } else if (missingAnchors.length) {
    flags.push(`missing_anchors:${missingAnchors.length}`);
  }

  // 3. Must answer at least one substantive (non-anchor) question.
  const substantive = Object.keys(answers).filter((id) => {
    const q = byId.get(id);
    return q && q.block !== "anchor";
  });
  if (substantive.length === 0) errors.push("empty_submission");

  // 4. Straight-lining: if many option-questions all share the same option index, flag.
  const idxs: number[] = [];
  for (const id of substantive) {
    const q = byId.get(id)!;
    const opts = q.options ?? [];
    const i = opts.findIndex((o) => o.value === answers[id]);
    if (i >= 0) idxs.push(i);
  }
  if (idxs.length >= 6 && new Set(idxs).size === 1) {
    flags.push("straight_lining");
  }

  return { ok: errors.length === 0, errors, flags };
}
