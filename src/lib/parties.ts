// Party / caucus labels used by sangiin, with EN translations and brand colors.
// Keys are the FULL Japanese names as they appear in the CSV's column 2.
// Short labels (略称) follow the official sangiin reference:
// https://www.sangiin.go.jp/japanese/joho1/kousei/giin/kaiha/kaiha221.htm
export const PARTY: Record<string, { short: string; en: string; color: string }> = {
  "自由民主党":                  { short: "自民",   en: "LDP",          color: "oklch(0.55 0.16 25)" },
  "自由民主党・無所属の会":      { short: "自民",   en: "LDP",          color: "oklch(0.55 0.16 25)" },
  "立憲民主・社民・無所属":      { short: "立憲",   en: "CDP/SDP",      color: "oklch(0.55 0.15 245)" },
  "立憲民主・無所属":            { short: "立憲",   en: "CDP",          color: "oklch(0.55 0.15 245)" },
  "国民民主党・新緑風会":        { short: "民主",   en: "DPP",          color: "oklch(0.62 0.15 65)" },
  "公明党":                      { short: "公明",   en: "Komeito",      color: "oklch(0.6 0.14 145)" },
  "日本維新の会":                { short: "維新",   en: "Ishin",        color: "oklch(0.6 0.14 85)" },
  "参政党":                      { short: "参政",   en: "Sanseito",     color: "oklch(0.55 0.18 300)" },
  "日本共産党":                  { short: "共産",   en: "JCP",          color: "oklch(0.5 0.2 27)" },
  "れいわ新選組":                { short: "れ新",   en: "Reiwa",        color: "oklch(0.55 0.18 330)" },
  "日本保守党":                  { short: "保守",   en: "Conservative", color: "oklch(0.5 0.14 260)" },
  "沖縄の風":                    { short: "沖縄",   en: "Okinawa Kaze", color: "oklch(0.6 0.14 190)" },
  "チームみらい・無所属の会":    { short: "みら",   en: "Mirai",        color: "oklch(0.55 0.14 200)" },
  "社会民主党":                  { short: "社民",   en: "SDP",          color: "oklch(0.58 0.15 15)" },
  "各派に属しない議員":          { short: "無所属", en: "Independent",  color: "oklch(0.55 0.02 260)" },
  "無所属":                      { short: "無所属", en: "Independent",  color: "oklch(0.55 0.02 260)" },
};

export const partyLabel = (ja: string, lang: "ja" | "en") => {
  if (lang === "ja") return PARTY[ja]?.short ?? ja;
  return PARTY[ja]?.en ?? ja;
};
export const partyColor = (ja: string) => PARTY[ja]?.color ?? "oklch(0.55 0.02 260)";
