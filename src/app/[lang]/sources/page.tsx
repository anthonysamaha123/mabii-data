import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/dictionaries";
import { sources, indicatorsForSource } from "@/data/queries";
import { getLastFetchedAtForSource } from "@/data/store";
import { formatDate } from "@/lib/format";
import { SourceStatusBadge } from "@/components/source-status-badge";

export const metadata = { title: "Sources" };

const headings: Record<Locale, { title: string; intro: string; reliability_cta: string }> = {
  en: {
    title: "Sources",
    intro:
      "Every Lebanese economic data source Mabii tracks — live or planned, free or deferred. Honest about coverage by design.",
    reliability_cta: "Open the Data Reliability Map →",
  },
  ar: {
    title: "المصادر",
    intro:
      "كل مصدر بيانات اقتصادي لبناني تتتبّعه مَبني — حيٌّ كان أم مخطَّطاً، مجانياً أم مؤجَّلاً. تغطيتنا شفّافة بالتصميم.",
    reliability_cta: "افتح خريطة موثوقية البيانات ←",
  },
};

export default async function SourcesIndex({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = headings[lang];

  const rows = await Promise.all(
    sources.map(async (s) => ({
      source: s,
      count: indicatorsForSource(s.id).length,
      lastFetched: await getLastFetchedAtForSource(s.id),
    }))
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-3xl" style={{ fontWeight: 600 }}>
            {c.title}
          </h1>
          <p
            className="mt-1 max-w-2xl text-sm"
            style={{ color: "var(--color-ink-soft)" }}
          >
            {c.intro}
          </p>
        </div>
        <Link
          href={`/${lang}/sources/reliability-map`}
          className="shrink-0 text-sm no-underline"
          style={{
            color: "var(--color-accent)",
            fontFamily: "var(--font-sans)",
            fontWeight: 500,
          }}
        >
          {c.reliability_cta}
        </Link>
      </div>
      <div
        className="overflow-x-auto border"
        style={{
          borderColor: "var(--color-rule)",
          background: "var(--color-bg-elev)",
        }}
      >
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Tier</th>
              <th>Status</th>
              <th className="num">Indicators</th>
              <th>Last fetched</th>
              <th>License</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ source, count, lastFetched }) => (
              <tr key={source.id}>
                <td>
                  <Link
                    href={`/${lang}/sources/${source.id}`}
                    className="no-underline"
                    style={{ color: "var(--color-ink)", fontWeight: 500 }}
                  >
                    {lang === "ar" ? source.name_ar : source.name_en}
                  </Link>
                </td>
                <td
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-ink-soft)",
                    fontSize: 12,
                  }}
                >
                  {source.tier}
                </td>
                <td>
                  <SourceStatusBadge status={source.ingestion_status} lang={lang} />
                </td>
                <td className="num">{count}</td>
                <td style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)", fontSize: 13 }}>
                  {lastFetched ? formatDate(lastFetched, lang) : "—"}
                </td>
                <td
                  className="text-xs"
                  style={{ color: "var(--color-ink-mute)", fontFamily: "var(--font-sans)" }}
                >
                  {source.license}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
