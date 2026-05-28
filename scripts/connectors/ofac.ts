// OFAC SDN connector — T4, deterministic, no AI.
// Endpoint: https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.XML
// Counts entries by program. Snapshot at fetch time, stored under the current year.

import { XMLParser } from "fast-xml-parser";
import {
  annualPeriod,
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

const SOURCE_ID = "us-ofac";
const SDN_URL = "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.XML";

// Map indicator → program-name predicate
const PROGRAM_PREDICATES: Record<
  string,
  { sourceNativeCode: string; matches: (program: string) => boolean }
> = {
  "mabii.governance.ofac_hizballah_count": {
    sourceNativeCode: "sdn.programList.HIZBALLAH",
    matches: (p) => /HIZBALLAH|HIZBOLLAH/i.test(p),
  },
  "mabii.governance.ofac_lebanon_count": {
    sourceNativeCode: "sdn.programList.LEBANON",
    matches: (p) => /^LEBANON$/i.test(p) || /\bLEBANON\b/i.test(p),
  },
};

interface SdnEntry {
  uid?: number;
  programList?: { program?: string | string[] };
}

interface SdnList {
  sdnEntry?: SdnEntry[];
  publshInformation?: { Publish_Date?: string; Record_Count?: string };
}

interface ParsedXml {
  sdnList?: SdnList;
}

async function fetchSdnXml(): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(SDN_URL, {
        signal: AbortSignal.timeout(60_000),
        headers: {
          "user-agent": "Mabii/0.1 (https://mabii.org; contact: hello@mabii.org)",
          accept: "application/xml,text/xml",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${SDN_URL}`);
      return await res.text();
    } catch (err) {
      lastErr = err;
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
  }
  throw lastErr;
}

function countByProgram(parsed: ParsedXml, matches: (p: string) => boolean): number {
  const entries = parsed?.sdnList?.sdnEntry ?? [];
  let count = 0;
  for (const e of entries) {
    const pl = e.programList?.program;
    const programs = Array.isArray(pl) ? pl : pl ? [pl] : [];
    if (programs.some((p) => typeof p === "string" && matches(p))) {
      count += 1;
    }
  }
  return count;
}

async function run() {
  const source = sources.find((s) => s.id === SOURCE_ID)!;
  const fetched_at = isoDate();
  const filter = parseCodesFilter();
  const results: Record<string, { added: number; updated: number; total: number }> = {};
  const year = new Date().getUTCFullYear();

  let xml: string;
  try {
    xml = await fetchSdnXml();
  } catch (err) {
    console.error("[ofac] fetch failed:", err);
    process.exit(1);
  }

  const raw = await writeRaw(SOURCE_ID, xml, "SDN.XML");
  const parser = new XMLParser({ ignoreAttributes: false, isArray: (name) => name === "sdnEntry" });
  const parsed = parser.parse(xml) as ParsedXml;

  for (const ind of indicators) {
    const mapping = ind.sources.find((s) => s.source_id === SOURCE_ID);
    if (!mapping) continue;
    if (!shouldProcess(ind.code, filter)) continue;
    const pred = PROGRAM_PREDICATES[ind.code];
    if (!pred) continue;

    const count = countByProgram(parsed, pred.matches);
    console.log(`[ofac] ${ind.code}: ${count} entries`);

    const { period_start, period_end } = annualPeriod(year);
    const observation: Observation = {
      indicator_code: ind.code,
      geography_id: ind.geography_id,
      period_start,
      period_end,
      frequency: "annual",
      value: count,
      unit: ind.default_unit,
      source_id: SOURCE_ID,
      raw_ref: raw.hash,
      trust_label: source.trust_label_default,
      extraction_method: "api",
      fetched_at,
      version: 1,
    };

    const stats = await mergeObservations(ind.code, [observation]);
    results[ind.code] = stats;
  }

  logConnectorRun(SOURCE_ID, results);
}

run().catch((err) => {
  console.error("[ofac] fatal:", err);
  process.exit(1);
});
