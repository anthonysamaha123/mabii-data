import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n/dictionaries";
import { indicators, getSource } from "@/data/queries";
import {
  getLatestObservation,
} from "@/data/store";
import { facetLabel } from "@/data/catalog/facet-vocabulary";
import { formatNumber, formatYear } from "@/lib/format";
import { TrustBadge } from "@/components/trust-badge";

export const metadata = { title: "Indicators" };

const headings: Record<Locale, { title: string }> = {
  en: { title: "Indicators" },
  ar: { title: "المؤشرات" },
};

export default async function IndicatorsIndex({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = headings[lang];
  const dict = await getDictionary(lang);

  const rows = await Promise.all(
    indicators.map(async (ind) => {
      const latest = await getLatestObservation(ind.code, ind.primary_source_id);
      const source = latest ? getSource(latest.source_id) : undefined;
      const topic = ind.facets.find((f) => f.facet_type === "topic")?.facet_value;
      return { ind, latest, source, topic };
    })
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-6 text-3xl" style={{ fontWeight: 600 }}>
        {c.title}
      </h1>
      <div
        className="overflow-hidden border"
        style={{
          borderColor: "var(--color-rule)",
          background: "var(--color-bg-elev)",
        }}
      >
        <table>
          <thead>
            <tr>
              <th>Indicator</th>
              <th>Topic</th>
              <th className="num">Latest</th>
              <th>Period</th>
              <th>Source</th>
              <th>Trust</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ ind, latest, source, topic }) => (
              <tr key={ind.code}>
                <td>
                  <Link
                    href={`/${lang}/indicators/${ind.code}`}
                    className="no-underline"
                    style={{
                      color: "var(--color-ink)",
                      fontWeight: 500,
                      fontFamily: "var(--font-serif)",
                    }}
                  >
                    {lang === "ar" ? ind.name_ar : ind.name_en}
                  </Link>
                  <div
                    className="mt-0.5 text-xs"
                    style={{
                      color: "var(--color-ink-mute)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {ind.code}
                  </div>
                </td>
                <td style={{ color: "var(--color-ink-soft)" }}>
                  {topic ? facetLabel("topic", topic, lang) : "—"}
                </td>
                <td className="num">
                  {latest
                    ? formatNumber(latest.value, ind.default_unit, lang)
                    : "—"}
                </td>
                <td style={{ color: "var(--color-ink-soft)" }}>
                  {latest ? formatYear(latest.period_end) : "—"}
                </td>
                <td style={{ color: "var(--color-ink-soft)" }}>
                  {source
                    ? lang === "ar"
                      ? source.name_ar
                      : source.name_en
                    : "—"}
                </td>
                <td>
                  {latest ? (
                    <TrustBadge label={latest.trust_label} dict={dict} />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
