import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/dictionaries";
import { sources, getSource } from "@/data/catalog/sources";
import {
  getLastFetchedAtForSource,
  getLastFetchedMap,
  listIndicatorsWithData,
} from "@/data/store";
import { indicators } from "@/data/catalog/indicators";
import { formatDate } from "@/lib/format";
import {
  classifyScheduleStatus,
  describeCadence,
} from "@/data/schedule";

export const metadata = { title: "Status" };

const headings: Record<
  Locale,
  {
    title: string;
    intro: string;
    sources_section: string;
    pairs_section: string;
    pairs_intro: string;
    cols: {
      source: string;
      lastFetch: string;
      indicators: string;
      indicator: string;
      cadence: string;
      last: string;
      next: string;
      status: string;
    };
    status: { fresh: string; due_soon: string; due: string; stale: string; no_schedule: string };
  }
> = {
  en: {
    title: "Pipeline status",
    intro:
      "Per-source and per-indicator freshness for the Mabii ingestion pipeline. The pipeline is the product; this page is published so that any reader can verify the catalogue's liveness independently.",
    sources_section: "By source",
    pairs_section: "By (indicator × source)",
    pairs_intro:
      "Each row is one indicator–source pair. The scheduler reads this same data to decide what to refresh next.",
    cols: {
      source: "Source",
      lastFetch: "Last successful fetch",
      indicators: "Indicators mapped",
      indicator: "Indicator",
      cadence: "Cadence",
      last: "Last fetch",
      next: "Next expected",
      status: "Status",
    },
    status: {
      fresh: "Fresh",
      due_soon: "Due soon",
      due: "Due",
      stale: "Stale",
      no_schedule: "—",
    },
  },
  ar: {
    title: "حالة الخط الإنتاجي",
    intro:
      "حداثة البيانات لكل مصدر ولكل مؤشر في خط إدخال مَبني. الخط هو المنتج؛ وتُنشَر هذه الصفحة كي يتمكّن أي قارئ من التحقّق المستقل من حيوية الكتالوج.",
    sources_section: "حسب المصدر",
    pairs_section: "حسب (المؤشر × المصدر)",
    pairs_intro:
      "كل صف هو زوج مؤشر/مصدر. يقرأ المُجدوِل البياناتِ ذاتها ليقرّر ما يُحدِّثه تالياً.",
    cols: {
      source: "المصدر",
      lastFetch: "آخر سحب ناجح",
      indicators: "المؤشرات المرتبطة",
      indicator: "المؤشر",
      cadence: "الدورية",
      last: "آخر سحب",
      next: "التحديث القادم المتوقَّع",
      status: "الحالة",
    },
    status: {
      fresh: "ضمن الجدول",
      due_soon: "يستحق قريباً",
      due: "حان موعد التحديث",
      stale: "متأخر",
      no_schedule: "—",
    },
  },
};

function statusColor(s: "fresh" | "due_soon" | "due" | "stale" | "no_schedule") {
  if (s === "fresh") return "var(--color-flag-ok)";
  if (s === "due_soon") return "var(--color-flag-low-conf)";
  if (s === "due") return "var(--color-flag-low-conf)";
  if (s === "stale") return "var(--color-flag-stale)";
  return "var(--color-ink-mute)";
}

