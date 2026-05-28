import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n/dictionaries";
import {
  getIndicator,
  getSource,
  sources as allSources,
} from "@/data/queries";
import {
  getMultiSourcePivot,
  getObservations,
} from "@/data/store";
import { facetLabel } from "@/data/catalog/facet-vocabulary";
import { formatDate, formatNumber, formatPeriod } from "@/lib/format";
import { TrustBadge } from "@/components/trust-badge";
import { Sparkline } from "@/components/sparkline";
import { CiteThis } from "@/components/cite-this";

interface PageProps {
  params: Promise<{ lang: string; code: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { lang, code } = await params;
  if (!isLocale(lang)) return {};
  const ind = getIndicator(code);
  if (!ind) return { title: "Indicator not found" };
  return {
    title: lang === "ar" ? ind.name_ar : ind.name_en,
    description: lang === "ar" ? ind.definition_ar : ind.definition_en,
  };
}

export default async function IndicatorDetailPage({ params }: PageProps) {
  const { lang, code } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const ind = getIndicator(code);
  if (!ind) notFound();

  const pivot = await getMultiSourcePivot(code);
  const allObs = await getObservations(code);

  const sourcesUsedIds = Array.from(
    new Set(allObs.map((o) => o.source_id))
  ).sort();
  const sourcesUsed = sourcesUsedIds
    .map((id) => getSource(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const topic = ind.facets.find((f) => f.facet_type === "topic")?.facet_value;
  const subtopic = ind.facets.find((f) => f.facet_type === "subtopic")?.facet_value;

  const primaryObs = ind.primary_source_id
    ? allObs.filter((o) => o.source_id === ind.primary_source_id)
    : allObs;
  const sparkData = primaryObs
    .map((o) => ({
      x: Number.parseInt(o.period_end.slice(0, 4), 10),
      y: o.value,
    }))
    .sort((a, b) => a.x - b.x);

  const latestYear = sparkData[sparkData.length - 1]?.x;
  const today = new Date().toISOString().slice(0, 10);
  const citation = `Mabii (${new Date().getUTCFullYear()}). ${
    lang === "ar" ? ind.name_ar : ind.name_en
  } [${ind.code}]. Retrieved ${today} from https://mabii.org/${lang}/indicators/${ind.code}`;

  return (
    <article className="mx-auto max-w-5xl px-6 py-10">
      <nav
        className="mb-3 text-xs"
        style={{
          color: "var(--color-ink-mute)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <Link
          href={`/${lang}/indicators`}
          style={{ color: "var(--color-ink-mute)" }}
        >
          {dict.nav.data}
        </Link>
        {topic && (
          <>
            {" / "}
            <Link
              href={`/${lang}/topics/${topic}`}
              style={{ color: "var(--color-ink-mute)" }}
            >
              {facetLabel("topic", topic, lang)}
            </Link>
          </>
        )}
        {subtopic && (
          <>
            {" / "}
            <span>{facetLabel("subtopic", subtopic, lang)}</span>
          </>
        )}
      </nav>

      <header className="mb-6">
        <h1 className="mb-2 text-3xl" style={{ fontWeight: 600 }}>
          {lang === "ar" ? ind.name_ar : ind.name_en}
        </h1>
        <p
          className="mb-3 text-lg"
          style={{ color: "var(--color-ink-soft)", lineHeight: 1.55 }}
        >
          {lang === "ar" ? ind.definition_ar : ind.definition_en}
        </p>
        <div
          className="flex flex-wrap gap-x-6 gap-y-2 text-xs"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <Meta label={dict.indicator.unit} value={ind.default_unit} />
          <Meta
            label={dict.indicator.frequency}
            value={
              (() => {
                const fv = ind.facets.find((f) => f.facet_type === "frequency")?.facet_value;
                return fv ? facetLabel("frequency", fv, lang) : "—";
              })()
            }
          />
          <Meta label={dict.indicator.geography} value={ind.geography_id} />
          <Meta
            label={dict.indicator.sources_count}
            value={String(ind.sources.length)}
          />
          <Meta
            label={dict.indicator.last_updated}
            value={latestYear ? String(latestYear) : "—"}
          />
        </div>
      </header>

      {sparkData.length >= 2 && (
        <section className="mb-10">
          <Sparkline
            data={sparkData}
            ariaLabel={`Time series for ${ind.name_en}`}
          />
          <p
            className="mt-1 text-xs"
            style={{
              color: "var(--color-ink-mute)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {dict.indicator.source}:{" "}
            {ind.primary_source_id
              ? lang === "ar"
                ? getSource(ind.primary_source_id)?.name_ar
                : getSource(ind.primary_source_id)?.name_en
              : "—"}
          </p>
        </section>
      )}

      <section className="mb-10">
        <h2 className="mb-3 text-lg" style={{ fontWeight: 600 }}>
          {dict.indicator.multi_source_table}
        </h2>
        {pivot.length === 0 ? (
          <p
            className="text-sm"
            style={{
              color: "var(--color-ink-mute)",
              fontFamily: "var(--font-sans)",
            }}
          >
            No observations yet. Run <code>npm run fetch:all</code> to populate
            the canonical store.
          </p>
        ) : (
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
                  <th>{dict.indicator.period}</th>
                  {sourcesUsed.map((s) => (
                    <th key={s.id} className="num">
                      {lang === "ar" ? s.name_ar : s.name_en}
                    </th>
                  ))}
                  <th className="num">{dict.indicator.divergence}</th>
                </tr>
              </thead>
              <tbody>
                {pivot.slice(0, 30).map((row) => (
                  <tr key={`${row.period_start}|${row.period_end}`}>
                    <td
                      style={{
                        fontFamily: "var(--font-sans)",
                        color: "var(--color-ink-soft)",
                      }}
                    >
                      {formatPeriod(
                        row.period_start,
                        row.period_end,
                        ind.facets.find((f) => f.facet_type === "frequency")?.facet_value ?? "annual"
                      )}
                    </td>
                    {sourcesUsed.map((s) => {
                      const obs = row.bySource[s.id];
                      return (
                        <td key={s.id} className="num">
                          {obs ? (
                            <span>
                              {formatNumber(obs.value, obs.unit, lang)}
                            </span>
                          ) : (
                            <span style={{ color: "var(--color-ink-mute)" }}>
                              —
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="num">
                      {row.range && row.range.spreadPct > 1 ? (
                        <span
                          style={{
                            color:
                              row.range.spreadPct > 25
                                ? "var(--color-flag-divergent)"
                                : "var(--color-ink-soft)",
                            fontWeight:
                              row.range.spreadPct > 25 ? 600 : 400,
                          }}
                        >
                          ±{row.range.spreadPct.toFixed(1)}%
                        </span>
                      ) : (
                        <span style={{ color: "var(--color-ink-mute)" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {ind.notes_en && (
        <section className="mb-10">
          <h2 className="mb-2 text-lg" style={{ fontWeight: 600 }}>
            {dict.indicator.methodology}
          </h2>
          <p style={{ lineHeight: 1.7 }}>
            {lang === "ar" ? ind.notes_ar : ind.notes_en}
          </p>
        </section>
      )}

      <section className="mb-10">
        <h2 className="mb-3 text-lg" style={{ fontWeight: 600 }}>
          {dict.indicator.provenance}
        </h2>
        <ul className="space-y-3">
          {ind.sources.map((mapping) => {
            const src = getSource(mapping.source_id);
            if (!src) return null;
            const latestForThis = allObs
              .filter((o) => o.source_id === src.id)
              .sort((a, b) => b.fetched_at.localeCompare(a.fetched_at))[0];
            return (
              <li
                key={mapping.source_id}
                className="border-l-2 pl-3 text-sm"
                style={{
                  borderColor: "var(--color-rule)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                <div className="mb-1 flex flex-wrap items-baseline gap-x-3">
                  <Link
                    href={`/${lang}/sources/${src.id}`}
                    style={{ color: "var(--color-ink)", fontWeight: 600 }}
                  >
                    {lang === "ar" ? src.name_ar : src.name_en}
                  </Link>
                  <TrustBadge label={src.trust_label_default} dict={dict} />
                  <code
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--color-ink-mute)",
                    }}
                  >
                    {mapping.source_native_code}
                  </code>
                </div>
                <div
                  className="text-xs"
                  style={{ color: "var(--color-ink-mute)" }}
                >
                  {dict.source.last_fetch}:{" "}
                  {latestForThis
                    ? formatDate(latestForThis.fetched_at, lang)
                    : "never"}
                  {mapping.reconciliation_notes && (
                    <>
                      {" · "}
                      {mapping.reconciliation_notes}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg" style={{ fontWeight: 600 }}>
          {dict.indicator.downloads_heading}
        </h2>
        <div
          className="flex flex-wrap gap-3 text-sm"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <DownloadLink href={`/api/v1/indicators/${ind.code}?format=csv`} label="CSV" />
          <DownloadLink href={`/api/v1/indicators/${ind.code}?format=json`} label="JSON" />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg" style={{ fontWeight: 600 }}>
          {dict.indicator.cite_heading}
        </h2>
        <CiteThis citation={citation} />
      </section>

      {/* facets used — shows the SQL-join grammar in plain sight */}
      <section>
        <h2
          className="mb-3 text-xs uppercase tracking-wider"
          style={{
            color: "var(--color-ink-mute)",
            letterSpacing: "0.06em",
            fontFamily: "var(--font-sans)",
          }}
        >
          Facets
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {ind.facets.map((f) => (
            <Link
              key={`${f.facet_type}:${f.facet_value}`}
              href={`/${lang}/browse?${f.facet_type}=${f.facet_value}`}
              className="no-underline"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 11,
                padding: "2px 8px",
                border: "1px solid var(--color-rule)",
                color: "var(--color-ink-soft)",
                background: "var(--color-bg-elev)",
              }}
            >
              {f.facet_type}: {facetLabel(f.facet_type, f.facet_value, lang)}
            </Link>
          ))}
        </div>
      </section>
    </article>
  );

  // unused but kept for parity in case both source columns are wanted
  void allSources;
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ color: "var(--color-ink-mute)" }}>{label}: </span>
      <span style={{ color: "var(--color-ink)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function DownloadLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="no-underline"
      style={{
        border: "1px solid var(--color-rule)",
        padding: "6px 12px",
        color: "var(--color-ink)",
        background: "var(--color-bg-elev)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {label}
    </a>
  );
}
