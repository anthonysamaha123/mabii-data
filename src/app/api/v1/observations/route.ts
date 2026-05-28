import { NextResponse, type NextRequest } from "next/server";
import {
  filterIndicatorsByFacets,
  facetsAvailableForBrowse,
  type FacetFilter,
} from "@/data/queries";
import { getObservations } from "@/data/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const filters: FacetFilter[] = [];
  for (const ft of facetsAvailableForBrowse()) {
    const v = req.nextUrl.searchParams.get(ft);
    if (v) filters.push({ facet_type: ft, facet_value: v });
  }
  const sourceFilter = req.nextUrl.searchParams.get("source");
  const sinceFilter = req.nextUrl.searchParams.get("since"); // ISO date inclusive

  const indicators = filterIndicatorsByFacets(filters);
  const result = await Promise.all(
    indicators.map(async (ind) => {
      let obs = await getObservations(ind.code);
      if (sourceFilter) obs = obs.filter((o) => o.source_id === sourceFilter);
      if (sinceFilter) obs = obs.filter((o) => o.period_end >= sinceFilter);
      return { indicator_code: ind.code, observations: obs };
    })
  );

  return NextResponse.json(
    {
      version: "v1",
      generated_at: new Date().toISOString(),
      query: { facets: filters, source: sourceFilter, since: sinceFilter },
      indicators_matched: result.length,
      observations_count: result.reduce(
        (acc, r) => acc + r.observations.length,
        0
      ),
      results: result,
    },
    {
      headers: {
        "cache-control": "public, max-age=60, s-maxage=300",
      },
    }
  );
}
