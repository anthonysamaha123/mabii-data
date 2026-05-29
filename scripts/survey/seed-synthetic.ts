// Synthetic submission seeder — FOR TESTING THE AGGREGATION LOOP ONLY.
// Writes plausible-but-fake submissions to a SYNTH wave so we can prove
// submit→store→aggregate→indicator works. Never commit SYNTH data as real.
// Run: tsx scripts/survey/seed-synthetic.ts --n=400

import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { surveyQuestions } from "../../src/data/survey/questions";
import { loadEnvLocal } from "../lib/load-env";

loadEnvLocal();

const SUB_DIR = path.join(process.cwd(), "data", "survey", "submissions");
const WAVE = "SYNTH";
const USE_PG = process.argv.includes("--pg");
const GOVS = ["LBN-BA", "LBN-ML", "LBN-NO", "LBN-AK", "LBN-BK", "LBN-BH", "LBN-SO", "LBN-NA"];

// deterministic-ish PRNG so reruns are stable
let seed = 12345;
function rng() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

async function run() {
  const n = Number.parseInt(process.argv.find((a) => a.startsWith("--n="))?.split("=")[1] ?? "400", 10);
  const personQs = surveyQuestions.filter((q) => q.respondent === "person");

  const records: Array<Record<string, unknown>> = [];
  for (let i = 0; i < n; i += 1) {
    const gov = pick(GOVS);
    const anchors: Record<string, string> = {};
    const answers: Record<string, string> = {};
    for (const q of personQs) {
      if (!q.options || q.options.length === 0) continue;
      let val: string;
      if (q.id === "p_deposits") val = rng() < 0.78 ? "no" : "yes";
      else if (q.id === "p_meals") val = rng() < 0.45 ? "yes" : "no";
      else if (q.id === "p_emigration") val = rng() < 0.4 ? "yes" : "no";
      else if (q.id === "p_gov") val = gov;
      else val = pick(q.options).value;
      if (q.block === "anchor") anchors[q.id] = val;
      else answers[q.id] = val;
    }
    records.push({
      id: crypto.randomUUID(),
      wave: WAVE,
      respondent: "person",
      governorate: gov,
      anchors,
      module_id: "spending",
      answers,
      submitted_at: new Date().toISOString(),
      integrity: { synthetic: true },
    });
  }

  if (USE_PG) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error("[seed-synthetic] --pg requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
      process.exit(2);
    }
    const sb = createClient(url, key, { auth: { persistSession: false } });
    // insert in chunks
    for (let i = 0; i < records.length; i += 200) {
      const { error } = await sb.from("survey_submission").insert(records.slice(i, i + 200));
      if (error) throw new Error(error.message);
    }
    console.log(`[seed-synthetic] inserted ${records.length} synthetic submissions into Postgres wave ${WAVE}`);
  } else {
    await fs.mkdir(SUB_DIR, { recursive: true });
    const f = path.join(SUB_DIR, `${WAVE}.jsonl`);
    await fs.writeFile(f, records.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf-8");
    console.log(`[seed-synthetic] wrote ${records.length} synthetic submissions to file wave ${WAVE}`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
