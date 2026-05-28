import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n/dictionaries";
import {
  indicators,
  sources,
  topicsInUse,
  getSource,
} from "@/data/queries";
import { liveSources } from "@/data/catalog/sources";
import {
  getLastFetchedAtForSource,
  getLatestObservation,
} from "@/data/store";
import { facetLabel } from "@/data/catalog/facet-vocabulary";
import { formatDate, formatNumber, formatYear } from "@/lib/format";
import { TrustBadge } from "@/components/trust-badge";
import {
  freshnessForAnnualSeries,
  FreshnessBadge,
} from "@/components/freshness-badge";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  const topics = topicsInUse();

  const indicatorRows = await Promise.all(
    indicators.map(async (ind) => {
      const latest = await getLatestObservation(ind.code, ind.primary_source_id);
      const source = latest ? getSource(latest.source_id) : undefined;
      const status = freshnessForAnnualSeries(
        latest ? Number.parseInt(latest.period_end.slice(0, 4), 10) : undefined
      );
      return { ind, latest, source, status };
    })
  );

  const sourceFreshness = await Promise.all(
    liveSources().map(async (s) => ({
      source: s,
      lastFetched: await getLastFetchedAtForSource(s.id),
    }))
  );

  const totalSources = sources.length;
  const liveCount = liveSources().length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <section className="mb-12 max-w-3xl">
        <h1
          className="mb-4 text-3xl md:text-4xl"
          style={{ lineHeight: 1.2, fontWeight: 600 }}
        >
          {dict.home.intro_heading}
        </h1>
        <p
          className="text-lg"
          style={{ color: "var(--color-ink-soft)", lineHeight: 1.55 }}
        >
          {dict.home.intro_body}
        </p>
      </section>

      <section className="mb-12">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xl" style={{ fontWeight: 600 }}>
            {dict.home.indicators_heading}
          </h2>
          <p
            className="text-xs"
            style={{
              color: "var(--color-ink-mute)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {dict.home.indicators_sub}
          </p>
        </div>
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
                <th>{dict.indicator.definition.split(" ")[0]}</th>
                <th className="num">{dict.indicator.value}</th>
                <th>{dict.indicator.period}</th>
                <th>{dict.indicator.source}</th>
                <th>{dict.indicator.trust}</th>
                <th>{dict.freshness.fresh}</th>
                <th className="num">{dict.indicator.sources_count}</th>
              </tr>
            </thead>
            <tbody>
              {indicatorRows.map(({ ind, latest, source, status }) => (
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
                  <td className="num">
                    {latest ? (
                      <>
                        {formatNumber(latest.value, ind.default_unit, lang)}
                        <span
                          className="ml-1 text-xs"
                          style={{ color: "var(--color-ink-mute)" }}
                        >
                          {ind.default_unit === "%" ? "%" : ind.default_unit}
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td
                    style={{
                      fontFamily: "var(--font-sans)",
                      color: "var(--color-ink-soft)",
                    }}
                  >
                    {latest ? formatYear(latest.period_end) : "—"}
                  </td>
                  <td
                    style={{
                      fontFamily: "var(--font-sans)",
                      color: "var(--color-ink-soft)",
                    }}
                  >
                    {source ? (
                      <Link
                        href={`/${lang}/sources/${source.id}`}
                        className="no-underline"
                        style={{ color: "var(--color-ink)" }}
                      >
                        {lang === "ar" ? source.name_ar : source.name_en}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {latest && (
                      <TrustBadge label={latest.trust_label} dict={dict} />
                    )}
                  </td>
                  <td>
                    <FreshnessBadge status={status} dict={dict} />
                  </td>
                  <td className="num">{ind.sources.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12">
        <Link
          href={`/${lang}/sources/reliability-map`}
          className="block border p-5 no-underline"
          style={{
            borderColor: "var(--color-rule)",
            background: "var(--color-bg-elev)",
            color: "var(--color-ink)",
          }}
        >
          <div
            className="mb-1 text-xs uppercase tracking-wider"
            style={{ color: "var(--color-accent)", letterSpacing: "0.08em", fontFamily: "var(--font-sans)" }}
          >
            {lang === "ar" ? "خريطة موثوقية البيانات" : "Data Reliability Map"}
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg md:text-xl" style={{ fontWeight: 600, lineHeight: 1.35 }}>
              {lang === "ar"
                ? "كل مصدر بيانات اقتصادي لبناني نتتبّعه — حيٌّ، مخطَّط، أو مؤجَّل — مع تصنيف صريح للحالة."
                : "Every Lebanese economic data source we track — live, planned, or deferred — with the honest status spelled out."}
            </h2>
            <span
              className="shrink-0 text-sm"
              style={{ color: "var(--color-accent)", fontFamily: "var(--font-sans)" }}
            >
              {lang === "ar" ? "اعرض ←" : "Open →"}
            </span>
          </div>
        </Link>
      </section>

      <section className="mb-12 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xl" style={{ fontWeight: 600 }}>
            {dict.home.topics_heading}
          </h2>
          <ul
            className="space-y-1.5 text-sm"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {topics.map((t) => (
              <li key={t}>
                <Link
                  href={`/${lang}/topics/${t}`}
                  className="no-underline"
                  style={{ color: "var(--color-ink)" }}
                >
                  {facetLabel("topic", t, lang)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-xl" style={{ fontWeight: 600 }}>
              {dict.home.status_heading}
            </h2>
            <Link
              href={`/${lang}/sources/reliability-map`}
              className="text-xs no-underline"
              style={{
                color: "var(--color-accent)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {liveCount} / {totalSources} live →
            </Link>
          </div>
          <ul
            className="space-y-2 text-sm"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {sourceFreshness.map(({ source, lastFetched }) => (
              <li
                key={source.id}
                className="flex items-baseline justify-between gap-3"
              >
                <Link
                  href={`/${lang}/sources/${source.id}`}
                  className="no-underline"
                  style={{ color: "var(--color-ink)" }}
                >
                  {lang === "ar" ? source.name_ar : source.name_en}
                </Link>
                <span
                  className="text-xs"
                  style={{
                    color: lastFetched
                      ? "var(--color-ink-mute)"
                      : "var(--color-flag-stale)",
                  }}
                >
                  {lastFetched ? formatDate(lastFetched, lang) : "not yet fetched"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
