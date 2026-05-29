// Survey aggregation engine — SPEC Layer 3 for the community survey.
// Reads anonymized submissions for a wave and produces published aggregates:
//   per (question, segment): n, proportion per option + Wilson 95% CI.
// Rules (SURVEY.md §3): suppress any cell with n < N_MIN; national figures are
// POPULATION-WEIGHTED roll-ups of the regional ones, not raw pools.
// Pure file I/O — no server-only imports, runs under tsx.

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { surveyQuestions, type Respondent } from "../../src/data/survey/questions";
import { loadEnvLocal } from "../lib/load-env";

loadEnvLocal();

const ROOT = path.join(process.cwd(), "data", "survey");
const SUB_DIR = path.join(ROOT, "submissions");
const OUT_DIR = path.join(ROOT, "aggregates");
const N_MIN = 30; // minimum cell size to publish

// Postgres is the source of truth when configured; otherwise read/write files.
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const pg: SupabaseClient | null =
  SB_URL && SB_KEY ? createClient(SB_URL, SB_KEY, { auth: { persistSession: false } }) : null;

// Governorate resident population (reference estimates, OCHA/CAS order of magnitude).
const GOV_POP: Record<string, number> = {
  "LBN-BA": 360_000,
  "LBN-ML": 1_700_000,
  "LBN-NO": 840_000,
  "LBN-AK": 390_000,
  "LBN-BK": 550_000,
  "LBN-BH": 340_000,
  "LBN-SO": 580_000,
  "LBN-NA": 280_000,
};

interface Sub {
  respondent: Respondent;
  governorate: string;
  answers: Record<string, string>;
}

function wilson(p: number, n: number): [number, number] {
  if (n === 0) return [0, 0];
  const z = 1.96;
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
}

async function readWave(wave: string): Promise<Sub[]> {
  // Postgres is the source of truth when configured.
  if (pg) {
    const { data, error } = await pg
      .from("survey_submission")
      .select("respondent,governorate,answers")
      .eq("wave", wave);
    if (error) throw new Error(`PG read failed: ${error.message}`);
    return (data ?? []) as Sub[];
  }
  // file fallback (local dev)
  const f = path.join(SUB_DIR, `${wave}.jsonl`);
  let text = "";
  try {
    text = await fs.readFile(f, "utf-8");
  } catch {
    return [];
  }
  const out: Sub[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      /* skip */
    }
  }
  return out;
}

interface OptionAgg { value: string; proportion: number; ci_low: number; ci_high: number }
interface CellAgg {
  question_id: string;
  yields?: string;
  respondent: Respondent;
  segment_type: "governorate" | "national";
  segment: string;
  n: number;
  options: OptionAgg[];
}

function aggregateCell(
  q: (typeof surveyQuestions)[number],
  subs: Sub[],
  segmentType: "governorate" | "national",
  segment: string
): CellAgg | null {
  const vals = subs.map((s) => s.answers[q.id]).filter((v): v is string => Boolean(v));
  const n = vals.length;
  if (n < N_MIN) return null; // suppress small cells
  const opts = q.options ?? [];
  const options: OptionAgg[] = opts.map((o) => {
    const c = vals.filter((v) => v === o.value).length;
    const p = c / n;
    const [lo, hi] = wilson(p, n);
    return {
      value: o.value,
      proportion: Math.round(p * 1000) / 10,
      ci_low: Math.round(lo * 1000) / 10,
      ci_high: Math.round(hi * 1000) / 10,
    };
  });
  return { question_id: q.id, yields: q.yields, respondent: q.respondent, segment_type: segmentType, segment, n, options };
}

