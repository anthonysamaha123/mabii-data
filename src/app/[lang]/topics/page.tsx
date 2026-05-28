import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/dictionaries";
import { topicsInUse, indicatorsForTopic } from "@/data/queries";
import { facetLabel } from "@/data/catalog/facet-vocabulary";

export const metadata = { title: "Topics" };

const headings: Record<Locale, { title: string }> = {
  en: { title: "Topics" },
  ar: { title: "المواضيع" },
};

export default async function TopicsIndex({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = headings[lang];

  const topics = topicsInUse();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-6 text-3xl" style={{ fontWeight: 600 }}>
        {c.title}
      </h1>
      <ul className="grid gap-4 sm:grid-cols-2">
        {topics.map((t) => {
          const count = indicatorsForTopic(t).length;
          return (
            <li
              key={t}
              className="border p-4"
              style={{
                borderColor: "var(--color-rule)",
                background: "var(--color-bg-elev)",
              }}
            >
              <Link
                href={`/${lang}/topics/${t}`}
                className="no-underline"
                style={{
                  color: "var(--color-ink)",
                  fontWeight: 600,
                  fontSize: 18,
                }}
              >
                {facetLabel("topic", t, lang)}
              </Link>
              <div
                className="mt-1 text-xs"
                style={{
                  color: "var(--color-ink-mute)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {count} indicator{count === 1 ? "" : "s"}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
