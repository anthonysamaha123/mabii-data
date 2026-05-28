import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/dictionaries";

export const metadata = { title: "About" };

const content = {
  en: {
    heading: "About Mabii",
    body: [
      "Mabii is an independent project building the data and accountability backbone for the Lebanese economy. It does one thing well: it pools data from multilaterals, central banks, ministries, customs, markets, and bank research desks into a single comparable catalogue — with a source reference on every number, the source's report date, and Mabii's fetch timestamp.",
      "Mabii does not editorialise. It does not generate narrative. It does not pick a winner when sources disagree. It joins data; you read it. Every page on this site is a deterministic query, reproducible from its URL. There is no AI between you and the numbers.",
      "Mabii is structured to be incorruptible: full funding disclosure, published methodology, versioned corrections, a measured and published error rate on AI-assisted extractions, and aggregates-not-individuals at the schema level. Trust is earned one number at a time.",
      "Mabii is a two-arm institution by design. The Data Arm — this website and its API — is neutral, technical, and cooperative. A separate, firewalled Accountability Arm undertakes investigative work; its activity is operationally and legally isolated so it cannot compromise the credibility of the data.",
    ],
  },
  ar: {
    heading: "من نحن",
    body: [
      "مَبني مشروع مستقلّ يبني البنية التحتية للبيانات والمساءلة في الاقتصاد اللبناني. هدفه واحد ينفّذه بإتقان: تجميع البيانات من المؤسسات الدولية والمصارف المركزية والوزارات والجمارك والأسواق ومراكز أبحاث المصارف في كتالوج موحَّد قابل للمقارنة — مع مرجع لمصدر كل رقم، وتاريخ نشر المصدر، ولحظة سحب البيانات في مَبني.",
      "لا تُقدّم مَبني تعليقاً تحريرياً، ولا تُنشئ سرديات، ولا تختار «الرقم الصحيح» حين تختلف المصادر. هي تُجمّع البيانات وأنتم تقرؤونها. كل صفحة على هذا الموقع هي استعلامٌ صارم يمكن إعادة إنتاجه من رابطه. لا يفصل بينكم وبين الأرقام أيّ ذكاء اصطناعي.",
      "بنية مَبني تحول دون اختطاف ثقتها: إفصاح كامل عن التمويل، منهجية منشورة، تصحيحات مُعَنونة بإصدارات، نسبة خطأ مُقاسة ومنشورة على الاستخراجات المساعَدة بالذكاء الاصطناعي، وتجميعات لا أفراد على مستوى النموذج. الثقة تُكتسب رقماً رقماً.",
      "مَبني مؤسسة ذات ذراعَين بحكم تصميمها. ذراع البيانات — هذا الموقع وواجهته البرمجية — محايد وتقني وتعاوني. أما الذراع الاستقصائية فمنفصلة وتعمل خلف جدار حماية تشغيلي وقانوني كي لا تُلوِّث مصداقية البيانات.",
    ],
  },
} as const;

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = content[lang];
  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-6 text-3xl" style={{ fontWeight: 600 }}>
        {c.heading}
      </h1>
      <div className="space-y-5" style={{ lineHeight: 1.7 }}>
        {c.body.map((p, i) => (
          <p key={i} style={{ color: "var(--color-ink)" }}>
            {p}
          </p>
        ))}
      </div>
    </article>
  );
}
