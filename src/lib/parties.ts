// Party / caucus short labels used by sangiin, with EN translations and brand colors.
export const PARTY: Record<string, { en: string; color: string }> = {
  "自民":   { en: "LDP",         color: "oklch(0.55 0.16 25)" },
  "立憲":   { en: "CDP",         color: "oklch(0.55 0.15 245)" },
  "公明":   { en: "Komeito",     color: "oklch(0.6 0.14 145)" },
  "維新":   { en: "Ishin",       color: "oklch(0.6 0.14 85)" },
  "民主":   { en: "DPP",         color: "oklch(0.62 0.15 65)" },
  "共産":   { en: "JCP",         color: "oklch(0.5 0.2 27)" },
  "れ新":   { en: "Reiwa",       color: "oklch(0.55 0.18 330)" },
  "参政":   { en: "Sanseito",    color: "oklch(0.55 0.18 300)" },
  "社民":   { en: "SDP",         color: "oklch(0.58 0.15 15)" },
  "N党":    { en: "NHK Party",   color: "oklch(0.55 0.14 50)" },
  "みら":   { en: "Mirai",       color: "oklch(0.55 0.14 200)" },
  "無所属": { en: "Independent", color: "oklch(0.55 0.02 260)" },
};

export const partyLabel = (ja: string, lang: "ja" | "en") => {
  if (lang === "ja") return ja;
  return PARTY[ja]?.en ?? ja;
};
export const partyColor = (ja: string) => PARTY[ja]?.color ?? "oklch(0.55 0.02 260)";