export default async function StatusPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = headings[lang];

  const withData = new Set(await listIndicatorsWithData());
  const lastFetchedMap = await getLastFetchedMap();
  const now = new Date();

  const sourceRows = await Promise.all(
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

  const pairRows: Array<{
    indicatorCode: string;
    indicatorNameEn: string;
    indicatorNameAr: string;
    sourceId: string;
    sourceNameEn: string;
    sourceNameAr: string;
    cadence: string;
    lastFetched: string | undefined;
    nextExpected: string | undefined;
    status: "fresh" | "due_soon" | "due" | "stale" | "no_schedule";
  }> = [];
  for (const ind of indicators) {
    for (const mapping of ind.sources) {
      const src = getSource(mapping.source_id);
      if (!src || src.ingestion_status !== "live") continue;
      const last = lastFetchedMap.get(ind.code)?.get(mapping.source_id);
      const { status, expectedNext } = classifyScheduleStatus(
        mapping.schedule,
        last ? new Date(last) : undefined,
        now
      );
      pairRows.push({
        indicatorCode: ind.code,
        indicatorNameEn: ind.name_en,
        indicatorNameAr: ind.name_ar,
        sourceId: src.id,
        sourceNameEn: src.name_en,
        sourceNameAr: src.name_ar,
        cadence: describeCadence(mapping.schedule),
        lastFetched: last,
        nextExpected: expectedNext?.toISOString().slice(0, 10),
        status,
      });
    }
  }
  const STATUS_ORDER = { stale: 0, due: 1, due_soon: 2, fresh: 3, no_schedule: 4 };
  pairRows.sort((a, b) => {
    const diff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (diff !== 0) return diff;
    return a.indicatorCode.localeCompare(b.indicatorCode);
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-3 text-3xl" style={{ fontWeight: 600 }}>
        {c.title}
      </h1>
      <p
        className="mb-10 max-w-3xl"
        style={{ lineHeight: 1.7, color: "var(--color-ink-soft)" }}
      >
        {c.intro}
      </p>

      <section className="mb-12">
        <h2
          className="mb-3 text-xs uppercase tracking-wider"
          style={{
            color: "var(--color-ink-soft)",
            letterSpacing: "0.06em",
            fontFamily: "var(--font-sans)",
          }}
        >
          {c.sources_section}
        </h2>
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
                <th>{c.cols.source}</th>
                <th>{c.cols.lastFetch}</th>
                <th className="num">{c.cols.indicators}</th>
              </tr>
            </thead>
            <tbody>
              {sourceRows.map(({ source, last, mappedCount, withDataCount }) => (
                <tr key={source.id}>
                  <td>
                    <Link
                      href={`/${lang}/sources/${source.id}`}
                      className="no-underline"
                      style={{ color: "var(--color-ink)", fontWeight: 500 }}
                    >
                      {lang === "ar" ? source.name_ar : source.name_en}
                    </Link>
                    <div
                      className="mt-0.5 text-xs"
                      style={{
                        color: "var(--color-ink-mute)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {source.id} · {source.ingestion_status}
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
                          color: source.ingestion_status === "live"
                            ? "var(--color-flag-stale)"
                            : "var(--color-ink-mute)",
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        {source.ingestion_status === "live" ? "never" : "—"}
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
      </section>

      <section className="mb-12">
        <h2
          className="mb-2 text-xs uppercase tracking-wider"
          style={{
            color: "var(--color-ink-soft)",
            letterSpacing: "0.06em",
            fontFamily: "var(--font-sans)",
          }}
        >
          {c.pairs_section}
        </h2>
        <p
          className="mb-3 max-w-3xl text-sm"
          style={{ color: "var(--color-ink-mute)" }}
        >
          {c.pairs_intro}
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
                <th>{c.cols.indicator}</th>
                <th>{c.cols.source}</th>
                <th>{c.cols.cadence}</th>
                <th>{c.cols.last}</th>
                <th>{c.cols.next}</th>
                <th>{c.cols.status}</th>
              </tr>
            </thead>
            <tbody>
              {pairRows.map((row) => (
                <tr key={`${row.indicatorCode}|${row.sourceId}`}>
                  <td>
                    <Link
                      href={`/${lang}/indicators/${row.indicatorCode}`}
                      className="no-underline"
                      style={{
                        color: "var(--color-ink)",
                        fontWeight: 500,
                        fontFamily: "var(--font-serif)",
                      }}
                    >
                      {lang === "ar" ? row.indicatorNameAr : row.indicatorNameEn}
                    </Link>
                  </td>
                  <td
                    style={{
                      color: "var(--color-ink-soft)",
                      fontFamily: "var(--font-sans)",
                      fontSize: 13,
                    }}
                  >
                    {lang === "ar" ? row.sourceNameAr : row.sourceNameEn}
                  </td>
                  <td
                    style={{
                      color: "var(--color-ink-soft)",
                      fontFamily: "var(--font-sans)",
                      fontSize: 12,
                    }}
                  >
                    {row.cadence}
                  </td>
                  <td
                    style={{
                      color: "var(--color-ink-soft)",
                      fontFamily: "var(--font-sans)",
                      fontSize: 12,
                    }}
                  >
                    {row.lastFetched ? formatDate(row.lastFetched, lang) : "—"}
                  </td>
                  <td
                    style={{
                      color: "var(--color-ink-soft)",
                      fontFamily: "var(--font-sans)",
                      fontSize: 12,
                    }}
                  >
                    {row.nextExpected ?? "—"}
                  </td>
                  <td>
                    <span
                      className="inline-block rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-wider"
                      style={{
                        background: "var(--color-rule-soft)",
                        color: statusColor(row.status),
                        fontFamily: "var(--font-sans)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {c.status[row.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
