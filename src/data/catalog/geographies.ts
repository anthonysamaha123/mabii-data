import type { Geography } from "@/data/types";

export const geographies: Geography[] = [
  { id: "LBN", iso3: "LBN", name_en: "Lebanon", name_ar: "لبنان", level: "country" },
  // ── Governorates (محافظات) — 8 total ────────────────────────────────
  { id: "LBN-BA", name_en: "Beirut", name_ar: "بيروت", level: "governorate", parent_id: "LBN" },
  { id: "LBN-ML", name_en: "Mount Lebanon", name_ar: "جبل لبنان", level: "governorate", parent_id: "LBN" },
  { id: "LBN-NO", name_en: "North", name_ar: "الشمال", level: "governorate", parent_id: "LBN" },
  { id: "LBN-AK", name_en: "Akkar", name_ar: "عكار", level: "governorate", parent_id: "LBN" },
  { id: "LBN-BK", name_en: "Bekaa", name_ar: "البقاع", level: "governorate", parent_id: "LBN" },
  { id: "LBN-BH", name_en: "Baalbek-Hermel", name_ar: "بعلبك-الهرمل", level: "governorate", parent_id: "LBN" },
  { id: "LBN-SO", name_en: "South", name_ar: "الجنوب", level: "governorate", parent_id: "LBN" },
  { id: "LBN-NA", name_en: "Nabatieh", name_ar: "النبطية", level: "governorate", parent_id: "LBN" },
];

export function getGeography(id: string): Geography | undefined {
  return geographies.find((g) => g.id === id);
}

export const governorates = geographies.filter((g) => g.level === "governorate");
