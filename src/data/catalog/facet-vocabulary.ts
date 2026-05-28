import type { FacetVocabularyEntry } from "@/data/types";

/**
 * Facet vocabulary v1.
 * Public artifact — every value here is reachable as a faceted query.
 * Versioned: do not silently rename a facet_value once published; deprecate + add.
 */
export const facetVocabulary: FacetVocabularyEntry[] = [
  // ── topic ────────────────────────────────────────────────────────────
  { facet_type: "topic", facet_value: "macro", label_en: "Macroeconomy", label_ar: "الاقتصاد الكلي" },
  { facet_type: "topic", facet_value: "monetary", label_en: "Monetary & banking", label_ar: "النقد والمصارف" },
  { facet_type: "topic", facet_value: "fiscal", label_en: "Public finance", label_ar: "المالية العامة" },
  { facet_type: "topic", facet_value: "external", label_en: "External sector", label_ar: "القطاع الخارجي" },
  { facet_type: "topic", facet_value: "prices", label_en: "Prices & inflation", label_ar: "الأسعار والتضخم" },
  { facet_type: "topic", facet_value: "trade", label_en: "Trade", label_ar: "التجارة" },
  { facet_type: "topic", facet_value: "demographic", label_en: "Demographics", label_ar: "السكان" },
  { facet_type: "topic", facet_value: "employment", label_en: "Employment", label_ar: "العمالة" },
  { facet_type: "topic", facet_value: "energy", label_en: "Energy", label_ar: "الطاقة" },
  { facet_type: "topic", facet_value: "real_estate", label_en: "Real estate", label_ar: "العقارات" },
  { facet_type: "topic", facet_value: "transport", label_en: "Transport & vehicles", label_ar: "النقل والمركبات" },
  { facet_type: "topic", facet_value: "infrastructure", label_en: "Infrastructure & connectivity", label_ar: "البنى التحتية والاتّصال" },
  { facet_type: "topic", facet_value: "social", label_en: "Social & development", label_ar: "اجتماعي وتنموي" },
  { facet_type: "topic", facet_value: "humanitarian", label_en: "Humanitarian", label_ar: "إنساني" },
  { facet_type: "topic", facet_value: "governance", label_en: "Governance & institutions", label_ar: "الحوكمة والمؤسسات" },
  { facet_type: "topic", facet_value: "health", label_en: "Health", label_ar: "الصحة" },
  { facet_type: "topic", facet_value: "environment", label_en: "Environment & energy", label_ar: "البيئة والطاقة" },
  { facet_type: "topic", facet_value: "hospitality", label_en: "Hospitality & food service", label_ar: "الضيافة والمطاعم" },
  { facet_type: "topic", facet_value: "retail", label_en: "Retail & consumer commerce", label_ar: "التجزئة والتجارة الاستهلاكية" },

  // ── subtopic ─────────────────────────────────────────────────────────
  { facet_type: "subtopic", facet_value: "gdp", parent: "macro", label_en: "Gross domestic product", label_ar: "الناتج المحلي الإجمالي" },
  { facet_type: "subtopic", facet_value: "growth", parent: "macro", label_en: "Real growth", label_ar: "النمو الحقيقي" },
  { facet_type: "subtopic", facet_value: "cpi", parent: "prices", label_en: "Consumer prices", label_ar: "أسعار المستهلك" },
  { facet_type: "subtopic", facet_value: "fx", parent: "monetary", label_en: "Exchange rate", label_ar: "سعر الصرف" },
  { facet_type: "subtopic", facet_value: "policy_rate", parent: "monetary", label_en: "Policy interest rate", label_ar: "سعر الفائدة الرسمي" },
  { facet_type: "subtopic", facet_value: "reserves", parent: "monetary", label_en: "Foreign reserves", label_ar: "الاحتياطيات الأجنبية" },
  { facet_type: "subtopic", facet_value: "debt", parent: "fiscal", label_en: "Public debt", label_ar: "الدين العام" },
  { facet_type: "subtopic", facet_value: "balance", parent: "fiscal", label_en: "Fiscal balance", label_ar: "الرصيد المالي" },
  { facet_type: "subtopic", facet_value: "current_account", parent: "external", label_en: "Current account", label_ar: "الحساب الجاري" },
  { facet_type: "subtopic", facet_value: "remittances", parent: "external", label_en: "Remittances", label_ar: "التحويلات" },
  { facet_type: "subtopic", facet_value: "exports", parent: "trade", label_en: "Exports", label_ar: "الصادرات" },
  { facet_type: "subtopic", facet_value: "imports", parent: "trade", label_en: "Imports", label_ar: "الواردات" },
  { facet_type: "subtopic", facet_value: "population", parent: "demographic", label_en: "Population", label_ar: "عدد السكان" },
  { facet_type: "subtopic", facet_value: "rent", parent: "real_estate", label_en: "Residential rent", label_ar: "إيجار سكني" },
  { facet_type: "subtopic", facet_value: "sale_price", parent: "real_estate", label_en: "Sale prices", label_ar: "أسعار البيع" },
  { facet_type: "subtopic", facet_value: "used_cars", parent: "transport", label_en: "Used cars", label_ar: "السيارات المستعملة" },
  // Macro (additional)
  { facet_type: "subtopic", facet_value: "gdp_per_capita", parent: "macro", label_en: "GDP per capita", label_ar: "نصيب الفرد من الناتج المحلي" },
  // Monetary (additional)
  { facet_type: "subtopic", facet_value: "money_supply", parent: "monetary", label_en: "Money supply", label_ar: "المعروض النقدي" },
  { facet_type: "subtopic", facet_value: "lending_rate", parent: "monetary", label_en: "Lending interest rate", label_ar: "فائدة الإقراض" },
  { facet_type: "subtopic", facet_value: "deposit_rate", parent: "monetary", label_en: "Deposit interest rate", label_ar: "فائدة الودائع" },
  { facet_type: "subtopic", facet_value: "bank_deposits", parent: "monetary", label_en: "Bank deposits", label_ar: "ودائع المصارف" },
  { facet_type: "subtopic", facet_value: "bank_lending", parent: "monetary", label_en: "Bank lending to private sector", label_ar: "إقراض المصارف للقطاع الخاص" },
  // Fiscal (additional)
  { facet_type: "subtopic", facet_value: "government_revenue", parent: "fiscal", label_en: "Government revenue", label_ar: "إيرادات الحكومة" },
  { facet_type: "subtopic", facet_value: "government_expenditure", parent: "fiscal", label_en: "Government expenditure", label_ar: "نفقات الحكومة" },
  { facet_type: "subtopic", facet_value: "primary_balance", parent: "fiscal", label_en: "Primary balance", label_ar: "الرصيد الأوّلي" },
  { facet_type: "subtopic", facet_value: "tax_revenue", parent: "fiscal", label_en: "Tax revenue", label_ar: "الإيرادات الضريبية" },
  // External (additional)
  { facet_type: "subtopic", facet_value: "fdi", parent: "external", label_en: "Foreign direct investment", label_ar: "الاستثمار الأجنبي المباشر" },
  { facet_type: "subtopic", facet_value: "trade_balance", parent: "trade", label_en: "Trade balance", label_ar: "الميزان التجاري" },
  // Prices (additional)
  { facet_type: "subtopic", facet_value: "food_prices", parent: "prices", label_en: "Food prices", label_ar: "أسعار الغذاء" },
  // Employment (additional)
  { facet_type: "subtopic", facet_value: "labor_force", parent: "employment", label_en: "Labour force", label_ar: "القوى العاملة" },
  { facet_type: "subtopic", facet_value: "unemployment", parent: "employment", label_en: "Unemployment", label_ar: "البطالة" },
  { facet_type: "subtopic", facet_value: "youth_unemployment", parent: "employment", label_en: "Youth unemployment", label_ar: "بطالة الشباب" },
  // Demographic (additional)
  { facet_type: "subtopic", facet_value: "population_growth", parent: "demographic", label_en: "Population growth", label_ar: "النموّ السكّاني" },
  { facet_type: "subtopic", facet_value: "age_dependency", parent: "demographic", label_en: "Age dependency ratio", label_ar: "نسبة الإعالة" },
  { facet_type: "subtopic", facet_value: "urban_population", parent: "demographic", label_en: "Urban population share", label_ar: "حصّة السكان في المدن" },
  // Infrastructure
  { facet_type: "subtopic", facet_value: "electricity_use", parent: "infrastructure", label_en: "Electricity use per capita", label_ar: "استهلاك الكهرباء للفرد" },
  { facet_type: "subtopic", facet_value: "internet_use", parent: "infrastructure", label_en: "Internet users", label_ar: "مستخدمو الإنترنت" },
  { facet_type: "subtopic", facet_value: "mobile_subscriptions", parent: "infrastructure", label_en: "Mobile subscriptions", label_ar: "اشتراكات الهاتف المحمول" },
  // Social
  { facet_type: "subtopic", facet_value: "life_expectancy", parent: "social", label_en: "Life expectancy at birth", label_ar: "متوسّط العمر المتوقّع عند الولادة" },
  { facet_type: "subtopic", facet_value: "schooling", parent: "social", label_en: "School enrolment", label_ar: "الالتحاق بالمدارس" },
  // Humanitarian
  { facet_type: "subtopic", facet_value: "refugees", parent: "humanitarian", label_en: "Registered refugees", label_ar: "اللاجئون المسجّلون" },
  // Affordability / cost of living
  { facet_type: "subtopic", facet_value: "food_basket", parent: "prices", label_en: "Food basket cost", label_ar: "كلفة سلّة الغذاء" },
  { facet_type: "subtopic", facet_value: "minimum_wage", parent: "employment", label_en: "Minimum wage", label_ar: "الحد الأدنى للأجور" },
  { facet_type: "subtopic", facet_value: "affordability", parent: "social", label_en: "Affordability", label_ar: "القدرة على تحمّل الكلفة" },
  // Governance
  { facet_type: "subtopic", facet_value: "corruption", parent: "governance", label_en: "Corruption control", label_ar: "مكافحة الفساد" },
  { facet_type: "subtopic", facet_value: "rule_of_law", parent: "governance", label_en: "Rule of law", label_ar: "سيادة القانون" },
  { facet_type: "subtopic", facet_value: "voice_accountability", parent: "governance", label_en: "Voice and accountability", label_ar: "التعبير والمساءلة" },
  { facet_type: "subtopic", facet_value: "political_stability", parent: "governance", label_en: "Political stability", label_ar: "الاستقرار السياسي" },
  { facet_type: "subtopic", facet_value: "government_effectiveness", parent: "governance", label_en: "Government effectiveness", label_ar: "فاعلية الحكومة" },
  { facet_type: "subtopic", facet_value: "regulatory_quality", parent: "governance", label_en: "Regulatory quality", label_ar: "جودة الأنظمة" },
  // Health
  { facet_type: "subtopic", facet_value: "mortality", parent: "health", label_en: "Mortality", label_ar: "الوفيات" },
  { facet_type: "subtopic", facet_value: "health_expenditure", parent: "health", label_en: "Health expenditure", label_ar: "الإنفاق الصحي" },
  { facet_type: "subtopic", facet_value: "health_workforce", parent: "health", label_en: "Health workforce & beds", label_ar: "الكادر الصحي والأسرّة" },
  { facet_type: "subtopic", facet_value: "immunization", parent: "health", label_en: "Immunization", label_ar: "التحصين" },
  // Environment
  { facet_type: "subtopic", facet_value: "co2_emissions", parent: "environment", label_en: "CO2 emissions", label_ar: "انبعاثات ثاني أكسيد الكربون" },
  { facet_type: "subtopic", facet_value: "electricity_access", parent: "environment", label_en: "Electricity access", label_ar: "الوصول إلى الكهرباء" },
  { facet_type: "subtopic", facet_value: "energy_mix", parent: "environment", label_en: "Energy mix", label_ar: "مزيج الطاقة" },
  // ── Places-derived business categories ───────────────────────────────
  { facet_type: "subtopic", facet_value: "pharmacy", parent: "health", label_en: "Pharmacies", label_ar: "الصيدليات" },
  { facet_type: "subtopic", facet_value: "hospital", parent: "health", label_en: "Hospitals & clinics", label_ar: "المستشفيات والعيادات" },
  { facet_type: "subtopic", facet_value: "bank_branch", parent: "monetary", label_en: "Bank branches", label_ar: "فروع المصارف" },
  { facet_type: "subtopic", facet_value: "money_exchange", parent: "monetary", label_en: "Money exchange (sarrafa)", label_ar: "صرافة" },
  { facet_type: "subtopic", facet_value: "restaurant", parent: "hospitality", label_en: "Restaurants", label_ar: "المطاعم" },
  { facet_type: "subtopic", facet_value: "cafe", parent: "hospitality", label_en: "Cafés", label_ar: "المقاهي" },
  { facet_type: "subtopic", facet_value: "hotel", parent: "hospitality", label_en: "Hotels & lodging", label_ar: "الفنادق ودور الإقامة" },
  { facet_type: "subtopic", facet_value: "supermarket", parent: "retail", label_en: "Supermarkets & grocers", label_ar: "السوبرماركت والبقالات" },
  { facet_type: "subtopic", facet_value: "gas_station", parent: "retail", label_en: "Gas stations", label_ar: "محطات الوقود" },
  { facet_type: "subtopic", facet_value: "generator_shop", parent: "environment", label_en: "Generator & solar shops", label_ar: "متاجر المولّدات والطاقة الشمسية" },

  // ── frequency ────────────────────────────────────────────────────────
  { facet_type: "frequency", facet_value: "daily", label_en: "Daily", label_ar: "يومية" },
  { facet_type: "frequency", facet_value: "weekly", label_en: "Weekly", label_ar: "أسبوعية" },
  { facet_type: "frequency", facet_value: "monthly", label_en: "Monthly", label_ar: "شهرية" },
  { facet_type: "frequency", facet_value: "quarterly", label_en: "Quarterly", label_ar: "ربعية" },
  { facet_type: "frequency", facet_value: "annual", label_en: "Annual", label_ar: "سنوية" },

  // ── currency_basis ───────────────────────────────────────────────────
  { facet_type: "currency_basis", facet_value: "usd", label_en: "USD", label_ar: "دولار أميركي" },
  { facet_type: "currency_basis", facet_value: "lbp", label_en: "LBP", label_ar: "ليرة لبنانية" },
  { facet_type: "currency_basis", facet_value: "percent", label_en: "% / ratio", label_ar: "نسبة مئوية / نسبة" },
  { facet_type: "currency_basis", facet_value: "index", label_en: "Index", label_ar: "رقم قياسي" },
  { facet_type: "currency_basis", facet_value: "count", label_en: "Count / persons", label_ar: "عدد / أشخاص" },

  // ── geography_level ──────────────────────────────────────────────────
  { facet_type: "geography_level", facet_value: "country", label_en: "Country", label_ar: "الوطني" },
  { facet_type: "geography_level", facet_value: "governorate", label_en: "Governorate", label_ar: "المحافظة" },
  { facet_type: "geography_level", facet_value: "district", label_en: "District", label_ar: "القضاء" },

  // ── stock_or_flow ────────────────────────────────────────────────────
  { facet_type: "stock_or_flow", facet_value: "stock", label_en: "Stock", label_ar: "رصيد" },
  { facet_type: "stock_or_flow", facet_value: "flow", label_en: "Flow", label_ar: "تدفّق" },
  { facet_type: "stock_or_flow", facet_value: "ratio", label_en: "Ratio", label_ar: "نسبة" },
];

export function facetLabel(
  facet_type: string,
  facet_value: string,
  lang: "en" | "ar"
): string {
  const entry = facetVocabulary.find(
    (f) => f.facet_type === facet_type && f.facet_value === facet_value
  );
  if (!entry) return facet_value;
  return lang === "ar" ? entry.label_ar : entry.label_en;
}

export function facetValuesForType(facet_type: string) {
  return facetVocabulary.filter((f) => f.facet_type === facet_type);
}

export function facetTypes(): string[] {
  return Array.from(new Set(facetVocabulary.map((f) => f.facet_type)));
}
