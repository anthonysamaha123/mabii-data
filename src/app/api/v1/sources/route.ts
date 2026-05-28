import { NextResponse } from "next/server";
import { sources } from "@/data/catalog/sources";
import { getLastFetchedAtForSource } from "@/data/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const enriched = await Promise.all(
    sources.map(async (s) => ({
      id: s.id,
      name_en: s.name_en,
      name_ar: s.name_ar,
      tier: s.tier,
      trust_label_default: s.trust_label_default,
      url: s.url,
      license: s.license,
      cadence_en: s.cadence_en,
      cadence_ar: s.cadence_ar,
      last_fetched_at: await getLastFetchedAtForSource(s.id),
    }))
  );
  return NextResponse.json(
    {
      version: "v1",
      generated_at: new Date().toISOString(),
      count: enriched.length,
      sources: enriched,
    },
    {
      headers: { "cache-control": "public, max-age=60, s-maxage=300" },
    }
  );
}
