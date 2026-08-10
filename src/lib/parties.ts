// Party / caucus labels used by sangiin, with EN translations and brand colors.
// Keys are the FULL Japanese names as they appear in the CSV's column 2.
// Short labels (略称) follow the official sangiin reference:
// https://www.sangiin.go.jp/japanese/joho1/kousei/giin/kaiha/kaiha221.htm
export const PARTY: Record<string, { short: string; en: string; color: string }> = {
  "自由民主党":                  { short: "自民",   en: "LDP",          color: "rgb(210, 35, 25)" },
  "自由民主党・無所属の会":      { short: "自民",   en: "LDP",          color: "rgb(210, 35, 25)" },
  "立憲民主・社民・無所属":      { short: "立民",   en: "CDP/SDP",      color: "rgb(35, 145, 255)" },
  "立憲民主・無所属":            { short: "立民",   en: "CDP",          color: "rgb(35, 145, 255)" },
  "国民民主党・新緑風会":        { short: "国民",   en: "DPP",          color: "rgb(0, 16, 165)" },
  "公明党":                      { short: "公明",   en: "Komeito",      color: "rgb(235, 97, 190)" },
  "日本維新の会":                { short: "維新",   en: "Ishin",        color: "rgb(225, 154, 0)" },
  "参政党":                      { short: "参政",   en: "Sanseito",     color: "rgb(235, 100, 10)" },
  "日本共産党":                  { short: "共産",   en: "JCP",          color: "rgb(110, 65, 225)" },
  "れいわ新選組":                { short: "れいわ",   en: "Reiwa",        color: "rgb(240, 160, 167)" },
  "日本保守党":                  { short: "保守",   en: "Conservative", color: "rgb(150, 150, 240)" },
  "沖縄の風":                    { short: "沖縄",   en: "Okinawa Kaze", color: "rgb(247, 216, 29)" },
  "チームみらい・無所属の会":    { short: "みらい",   en: "Mirai",        color: "rgb(170, 135, 40)" },
  "社会民主党":                  { short: "社民",   en: "SDP",          color: "rgb(5, 85, 90)" },
  "各派に属しない議員":          { short: "無所属・他", en: "Independent",  color: "rgb(76, 106, 136)" },
  "無所属":                      { short: "無所属・他", en: "Independent",  color: "rgb(76, 106, 136)" },
};

export const partyLabel = (ja: string, lang: "ja" | "en") => {
  if (lang === "ja") return PARTY[ja]?.short ?? ja;
  return PARTY[ja]?.en ?? ja;
};
export const partyColor = (ja: string) => PARTY[ja]?.color ?? "oklch(0.55 0.02 260)";
