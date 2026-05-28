import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/dictionaries";
import { sources } from "@/data/catalog/sources";
import {
  getLastFetchedAtForSource,
  listIndicatorsWithData,
} from "@/data/store";
import { indicators } from "@/data/catalog/indicators";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Status" };

const headings: Record<Locale, { title: string; intro: string; sourcesCol: string; lastFetch: string; indicators: string }> = {
  en: {
    title: "Pipeline status",
    intro:
      "Per-source freshness for the Mabii ingestion pipeline. The pipeline is the product; this page is published so that any reader can verify the catalogue's liveness independently.",
    sourcesCol: "Source",
    lastFetch: "Last successful fetch",
    indicators: "Indicators mapped",
  },
  ar: {
    title: "حالة الخط الإنتاجي",
    intro:
      "حداثة البيانات لكل مصدر في خط إدخال مَبني. الخط هو المنتج؛ وتُنشَر هذه الصفحة كي يتمكّن أي قارئ من التحقّق المستقل من حيوية الكتالوج.",
    sourcesCol: "المصدر",
    lastFetch: "آخر سحب ناجح",
    indicators: "المؤشرات المرتبطة",
  },
};

export default async function StatusPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = headings[lang];

  const withData = new Set(await listIndicatorsWithData());

  const rows = await Promise.all(
    sources.map(async (s) => {
      const last = await getLastFetchedAtForSource(s.id);
      const mappedCount = indicators.filter((i) =>
        i.sources.some((ss) => ss.source_id === s.id)
      ).length;
      const withDataCount = indicators.filter(
        (i) =>
          i.sources.some((ss) => ss.source_id === s.id) && withData.has(i.code)
      ).length;
      return { source: s, last, mappedCount, withDataCount };
    })
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-3 text-3xl" style={{ fontWeight: 600 }}>
        {c.title}
      </h1>
      <p
        className="mb-8"
        style={{ lineHeight: 1.7, color: "var(--color-ink-soft)" }}
      >
        {c.intro}
      </p>
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
              <th>{c.sourcesCol}</th>
              <th>{c.lastFetch}</th>
              <th className="num">{c.indicators}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ source, last, mappedCount, withDataCount }) => (
              <tr key={source.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>
                    {lang === "ar" ? source.name_ar : source.name_en}
                  </div>
                  <div
                    className="mt-0.5 text-xs"
                    style={{
                      color: "var(--color-ink-mute)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {source.id}
                  </div>
                </td>
                <td>
                  {last ? (
                    <span style={{ fontFamily: "var(--font-sans)" }}>
                      {formatDate(last, lang)}
                    </span>
                  ) : (
                    <span
                      style={{
                        color: "var(--color-flag-stale)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      never
                    </span>
                  )}
                </td>
                <td className="num">
                  {withDataCount} / {mappedCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
