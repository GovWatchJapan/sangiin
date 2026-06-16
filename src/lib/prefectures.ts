// Prefecture metadata + grid tilemap coordinates for Japan.
// Coordinates roughly mirror Japan's geography on a 12-col × 12-row grid.
// "hirei" is a synthetic entry for proportional representation (比例代表).

export type Prefecture = {
  slug: string;
  ja: string;     // matches sangiin "選挙区" column value
  en: string;
  region: "hokkaido" | "tohoku" | "kanto" | "chubu" | "kansai" | "chugoku" | "shikoku" | "kyushu" | "proportional";
  x: number;
  y: number;
};

export const PREFECTURES: Prefecture[] = [
  { slug: "hokkaido",  ja: "北海道", en: "Hokkaido",  region: "hokkaido", x: 10, y: 0 },
  { slug: "aomori",    ja: "青森",   en: "Aomori",    region: "tohoku",   x: 10, y: 1 },
  { slug: "akita",     ja: "秋田",   en: "Akita",     region: "tohoku",   x: 9,  y: 2 },
  { slug: "iwate",     ja: "岩手",   en: "Iwate",     region: "tohoku",   x: 10, y: 2 },
  { slug: "yamagata",  ja: "山形",   en: "Yamagata",  region: "tohoku",   x: 9,  y: 3 },
  { slug: "miyagi",    ja: "宮城",   en: "Miyagi",    region: "tohoku",   x: 10, y: 3 },
  { slug: "niigata",   ja: "新潟",   en: "Niigata",   region: "chubu",    x: 8,  y: 4 },
  { slug: "fukushima", ja: "福島",   en: "Fukushima", region: "tohoku",   x: 10, y: 4 },
  { slug: "ishikawa",  ja: "石川",   en: "Ishikawa",  region: "chubu",    x: 6,  y: 5 },
  { slug: "toyama",    ja: "富山",   en: "Toyama",    region: "chubu",    x: 7,  y: 5 },
  { slug: "gunma",     ja: "群馬",   en: "Gunma",     region: "kanto",    x: 8,  y: 5 },
  { slug: "tochigi",   ja: "栃木",   en: "Tochigi",   region: "kanto",    x: 9,  y: 5 },
  { slug: "ibaraki",   ja: "茨城",   en: "Ibaraki",   region: "kanto",    x: 10, y: 5 },
  { slug: "fukui",     ja: "福井",   en: "Fukui",     region: "chubu",    x: 5,  y: 6 },
  { slug: "gifu",      ja: "岐阜",   en: "Gifu",      region: "chubu",    x: 6,  y: 6 },
  { slug: "nagano",    ja: "長野",   en: "Nagano",    region: "chubu",    x: 7,  y: 6 },
  { slug: "saitama",   ja: "埼玉",   en: "Saitama",   region: "kanto",    x: 8,  y: 6 },
  { slug: "tokyo",     ja: "東京",   en: "Tokyo",     region: "kanto",    x: 9,  y: 6 },
  { slug: "chiba",     ja: "千葉",   en: "Chiba",     region: "kanto",    x: 10, y: 6 },
  { slug: "shimane",   ja: "島根",   en: "Shimane",   region: "chugoku",  x: 2,  y: 6 },
  { slug: "tottori",   ja: "鳥取",   en: "Tottori",   region: "chugoku",  x: 3,  y: 6 },
  { slug: "yamaguchi", ja: "山口",   en: "Yamaguchi", region: "chugoku",  x: 1,  y: 7 },
  { slug: "hiroshima", ja: "広島",   en: "Hiroshima", region: "chugoku",  x: 2,  y: 7 },
  { slug: "okayama",   ja: "岡山",   en: "Okayama",   region: "chugoku",  x: 3,  y: 7 },
  { slug: "hyogo",     ja: "兵庫",   en: "Hyogo",     region: "kansai",   x: 4,  y: 7 },
  { slug: "kyoto",     ja: "京都",   en: "Kyoto",     region: "kansai",   x: 5,  y: 7 },
  { slug: "shiga",     ja: "滋賀",   en: "Shiga",     region: "kansai",   x: 6,  y: 7 },
  { slug: "aichi",     ja: "愛知",   en: "Aichi",     region: "chubu",    x: 7,  y: 7 },
  { slug: "yamanashi", ja: "山梨",   en: "Yamanashi", region: "chubu",    x: 8,  y: 7 },
  { slug: "shizuoka",  ja: "静岡",   en: "Shizuoka",  region: "chubu",    x: 9,  y: 7 },
  { slug: "kanagawa",  ja: "神奈川", en: "Kanagawa",  region: "kanto",    x: 10, y: 7 },
  { slug: "ehime",     ja: "愛媛",   en: "Ehime",     region: "shikoku",  x: 2,  y: 8 },
  { slug: "kagawa",    ja: "香川",   en: "Kagawa",    region: "shikoku",  x: 3,  y: 8 },
  { slug: "tokushima", ja: "徳島",   en: "Tokushima", region: "shikoku",  x: 4,  y: 9 },
  { slug: "wakayama",  ja: "和歌山", en: "Wakayama",  region: "kansai",   x: 5,  y: 8 },
  { slug: "nara",      ja: "奈良",   en: "Nara",      region: "kansai",   x: 6,  y: 8 },
  { slug: "mie",       ja: "三重",   en: "Mie",       region: "kansai",   x: 7,  y: 8 },
  { slug: "osaka",     ja: "大阪",   en: "Osaka",     region: "kansai",   x: 4,  y: 9 },
  { slug: "kochi",     ja: "高知",   en: "Kochi",     region: "shikoku",  x: 3,  y: 9 },
  { slug: "fukuoka",   ja: "福岡",   en: "Fukuoka",   region: "kyushu",   x: 1,  y: 9 },
  { slug: "oita",      ja: "大分",   en: "Oita",      region: "kyushu",   x: 2,  y: 9 },
  { slug: "saga",      ja: "佐賀",   en: "Saga",      region: "kyushu",   x: 0,  y: 9 },
  { slug: "nagasaki",  ja: "長崎",   en: "Nagasaki",  region: "kyushu",   x: 0,  y: 10 },
  { slug: "kumamoto",  ja: "熊本",   en: "Kumamoto",  region: "kyushu",   x: 1,  y: 10 },
  { slug: "miyazaki",  ja: "宮崎",   en: "Miyazaki",  region: "kyushu",   x: 2,  y: 10 },
  { slug: "kagoshima", ja: "鹿児島", en: "Kagoshima", region: "kyushu",   x: 1,  y: 11 },
  { slug: "okinawa",   ja: "沖縄",   en: "Okinawa",   region: "kyushu",   x: 4,  y: 11 },
  { slug: "hirei",     ja: "比例",   en: "Proportional", region: "proportional", x: 0,  y: 0 },
];

export const PREF_BY_SLUG: Record<string, Prefecture> = Object.fromEntries(PREFECTURES.map(p => [p.slug, p]));
export const PREF_BY_JA: Record<string, Prefecture> = Object.fromEntries(PREFECTURES.map(p => [p.ja, p]));

export const REGION_COLOR: Record<Prefecture["region"], string> = {
  hokkaido: "oklch(0.78 0.08 235)",
  tohoku:   "oklch(0.78 0.08 200)",
  kanto:    "oklch(0.78 0.10 25)",
  chubu:    "oklch(0.82 0.10 90)",
  kansai:   "oklch(0.80 0.12 50)",
  chugoku:  "oklch(0.80 0.09 140)",
  shikoku:  "oklch(0.82 0.10 170)",
  kyushu:   "oklch(0.78 0.10 320)",
  proportional: "oklch(0.65 0.04 260)",
};
