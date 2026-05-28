import "server-only";
import { indicators, getIndicator } from "@/data/catalog/indicators";
import { sources, getSource } from "@/data/catalog/sources";
import {
  facetVocabulary,
  facetValuesForType,
} from "@/data/catalog/facet-vocabulary";
import type { Indicator, IndicatorFacet } from "@/data/types";

export interface FacetFilter {
  facet_type: string;
  facet_value: string;
}

/**
 * The SQL-join model from SPEC §7: an indicator matches if it has every
 * requested (facet_type, facet_value) tag. This is the only composition layer.
 * No AI, no interpretation — just a deterministic AND across tags.
 */
export function filterIndicatorsByFacets(filters: FacetFilter[]): Indicator[] {
  if (filters.length === 0) return indicators;
  return indicators.filter((ind) =>
    filters.every((f) =>
      ind.facets.some(
        (af) =>
          af.facet_type === f.facet_type && af.facet_value === f.facet_value
      )
    )
  );
}

export function indicatorsForTopic(topic: string): Indicator[] {
  return filterIndicatorsByFacets([{ facet_type: "topic", facet_value: topic }]);
}

export function indicatorsForSource(source_id: string): Indicator[] {
  return indicators.filter((i) =>
    i.sources.some((s) => s.source_id === source_id)
  );
}

export function topicsInUse(): string[] {
  const topics = new Set<string>();
  for (const i of indicators) {
    for (const f of i.facets) {
      if (f.facet_type === "topic") topics.add(f.facet_value);
    }
  }
  return Array.from(topics).sort();
}

export function uniqueFacetValues(facet_type: string): string[] {
  const set = new Set<string>();
  for (const i of indicators) {
    for (const f of i.facets) {
      if (f.facet_type === facet_type) set.add(f.facet_value);
    }
  }
  return Array.from(set).sort();
}

export function facetsAvailableForBrowse(): string[] {
  return [
    "topic",
    "subtopic",
    "frequency",
    "currency_basis",
    "stock_or_flow",
    "geography_level",
  ];
}

export {
  indicators,
  getIndicator,
  sources,
  getSource,
  facetVocabulary,
  facetValuesForType,
};

export function getIndicatorFacetValue(
  ind: Indicator,
  facet_type: string
): string | undefined {
  return ind.facets.find((f) => f.facet_type === facet_type)?.facet_value;
}

export function hasIndicatorFacet(
  ind: Indicator,
  facet: IndicatorFacet
): boolean {
  return ind.facets.some(
    (f) => f.facet_type === facet.facet_type && f.facet_value === facet.facet_value
  );
}
