// Lebanese Ministry of Finance — "Debt & Debt Markets" quarterly PDF connector.
// First production use of the AI extractor (gpt-4o-mini). Trust='official'
// because MoF is itself the publisher; AI is only doing structured extraction.
// Sample-audit policy: 5% of extracted values reviewed monthly.

import { z } from "zod";
import { extractFromPdf } from "../lib/pdf-ai-extractor";
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
import type { Observation } from "../../src/data/types";

const SOURCE_ID = "mof";

// Latest publicly available MoF debt report. Hardcoded for now; an index-scrape
// step can find the latest when MoF resumes publication after their pause.
const REPORT_URL =
  "https://www.finance.gov.lb/en-us/Finance/PublicDebt/DebtReports/Documents/Debt%20&%20Debt%20Markets%20QIV%202022.pdf";
const REPORT_PERIOD = { period_start: "2022-10-01", period_end: "2022-12-31" };

const DebtSchema = z.object({
  gross_public_debt_lbp_bn: z.number().nullable(),
  gross_public_debt_usd_bn: z.number().nullable(),
  notes: z.string().nullable().optional(),
});

async function run() {
  const source = sources.find((s) => s.id === SOURCE_ID)!;
  const fetched_at = isoDate();
  const filter = parseCodesFilter();
  const results: Record<string, { added: number; updated: number; total: number }> = {};

  console.log(`[mof] fetching ${REPORT_URL}`);
  let extracted;
  try {
    extracted = await extractFromPdf({
      url: REPORT_URL,
      schema: DebtSchema,
      aiSystemPrompt: [
        "You are extracting Lebanese public-debt figures from an official Ministry of Finance PDF.",
        "Return ONLY a JSON object matching this shape:",
        '{ "gross_public_debt_lbp_bn": number, "gross_public_debt_usd_bn": number, "notes": string }',
        "Find the headline TOTAL gross public debt (NOT domestic-only or foreign-only). Convert units carefully — the report typically uses trillions of LBP; divide by 1000 to get billions.",
        "Use the FX rate the report itself states for the USD conversion. If multiple period rows are present, return the LATEST quarter shown.",
        "If a value is unclear or missing, return null for that field.",
      ].join("\n"),
      aiMaxChars: 16000,
    });
  } catch (err) {
    console.error("[mof] extraction failed:", err);
    process.exit(1);
  }

  console.log(`[mof] pathway=${extracted.pathway} bytes=${extracted.bytes} chars=${extracted.chars}`);
  console.log("[mof] extracted:", JSON.stringify(extracted.value, null, 2));

  const raw = await writeRaw(SOURCE_ID, extracted.value, "QIV-2022-debt.json");

  const byCode: Record<string, number | null> = {
    "mabii.fiscal.gross_public_debt_lbp": extracted.value.gross_public_debt_lbp_bn,
    "mabii.fiscal.gross_public_debt_usd": extracted.value.gross_public_debt_usd_bn,
  };

  for (const ind of indicators) {
    const mapping = ind.sources.find((s) => s.source_id === SOURCE_ID);
    if (!mapping) continue;
    if (!shouldProcess(ind.code, filter)) continue;
    const value = byCode[ind.code];
    if (value === undefined || value === null || !Number.isFinite(value)) {
      console.warn(`[mof] no value for ${ind.code}`);
      continue;
    }

    const observation: Observation = {
      indicator_code: ind.code,
      geography_id: ind.geography_id,
      period_start: REPORT_PERIOD.period_start,
      period_end: REPORT_PERIOD.period_end,
      frequency: "quarterly",
      value,
      unit: ind.default_unit,
      source_id: SOURCE_ID,
      raw_ref: raw.hash,
      trust_label: source.trust_label_default,
      extraction_method: extracted.pathway === "ai" ? "pdf_ai" : "scrape",
      confidence: extracted.pathway === "ai" ? 0.85 : undefined,
      method_note: extracted.value.notes ?? undefined,
      fetched_at,
      version: 1,
    };

    const stats = await mergeObservations(ind.code, [observation]);
    results[ind.code] = stats;
  }

  logConnectorRun(SOURCE_ID, results);
}

run().catch((err) => {
  console.error("[mof] fatal:", err);
  process.exit(1);
});
