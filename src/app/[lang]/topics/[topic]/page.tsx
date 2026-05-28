import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/dictionaries";
import { indicatorsForTopic, getSource } from "@/data/queries";
import { getLatestObservation } from "@/data/store";
import { facetLabel } from "@/data/catalog/facet-vocabulary";
import { formatNumber, formatYear } from "@/lib/format";

interface PageProps {
  params: Promise<{ lang: string; topic: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { lang, topic } = await params;
  if (!isLocale(lang)) return {};
  return { title: facetLabel("topic", topic, lang) };
}

export default async function TopicPage({ params }: PageProps) {
  const { lang, topic } = await params;
  if (!isLocale(lang)) notFound();
  const list = indicatorsForTopic(topic);
  if (list.length === 0) notFound();

  const rows = await Promise.all(
    list.map(async (ind) => {
      const latest = await getLatestObservation(ind.code, ind.primary_source_id);
      const source = latest ? getSource(latest.source_id) : undefined;
      return { ind, latest, source };
    })
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <nav
        className="mb-2 text-xs"
        style={{
          color: "var(--color-ink-mute)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <Link
          href={`/${lang}/topics`}
          style={{ color: "var(--color-ink-mute)" }}
        >
          Topics
        </Link>
      </nav>
      <h1 className="mb-6 text-3xl" style={{ fontWeight: 600 }}>
        {facetLabel("topic", topic, lang)}
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
              <th>Subtopic</th>
              <th className="num">Latest</th>
              <th>Period</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ ind, latest, source }) => {
              const subtopic = ind.facets.find(
                (f) => f.facet_type === "subtopic"
              )?.facet_value;
              return (
                <tr key={ind.code}>
                  <td>
                    <Link
                      href={`/${lang}/indicators/${ind.code}`}
                      className="no-underline"
                      style={{ color: "var(--color-ink)", fontWeight: 500 }}
                    >
                      {lang === "ar" ? ind.name_ar : ind.name_en}
                    </Link>
                  </td>
                  <td style={{ color: "var(--color-ink-soft)" }}>
                    {subtopic ? facetLabel("subtopic", subtopic, lang) : "—"}
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
