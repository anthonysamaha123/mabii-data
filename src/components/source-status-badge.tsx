import type { IngestionStatus } from "@/data/types";

const labelByStatus: Record<IngestionStatus, { en: string; ar: string }> = {
  live: { en: "Live", ar: "حيّ" },
  scrape_needed: { en: "Scrape needed", ar: "كَشط مطلوب" },
  pdf_ai_needed: { en: "PDF · AI extraction", ar: "PDF · استخراج بالذكاء" },
  geospatial_needed: { en: "Geospatial · GDAL", ar: "جغرافي · GDAL" },
  partnership_needed: { en: "Partnership", ar: "شراكة مطلوبة" },
  deferred: { en: "Deferred", ar: "مؤجَّل" },
  planned: { en: "Planned", ar: "مخطَّط" },
};

const styleByStatus: Record<IngestionStatus, { color: string; bg: string }> = {
  live: { color: "var(--color-flag-ok)", bg: "#e5f1e8" },
  scrape_needed: { color: "var(--color-flag-low-conf)", bg: "#f5e8cc" },
  pdf_ai_needed: { color: "var(--color-flag-low-conf)", bg: "#f5e8cc" },
  geospatial_needed: { color: "var(--color-ink-soft)", bg: "var(--color-rule-soft)" },
  partnership_needed: { color: "var(--color-ink-soft)", bg: "var(--color-rule-soft)" },
  deferred: { color: "var(--color-ink-mute)", bg: "var(--color-rule-soft)" },
  planned: { color: "var(--color-ink-soft)", bg: "var(--color-rule-soft)" },
};

export function SourceStatusBadge({
  status,
  lang,
}: {
  status: IngestionStatus;
  lang: "en" | "ar";
}) {
  const s = styleByStatus[status];
  const label = labelByStatus[status][lang];
  return (
    <span
      className="inline-block whitespace-nowrap rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-wider"
      style={{
        background: s.bg,
        color: s.color,
        fontFamily: "var(--font-sans)",
        letterSpacing: "0.05em",
      }}
    >
      {label}
    </span>
  );
}
