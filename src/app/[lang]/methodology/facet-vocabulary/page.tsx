import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/dictionaries";
import { facetVocabulary } from "@/data/catalog/facet-vocabulary";

export const metadata = { title: "Facet vocabulary v1" };

const headings: Record<Locale, { title: string; intro: string }> = {
  en: {
    title: "Facet vocabulary (v1)",
    intro:
      "These are the facet types and values used to tag every indicator. Subject browsing is a SQL join over these tags: every query the site can answer is expressible as one or more (facet_type, facet_value) pairs. The vocabulary is versioned; missing concepts are added publicly via the changelog.",
  },
  ar: {
    title: "مفردات التصنيف (الإصدار الأول)",
    intro:
      "هذه أنواع التصنيف وقيمها المستخدَمة لوسم كل مؤشر. التصفّح بحسب الموضوع هو ضمّ SQL على هذه الوسوم: كل استعلامٍ يقدر الموقع على الإجابة عنه يُعَبَّر عنه بزوج أو أكثر من (نوع_التصنيف، القيمة). المفردات مُعَنوَنة بإصدارات؛ والمفاهيم الناقصة تُضاف علناً عبر سجل التغييرات.",
  },
};

export default async function FacetVocabPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = headings[lang];

  const byType = new Map<string, typeof facetVocabulary>();
  for (const entry of facetVocabulary) {
    const list = byType.get(entry.facet_type) ?? [];
    list.push(entry);
    byType.set(entry.facet_type, list);
  }

  return (
    <article className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-4 text-3xl" style={{ fontWeight: 600 }}>
        {c.title}
      </h1>
      <p className="mb-10" style={{ lineHeight: 1.7 }}>
        {c.intro}
      </p>

      <div className="space-y-10">
        {Array.from(byType.entries()).map(([type, entries]) => (
          <section key={type}>
            <h2
              className="mb-3 text-xs uppercase tracking-wider"
              style={{ color: "var(--color-ink-soft)", letterSpacing: "0.06em" }}
            >
              {type}
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
                    <th>facet_value</th>
                    <th>label (EN)</th>
                    <th>label (AR)</th>
                    <th>parent</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={`${type}:${e.facet_value}`}>
                      <td>
                        <code>{e.facet_value}</code>
                      </td>
                      <td>{e.label_en}</td>
                      <td style={{ fontFamily: "var(--font-serif)" }}>
                        {e.label_ar}
                      </td>
                      <td
                        style={{
                          color: "var(--color-ink-mute)",
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                        }}
                      >
                        {e.parent ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
