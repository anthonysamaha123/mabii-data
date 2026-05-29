// Mabii Community Survey — question schema as data.
// This is the durable instrument: the contribute form renders it, and the
// (future) backend + aggregation engine read the SAME schema. See SURVEY.md.
//
// No PII fields exist here by construction. Every numeric is BANDED.

export type QuestionType = "yes_no" | "single_choice" | "banded_number" | "scale3";
export type Respondent = "person" | "business";

export interface Choice {
  value: string;
  label_en: string;
  label_ar: string;
}

export interface SurveyQuestion {
  id: string;
  respondent: Respondent;
  /** anchor = demographic/segmentation; core = every wave; otherwise a rotating module id */
  block: "anchor" | "core" | string;
  domain: string; // P1..P8 / B1..B5 / anchor — for grouping
  type: QuestionType;
  prompt_en: string;
  prompt_ar: string;
  /** for single_choice / banded_number / scale3 */
  options?: Choice[];
  /** the indicator this question feeds (documentation) */
  yields?: string;
  /** used internally as a segmentation dimension, not published as its own indicator */
  isSegment?: boolean;
  sensitive?: boolean;
}

// ── shared option sets ────────────────────────────────────────────────
const GOVERNORATES: Choice[] = [
  { value: "LBN-BA", label_en: "Beirut", label_ar: "بيروت" },
  { value: "LBN-ML", label_en: "Mount Lebanon", label_ar: "جبل لبنان" },
  { value: "LBN-NO", label_en: "North", label_ar: "الشمال" },
  { value: "LBN-AK", label_en: "Akkar", label_ar: "عكار" },
  { value: "LBN-BK", label_en: "Bekaa", label_ar: "البقاع" },
  { value: "LBN-BH", label_en: "Baalbek-Hermel", label_ar: "بعلبك-الهرمل" },
  { value: "LBN-SO", label_en: "South", label_ar: "الجنوب" },
  { value: "LBN-NA", label_en: "Nabatieh", label_ar: "النبطية" },
];

const YESNO: Choice[] = [
  { value: "yes", label_en: "Yes", label_ar: "نعم" },
  { value: "no", label_en: "No", label_ar: "لا" },
];

const SCALE3: Choice[] = [
  { value: "better", label_en: "Better", label_ar: "أفضل" },
  { value: "same", label_en: "About the same", label_ar: "كما هي" },
  { value: "worse", label_en: "Worse", label_ar: "أسوأ" },
];

const USD_BANDS: Choice[] = [
  { value: "0-200", label_en: "Under $200", label_ar: "أقل من 200$" },
  { value: "200-500", label_en: "$200 – 500", label_ar: "200 – 500$" },
  { value: "500-1000", label_en: "$500 – 1,000", label_ar: "500 – 1,000$" },
  { value: "1000-2000", label_en: "$1,000 – 2,000", label_ar: "1,000 – 2,000$" },
  { value: "2000-4000", label_en: "$2,000 – 4,000", label_ar: "2,000 – 4,000$" },
  { value: "4000+", label_en: "Over $4,000", label_ar: "أكثر من 4,000$" },
];

const SPEND_BANDS: Choice[] = [
  { value: "0", label_en: "~$0", label_ar: "~0$" },
  { value: "1-50", label_en: "$1 – 50", label_ar: "1 – 50$" },
  { value: "50-150", label_en: "$50 – 150", label_ar: "50 – 150$" },
  { value: "150-300", label_en: "$150 – 300", label_ar: "150 – 300$" },
  { value: "300-600", label_en: "$300 – 600", label_ar: "300 – 600$" },
  { value: "600+", label_en: "Over $600", label_ar: "أكثر من 600$" },
];

