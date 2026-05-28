// Canonical data model — TypeScript mirror of SPEC §6.
// When this graduates to Postgres, the same field names map 1:1 to columns.

export type TrustLabel = "official" | "proxy" | "modeled" | "reference";

export type ExtractionMethod =
  | "api"
  | "scrape"
  | "pdf_ai"
  | "manual"
  | "derived";

export type Frequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annual"
  | "irregular";

export type FacetType =
  | "topic"
  | "subtopic"
  | "sector"
  | "frequency"
  | "currency_basis"
  | "geography_level"
  | "stock_or_flow"
  | "methodology_family"
  | "time_horizon";

export type SourceTier = "T1" | "T2" | "T3" | "T4" | "T5";

/**
 * Honest accounting of where Mabii stands with each source.
 * "live"                — connector running on schedule, data flowing
 * "scrape_needed"       — public site but no API; needs scraper + workbench review
 * "pdf_ai_needed"       — publishes as PDF; needs AI extraction + sample audit
 * "geospatial_needed"   — raster / satellite; needs GDAL toolchain (Phase 2)
 * "partnership_needed"  — public-spirited but gated; requires application
 * "deferred"            — T3 paid sources (deferred per SPEC §4); see substitute_for_id
 * "planned"             — registered, not yet started
 */
export type IngestionStatus =
  | "live"
  | "scrape_needed"
  | "pdf_ai_needed"
  | "geospatial_needed"
  | "partnership_needed"
  | "deferred"
  | "planned";

export interface Source {
  /** Stable kebab-case code; appears in URLs. */
  id: string;
  /** Publisher display name (EN). */
  name_en: string;
  name_ar: string;
  publisher_en: string;
  publisher_ar: string;
  tier: SourceTier;
  trust_label_default: TrustLabel;
  url: string;
  license: string;
  /** Free-form cadence description, EN. */
  cadence_en: string;
  cadence_ar: string;
  /** How Mabii ingests this source, one sentence each. */
  ingest_method_en: string;
  ingest_method_ar: string;
  /** Where we stand on ingesting this source. */
  ingestion_status: IngestionStatus;
  /** For T3 (deferred) sources, the free substitute we use instead. */
  substitute_for_id?: string;
  /** Optional: the phase of the plan when this source comes online. */
  planned_phase?: 0 | 1 | 2 | 3 | 4;
}

export interface Geography {
  id: string;
  iso3?: string;
  name_en: string;
  name_ar: string;
  level: "country" | "governorate" | "district";
  parent_id?: string;
}

/** A faceted-vocabulary entry: the canonical list of valid (type,value) pairs. */
export interface FacetVocabularyEntry {
  facet_type: FacetType;
  facet_value: string;
  label_en: string;
  label_ar: string;
  /** Optional parent within the same facet_type (for hierarchies like topic→subtopic). */
  parent?: string;
  /** Public description shown on the methodology page. */
  description_en?: string;
  description_ar?: string;
}

export interface IndicatorFacet {
  facet_type: FacetType;
  facet_value: string;
}

export interface IndicatorSourceMapping {
  source_id: string;
  /** The source's native identifier for this series. */
  source_native_code: string;
  comparability: "direct" | "after_conversion" | "directional_only";
  reconciliation_notes?: string;
}

export interface Indicator {
  /** Mabii canonical code, e.g. "mabii.macro.gdp_nominal_usd" */
  code: string;
  name_en: string;
  name_ar: string;
  definition_en: string;
  definition_ar: string;
  default_unit: string;
  geography_id: string;
  /** Optional: deterministic preferred source for the headline value. */
  primary_source_id?: string;
  facets: IndicatorFacet[];
  sources: IndicatorSourceMapping[];
  /** Free-text caveats, plain English. */
  notes_en?: string;
  notes_ar?: string;
}

export interface RawFetch {
  /** SHA-256 of the payload — content-addressed. */
  hash: string;
  source_id: string;
  /** ISO timestamp at fetch. */
  fetched_at: string;
  /** Relative path under data/raw/ where the verbatim payload lives. */
  path: string;
  /** Optional source-side last-modified or ETag, when available. */
  upstream_modified?: string;
}

export interface Observation {
  indicator_code: string;
  geography_id: string;
  /** ISO date — inclusive */
  period_start: string;
  /** ISO date — inclusive */
  period_end: string;
  frequency: Frequency;
  value: number;
  unit: string;
  currency?: string;
  fx_basis?: string;
  source_id: string;
  /** Hash of the raw fetch this value derives from. */
  raw_ref: string;
  trust_label: TrustLabel;
  extraction_method: ExtractionMethod;
  /** Confidence for AI-extracted / modeled values, [0,1]. */
  confidence?: number;
  /** When the source reported this value (or best estimate). */
  vintage?: string;
  fetched_at: string;
  version: number;
  method_note?: string;
}

/** Per-indicator file shape — what lives in data/canonical/{code}.json */
export interface IndicatorObservationsFile {
  indicator_code: string;
  observations: Observation[];
  /** When this file was last (re)built. */
  built_at: string;
}
