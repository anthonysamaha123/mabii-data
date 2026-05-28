import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/dictionaries";
import { indicatorsForTopic, getSource } from "@/data/queries";
import { getLatestObservation, getObservations } from "@/data/store";
import { facetLabel } from "@/data/catalog/facet-vocabulary";
import { formatNumber, formatYear } from "@/lib/format";
import { Sparkline } from "@/components/sparkline";
import { TrustBadge } from "@/components/trust-badge";
import { getDictionary } from "@/lib/i18n/dictionaries";

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
  const dict = await getDictionary(lang);
  const list = indicatorsForTopic(topic);
  if (list.length === 0) notFound();

  // Hydrate every indicator with its latest, observations, source, and subtopic.
  const rows = await Promise.all(
    list.map(async (ind) => {
      const latest = await getLatestObservation(ind.code, ind.primary_source_id);
      const obs = await getObservations(ind.code);
      const source = latest ? getSource(latest.source_id) : undefined;
      const subtopic = ind.facets.find(
        (f) => f.facet_type === "subtopic"
      )?.facet_value;
      return { ind, latest, obs, source, subtopic };
    })
  );

  // Group by subtopic. Indicators without a subtopic land in "other".
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = row.subtopic ?? "other";
    const bucket = groups.get(key) ?? [];
    bucket.push(row);
    groups.set(key, bucket);
  }
  const orderedGroups = Array.from(groups.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
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
          {dict.nav.topics}
        </Link>
      </nav>

      <header className="mb-8 flex items-baseline justify-between gap-4">
        <h1 className="text-3xl" style={{ fontWeight: 600 }}>
          {facetLabel("topic", topic, lang)}
        </h1>
        <p
          className="text-xs"
          style={{
            color: "var(--color-ink-mute)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {rows.length} indicator{rows.length === 1 ? "" : "s"} · {orderedGroups.length}{" "}
          group{orderedGroups.length === 1 ? "" : "s"}
        </p>
      </header>

      {orderedGroups.map(([subtopic, items]) => (
        <section key={subtopic} className="mb-12">
          <h2
            className="mb-3 text-xs uppercase tracking-wider"
            style={{
              color: "var(--color-ink-soft)",
              letterSpacing: "0.06em",
              fontFamily: "var(--font-sans)",
            }}
          >
            {subtopic === "other"
              ? lang === "ar"
                ? "أخرى"
                : "Other"
              : facetLabel("subtopic", subtopic, lang)}
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
                  <th>{dict.indicator.definition.split(" ")[0]}</th>
                  <th>{dict.indicator.source}</th>
                  <th className="num">{dict.indicator.value}</th>
                  <th>{dict.indicator.period}</th>
                  <th>Trend</th>
                  <th>{dict.indicator.trust}</th>
                </tr>
              </thead>
              <tbody>
                {items.map(({ ind, latest, obs, source }) => {
                  const sparkData = obs
                    .filter(
                      (o) =>
                        o.source_id ===
                        (ind.primary_source_id ?? o.source_id)
                    )
                    .map((o) => ({
                      x: Number.parseInt(o.period_end.slice(0, 4), 10),
                      y: o.value,
                    }))
                    .sort((a, b) => a.x - b.x);

                  return (
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
                      </td>
                      <td
                        style={{
                          color: "var(--color-ink-soft)",
                          fontFamily: "var(--font-sans)",
                          fontSize: 13,
                        }}
                      >
                        {source
                          ? lang === "ar"
                            ? source.name_ar
                            : source.name_en
                          : "—"}
                      </td>
                      <td className="num">
                        {latest
                          ? formatNumber(latest.value, ind.default_unit, lang)
                          : "—"}
                      </td>
                      <td
                        style={{
                          color: "var(--color-ink-soft)",
                          fontFamily: "var(--font-sans)",
                          fontSize: 13,
                        }}
                      >
                        {latest ? formatYear(latest.period_end) : "—"}
                      </td>
                      <td style={{ width: 160 }}>
                        {sparkData.length >= 2 ? (
                          <Sparkline
                            data={sparkData}
                            width={160}
                            height={36}
                            ariaLabel={`Trend for ${ind.name_en}`}
                          />
                        ) : (
                          <span
                            style={{
                              color: "var(--color-ink-mute)",
                              fontFamily: "var(--font-sans)",
                              fontSize: 12,
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        {latest && (
                          <TrustBadge label={latest.trust_label} dict={dict} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
