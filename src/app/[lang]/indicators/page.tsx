import { notFound } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n/dictionaries";
import { indicators, getSource, sources } from "@/data/queries";
import { getObservations } from "@/data/store";
import { facetLabel } from "@/data/catalog/facet-vocabulary";
import { formatNumber, formatPeriod } from "@/lib/format";
import { IndicatorLibrary, type LibRow } from "@/components/indicator-library";

export const metadata = { title: "Indicators" };

const headings: Record<Locale, { title: string; intro: string }> = {
  en: {
    title: "Indicator library",
    intro:
      "Every Lebanese economic series Mabii tracks, grouped by topic. Search, scan the trend, click for the full multi-source view and provenance.",
  },
  ar: {
    title: "مكتبة المؤشرات",
    intro:
      "كل سلسلة اقتصادية لبنانية تتتبّعها مَبني، مجمَّعة حسب الموضوع. ابحث، اطّلع على الاتجاه، واضغط للعرض الكامل المتعدّد المصادر والمرجعية.",
  },
};

const libLabels: Record<Locale, Parameters<typeof IndicatorLibrary>[0]["labels"]> = {
  en: {
    title: "Indicator library",
    searchPlaceholder: "Search indicators, topics, sources…",
    indicators: "indicators",
    sources: "live sources",
    topics: "topics",
    results: "Showing",
    clear: "Clear",
    noResults: "No indicators match your search.",
    latest: "Latest",
    governorates: "governorates",
  },
  ar: {
    title: "مكتبة المؤشرات",
    searchPlaceholder: "ابحث في المؤشرات والمواضيع والمصادر…",
    indicators: "مؤشر",
    sources: "مصدر حيّ",
    topics: "موضوع",
    results: "تُعرض",
    clear: "مسح",
    noResults: "لا مؤشرات تطابق بحثك.",
    latest: "الأحدث",
    governorates: "محافظات",
  },
};

export default async function IndicatorsIndex({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = headings[lang];
  void (await getDictionary(lang));

  const rows: LibRow[] = await Promise.all(
    indicators.map(async (ind) => {
      const obs = await getObservations(ind.code);
      const topic = ind.facets.find((f) => f.facet_type === "topic")?.facet_value ?? "other";
      const subtopic = ind.facets.find((f) => f.facet_type === "subtopic")?.facet_value;
      const geoLevel =
        ind.facets.find((f) => f.facet_type === "geography_level")?.facet_value ?? "country";

      // Latest by primary source (country-level) or overall latest.
      const sorted = [...obs].sort((a, b) => b.period_end.localeCompare(a.period_end));
      const latest = ind.primary_source_id
        ? sorted.find((o) => o.source_id === ind.primary_source_id) ?? sorted[0]
        : sorted[0];

      // Sparkline: primary-source time series, oldest→newest, for country-level series only.
      let spark: number[] = [];
      if (geoLevel !== "governorate") {
        const series = obs
          .filter((o) => o.source_id === (ind.primary_source_id ?? latest?.source_id))
          .sort((a, b) => a.period_end.localeCompare(b.period_end))
          .map((o) => o.value);
        spark = series.length >= 2 ? series : [];
      }

      const govCount =
        geoLevel === "governorate"
          ? new Set(obs.map((o) => o.geography_id)).size
          : 0;

      const source = latest ? getSource(latest.source_id) : undefined;

      return {
        code: ind.code,
        name: lang === "ar" ? ind.name_ar : ind.name_en,
        topic,
        topicLabel: facetLabel("topic", topic, lang),
        subtopicLabel: subtopic ? facetLabel("subtopic", subtopic, lang) : null,
        latestValue: latest?.value ?? null,
        valueDisplay: latest ? formatNumber(latest.value, ind.default_unit, lang) : "—",
        unit: ind.default_unit,
        period: latest ? formatPeriod(latest.period_start, latest.period_end, latest.frequency) : "—",
        sourceName: source ? (lang === "ar" ? source.name_ar : source.name_en) : null,
        trust: latest?.trust_label ?? null,
        spark,
        geoLevel,
        govCount,
      };
    })
  );

  const liveSourceCount = new Set(
    sources.filter((s) => s.ingestion_status === "live").map((s) => s.id)
  ).size;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-2 text-3xl" style={{ fontWeight: 600 }}>
        {c.title}
      </h1>
      <p
        className="mb-8 max-w-2xl"
        style={{ color: "var(--color-ink-soft)", lineHeight: 1.55 }}
      >
        {c.intro}
      </p>
      <IndicatorLibrary
        rows={rows}
        locale={lang}
        sourceCount={liveSourceCount}
        labels={libLabels[lang]}
      />
    </div>
  );
}
