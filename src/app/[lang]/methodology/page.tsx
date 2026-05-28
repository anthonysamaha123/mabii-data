import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/dictionaries";

export const metadata = { title: "Methodology" };

const content = {
  en: {
    heading: "Methodology",
    intro:
      "Mabii's methodology is itself a public artifact. Every choice that shapes a published number is documented here, linkable from anywhere on the site, and versioned in the project's open-source repository.",
    sections: [
      { href: "accuracy-standard", title: "Accuracy & reliability standard", body: "Eight non-negotiable commitments that govern what appears on the site, in the API, and in exports." },
      { href: "facet-vocabulary", title: "Faceted catalogue (vocabulary v1)", body: "The published list of facet types and values. Subject browsing is a SQL join over these tags — nothing more." },
    ],
    trust_heading: "Trust labels",
    trust_body:
      "Every observation carries one of four trust labels: official (a published authoritative source), proxy (a reliable proxy reported by such a source), modeled (a Mabii-derived estimate with documented method), and reference (background structural data, often stale).",
    ai_heading: "Where AI sits",
    ai_body:
      "AI is used only at onboarding (proposing schema mappings, facet tags, bilingual metadata) and inside the queued ingestion path (proposing PDF extractions for human review). No AI runs in the request path; per-query AI cost is zero. AI proposes, code disposes — and every AI-assisted value is sample-audited.",
  },
  ar: {
    heading: "المنهجية",
    intro:
      "منهجية مَبني هي بحدّ ذاتها وثيقة عامة. كل خيارٍ يُشكّل رقماً منشوراً موثَّقٌ هنا، قابلٌ للاستشهاد من أيّ مكان على الموقع، ومُعَنوَنٌ بإصدارات في المستودع المفتوح المصدر للمشروع.",
    sections: [
      { href: "accuracy-standard", title: "معيار الدقة والاعتمادية", body: "ثمانية التزامات غير قابلة للتفاوض تحكم ما يظهر على الموقع وفي الواجهة البرمجية والتنزيلات." },
      { href: "facet-vocabulary", title: "الكتالوج المُصنَّف (مفردات الإصدار الأول)", body: "القائمة المنشورة لأنواع التصنيف وقيمها. التصفّح بحسب الموضوع هو ضمّ SQL على هذه التصنيفات لا أكثر." },
    ],
    trust_heading: "تصنيفات الثقة",
    trust_body:
      "تحمل كل ملاحظة أحد أربعة تصنيفات: رسمي (مصدر مرجعي منشور)، بديل (مؤشر بديل موثوق من المصدر نفسه)، نموذجي (تقدير مَبني بمنهجية موثَّقة)، مرجعي (بيانات هيكلية للسياق، غالباً قديمة).",
    ai_heading: "موقع الذكاء الاصطناعي",
    ai_body:
      "يُستعمل الذكاء الاصطناعي حصراً في مرحلة الإلحاق (اقتراح ربط البنى، تصنيفات الفهرسة، البيانات الوصفية الثنائية اللغة) وضمن مسار الإدخال المُؤجَّل (اقتراح استخراجات من ملفات PDF للمراجعة البشرية). لا يعمل أي ذكاء اصطناعي ضمن مسار الطلب؛ كلفة الذكاء الاصطناعي لكل استعلام صفر. الذكاء يقترح والشيفرة تَفصل — وكل قيمة بمساعدة الذكاء تخضع لتدقيق عيّنات.",
  },
} as const;

export default async function MethodologyIndex({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = content[lang];

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-4 text-3xl" style={{ fontWeight: 600 }}>
        {c.heading}
      </h1>
      <p className="mb-8" style={{ lineHeight: 1.7 }}>
        {c.intro}
      </p>
      <ul className="mb-10 space-y-4">
        {c.sections.map((s) => (
          <li
            key={s.href}
            className="border-l-2 pl-4"
            style={{ borderColor: "var(--color-rule)" }}
          >
            <Link
              href={`/${lang}/methodology/${s.href}`}
              className="text-lg no-underline"
              style={{ color: "var(--color-ink)", fontWeight: 600 }}
            >
              {s.title} →
            </Link>
            <p className="mt-1 text-sm" style={{ color: "var(--color-ink-soft)" }}>
              {s.body}
            </p>
          </li>
        ))}
      </ul>
      <section className="mb-8">
        <h2 className="mb-2 text-lg" style={{ fontWeight: 600 }}>
          {c.trust_heading}
        </h2>
        <p style={{ lineHeight: 1.7 }}>{c.trust_body}</p>
      </section>
      <section className="mb-8">
        <h2 className="mb-2 text-lg" style={{ fontWeight: 600 }}>
          {c.ai_heading}
        </h2>
        <p style={{ lineHeight: 1.7 }}>{c.ai_body}</p>
      </section>
    </article>
  );
}
