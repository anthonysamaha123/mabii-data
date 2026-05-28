import { NextResponse, type NextRequest } from "next/server";
import { getIndicator } from "@/data/catalog/indicators";
import { getObservations } from "@/data/store";

export const dynamic = "force-dynamic";

function toCSV(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";
  const headers = Array.from(
    rows.reduce<Set<string>>((acc, r) => {
      for (const k of Object.keys(r)) acc.add(k);
      return acc;
    }, new Set())
  );
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows
    .map((r) => headers.map((h) => esc(r[h])).join(","))
    .join("\n");
  return `${headers.join(",")}\n${body}\n`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const ind = getIndicator(code);
  if (!ind) {
    return NextResponse.json(
      { error: "Indicator not found", code },
      { status: 404 }
    );
  }
  const observations = await getObservations(code);
  const format = req.nextUrl.searchParams.get("format") ?? "json";

  if (format === "csv") {
    const rows = observations.map((o) => ({
      indicator_code: o.indicator_code,
      geography_id: o.geography_id,
      period_start: o.period_start,
      period_end: o.period_end,
      frequency: o.frequency,
      value: o.value,
      unit: o.unit,
      source_id: o.source_id,
      raw_ref: o.raw_ref,
      trust_label: o.trust_label,
      extraction_method: o.extraction_method,
      vintage: o.vintage ?? "",
      fetched_at: o.fetched_at,
      version: o.version,
    }));
    return new NextResponse(toCSV(rows), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${code}.csv"`,
        "cache-control": "public, max-age=60, s-maxage=300",
      },
    });
  }

  return NextResponse.json(
    {
      version: "v1",
      generated_at: new Date().toISOString(),
      indicator: {
        code: ind.code,
        name_en: ind.name_en,
        name_ar: ind.name_ar,
        definition_en: ind.definition_en,
        definition_ar: ind.definition_ar,
        unit: ind.default_unit,
        geography_id: ind.geography_id,
        facets: ind.facets,
        sources: ind.sources,
        primary_source_id: ind.primary_source_id,
      },
      observations,
    },
    {
      headers: {
        "cache-control": "public, max-age=60, s-maxage=300",
      },
    }
  );
}
