import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/dictionaries";

export const metadata = { title: "Accuracy & reliability standard" };

const content = {
  en: {
    heading: "Accuracy & reliability standard",
    intro:
      "These eight commitments govern everything Mabii publishes. They are not aspirational; they are enforced by the system's architecture and visible to anyone reading any page.",
    items: [
      ["Source reference on every data point.", "No number appears anywhere — website, API, export — without a one-click link to its exact source, the source's report date (vintage), and Mabii's fetch timestamp."],
      ["Clear, consistent, comparable tables.", "Uniform columns sitewide: value, unit, currency basis, period, frequency, source, vintage, trust label, last-updated, next-expected-update."],
      ["Cross-source verification before publish.", "Where a figure exists in more than one source it is checked; agreement raises confidence, disagreement is surfaced — never hidden. Validation gates are deterministic."],
      ["Visible freshness, per series.", "Each indicator shows its own last-updated and next-expected-update dates. There is no single sitewide freshness, because sources move at different speeds."],
      ["Honest staleness and known-limitation flags.", "A series openly states when its source lags or its method is dated (for example: CPI weights from 2004–05). Admitting unreliability is itself a reliability feature."],
      ["Versioned corrections with a public changelog.", "Numbers are never silently edited. A correction is a new version; the old value and the reason remain visible."],
      ["Clear trust labelling.", "Every value is tagged official, proxy, modeled, or reference, so a satellite estimate is never mistaken for a central-bank figure."],
      ["Published methodology and measured error rate.", "How each indicator is sourced and derived is documented publicly. AI-assisted extractions are sample-audited; the error rate is measured and published."],
    ],
  },
  ar: {
    heading: "معيار الدقة والاعتمادية",
    intro:
      "تَحكم هذه الالتزامات الثمانية كل ما تنشره مَبني. ليست شعارات؛ هي مفروضة بنيوياً وظاهرة في كل صفحة.",
    items: [
      ["مرجع المصدر على كل رقم.", "لا يظهر أيّ رقم — على الموقع أو في الواجهة البرمجية أو في التنزيلات — من دون رابط مباشر إلى المصدر الأصلي وتاريخ التقرير ولحظة سحب البيانات."],
      ["جداول واضحة ومتّسقة وقابلة للمقارنة.", "أعمدة موحَّدة عبر الموقع: القيمة، الوحدة، العملة المرجعية، الفترة، الدورية، المصدر، تاريخ النشر، تصنيف الثقة، آخر تحديث، التحديث القادم المتوقَّع."],
      ["تحقّق من المصادر قبل النشر.", "حين تتوفّر القيمة في أكثر من مصدر، تُقارَن؛ يَرفع التوافقُ الثقةَ، ويُكشَف الاختلافُ ولا يُخفى. بوّاباتُ التحقّق صارمة."],
      ["حداثة ظاهرة لكل سلسلة.", "تُظهر كل سلسلة تاريخَ آخر تحديث والتحديث القادم المتوقَّع. لا يوجد تاريخ تحديث واحد للموقع لأن المصادر تتحرّك بإيقاعات مختلفة."],
      ["إعلانٌ صريح للقدم والقيود المعروفة.", "تُعلن السلسلة بوضوحٍ إن كان مصدرها متأخراً أو منهجيتها قديمة (مثلاً: أوزان الرقم القياسي تعود لعام 2004–2005). الاعتراف بالقيود هو في ذاته ميزة اعتمادية."],
      ["تصحيحات مُعنونة بإصدارات وسجلٌّ علني للتغيير.", "لا تُعدَّل الأرقام في صمت. كل تصحيح إصدار جديد؛ القيمة القديمة والسبب يبقيان ظاهرَين."],
      ["تصنيف ثقةٍ واضح.", "تُصَنَّف كل قيمة: رسمي، بديل، نموذجي، مرجعي — كي لا تُخلط أبداً بيانات قمر اصطناعي ببيانات مصرف مركزي."],
      ["منهجية منشورة ونسبة خطأ مُقاسة.", "كيفيّة استمداد كل مؤشر مُوَثَّقة علناً. الاستخراجات المساعَدة بالذكاء الاصطناعي تخضع لتدقيق عيّنات، ونسبة الخطأ تُقاس وتُنشر."],
    ],
  },
} as const;

export default async function AccuracyStandardPage({
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
      <ol className="space-y-6">
        {c.items.map(([title, body], i) => (
          <li
            key={i}
            className="flex gap-4 border-l-2 pl-4"
            style={{ borderColor: "var(--color-rule)" }}
          >
            <span
              className="shrink-0 text-xl"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--color-accent)",
                lineHeight: 1.2,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="mb-1" style={{ fontWeight: 600 }}>
                {title}
              </h3>
              <p style={{ lineHeight: 1.65, color: "var(--color-ink-soft)" }}>
                {body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}
