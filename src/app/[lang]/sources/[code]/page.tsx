import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n/dictionaries";
import { getSource, indicatorsForSource } from "@/data/queries";
import { getLastFetchedAtForSource } from "@/data/store";
import { TrustBadge } from "@/components/trust-badge";
import { formatDate } from "@/lib/format";

interface PageProps {
  params: Promise<{ lang: string; code: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { lang, code } = await params;
  if (!isLocale(lang)) return {};
  const src = getSource(code);
  if (!src) return { title: "Source not found" };
  return { title: lang === "ar" ? src.name_ar : src.name_en };
}

export default async function SourceDetail({ params }: PageProps) {
  const { lang, code } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const src = getSource(code);
  if (!src) notFound();

  const list = indicatorsForSource(src.id);
  const lastFetched = await getLastFetchedAtForSource(src.id);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <nav
        className="mb-2 text-xs"
        style={{
          color: "var(--color-ink-mute)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <Link
          href={`/${lang}/sources`}
          style={{ color: "var(--color-ink-mute)" }}
        >
          Sources
        </Link>
      </nav>
      <h1 className="mb-2 text-3xl" style={{ fontWeight: 600 }}>
        {lang === "ar" ? src.name_ar : src.name_en}
      </h1>
      <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <TrustBadge label={src.trust_label_default} dict={dict} />
        <code
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--color-ink-mute)",
            fontSize: 12,
          }}
        >
          {src.tier}
        </code>
        <a
          href={src.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm"
        >
          {src.url}
        </a>
      </div>

      <dl
        className="mb-8 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <Field
          label={dict.source.publisher}
          value={lang === "ar" ? src.publisher_ar : src.publisher_en}
        />
        <Field label={dict.source.license} value={src.license} />
        <Field
          label={dict.source.cadence}
          value={lang === "ar" ? src.cadence_ar : src.cadence_en}
        />
        <Field
          label={dict.source.last_fetch}
          value={lastFetched ? formatDate(lastFetched, lang) : "—"}
        />
      </dl>

      <section className="mb-10">
        <h2 className="mb-2 text-lg" style={{ fontWeight: 600 }}>
          How Mabii ingests this source
        </h2>
        <p style={{ lineHeight: 1.7, color: "var(--color-ink-soft)" }}>
          {lang === "ar" ? src.ingest_method_ar : src.ingest_method_en}
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg" style={{ fontWeight: 600 }}>
          {dict.source.indicators_heading}
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
                <th>Indicator</th>
                <th>Native code</th>
                <th>Comparability</th>
              </tr>
            </thead>
            <tbody>
              {list.map((ind) => {
                const mapping = ind.sources.find(
                  (m) => m.source_id === src.id
                )!;
                return (
                  <tr key={ind.code}>
                    <td>
                      <Link
                        href={`/${lang}/indicators/${ind.code}`}
                        className="no-underline"
                        style={{
                          color: "var(--color-ink)",
                          fontWeight: 500,
                        }}
                      >
                        {lang === "ar" ? ind.name_ar : ind.name_en}
                      </Link>
                    </td>
                    <td>
                      <code style={{ fontSize: 12 }}>
                        {mapping.source_native_code}
                      </code>
                    </td>
                    <td
                      style={{
                        color: "var(--color-ink-soft)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {mapping.comparability}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt
        className="text-xs uppercase tracking-wider"
        style={{
          color: "var(--color-ink-mute)",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </dt>
      <dd className="mt-0.5" style={{ color: "var(--color-ink)" }}>
        {value}
      </dd>
    </div>
  );
}
