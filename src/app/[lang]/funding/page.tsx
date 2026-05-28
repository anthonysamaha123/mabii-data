import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/dictionaries";

export const metadata = { title: "Funding disclosure" };

const content = {
  en: {
    heading: "Funding disclosure",
    intro:
      "Mabii commits to full, public, dated disclosure of every source of funding. Below is the complete list as of the date shown. This page is updated within seven days of any new commitment.",
    statement_heading: "Current status",
    statement:
      "As of the most recent update, Mabii has not received external funding. The project is built and maintained by its founder using personal time and approximately the cost of a domain. This page will be updated the moment that changes.",
    rules_heading: "Funding rules",
    rules: [
      "No funding from any entity Mabii might investigate or report on, directly or through a controlled affiliate.",
      "No single funder may account for more than 25% of annual operating budget once funding exceeds a single founder's personal contributions.",
      "The Data Arm and the Accountability Arm have separate balance sheets; surplus from the Data Arm is the only operational link between them.",
      "Every funder is named publicly with amount and date.",
    ],
    last_updated: "Last updated",
  },
  ar: {
    heading: "إفصاح عن التمويل",
    intro:
      "تلتزم مَبني بالإفصاح العلني الكامل وبتاريخ محدَّد عن كل مصدر تمويل. أدناه القائمة الكاملة حتى التاريخ المُبيَّن. تُحدَّث هذه الصفحة خلال سبعة أيام من تلقّي أي التزام جديد.",
    statement_heading: "الوضع الحالي",
    statement:
      "حتى آخر تحديث، لم تتلقَّ مَبني أيّ تمويل خارجي. يبنى المشروع ويُصان من قِبَل مؤسّسه باستخدام وقته الشخصي وكلفة لا تتجاوز ثمن النطاق. ستُحدَّث هذه الصفحة فور تغيّر ذلك.",
    rules_heading: "قواعد التمويل",
    rules: [
      "لا تمويل من أيّ جهة قد تكون موضع تحقيقٍ أو تغطيةٍ من مَبني، مباشرةً أو عبر تابع لها.",
      "لا يجوز أن يتجاوز أي ممولٍ منفرد 25% من الموازنة التشغيلية السنوية متى ما تخطّى التمويل مساهمات المؤسّس الشخصية.",
      "لذراع البيانات وذراع المساءلة موازنتان منفصلتان؛ والصلة التشغيلية الوحيدة بينهما هي فائض ذراع البيانات.",
      "يُذكر كل ممولٍ علناً مع المبلغ والتاريخ.",
    ],
    last_updated: "آخر تحديث",
  },
} as const;

export default async function FundingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = content[lang];
  const today = new Date().toISOString().slice(0, 10);
  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-3 text-3xl" style={{ fontWeight: 600 }}>
        {c.heading}
      </h1>
      <p
        className="mb-8 text-xs"
        style={{
          color: "var(--color-ink-mute)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {c.last_updated}: <code>{today}</code>
      </p>
      <p className="mb-8" style={{ lineHeight: 1.7 }}>
        {c.intro}
      </p>
      <section
        className="mb-8 border-l-4 pl-4"
        style={{ borderColor: "var(--color-accent)" }}
      >
        <h2 className="mb-2 text-lg" style={{ fontWeight: 600 }}>
          {c.statement_heading}
        </h2>
        <p style={{ lineHeight: 1.7 }}>{c.statement}</p>
      </section>
      <h2 className="mb-3 text-lg" style={{ fontWeight: 600 }}>
        {c.rules_heading}
      </h2>
      <ul className="list-disc space-y-2 pl-6" style={{ lineHeight: 1.65 }}>
        {c.rules.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </article>
  );
}
