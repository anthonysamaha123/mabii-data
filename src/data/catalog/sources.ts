import type { Source } from "@/data/types";

/**
 * Source catalogue.
 *
 * Every source we know about — live, planned, scrape-needed, or deferred —
 * is registered here. The site exposes all of them honestly so a reader can
 * see what Mabii ingests today and what it doesn't, without misrepresenting
 * coverage. This catalogue feeds the /sources index and the Data Reliability
 * Map at /sources/reliability-map (SPEC §9, Phase 1 flagship).
 *
 * Accountability-arm OSINT sources are intentionally absent — they live in a
 * firewalled, separately-incorporated org (SPEC §7). The leverage machinery
 * (FATF, IMF country teams, donors) is also absent — those are *consumers* of
 * Mabii data, not sources.
 */
export const sources: Source[] = [
  // ──────────────────────────────────────────────────────────────────────
  // T1 — Open APIs (the reliable spine)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "world-bank-wdi",
    name_en: "World Bank — World Development Indicators",
    name_ar: "البنك الدولي — مؤشرات التنمية العالمية",
    publisher_en: "World Bank Group",
    publisher_ar: "مجموعة البنك الدولي",
    tier: "T1",
    trust_label_default: "official",
    url: "https://data.worldbank.org/country/lebanon",
    license: "CC-BY-4.0 (World Bank Open Data)",
    cadence_en: "Annual; revisions ongoing.",
    cadence_ar: "سنوية؛ مع مراجعات مستمرة.",
    ingest_method_en:
      "Mabii pulls Lebanon series directly from the World Bank API. Every fetch is stored verbatim as JSON.",
    ingest_method_ar:
      "تسحب مَبني سلاسل لبنان مباشرةً من واجهة البنك الدولي. يُحفظ كل سحب كما هو بصيغة JSON.",
    ingestion_status: "live",
  },
  {
    id: "imf-weo",
    name_en: "IMF — World Economic Outlook",
    name_ar: "صندوق النقد الدولي — آفاق الاقتصاد العالمي",
    publisher_en: "International Monetary Fund",
    publisher_ar: "صندوق النقد الدولي",
    tier: "T1",
    trust_label_default: "official",
    url: "https://www.imf.org/en/Publications/WEO",
    license: "IMF Terms of Use (free for non-commercial use)",
    cadence_en: "Biannual (April, October); includes projections.",
    cadence_ar: "مرتين سنوياً (نيسان وتشرين الأول)؛ تتضمن توقّعات.",
    ingest_method_en:
      "Mabii pulls Lebanon WEO series from the IMF DataMapper JSON endpoint. The latest published release is canonical.",
    ingest_method_ar:
      "تسحب مَبني سلاسل لبنان من إصدار آفاق الاقتصاد العالمي عبر بيانات JSON. الإصدار المنشور الأحدث هو المرجع.",
    ingestion_status: "live",
  },
  {
    id: "fred",
    name_en: "FRED — Federal Reserve Economic Data",
    name_ar: "FRED — قاعدة بيانات بنك الاحتياطي الفدرالي",
    publisher_en: "Federal Reserve Bank of St. Louis",
    publisher_ar: "بنك الاحتياطي الفدرالي في سانت لويس",
    tier: "T1",
    trust_label_default: "official",
    url: "https://fred.stlouisfed.org/searchresults?st=lebanon",
    license: "Free (subject to source publishers' terms; ~89 LBN series mirror WB).",
    cadence_en: "Series-dependent; mostly annual mirrors of World Bank data.",
    cadence_ar: "تختلف بحسب السلسلة؛ معظمها مرايا سنوية لبيانات البنك الدولي.",
    ingest_method_en:
      "Mabii pulls FRED Lebanon series via the public FRED API. Used primarily for cross-verification with World Bank.",
    ingest_method_ar:
      "تسحب مَبني سلاسل لبنان من FRED عبر واجهتها العامة. تُستخدم أساساً للتحقق المتقاطع مع البنك الدولي.",
    ingestion_status: "live",
  },
  {
    id: "un-comtrade",
    name_en: "UN Comtrade",
    name_ar: "بيانات التجارة الأممية (Comtrade)",
    publisher_en: "United Nations Statistics Division",
    publisher_ar: "شعبة الإحصاءات في الأمم المتحدة",
    tier: "T1",
    trust_label_default: "official",
    url: "https://comtradeplus.un.org",
    license: "Free for non-commercial; UN open data terms.",
    cadence_en: "Monthly updates; annual reporting from member states.",
    cadence_ar: "تحديثات شهرية؛ تقارير سنوية من الدول الأعضاء.",
    ingest_method_en:
      "Mabii pulls Lebanon trade aggregates (total goods exports/imports) via the public Comtrade API. Per-partner / per-commodity breakdowns are deferred to Phase 2 due to data volume.",
    ingest_method_ar:
      "تسحب مَبني الإجماليات التجارية للبنان (إجمالي صادرات وواردات السلع) عبر واجهة Comtrade العامة. التفصيل بحسب الشريك أو السلعة مؤجَّل للمرحلة الثانية.",
    ingestion_status: "live",
  },
  {
    id: "hdx",
    name_en: "HDX — Humanitarian Data Exchange",
    name_ar: "تبادل البيانات الإنسانية (HDX)",
    publisher_en: "OCHA Centre for Humanitarian Data",
    publisher_ar: "مركز الأمم المتحدة للبيانات الإنسانية (OCHA)",
    tier: "T1",
    trust_label_default: "official",
    url: "https://data.humdata.org/group/lbn",
    license: "Mostly CC-BY-IGO / CC-BY (varies per dataset).",
    cadence_en: "Per-dataset; UNHCR refugee data is monthly.",
    cadence_ar: "تختلف بحسب مجموعة البيانات؛ بيانات اللاجئين لدى UNHCR شهرية.",
    ingest_method_en:
      "Phase-1 build (in progress): Mabii will query the HDX CKAN API for UNHCR-registered refugee populations in Lebanon. Connector not yet shipped; resource endpoints being verified before claiming 'live'.",
    ingest_method_ar:
      "بناء قيد التنفيذ (المرحلة 1): ستستعلم مَبني واجهة CKAN التابعة لـ HDX للحصول على أعداد اللاجئين المسجَّلين لدى UNHCR. لم يُشحَن الموصِل بعد؛ يجري التحقّق من نقاط الوصول قبل الإعلان أنها ‘حيّة’.",
    ingestion_status: "planned",
    planned_phase: 1,
  },
  {
    id: "unctad",
    name_en: "UNCTAD — Trade & Development Statistics",
    name_ar: "الأونكتاد — إحصاءات التجارة والتنمية",
    publisher_en: "United Nations Conference on Trade and Development",
    publisher_ar: "مؤتمر الأمم المتحدة للتجارة والتنمية",
    tier: "T1",
    trust_label_default: "official",
    url: "https://unctadstat.unctad.org",
    license: "UN open data terms (free for non-commercial).",
    cadence_en: "Annual; FDI and trade indicators.",
    cadence_ar: "سنوية؛ مؤشرات الاستثمار الأجنبي المباشر والتجارة.",
    ingest_method_en:
      "Phase-1 build (in progress): Mabii will pull Lebanon FDI inflows and goods-trade balance from UNCTADstat. Connector not yet shipped; resource endpoints being verified before claiming 'live'.",
    ingest_method_ar:
      "بناء قيد التنفيذ (المرحلة 1): ستسحب مَبني تدفقات الاستثمار الأجنبي المباشر لداخل لبنان وميزان تجارة السلع من UNCTADstat. لم يُشحَن الموصِل بعد؛ يجري التحقّق من نقاط الوصول.",
    ingestion_status: "planned",
    planned_phase: 1,
  },
  {
    id: "worldpop",
    name_en: "WorldPop",
    name_ar: "WorldPop",
    publisher_en: "WorldPop / University of Southampton",
    publisher_ar: "WorldPop — جامعة ساوثهامبتون",
    tier: "T1",
    trust_label_default: "modeled",
    url: "https://www.worldpop.org",
    license: "CC-BY-4.0",
    cadence_en: "Annual gridded population estimates; satellite-derived.",
    cadence_ar: "تقديرات سكانية سنوية بدقة شبكية مستمدّة من بيانات الأقمار.",
    ingest_method_en:
      "Population grids require the GDAL toolchain. Phase-2 build: extract Lebanon governorate and district aggregates as Mabii indicators with documented method.",
    ingest_method_ar:
      "تتطلّب الشبكات السكانية أدوات GDAL. في المرحلة الثانية: استخراج إجماليات لبنان على مستوى المحافظات والأقضية كمؤشرات مَبني مع منهجية موثَّقة.",
    ingestion_status: "geospatial_needed",
    planned_phase: 2,
  },
  {
    id: "nasa-viirs",
    name_en: "NASA VIIRS — Night Lights",
    name_ar: "NASA VIIRS — أضواء الليل",
    publisher_en: "NASA / NOAA",
    publisher_ar: "NASA و NOAA",
    tier: "T1",
    trust_label_default: "modeled",
    url: "https://eogdata.mines.edu/products/vnl/",
    license: "US public domain; Earthdata account required.",
    cadence_en: "Monthly composites; daily granules.",
    cadence_ar: "تركيبات شهرية وحبيبات يومية.",
    ingest_method_en:
      "Phase-2 build: compute Lebanon governorate-level night-light aggregates as a proxy for economic activity; published as a derived indicator.",
    ingest_method_ar:
      "في المرحلة الثانية: حساب إجماليات أضواء الليل على مستوى المحافظات اللبنانية كمؤشر بديل للنشاط الاقتصادي، ونشره كمؤشر مشتقّ.",
    ingestion_status: "geospatial_needed",
    planned_phase: 2,
  },
  {
    id: "meta-data-for-good",
    name_en: "Meta Data for Good",
    name_ar: "Meta — بيانات للصالح العام",
    publisher_en: "Meta Platforms",
    publisher_ar: "Meta Platforms",
    tier: "T1",
    trust_label_default: "modeled",
    url: "https://dataforgood.facebook.com",
    license: "Meta partnership terms; non-commercial.",
    cadence_en: "Periodic high-resolution population density maps.",
    cadence_ar: "خرائط دورية عالية الدقة لكثافة السكان.",
    ingest_method_en:
      "Requires partner application to Meta. Phase-3 build pending; not yet requested.",
    ingest_method_ar:
      "يتطلّب تقديم طلب شراكة إلى Meta. مؤجَّل للمرحلة الثالثة؛ لم يُقدَّم الطلب بعد.",
    ingestion_status: "partnership_needed",
    planned_phase: 3,
  },

  // ──────────────────────────────────────────────────────────────────────
  // T2 — Scrape / PDF (the differentiator)
  // Registered here so the catalogue shows them; ingestion comes online
  // only after the onboarding workbench (Phase 0g) is built.
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "bdl",
    name_en: "Banque du Liban (BDL)",
    name_ar: "مصرف لبنان",
    publisher_en: "Banque du Liban",
    publisher_ar: "مصرف لبنان",
    tier: "T2",
    trust_label_default: "official",
    url: "https://www.bdl.gov.lb",
    license: "Public; downloadable PDFs and Excel.",
    cadence_en: "Weekly balance sheet; monthly monetary survey; daily FX.",
    cadence_ar: "ميزانية أسبوعية؛ مسح نقدي شهري؛ سعر صرف يومي.",
    ingest_method_en:
      "Highest-priority T2. Phase-2 build: AI-assisted PDF extraction with human review for the consolidated balance sheet and the monetary survey; FX rates from the daily release.",
    ingest_method_ar:
      "أعلوية T2. في المرحلة الثانية: استخراج مساعَد بالذكاء الاصطناعي مع مراجعة بشرية للميزانية الموحَّدة والمسح النقدي؛ وأسعار الصرف من الإصدار اليومي.",
    ingestion_status: "pdf_ai_needed",
    planned_phase: 2,
  },
  {
    id: "cas",
    name_en: "Central Administration of Statistics (CAS)",
    name_ar: "إدارة الإحصاء المركزي",
    publisher_en: "Central Administration of Statistics, Lebanese Republic",
    publisher_ar: "إدارة الإحصاء المركزي — الجمهورية اللبنانية",
    tier: "T2",
    trust_label_default: "official",
    url: "http://www.cas.gov.lb",
    license: "Public; PDFs and Excel.",
    cadence_en: "Monthly CPI; annual national accounts and labour surveys.",
    cadence_ar: "رقم قياسي لأسعار المستهلك شهرياً؛ حسابات قومية ومسوحات عمل سنوياً.",
    ingest_method_en:
      "Phase-2 build: CPI series from monthly bulletin (AI-assisted PDF extraction). Known limitation: weights date to 2004–05 — flagged on every CPI value.",
    ingest_method_ar:
      "في المرحلة الثانية: سلسلة الرقم القياسي لأسعار المستهلك من النشرة الشهرية (استخراج مساعَد بالذكاء الاصطناعي). قيد معروف: تعود الأوزان إلى 2004–2005 — يُشار إليه على كل قيمة.",
    ingestion_status: "pdf_ai_needed",
    planned_phase: 2,
  },
  {
    id: "mof",
    name_en: "Lebanese Ministry of Finance",
    name_ar: "وزارة المالية اللبنانية",
    publisher_en: "Ministry of Finance, Lebanese Republic",
    publisher_ar: "وزارة المالية — الجمهورية اللبنانية",
    tier: "T2",
    trust_label_default: "official",
    url: "http://www.finance.gov.lb",
    license: "Public; PDFs.",
    cadence_en: "Quarterly fiscal performance; periodic debt bulletins.",
    cadence_ar: "أداء مالي ربعي؛ نشرات دورية للدين العام.",
    ingest_method_en:
      "Phase-2 build: fiscal balance, revenue, expenditure, and gross public debt from quarterly fiscal-performance PDFs.",
    ingest_method_ar:
      "في المرحلة الثانية: الرصيد المالي والإيرادات والنفقات وإجمالي الدين العام من تقارير الأداء المالي الربعية (PDF).",
    ingestion_status: "pdf_ai_needed",
    planned_phase: 2,
  },
  {
    id: "abl",
    name_en: "Association of Banks in Lebanon (ABL)",
    name_ar: "جمعية مصارف لبنان",
    publisher_en: "Association of Banks in Lebanon",
    publisher_ar: "جمعية مصارف لبنان",
    tier: "T2",
    trust_label_default: "official",
    url: "https://www.abl.org.lb",
    license: "Public bulletins; some members-only content.",
    cadence_en: "Monthly aggregate balance sheet; weekly cleared cheques.",
    cadence_ar: "ميزانية مجمَّعة شهرية؛ شيكات مقاصة أسبوعية.",
    ingest_method_en:
      "Phase-2 build: aggregated commercial-bank balance sheet and cleared-cheque series.",
    ingest_method_ar:
      "في المرحلة الثانية: الميزانية المجمَّعة للمصارف التجارية وسلسلة الشيكات المقاصة.",
    ingestion_status: "pdf_ai_needed",
    planned_phase: 2,
  },
  {
    id: "lebanese-customs",
    name_en: "Lebanese Customs",
    name_ar: "الجمارك اللبنانية",
    publisher_en: "Higher Council of Customs, Lebanese Republic",
    publisher_ar: "المجلس الأعلى للجمارك — الجمهورية اللبنانية",
    tier: "T2",
    trust_label_default: "official",
    url: "http://www.customs.gov.lb",
    license: "Public; web portal.",
    cadence_en: "Monthly trade statistics by HS code.",
    cadence_ar: "إحصاءات تجارية شهرية مصنَّفة وفق رمز HS.",
    ingest_method_en:
      "Phase-2 scrape build. Used as one input to the Mabii trade-mirror analysis (SPEC §4 Layer 3).",
    ingest_method_ar:
      "بناء كَشط في المرحلة الثانية. أحد مدخلات تحليل مرآة التجارة في مَبني.",
    ingestion_status: "scrape_needed",
    planned_phase: 2,
  },
  {
    id: "bse",
    name_en: "Beirut Stock Exchange (BSE)",
    name_ar: "بورصة بيروت",
    publisher_en: "Beirut Stock Exchange",
    publisher_ar: "بورصة بيروت",
    tier: "T2",
    trust_label_default: "official",
    url: "https://www.bse.com.lb",
    license: "Public market data.",
    cadence_en: "Daily during trading days.",
    cadence_ar: "يومية في أيام التداول.",
    ingest_method_en:
      "Phase-2 build: daily closing prices and volumes, including Solidere shares.",
    ingest_method_ar:
      "في المرحلة الثانية: أسعار الإقفال والأحجام اليومية، بما فيها أسهم سوليدير.",
    ingestion_status: "scrape_needed",
    planned_phase: 2,
  },
  {
    id: "port-of-beirut",
    name_en: "Port of Beirut",
    name_ar: "مرفأ بيروت",
    publisher_en: "Port of Beirut Authority",
    publisher_ar: "إدارة مرفأ بيروت",
    tier: "T2",
    trust_label_default: "official",
    url: "http://www.portdebeyrouth.com",
    license: "Public statistics.",
    cadence_en: "Monthly port throughput (TEU, tonnage).",
    cadence_ar: "إنتاجية المرفأ شهرياً (TEU، طن).",
    ingest_method_en:
      "Phase-2 scrape build. Throughput is a leading proxy for trade activity; used in the composite nowcast (Phase 3).",
    ingest_method_ar:
      "بناء كَشط في المرحلة الثانية. الإنتاجية مؤشر سابق للنشاط التجاري؛ تُستخدم في التنبّؤ المركَّب (المرحلة الثالثة).",
    ingestion_status: "scrape_needed",
    planned_phase: 2,
  },
  {
    id: "idal",
    name_en: "IDAL — Investment Development Authority of Lebanon",
    name_ar: "IDAL — الهيئة العامة لتشجيع الاستثمارات في لبنان",
    publisher_en: "Investment Development Authority of Lebanon",
    publisher_ar: "الهيئة العامة لتشجيع الاستثمارات في لبنان",
    tier: "T2",
    trust_label_default: "official",
    url: "https://investinlebanon.gov.lb",
    license: "Public reports.",
    cadence_en: "Periodic sector reports; annual FDI summary.",
    cadence_ar: "تقارير قطاعية دورية؛ ملخّص سنوي للاستثمار الأجنبي.",
    ingest_method_en:
      "Phase-2 build: sector-level FDI breakdowns from annual reports.",
    ingest_method_ar:
      "في المرحلة الثانية: تفاصيل الاستثمار الأجنبي حسب القطاع من التقارير السنوية.",
    ingestion_status: "pdf_ai_needed",
    planned_phase: 2,
  },
  {
    id: "byblos-bank-research",
    name_en: "Byblos Bank — Economic Research",
    name_ar: "بنك بيبلوس — قسم الأبحاث الاقتصادية",
    publisher_en: "Byblos Bank",
    publisher_ar: "بنك بيبلوس",
    tier: "T2",
    trust_label_default: "proxy",
    url: "https://www.byblosbank.com/library/research",
    license: "Publicly published; copyright Byblos.",
    cadence_en: "Weekly (Lebanon This Week, Country Risk Bulletin); quarterly (Consumer Confidence Index with AUB).",
    cadence_ar: "أسبوعية (لبنان هذا الأسبوع، نشرة المخاطر القُطرية)؛ ربعية (مؤشر ثقة المستهلك مع الجامعة الأميركية في بيروت).",
    ingest_method_en:
      "Phase-2 build: AI-assisted extraction of headline indicators (Consumer Confidence Index, sector commentary). Reviewed before publish; tagged trust='proxy'.",
    ingest_method_ar:
      "في المرحلة الثانية: استخراج مساعَد بالذكاء الاصطناعي للمؤشرات الرئيسية (مؤشر ثقة المستهلك، التعليقات القطاعية). تُراجَع قبل النشر، وتُصنَّف بـ ‘بديل’.",
    ingestion_status: "pdf_ai_needed",
    planned_phase: 2,
  },
  {
    id: "blominvest-research",
    name_en: "BLOMINVEST Bank — Economic Research",
    name_ar: "بلومنفست بنك — الأبحاث الاقتصادية",
    publisher_en: "BLOMINVEST Bank",
    publisher_ar: "بلومنفست بنك",
    tier: "T2",
    trust_label_default: "proxy",
    url: "https://blog.blominvestbank.com",
    license: "Publicly published; copyright BLOMINVEST.",
    cadence_en: "Daily market bulletin; periodic Lebanon Brief; monthly Economic Digest.",
    cadence_ar: "نشرة سوق يومية؛ ‘لبنان بإيجاز’ دورياً؛ ‘الموجز الاقتصادي’ شهرياً.",
    ingest_method_en:
      "Phase-2 build: daily indices and bank-sector aggregates from the market bulletin.",
    ingest_method_ar:
      "في المرحلة الثانية: مؤشرات يومية وإجماليات قطاع المصارف من النشرة اليومية.",
    ingestion_status: "pdf_ai_needed",
    planned_phase: 2,
  },
  {
    id: "credit-libanais-research",
    name_en: "Credit Libanais — Economic Research",
    name_ar: "بنك الاعتماد اللبناني — الأبحاث الاقتصادية",
    publisher_en: "Credit Libanais",
    publisher_ar: "بنك الاعتماد اللبناني",
    tier: "T2",
    trust_label_default: "proxy",
    url: "https://www.creditlibanais.com.lb/Content/Economics",
    license: "Publicly published; copyright Credit Libanais.",
    cadence_en: "Periodic Lebanon economic reports.",
    cadence_ar: "تقارير اقتصادية دورية عن لبنان.",
    ingest_method_en:
      "Phase-2 build: AI-assisted PDF extraction of sector commentary.",
    ingest_method_ar:
      "في المرحلة الثانية: استخراج مساعَد بالذكاء الاصطناعي للتعليقات القطاعية من ملفات PDF.",
    ingestion_status: "pdf_ai_needed",
    planned_phase: 2,
  },
  {
    id: "bankmed-research",
    name_en: "Bankmed — Lebanon Economic Report",
    name_ar: "بنك البحر المتوسط — التقرير الاقتصادي عن لبنان",
    publisher_en: "Bankmed",
    publisher_ar: "بنك البحر المتوسط",
    tier: "T2",
    trust_label_default: "proxy",
    url: "https://www.bankmed.com.lb/Library/Files/Uploaded%20files/Lebanon_Economic_Report.pdf",
    license: "Publicly published; copyright Bankmed.",
    cadence_en: "Annual flagship report; thematic notes.",
    cadence_ar: "تقرير سنوي رئيسي؛ ملاحظات موضوعية.",
    ingest_method_en:
      "Phase-2 build: annual report tables.",
    ingest_method_ar:
      "في المرحلة الثانية: جداول التقرير السنوي.",
    ingestion_status: "pdf_ai_needed",
    planned_phase: 2,
  },
  {
    id: "bank-audi-research",
    name_en: "Bank Audi — Economic Reports",
    name_ar: "بنك عوده — التقارير الاقتصادية",
    publisher_en: "Bank Audi",
    publisher_ar: "بنك عوده",
    tier: "T2",
    trust_label_default: "proxy",
    url: "https://www.bankaudi.com.lb/research",
    license: "Publicly published; copyright Bank Audi.",
    cadence_en: "Quarterly Lebanon economic review; thematic notes.",
    cadence_ar: "مراجعة فصلية للاقتصاد اللبناني؛ ملاحظات موضوعية.",
    ingest_method_en:
      "Phase-2 build: quarterly review tables.",
    ingest_method_ar:
      "في المرحلة الثانية: جداول المراجعة الفصلية.",
    ingestion_status: "pdf_ai_needed",
    planned_phase: 2,
  },
  {
    id: "cri",
    name_en: "Consultation & Research Institute (CRI) — Independent CPI",
    name_ar: "مؤسسة الاستشارات والأبحاث — الرقم القياسي المستقل لأسعار المستهلك",
    publisher_en: "Consultation & Research Institute",
    publisher_ar: "مؤسسة الاستشارات والأبحاث",
    tier: "T2",
    trust_label_default: "proxy",
    url: "https://www.crilebanon.com",
    license: "Publicly cited; copyright CRI.",
    cadence_en: "Periodic; an independent alternative to the official CPI.",
    cadence_ar: "دورية؛ بديل مستقل للرقم القياسي الرسمي.",
    ingest_method_en:
      "Phase-2 build: independent CPI series, intended for direct comparison with the CAS official CPI.",
    ingest_method_ar:
      "في المرحلة الثانية: سلسلة CPI مستقلّة، مُعَدّة للمقارنة المباشرة مع CPI الرسمي الصادر عن إدارة الإحصاء.",
    ingestion_status: "pdf_ai_needed",
    planned_phase: 2,
  },
  {
    id: "information-international",
    name_en: "Information International",
    name_ar: "المعلومات الدولية",
    publisher_en: "Information International SAL",
    publisher_ar: "المعلومات الدولية ش.م.ل",
    tier: "T2",
    trust_label_default: "reference",
    url: "https://information-international.com",
    license: "Publicly published; copyright Information International.",
    cadence_en: "Periodic research notes; The Monthly magazine.",
    cadence_ar: "ملاحظات بحثية دورية؛ مجلّة The Monthly.",
    ingest_method_en:
      "Phase-2 build: extract quantitative indicators from research notes; tagged trust='reference' unless triangulated.",
    ingest_method_ar:
      "في المرحلة الثانية: استخراج المؤشرات الكمّية من الملاحظات البحثية؛ يُصنَّف ‘مرجعي’ ما لم يُثلَّث.",
    ingestion_status: "pdf_ai_needed",
    planned_phase: 2,
  },

  // ──────────────────────────────────────────────────────────────────────
  // T3 — Manual / licensed (DEFERRED in v1; free substitutes used instead)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "sp-moodys-public-actions",
    name_en: "S&P / Moody's — Public Rating Actions",
    name_ar: "S&P و Moody's — قرارات التصنيف العلنية",
    publisher_en: "S&P Global Ratings; Moody's Investors Service",
    publisher_ar: "S&P Global Ratings و Moody's Investors Service",
    tier: "T3",
    trust_label_default: "official",
    url: "https://www.spglobal.com/ratings",
    license: "Public press releases (free); full reports paid.",
    cadence_en: "Press releases on each rating action.",
    cadence_ar: "بيانات صحفية مع كل قرار تصنيف.",
    ingest_method_en:
      "Per SPEC §4, the paid full reports are deferred. Mabii scrapes the public rating-action press releases (≈90% of the signal, free) when Phase-2 scraping ships.",
    ingest_method_ar:
      "وفق SPEC §4 تؤجَّل التقارير الكاملة المدفوعة. تكشط مَبني بيانات قرارات التصنيف العلنية (نحو 90% من الإشارة، مجاناً) عند جاهزية مرحلة الكشط الثانية.",
    ingestion_status: "deferred",
    planned_phase: 2,
  },
  {
    id: "eiu",
    name_en: "EIU — Economist Intelligence Unit",
    name_ar: "EIU — وحدة المعلومات الاقتصادية في «الإيكونوميست»",
    publisher_en: "Economist Intelligence Unit",
    publisher_ar: "وحدة المعلومات الاقتصادية في «الإيكونوميست»",
    tier: "T3",
    trust_label_default: "modeled",
    url: "https://www.eiu.com",
    license: "Subscription-only.",
    cadence_en: "Monthly country forecasts.",
    cadence_ar: "توقّعات قُطرية شهرية.",
    ingest_method_en:
      "Deferred. Mabii substitutes by generating its own forecasts from T1/T2 inputs with published method (Phase 3 derived indicators).",
    ingest_method_ar:
      "مؤجَّل. تستعيض مَبني بتوليد توقّعاتها من مدخلات T1/T2 ومنهجية منشورة (مؤشرات مشتقَّة في المرحلة الثالثة).",
    ingestion_status: "deferred",
    substitute_for_id: "world-bank-wdi",
  },
  {
    id: "fitch-solutions",
    name_en: "BMI / Fitch Solutions",
    name_ar: "BMI / Fitch Solutions",
    publisher_en: "Fitch Solutions",
    publisher_ar: "Fitch Solutions",
    tier: "T3",
    trust_label_default: "modeled",
    url: "https://www.fitchsolutions.com",
    license: "Subscription-only.",
    cadence_en: "Monthly country forecasts.",
    cadence_ar: "توقّعات قُطرية شهرية.",
    ingest_method_en:
      "Deferred. Substituted by Mabii-generated forecasts.",
    ingest_method_ar:
      "مؤجَّل. تستعيض مَبني بتوقّعاتها الخاصة.",
    ingestion_status: "deferred",
    substitute_for_id: "imf-weo",
  },
  {
    id: "oxford-economics",
    name_en: "Oxford Economics",
    name_ar: "Oxford Economics",
    publisher_en: "Oxford Economics",
    publisher_ar: "Oxford Economics",
    tier: "T3",
    trust_label_default: "modeled",
    url: "https://www.oxfordeconomics.com",
    license: "Subscription-only.",
    cadence_en: "Monthly country forecasts.",
    cadence_ar: "توقّعات قُطرية شهرية.",
    ingest_method_en:
      "Deferred. Substituted by Mabii-generated forecasts.",
    ingest_method_ar:
      "مؤجَّل. تستعيض مَبني بتوقّعاتها الخاصة.",
    ingestion_status: "deferred",
    substitute_for_id: "imf-weo",
  },
  {
    id: "iif",
    name_en: "IIF — Institute of International Finance",
    name_ar: "IIF — معهد التمويل الدولي",
    publisher_en: "Institute of International Finance",
    publisher_ar: "معهد التمويل الدولي",
    tier: "T3",
    trust_label_default: "official",
    url: "https://www.iif.com",
    license: "Member-only for full data.",
    cadence_en: "Periodic regional reports.",
    cadence_ar: "تقارير إقليمية دورية.",
    ingest_method_en:
      "Deferred. Free multilateral substitutes (ESCWA, IMF, World Bank, UNCTAD) used instead.",
    ingest_method_ar:
      "مؤجَّل. تُستعمل بدائل مجانية متعدّدة الأطراف (ESCWA و IMF و البنك الدولي و UNCTAD) بدلاً منه.",
    ingestion_status: "deferred",
    substitute_for_id: "world-bank-wdi",
  },
  {
    id: "amf",
    name_en: "Arab Monetary Fund (AMF)",
    name_ar: "صندوق النقد العربي",
    publisher_en: "Arab Monetary Fund",
    publisher_ar: "صندوق النقد العربي",
    tier: "T3",
    trust_label_default: "official",
    url: "https://www.amf.org.ae",
    license: "Mixed public + paid; some statistics free.",
    cadence_en: "Annual reports; regional statistics.",
    cadence_ar: "تقارير سنوية؛ إحصاءات إقليمية.",
    ingest_method_en:
      "Deferred for the paid portion. Free regional comparators come from ESCWA / World Bank / IMF.",
    ingest_method_ar:
      "مؤجَّل في الشقّ المدفوع. تأتي المقارنات الإقليمية المجانية من ESCWA و البنك الدولي و IMF.",
    ingestion_status: "deferred",
    substitute_for_id: "escwa",
  },
  {
    id: "eurobond-fx-live",
    name_en: "Eurobond prices + live FX feed",
    name_ar: "أسعار السندات السيادية بالعملات الأجنبية + تغذية مباشرة لأسعار الصرف",
    publisher_en: "Various market data vendors",
    publisher_ar: "بائعون متعدّدون لبيانات السوق",
    tier: "T3",
    trust_label_default: "official",
    url: "",
    license: "Paid feed.",
    cadence_en: "Intraday.",
    cadence_ar: "خلال اليوم.",
    ingest_method_en:
      "Deferred. v1 ships free indicative levels clearly labeled as indicative; a paid feed comes online only when revenue justifies (SPEC §4).",
    ingest_method_ar:
      "مؤجَّل. تنشر النسخة 1 مستوياتٍ مجانية إرشادية مع تصنيف واضح بأنها إرشادية؛ ولن تُعتمد تغذية مدفوعة إلا عند توفّر الإيرادات المُبرّرة (SPEC §4).",
    ingestion_status: "deferred",
  },

  // ──────────────────────────────────────────────────────────────────────
  // T4 — Reference / intelligence (free, often stale)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "cia-world-factbook",
    name_en: "CIA World Factbook",
    name_ar: "كتاب الحقائق العالمية (CIA)",
    publisher_en: "U.S. Central Intelligence Agency",
    publisher_ar: "وكالة المخابرات المركزية الأميركية",
    tier: "T4",
    trust_label_default: "reference",
    url: "https://www.cia.gov/the-world-factbook/countries/lebanon",
    license: "U.S. public domain.",
    cadence_en: "Updated periodically; often years behind for some series.",
    cadence_ar: "يُحدَّث دورياً؛ وقد يتأخّر سنوات في بعض السلاسل.",
    ingest_method_en:
      "Phase-2 scrape build: structural baseline (geography, government, basic demographics). Tagged trust='reference'.",
    ingest_method_ar:
      "كَشط في المرحلة الثانية: قاعدة بنيوية (جغرافيا، حكومة، ديموغرافيا أساسية). يُصنَّف ‘مرجعي’.",
    ingestion_status: "scrape_needed",
    planned_phase: 2,
  },
  {
    id: "us-state-icr",
    name_en: "US State Dept. — Investment Climate / Country Reports",
    name_ar: "وزارة الخارجية الأميركية — تقارير مناخ الاستثمار / التقارير القُطرية",
    publisher_en: "U.S. Department of State",
    publisher_ar: "وزارة الخارجية الأميركية",
    tier: "T4",
    trust_label_default: "reference",
    url: "https://www.state.gov/reports/2024-investment-climate-statements/lebanon",
    license: "U.S. public domain.",
    cadence_en: "Annual; some subreports irregular.",
    cadence_ar: "سنوية؛ بعض التقارير الفرعية غير منتظمة.",
    ingest_method_en:
      "Phase-2 scrape build: structured indicators extractable from the annual report.",
    ingest_method_ar:
      "كَشط في المرحلة الثانية: مؤشرات قابلة للاستخراج من التقرير السنوي.",
    ingestion_status: "scrape_needed",
    planned_phase: 2,
  },
  {
    id: "usaid",
    name_en: "USAID — Lebanon",
    name_ar: "USAID — لبنان",
    publisher_en: "U.S. Agency for International Development",
    publisher_ar: "الوكالة الأميركية للتنمية الدولية",
    tier: "T4",
    trust_label_default: "reference",
    url: "https://www.usaid.gov/lebanon",
    license: "U.S. public domain.",
    cadence_en: "Project-based reporting; periodic country profile.",
    cadence_ar: "تقارير قائمة على المشاريع؛ ملف قُطري دوري.",
    ingest_method_en:
      "Phase-2 scrape build for development-finance flows.",
    ingest_method_ar:
      "كَشط في المرحلة الثانية لتدفقات تمويل التنمية.",
    ingestion_status: "scrape_needed",
    planned_phase: 2,
  },
  {
    id: "library-of-congress",
    name_en: "Library of Congress — Country Studies",
    name_ar: "مكتبة الكونغرس — الدراسات القُطرية",
    publisher_en: "U.S. Library of Congress",
    publisher_ar: "مكتبة الكونغرس الأميركية",
    tier: "T4",
    trust_label_default: "reference",
    url: "https://www.loc.gov/collections/country-studies",
    license: "U.S. public domain.",
    cadence_en: "Historical / largely static.",
    cadence_ar: "تاريخية / شبه ثابتة.",
    ingest_method_en:
      "Reference only — used to source structural background, not live indicators.",
    ingest_method_ar:
      "مرجعية فقط — تُستخدم لرفد الخلفية البنيوية، لا المؤشرات الحيّة.",
    ingestion_status: "planned",
    planned_phase: 2,
  },
  {
    id: "us-treasury-ofac",
    name_en: "US Treasury — OFAC Sanctions",
    name_ar: "الخزانة الأميركية — قوائم العقوبات (OFAC)",
    publisher_en: "U.S. Department of the Treasury, Office of Foreign Assets Control",
    publisher_ar: "وزارة الخزانة الأميركية — مكتب مراقبة الأصول الأجنبية",
    tier: "T4",
    trust_label_default: "reference",
    url: "https://ofac.treasury.gov",
    license: "U.S. public domain.",
    cadence_en: "Updated on each sanction action.",
    cadence_ar: "تُحدَّث مع كل قرار عقوبات.",
    ingest_method_en:
      "Sanctions data has accountability-arm overlap; in the Data Arm, used only to surface aggregate counts (Lebanese-designated entity total over time), never individual profiles.",
    ingest_method_ar:
      "بيانات العقوبات متشابكة مع عمل ذراع المساءلة؛ في ذراع البيانات تُستخدم فقط لإظهار إجماليات مجمَّعة (عدد الكيانات اللبنانية المُدرَجة عبر الزمن)، لا الملفات الفردية.",
    ingestion_status: "planned",
    planned_phase: 3,
  },
  {
    id: "escwa",
    name_en: "UN ESCWA — Economic & Social Commission for Western Asia",
    name_ar: "الإسكوا — لجنة الأمم المتحدة الاقتصادية والاجتماعية لغربي آسيا",
    publisher_en: "United Nations ESCWA (Beirut)",
    publisher_ar: "لجنة الأمم المتحدة الاقتصادية والاجتماعية لغربي آسيا (بيروت)",
    tier: "T4",
    trust_label_default: "official",
    url: "https://www.unescwa.org",
    license: "UN open data terms.",
    cadence_en: "Annual surveys; thematic notes.",
    cadence_ar: "مسوحات سنوية؛ ملاحظات موضوعية.",
    ingest_method_en:
      "Phase-2 build: ESCWA Arab Region datasets used as regional comparators (the free substitute for AMF / IIF — SPEC §4).",
    ingest_method_ar:
      "في المرحلة الثانية: تُستخدم بيانات الإسكوا للمنطقة العربية كمقارنات إقليمية (البديل المجاني لـ AMF / IIF — SPEC §4).",
    ingestion_status: "planned",
    planned_phase: 2,
  },

  // ──────────────────────────────────────────────────────────────────────
  // T5 — Digital / social (high-frequency edge, used carefully)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "meta-ad-audience",
    name_en: "Meta — Ad Audience Insights",
    name_ar: "Meta — رؤى الجمهور الإعلاني",
    publisher_en: "Meta Platforms",
    publisher_ar: "Meta Platforms",
    tier: "T5",
    trust_label_default: "modeled",
    url: "https://www.facebook.com/business/ads-guide/audiences",
    license: "Meta Ads terms.",
    cadence_en: "Queryable on demand.",
    cadence_ar: "قابلة للاستعلام عند الطلب.",
    ingest_method_en:
      "Phase-3 build: aggregate counts by governorate × age × interest, used as a population/income proxy. Aggregates only; never individual targeting.",
    ingest_method_ar:
      "في المرحلة الثالثة: إجماليات حسب المحافظة × العمر × الاهتمام، تُستخدم كمؤشر بديل للسكان/الدخل. إجماليات فقط ولا استهداف للأفراد.",
    ingestion_status: "planned",
    planned_phase: 3,
  },
  {
    id: "google-trends",
    name_en: "Google — Ad Audience / Search Trends",
    name_ar: "Google — جمهور الإعلانات / اتجاهات البحث",
    publisher_en: "Google",
    publisher_ar: "Google",
    tier: "T5",
    trust_label_default: "modeled",
    url: "https://trends.google.com",
    license: "Google terms (non-commercial use).",
    cadence_en: "Daily.",
    cadence_ar: "يومية.",
    ingest_method_en:
      "Phase-3 build: indexed search interest for Lebanon-specific terms (FX, emigration, banking). Used as a coincident sentiment proxy.",
    ingest_method_ar:
      "في المرحلة الثالثة: مؤشّر اهتمام البحث لمصطلحات لبنانية (سعر الصرف، الهجرة، المصارف). يُستخدم كمؤشر مزامن لمعنويات السوق.",
    ingestion_status: "planned",
    planned_phase: 3,
  },
  {
    id: "gdelt",
    name_en: "GDELT — Global Events & Tone Database",
    name_ar: "GDELT — قاعدة بيانات الأحداث ونبرة الأخبار العالمية",
    publisher_en: "GDELT Project",
    publisher_ar: "مشروع GDELT",
    tier: "T5",
    trust_label_default: "modeled",
    url: "https://www.gdeltproject.org",
    license: "Free for non-commercial.",
    cadence_en: "15-minute updates.",
    cadence_ar: "تحديثات كل ربع ساعة.",
    ingest_method_en:
      "Phase-3 build: Lebanon-tagged events and news-tone aggregates as a high-frequency political-risk signal.",
    ingest_method_ar:
      "في المرحلة الثالثة: الأحداث المُصنَّفة كلبنانية وإجماليات نبرة الأخبار كمؤشر سياسي عالي التواتر.",
    ingestion_status: "planned",
    planned_phase: 3,
  },
  {
    id: "mabii-price-index",
    name_en: "Mabii — Scraped Price Index (planned)",
    name_ar: "مَبني — الرقم القياسي للأسعار المستمدّ من المصادر (مخطَّط)",
    publisher_en: "Mabii (originated)",
    publisher_ar: "مَبني (مَصدر أصلي)",
    tier: "T5",
    trust_label_default: "modeled",
    url: "",
    license: "CC-BY-4.0 once published.",
    cadence_en: "Planned: monthly.",
    cadence_ar: "مخطَّط: شهري.",
    ingest_method_en:
      "Phase-3 build: Mabii scrapes e-commerce, classifieds, fuel-station, and supermarket sources to construct an independent CPI alternative. Methodology published; sample-audited; trust='modeled'.",
    ingest_method_ar:
      "في المرحلة الثالثة: تكشط مَبني مواقع التجارة الإلكترونية والإعلانات المبوَّبة ومحطات الوقود والسوبرماركت لبناء رقم قياسي مستقلّ لأسعار المستهلك. منهجية منشورة، وتدقيق عيّنات، وتصنيف ‘نموذجي’.",
    ingestion_status: "planned",
    planned_phase: 3,
  },
  {
    id: "real-estate-portals",
    name_en: "Property / real-estate portals",
    name_ar: "بوّابات العقارات",
    publisher_en: "Various (OLX, classifieds, agency feeds)",
    publisher_ar: "متعدّدة (OLX، إعلانات مبوّبة، خلاصات وكلاء)",
    tier: "T5",
    trust_label_default: "modeled",
    url: "",
    license: "Site-specific.",
    cadence_en: "Daily.",
    cadence_ar: "يومية.",
    ingest_method_en:
      "Phase-3 build: rent and sale-price signals by neighbourhood; surfaces a property market that has no official data.",
    ingest_method_ar:
      "في المرحلة الثالثة: مؤشرات الإيجار وأسعار البيع حسب الحي؛ يُظهر سوقاً عقارياً بلا بيانات رسمية.",
    ingestion_status: "planned",
    planned_phase: 3,
  },
  {
    id: "flight-trackers",
    name_en: "Flight / aircraft trackers (MEA, RHIA)",
    name_ar: "متعقّبو الطيران (MEA، مطار بيروت)",
    publisher_en: "Various (FlightRadar24, OpenSky)",
    publisher_ar: "متعدّدون (FlightRadar24، OpenSky)",
    tier: "T5",
    trust_label_default: "modeled",
    url: "https://opensky-network.org",
    license: "Aggregator-specific; some open.",
    cadence_en: "Real-time; aggregated daily/weekly for Mabii use.",
    cadence_ar: "آنية؛ تُجمَّع يومياً/أسبوعياً لاستخدام مَبني.",
    ingest_method_en:
      "Phase-3 build: arrival counts at Beirut Rafic Hariri International as a tourism / mobility proxy.",
    ingest_method_ar:
      "في المرحلة الثالثة: عدد الواصلين عبر مطار رفيق الحريري الدولي كمؤشر سياحة وحركة.",
    ingestion_status: "planned",
    planned_phase: 3,
  },
  {
    id: "ship-trackers",
    name_en: "Ship / vessel trackers (Beirut port AIS)",
    name_ar: "متعقّبو السفن (إشارات AIS لمرفأ بيروت)",
    publisher_en: "Various (MarineTraffic, VesselFinder)",
    publisher_ar: "متعدّدون (MarineTraffic، VesselFinder)",
    tier: "T5",
    trust_label_default: "modeled",
    url: "https://www.marinetraffic.com",
    license: "Aggregator-specific.",
    cadence_en: "Real-time; aggregated to weekly call counts.",
    cadence_ar: "آنية؛ تُجمَّع إلى عدد رسوّ أسبوعي.",
    ingest_method_en:
      "Phase-3 build: independent vessel-call counts as a trade-activity proxy, cross-referenced against the Port of Beirut throughput.",
    ingest_method_ar:
      "في المرحلة الثالثة: عدد مستقل لرسوّ السفن كمؤشر للنشاط التجاري، يُقاطَع مع إنتاجية مرفأ بيروت.",
    ingestion_status: "planned",
    planned_phase: 3,
  },
];

export function getSource(id: string): Source | undefined {
  return sources.find((s) => s.id === id);
}

export function sourcesByTier(tier: string) {
  return sources.filter((s) => s.tier === tier);
}

export function liveSources() {
  return sources.filter((s) => s.ingestion_status === "live");
}
