import type { Geography } from "@/data/types";

export const geographies: Geography[] = [
  {
    id: "LBN",
    iso3: "LBN",
    name_en: "Lebanon",
    name_ar: "لبنان",
    level: "country",
  },
];

export function getGeography(id: string): Geography | undefined {
  return geographies.find((g) => g.id === id);
}
