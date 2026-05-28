import { NextResponse } from "next/server";
import { topicsInUse, indicatorsForTopic } from "@/data/queries";
import { facetLabel } from "@/data/catalog/facet-vocabulary";

export const dynamic = "force-dynamic";

export async function GET() {
  const topics = topicsInUse().map((code) => ({
    code,
    label_en: facetLabel("topic", code, "en"),
    label_ar: facetLabel("topic", code, "ar"),
    indicator_count: indicatorsForTopic(code).length,
  }));
  return NextResponse.json({
    version: "v1",
    generated_at: new Date().toISOString(),
    count: topics.length,
    topics,
  });
}
