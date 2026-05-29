import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { getSurveyStore, type SubmissionRecord } from "@/lib/survey/store";
import {
  verifyToken,
  dedupHash,
  ipHash,
  validateSubmission,
} from "@/lib/survey/integrity";
import { surveyQuestions, type Respondent } from "@/data/survey/questions";

export const dynamic = "force-dynamic";

const IP_VELOCITY_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const IP_VELOCITY_MAX = 8; // submissions per IP per hour
const TURNSTILE_SECRET = process.env.CF_TURNSTILE_SECRET ?? "";

interface SubmitBody {
  respondent: Respondent;
  wave: string;
  answers: Record<string, string>;
  token: string;
  hp?: string; // honeypot — must be empty
  turnstile?: string; // Cloudflare Turnstile token (optional in dev)
}

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!TURNSTILE_SECRET) return true; // dev: no key → skip (the form also hides the widget)
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: TURNSTILE_SECRET, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}

function reject(reason: string, status = 400) {
  return NextResponse.json({ ok: false, reason }, { status });
}

export async function POST(req: NextRequest) {
  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return reject("invalid_json");
  }

  const { respondent, wave, answers, token, hp, turnstile } = body;

  // Layer 1a — honeypot: a hidden field bots fill, humans never see.
  if (hp && hp.trim() !== "") return reject("honeypot");

  // Layer 1b — shape checks
  if (respondent !== "person" && respondent !== "business") return reject("bad_respondent");
  if (!wave || typeof wave !== "string") return reject("bad_wave");
  if (!answers || typeof answers !== "object") return reject("bad_answers");

  // Layer 1c — timing token (rejects instant bot submits + expired/forged tokens)
  const timing = verifyToken(token);
  if (!timing.ok) return reject(timing.reason ?? "bad_token");

  // Layer 1d — Turnstile (no-op in dev when no secret configured)
  const ip = clientIp(req);
  const ua = req.headers.get("user-agent") ?? "";
  const turnstileOk = await verifyTurnstile(turnstile ?? "", ip);
  if (!turnstileOk) return reject("turnstile_failed");

  // Layer 3 — response validation against the schema
  const validation = validateSubmission(respondent, answers);
  if (!validation.ok) {
    return NextResponse.json({ ok: false, reason: "validation", errors: validation.errors }, { status: 422 });
  }

  const store = getSurveyStore();

  // Layer 2a — IP velocity cap
  const ih = ipHash(ip);
  const recentFromIp = await store.ipVelocity(ih, IP_VELOCITY_WINDOW_MS);
  if (recentFromIp >= IP_VELOCITY_MAX) return reject("rate_limited", 429);

  // Layer 2b — per-wave uniqueness (privacy-preserving dedup hash)
  const dh = dedupHash(wave, ip, ua);
  const isNew = await store.recordDedup(`${wave}:${respondent}`, dh);
  if (!isNew) return reject("already_submitted", 409);

  // Split anchors vs answers; derive governorate + module.
  const mine = surveyQuestions.filter((q) => q.respondent === respondent);
  const anchorIds = new Set(mine.filter((q) => q.block === "anchor").map((q) => q.id));
  const govKey = respondent === "person" ? "p_gov" : "b_gov";
  const governorate = answers[govKey] ?? "unknown";
  const moduleId =
    mine.find((q) => answers[q.id] && q.block !== "anchor" && q.block !== "core")?.block ?? "core";

  const anchors: Record<string, string> = {};
  const substantive: Record<string, string> = {};
  for (const [k, v] of Object.entries(answers)) {
    if (anchorIds.has(k)) anchors[k] = v;
    else substantive[k] = v;
  }

  const rec: SubmissionRecord = {
    id: crypto.randomUUID(),
    wave,
    respondent,
    governorate,
    anchors,
    module_id: String(moduleId),
    answers: substantive,
    submitted_at: new Date().toISOString(),
    integrity: { flags: validation.flags, ts_ok: true },
  };

  await store.saveSubmission(rec);
  await store.noteIp(ih);

  return NextResponse.json({ ok: true, flags: validation.flags });
}
