import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/dictionaries";
import { sources, indicatorsForSource } from "@/data/queries";
import { getLastFetchedAtForSource } from "@/data/store";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Sources" };

export default async function SourcesIndex({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const rows = await Promise.all(
    sources.map(async (s) => ({
      source: s,
      count: indicatorsForSource(s.id).length,
      lastFetched: await getLastFetchedAtForSource(s.id),
    }))
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-6 text-3xl" style={{ fontWeight: 600 }}>
        Sources
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
              <th>Source</th>
              <th>Tier</th>
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
                  }}
                >
                  {source.tier}
                </td>
                <td className="num">{count}</td>
                <td style={{ color: "var(--color-ink-soft)" }}>
                  {lastFetched ? formatDate(lastFetched, lang) : "—"}
                </td>
                <td
                  className="text-xs"
                  style={{ color: "var(--color-ink-mute)" }}
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