async function run() {
  const wave = process.argv.find((a) => a.startsWith("--wave="))?.split("=")[1];
  if (!wave) {
    console.error("usage: tsx scripts/derive/survey-aggregate.ts --wave=2026-W22");
    process.exit(2);
  }
  const subs = await readWave(wave);
  if (subs.length === 0) {
    console.error(`[survey-aggregate] no submissions for wave ${wave}`);
    process.exit(1);
  }

  const cells: CellAgg[] = [];
  for (const respondent of ["person", "business"] as Respondent[]) {
    const rSubs = subs.filter((s) => s.respondent === respondent);
    if (rSubs.length === 0) continue;
    const substantive = surveyQuestions.filter(
      (q) => q.respondent === respondent && q.block !== "anchor"
    );

    for (const q of substantive) {
      // 1-way: per governorate
      const perGovProps = new Map<string, OptionAgg[]>();
      const govsWithData: string[] = [];
      for (const gov of Object.keys(GOV_POP)) {
        const cell = aggregateCell(q, rSubs.filter((s) => s.governorate === gov), "governorate", gov);
        if (cell) {
          cells.push(cell);
          perGovProps.set(gov, cell.options);
          govsWithData.push(gov);
        }
      }
      // national = population-weighted roll-up across governorates that cleared N_MIN
      if (govsWithData.length > 0) {
        const totalPop = govsWithData.reduce((s, g) => s + GOV_POP[g], 0);
        const opts = q.options ?? [];
        const nTotal = govsWithData.reduce(
          (s, g) => s + rSubs.filter((x) => x.governorate === g && x.answers[q.id]).length,
          0
        );
        if (nTotal >= N_MIN) {
          const options: OptionAgg[] = opts.map((o) => {
            const weighted = govsWithData.reduce((s, g) => {
              const op = perGovProps.get(g)!.find((x) => x.value === o.value);
              return s + ((op?.proportion ?? 0) * GOV_POP[g]) / totalPop;
            }, 0);
            return { value: o.value, proportion: Math.round(weighted * 10) / 10, ci_low: 0, ci_high: 0 };
          });
          cells.push({
            question_id: q.id, yields: q.yields, respondent, segment_type: "national",
            segment: "LBN", n: nTotal, options,
          });
        }
      }
    }
  }

  // Write aggregates to Postgres (public-readable via RLS) when configured.
  if (pg && cells.length > 0) {
    const rows = cells.map((c) => ({
      wave,
      question_id: c.question_id,
      respondent: c.respondent,
      segment_type: c.segment_type,
      segment: c.segment,
      n: c.n,
      options: c.options,
    }));
    const { error } = await pg
      .from("survey_aggregate")
      .upsert(rows, { onConflict: "wave,question_id,respondent,segment_type,segment" });
    if (error) throw new Error(`PG aggregate upsert failed: ${error.message}`);
    console.log(`[survey-aggregate] upserted ${rows.length} cells to Postgres`);
  }

  // Always also write a local JSON snapshot for inspection.
  await fs.mkdir(OUT_DIR, { recursive: true });
  const outFile = path.join(OUT_DIR, `${wave}.json`);
  const payload = {
    wave,
    generated_at: new Date().toISOString(),
    submissions: subs.length,
    n_min: N_MIN,
    source: pg ? "postgres" : "file",
    method: "Proportions with Wilson 95% CI per governorate; national = population-weighted roll-up. Cells < n_min suppressed.",
    cells,
  };
  await fs.writeFile(outFile, JSON.stringify(payload, null, 2), "utf-8");

  console.log(`[survey-aggregate] wave ${wave} (${pg ? "postgres" : "file"}): ${subs.length} submissions → ${cells.length} published cells (n_min=${N_MIN})`);
  // print a couple of national headlines
  for (const c of cells.filter((x) => x.segment_type === "national").slice(0, 6)) {
    const top = c.options.filter((o) => o.proportion > 0).map((o) => `${o.value} ${o.proportion}%`).join(", ");
    console.log(`  [national] ${c.question_id} (n=${c.n}): ${top}`);
  }
}

run().catch((err) => {
  console.error("[survey-aggregate] fatal:", err);
  process.exit(1);
});
