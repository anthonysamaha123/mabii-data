import Link from "next/link";
import type { Locale, Dictionary } from "@/lib/i18n/dictionaries";
import type { Indicator, Observation } from "@/data/types";
import type { Source } from "@/data/types";
import { Sparkline } from "@/components/sparkline";
import { FreshnessBadge, freshnessForAnnualSeries } from "@/components/freshness-badge";
import { formatNumber, formatYear } from "@/lib/format";

interface Props {
  indicator: Indicator;
  observations: Observation[];
  latest: Observation | undefined;
  source: Source | undefined;
  locale: Locale;
  dict: Dictionary;
}

/**
 * "Lebanon at a glance" tile.
 * Self-contained, deterministic, server-rendered. Clicking anywhere on the
 * card opens the indicator detail page — every value carries its source.
 */
export function IndicatorTile({
  indicator,
  observations,
  latest,
  source,
  locale,
  dict,
}: Props) {
  const sparkData = observations
    .filter((o) => o.source_id === (indicator.primary_source_id ?? o.source_id))
    .map((o) => ({
      x: Number.parseInt(o.period_end.slice(0, 4), 10),
      y: o.value,
    }))
    .sort((a, b) => a.x - b.x);

  const lastYear = latest
    ? Number.parseInt(latest.period_end.slice(0, 4), 10)
    : undefined;
  const status = freshnessForAnnualSeries(lastYear);

  return (
    <Link
      href={`/${locale}/indicators/${indicator.code}`}
      className="block border p-4 no-underline transition-colors"
      style={{
        borderColor: "var(--color-rule)",
        background: "var(--color-bg-elev)",
        color: "var(--color-ink)",
      }}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3
          className="text-sm leading-snug"
          style={{
            fontWeight: 600,
            color: "var(--color-ink)",
            fontFamily: "var(--font-serif)",
          }}
        >
          {locale === "ar" ? indicator.name_ar : indicator.name_en}
        </h3>
        <FreshnessBadge status={status} dict={dict} />
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span
          className="text-2xl md:text-3xl"
          style={{
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
            color: "var(--color-ink)",
            fontFamily: "var(--font-sans)",
            letterSpacing: "-0.01em",
          }}
        >
          {latest ? formatNumber(latest.value, indicator.default_unit, locale) : "—"}
        </span>
        <span
          className="text-xs"
          style={{
            color: "var(--color-ink-mute)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {indicator.default_unit === "%" ? "%" : indicator.default_unit}
          {latest ? ` · ${formatYear(latest.period_end)}` : ""}
        </span>
      </div>

      <div className="mt-2 -mx-1">
        <Sparkline
          data={sparkData}
          width={320}
          height={56}
          ariaLabel={`Trend for ${indicator.name_en}`}
        />
      </div>

      <div
        className="mt-2 text-[11px]"
        style={{
          color: "var(--color-ink-mute)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {source
          ? locale === "ar"
            ? source.name_ar
            : source.name_en
          : "—"}
      </div>
    </Link>
  );
}
