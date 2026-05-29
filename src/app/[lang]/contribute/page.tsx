import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/dictionaries";
import { SurveyForm, type SurveyLabels } from "@/components/survey-form";
import { questionsFor, moduleForWeek } from "@/data/survey/questions";

export const metadata = {
  title: "Contribute",
  description:
    "Anonymously share what you actually pay, earn, and experience in Lebanon. Aggregated, never individual.",
};

const MODULE_LABEL: Record<Locale, Record<string, string>> = {
  en: {
    spending: "This month: your spending",
    banking: "This month: banking & trust",
    infrastructure: "This month: electricity & utilities",
    operations: "This month: operations",
  },
  ar: {
    spending: "هذا الشهر: إنفاقك",
    banking: "هذا الشهر: المصارف والثقة",
    infrastructure: "هذا الشهر: الكهرباء والخدمات",
    operations: "هذا الشهر: التشغيل",
  },
};

const LABELS: Record<Locale, SurveyLabels> = {
  en: {
    preview_banner:
      "Preview — this form is not yet collecting data. It is here so the questions can be reviewed. Nothing you click is stored or sent.",
    intro_title: "Tell Lebanon what's actually happening",
    intro_body:
      "Two anonymous minutes. We never ask your name, contact, or exact location — only broad bands. Your answers join thousands of others into governorate-level statistics that official numbers miss: what people really pay, earn, and live. Choose how you're answering.",
    as_person: "As a resident",
    as_business: "As a business",
    section_about_person: "About you (kept broad, for grouping only)",
    section_about_business: "About your business (kept broad, for grouping only)",
    section_core: "Your situation",
    section_module: "Rotating questions",
    progress: "{n} of {total} answered",
    submit: "Review & submit",
    back: "Back",
    done_title: "Thank you",
    done_body:
      "You answered {n} questions. In the live version these would join your governorate's monthly statistics — aggregated, never shown individually. For now, nothing was stored.",
    done_again: "Fill it again",
    optional: "optional",
    error_prefix: "Could not submit",
  },
  ar: {
    preview_banner:
      "معاينة — هذا النموذج لا يجمع البيانات بعد. هو هنا لمراجعة الأسئلة. لا يُحفظ أو يُرسَل أي شيء تضغطه.",
    intro_title: "أخبر لبنان بما يحدث فعلاً",
    intro_body:
      "دقيقتان مجهولتان. لا نسأل عن اسمك أو وسيلة تواصلك أو موقعك الدقيق — فقط فئات عامة. تنضمّ إجاباتك إلى آلاف غيرها لتُكوّن إحصاءات على مستوى المحافظة تغيب عن الأرقام الرسمية: ما يدفعه الناس ويكسبونه ويعيشونه فعلاً. اختر كيف تجيب.",
    as_person: "كمقيم",
    as_business: "كصاحب عمل",
    section_about_person: "عنك (تبقى عامة، للتجميع فقط)",
    section_about_business: "عن عملك (تبقى عامة، للتجميع فقط)",
    section_core: "وضعك",
    section_module: "أسئلة متناوبة",
    progress: "{n} من {total} مُجابة",
    submit: "مراجعة وإرسال",
    back: "رجوع",
    done_title: "شكراً لك",
    done_body:
      "أجبت على {n} سؤالاً. في النسخة الحيّة ستنضمّ إلى إحصاءات محافظتك الشهرية — مُجمَّعة، لا تُعرَض فردياً أبداً. حالياً لم يُحفَظ أي شيء.",
    done_again: "املأ النموذج مجدّداً",
    optional: "اختياري",
    error_prefix: "تعذّر الإرسال",
  },
};

function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const diff = date.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
}

export default async function ContributePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const now = new Date();
  const week = isoWeek(now);
  const wave = `${now.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  const personModule = moduleForWeek("person", week);
  const businessModule = moduleForWeek("business", week);

  const person = {
    ...questionsFor("person", personModule),
    moduleLabel: MODULE_LABEL[lang][personModule] ?? personModule,
    wave,
  };
  const business = {
    ...questionsFor("business", businessModule),
    moduleLabel: MODULE_LABEL[lang][businessModule] ?? businessModule,
    wave,
  };

  return (
    <SurveyForm person={person} business={business} locale={lang} labels={LABELS[lang]} />
  );
}
