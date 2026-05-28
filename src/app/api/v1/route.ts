import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    name: "Mabii Open API",
    version: "v1",
    description:
      "Free, read-only, faceted access to the Lebanese economic data catalogue. Every response carries provenance.",
    documentation: "/en/api",
    endpoints: {
      "GET /api/v1/indicators": "List the catalogue.",
      "GET /api/v1/indicators/{code}": "One indicator with all observations and per-source provenance.",
      "GET /api/v1/indicators/{code}?format=csv": "CSV export with provenance columns.",
      "GET /api/v1/observations?topic=…&subtopic=…": "Faceted query over the catalogue.",
      "GET /api/v1/sources": "All sources, with cadence and last fetch.",
      "GET /api/v1/topics": "Topic facet values currently in use.",
    },
    license: {
      mabii_metadata: "CC-BY-4.0",
      source_data: "Source-specific; see each source page.",
    },
    contact: "hello@mabii.org",
  });
}
