import { NextResponse } from "next/server";
import { indicators } from "@/data/catalog/indicators";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      version: "v1",
      generated_at: new Date().toISOString(),
      count: indicators.length,
      indicators: indicators.map((i) => ({
        code: i.code,
        name_en: i.name_en,
        name_ar: i.name_ar,
        definition_en: i.definition_en,
        definition_ar: i.definition_ar,
        unit: i.default_unit,
        geography_id: i.geography_id,
        facets: i.facets,
        sources: i.sources.map((s) => ({
          source_id: s.source_id,
          source_native_code: s.source_native_code,
          comparability: s.comparability,
        })),
        primary_source_id: i.primary_source_id,
      })),
    },
    {
      headers: {
        "cache-control": "public, max-age=60, s-maxage=300",
      },
    }
  );
}