export const surveyQuestions: SurveyQuestion[] = [
  // ════════════ PEOPLE — anchors ════════════
  {
    id: "p_age", respondent: "person", block: "anchor", domain: "anchor", type: "single_choice", isSegment: true,
    prompt_en: "Your age group", prompt_ar: "فئتك العمرية",
    options: ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"].map((v) => ({ value: v, label_en: v, label_ar: v })),
  },
  {
    id: "p_gov", respondent: "person", block: "anchor", domain: "anchor", type: "single_choice", isSegment: true,
    prompt_en: "Which governorate do you live in?", prompt_ar: "في أي محافظة تقيم؟", options: GOVERNORATES,
  },
  {
    id: "p_education", respondent: "person", block: "anchor", domain: "anchor", type: "single_choice", isSegment: true,
    prompt_en: "Highest education completed", prompt_ar: "أعلى مستوى تعليمي أنهيته",
    options: [
      { value: "school", label_en: "School or less", label_ar: "مدرسة أو أقل" },
      { value: "technical", label_en: "Technical / vocational", label_ar: "تقني / مهني" },
      { value: "university", label_en: "University degree", label_ar: "شهادة جامعية" },
      { value: "postgrad", label_en: "Postgraduate", label_ar: "دراسات عليا" },
    ],
  },
  {
    id: "p_employment", respondent: "person", block: "anchor", domain: "anchor", type: "single_choice", isSegment: true,
    prompt_en: "Your work situation", prompt_ar: "وضعك المهني",
    options: [
      { value: "private", label_en: "Employed — private sector", label_ar: "موظف — قطاع خاص" },
      { value: "public", label_en: "Employed — public sector", label_ar: "موظف — قطاع عام" },
      { value: "self", label_en: "Self-employed / own business", label_ar: "عمل حر / مشروع خاص" },
      { value: "unemployed", label_en: "Unemployed, seeking", label_ar: "عاطل عن العمل، أبحث" },
      { value: "student", label_en: "Student", label_ar: "طالب" },
      { value: "retired", label_en: "Retired / not working", label_ar: "متقاعد / لا أعمل" },
    ],
  },

  // ════════════ PEOPLE — core ════════════
  {
    id: "p_income_currency", respondent: "person", block: "core", domain: "P1", type: "single_choice",
    prompt_en: "How are you mainly paid?", prompt_ar: "كيف تتقاضى دخلك بشكل أساسي؟",
    yields: "wage-dollarization rate",
    options: [
      { value: "fresh_usd", label_en: "Fresh US dollars (cash)", label_ar: "دولار «فريش» (نقداً)" },
      { value: "lollar", label_en: "Bank dollars / lollar", label_ar: "دولار مصرفي / لولار" },
      { value: "lbp", label_en: "Lebanese pounds", label_ar: "ليرة لبنانية" },
      { value: "mixed", label_en: "A mix", label_ar: "مزيج" },
    ],
  },
  {
    id: "p_income_band", respondent: "person", block: "core", domain: "P1", type: "banded_number",
    prompt_en: "Roughly, your monthly income (USD equivalent)", prompt_ar: "تقريباً، دخلك الشهري (بما يعادل الدولار)",
    yields: "average income by segment", options: USD_BANDS,
  },
  {
    id: "p_deposits", respondent: "person", block: "core", domain: "P2", type: "yes_no",
    prompt_en: "Can you freely withdraw your bank savings?", prompt_ar: "هل تستطيع سحب مدّخراتك المصرفية بحرّية؟",
    yields: "frozen-deposit rate", options: YESNO,
  },
  {
    id: "p_ends_meet", respondent: "person", block: "core", domain: "P3", type: "yes_no",
    prompt_en: "Did your income cover your expenses last month?", prompt_ar: "هل غطّى دخلك مصاريفك الشهر الماضي؟",
    yields: "not-making-ends-meet rate", options: YESNO,
  },
  {
    id: "p_meals", respondent: "person", block: "core", domain: "P3", type: "yes_no",
    prompt_en: "Did you skip or cut meals because of cost last month?", prompt_ar: "هل تخطّيت أو قلّصت وجبات بسبب الكلفة الشهر الماضي؟",
    yields: "food-insecurity rate", options: YESNO,
  },
  {
    id: "p_remit", respondent: "person", block: "core", domain: "P7", type: "yes_no",
    prompt_en: "Do you receive money from relatives abroad?", prompt_ar: "هل تتلقّى أموالاً من أقارب في الخارج؟",
    yields: "remittance-receiving rate", options: YESNO,
  },
  {
    id: "p_cash_home", respondent: "person", block: "core", domain: "P2", type: "yes_no",
    prompt_en: "Do you keep most of your savings as cash at home?", prompt_ar: "هل تحتفظ بمعظم مدّخراتك نقداً في المنزل؟",
    yields: "cash-hoarding / debanking proxy", options: YESNO,
  },
  {
    id: "p_emigration", respondent: "person", block: "core", domain: "P8", type: "yes_no",
    prompt_en: "Are you seriously considering emigrating in the next 12 months?", prompt_ar: "هل تفكّر جدّياً بالهجرة خلال الأشهر الـ12 المقبلة؟",
    yields: "emigration-intent rate", options: YESNO,
  },
  {
    id: "p_sentiment", respondent: "person", block: "core", domain: "P8", type: "scale3",
    prompt_en: "Financially, are you better or worse than a year ago?", prompt_ar: "مالياً، هل أنت أفضل أم أسوأ من قبل سنة؟",
    yields: "household sentiment", options: SCALE3,
  },

  // ════════════ PEOPLE — module: spending diary ════════════
  ...(
    [
      ["spend_food", "Food & groceries", "الغذاء والبقالة"],
      ["spend_rent", "Rent / housing", "الإيجار / السكن"],
      ["spend_power", "Electricity + generator", "الكهرباء + المولّد"],
      ["spend_transport", "Transport & fuel", "النقل والوقود"],
      ["spend_health", "Health & medicine", "الصحة والدواء"],
    ] as const
  ).map(([id, en, ar]): SurveyQuestion => ({
    id: `p_${id}`, respondent: "person", block: "spending", domain: "P3", type: "banded_number",
    prompt_en: `About how much did your household spend on ${en.toLowerCase()} last month?`,
    prompt_ar: `كم أنفقت أسرتك تقريباً على ${ar} الشهر الماضي؟`,
    yields: "spending share (consumption basket)", options: SPEND_BANDS,
  })),

  // ════════════ PEOPLE — module: banking & trust ════════════
  {
    id: "p_lost_deposits", respondent: "person", block: "banking", domain: "P2", type: "yes_no",
    prompt_en: "Did you lose money to a bank deposit haircut since 2019?", prompt_ar: "هل خسرت أموالاً نتيجة اقتطاع الودائع منذ 2019؟",
    yields: "crisis-loss incidence", options: YESNO,
  },
  {
    id: "p_fintech", respondent: "person", block: "banking", domain: "P2", type: "yes_no",
    prompt_en: "Do you use a transfer wallet (Whish, OMT, etc.)?", prompt_ar: "هل تستخدم محفظة تحويل (Whish، OMT…)؟",
    yields: "fintech adoption", options: YESNO,
  },
  {
    id: "p_trust_banks", respondent: "person", block: "banking", domain: "P8", type: "yes_no",
    prompt_en: "Do you trust banks with your money?", prompt_ar: "هل تثق بالمصارف على أموالك؟",
    yields: "bank-trust index", options: YESNO,
  },
  {
    id: "p_keep_lbp", respondent: "person", block: "banking", domain: "P8", type: "yes_no",
    prompt_en: "Would you keep new savings in Lebanese pounds?", prompt_ar: "هل تحتفظ بمدّخرات جديدة بالليرة اللبنانية؟",
    yields: "currency-confidence index", options: YESNO,
  },

  // ════════════ PEOPLE — module: infrastructure ════════════
  {
    id: "p_state_power", respondent: "person", block: "infrastructure", domain: "P6", type: "single_choice",
    prompt_en: "Hours of STATE electricity you get per day", prompt_ar: "عدد ساعات كهرباء الدولة يومياً",
    yields: "grid-failure reality",
    options: [
      { value: "0-4", label_en: "0 – 4 hours", label_ar: "0 – 4 ساعات" },
      { value: "4-8", label_en: "4 – 8 hours", label_ar: "4 – 8 ساعات" },
      { value: "8-16", label_en: "8 – 16 hours", label_ar: "8 – 16 ساعة" },
      { value: "16-24", label_en: "16 – 24 hours", label_ar: "16 – 24 ساعة" },
    ],
  },
  {
    id: "p_generator", respondent: "person", block: "infrastructure", domain: "P6", type: "yes_no",
    prompt_en: "Do you pay for a private generator subscription?", prompt_ar: "هل تدفع اشتراك مولّد خاص؟",
    yields: "generator-reliance rate", options: YESNO,
  },
  {
    id: "p_solar", respondent: "person", block: "infrastructure", domain: "P6", type: "yes_no",
    prompt_en: "Did you install solar power in the last 2 years?", prompt_ar: "هل ركّبت طاقة شمسية في العامين الأخيرين؟",
    yields: "solar-adoption rate", options: YESNO,
  },

  // ════════════ BUSINESS — anchors ════════════
  {
    id: "b_sector", respondent: "business", block: "anchor", domain: "anchor", type: "single_choice", isSegment: true,
    prompt_en: "Your business sector", prompt_ar: "قطاع عملك",
    options: [
      { value: "retail", label_en: "Retail / trade", label_ar: "تجزئة / تجارة" },
      { value: "food", label_en: "Food & hospitality", label_ar: "مطاعم وضيافة" },
      { value: "services", label_en: "Services", label_ar: "خدمات" },
      { value: "manufacturing", label_en: "Manufacturing", label_ar: "تصنيع" },
      { value: "construction", label_en: "Construction", label_ar: "إنشاءات" },
      { value: "agriculture", label_en: "Agriculture", label_ar: "زراعة" },
      { value: "tech", label_en: "Tech / digital", label_ar: "تكنولوجيا / رقمي" },
      { value: "health", label_en: "Healthcare", label_ar: "رعاية صحية" },
      { value: "other", label_en: "Other", label_ar: "أخرى" },
    ],
  },
  {
    id: "b_size", respondent: "business", block: "anchor", domain: "anchor", type: "single_choice", isSegment: true,
    prompt_en: "How many people work there (including you)?", prompt_ar: "كم شخصاً يعمل لديك (بمن فيهم أنت)؟",
    options: [
      { value: "1", label_en: "Just me", label_ar: "أنا فقط" },
      { value: "2-5", label_en: "2 – 5", label_ar: "2 – 5" },
      { value: "6-20", label_en: "6 – 20", label_ar: "6 – 20" },
      { value: "21-50", label_en: "21 – 50", label_ar: "21 – 50" },
      { value: "50+", label_en: "More than 50", label_ar: "أكثر من 50" },
    ],
  },
  {
    id: "b_gov", respondent: "business", block: "anchor", domain: "anchor", type: "single_choice", isSegment: true,
    prompt_en: "Which governorate does it operate in?", prompt_ar: "في أي محافظة يعمل؟", options: GOVERNORATES,
  },

  // ════════════ BUSINESS — core ════════════
  {
    id: "b_deposits", respondent: "business", block: "core", domain: "B1", type: "yes_no",
    prompt_en: "Can your business access its bank deposits?", prompt_ar: "هل يستطيع عملك الوصول إلى ودائعه المصرفية؟",
    yields: "frozen-business-deposit rate", options: YESNO,
  },
  {
    id: "b_pricing", respondent: "business", block: "core", domain: "B2", type: "single_choice",
    prompt_en: "Do you price mainly in USD or LBP?", prompt_ar: "هل تسعّر أساساً بالدولار أم بالليرة؟",
    yields: "pricing-dollarization",
    options: [
      { value: "usd", label_en: "Mainly USD", label_ar: "أساساً بالدولار" },
      { value: "lbp", label_en: "Mainly LBP", label_ar: "أساساً بالليرة" },
      { value: "both", label_en: "Both", label_ar: "كلاهما" },
    ],
  },
  {
    id: "b_cash", respondent: "business", block: "core", domain: "B2", type: "yes_no",
    prompt_en: "Is most of your revenue received in cash?", prompt_ar: "هل تتلقّى معظم إيراداتك نقداً؟",
    yields: "cash-economy share", options: YESNO,
  },
  {
    id: "b_credit", respondent: "business", block: "core", domain: "B1", type: "yes_no",
    prompt_en: "Could you get a bank loan if you needed one?", prompt_ar: "هل يمكنك الحصول على قرض مصرفي عند الحاجة؟",
    yields: "credit-access rate", options: YESNO,
  },
  {
    id: "b_revenue_yoy", respondent: "business", block: "core", domain: "B5", type: "scale3",
    prompt_en: "Revenue vs a year ago?", prompt_ar: "الإيرادات مقارنةً بقبل سنة؟",
    yields: "business-cycle sentiment", options: SCALE3,
  },
  {
    id: "b_hiring", respondent: "business", block: "core", domain: "B4", type: "single_choice",
    prompt_en: "In the last 6 months, did you…", prompt_ar: "خلال الأشهر الستة الأخيرة، هل…",
    yields: "employment direction",
    options: [
      { value: "hired", label_en: "Hire staff", label_ar: "وظّفت موظفين" },
      { value: "held", label_en: "Keep staff the same", label_ar: "أبقيت العدد ثابتاً" },
      { value: "laid_off", label_en: "Lay off staff", label_ar: "صرفت موظفين" },
    ],
  },
  {
    id: "b_generator", respondent: "business", block: "core", domain: "B3", type: "yes_no",
    prompt_en: "Do you run on a private generator?", prompt_ar: "هل تعتمد على مولّد خاص؟",
    yields: "firm generator-reliance", options: YESNO,
  },
  {
    id: "b_outlook", respondent: "business", block: "core", domain: "B5", type: "single_choice",
    prompt_en: "In the next 6 months, do you plan to…", prompt_ar: "خلال الأشهر الستة المقبلة، تنوي أن…",
    yields: "investment intent",
    options: [
      { value: "expand", label_en: "Expand", label_ar: "تتوسّع" },
      { value: "hold", label_en: "Hold steady", label_ar: "تبقى ثابتاً" },
      { value: "downsize", label_en: "Downsize", label_ar: "تقلّص" },
    ],
  },

  // ════════════ BUSINESS — module: operations ════════════
  {
    id: "b_imports", respondent: "business", block: "operations", domain: "B3", type: "yes_no",
    prompt_en: "Do you import most of your inputs/goods?", prompt_ar: "هل تستورد معظم مدخلاتك/بضائعك؟",
    yields: "import-dependence", options: YESNO,
  },
  {
    id: "b_energy_cost", respondent: "business", block: "operations", domain: "B3", type: "yes_no",
    prompt_en: "Is electricity among your top 3 costs?", prompt_ar: "هل الكهرباء من أعلى 3 تكاليف لديك؟",
    yields: "energy-cost burden", options: YESNO,
  },
  {
    id: "b_staff_squeeze", respondent: "business", block: "operations", domain: "B4", type: "yes_no",
    prompt_en: "Do you struggle to find or keep staff (emigration)?", prompt_ar: "هل تواجه صعوبة في إيجاد/إبقاء الموظفين (الهجرة)؟",
    yields: "labour-supply squeeze", options: YESNO,
  },
];

// Rotating modules per respondent (the core block ships every wave; one module rotates in).
export const MODULES: Record<Respondent, string[]> = {
  person: ["spending", "banking", "infrastructure"],
  business: ["operations"],
};

export function questionsFor(
  respondent: Respondent,
  activeModule: string
): { anchors: SurveyQuestion[]; core: SurveyQuestion[]; module: SurveyQuestion[] } {
  const mine = surveyQuestions.filter((q) => q.respondent === respondent);
  return {
    anchors: mine.filter((q) => q.block === "anchor"),
    core: mine.filter((q) => q.block === "core"),
    module: mine.filter((q) => q.block === activeModule),
  };
}

/** Deterministic module pick for a given ISO-week number (rotation). */
export function moduleForWeek(respondent: Respondent, week: number): string {
  const mods = MODULES[respondent];
  return mods[week % mods.length];
}
