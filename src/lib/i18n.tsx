import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ja" | "en";

type Dict = Record<string, { ja: string; en: string }>;

export const T: Dict = {
  site_title: { ja: "参議院・国会ウォッチ", en: "Diet Watch Japan" },
  site_tag: { ja: "参議院議員の投票行動をトラッキング", en: "Tracking how Japan's councillors vote" },
  pick_district: { ja: "選挙区を選んでください", en: "Select a district" },
  proportional: { ja: "比例代表", en: "Proportional" },
  members: { ja: "議員", en: "Members" },
  party: { ja: "会派", en: "Party / Caucus" },
  district: { ja: "選挙区", en: "District" },
  term_end: { ja: "任期満了", en: "Term ends" },
  voting_record: { ja: "投票記録", en: "Voting record" },
  back: { ja: "戻る", en: "Back" },
  source: { ja: "データ元", en: "Source" },
  yea: { ja: "賛成", en: "Yea" },
  nay: { ja: "反対", en: "Nay" },
  abstain: { ja: "投票なし", en: "No vote" },
  absent: { ja: "欠席", en: "Absent" },
  standing: { ja: "起立採決", en: "Standing vote" },
  bill: { ja: "議案名", en: "Bill" },
  date: { ja: "投票日", en: "Vote date" },
  vote: { ja: "投票", en: "Vote" },
  loading: { ja: "読み込み中…", en: "Loading…" },
  about: { ja: "このサイトについて", en: "About" },
  about_body: {
    ja: "本サイトは市民活動として、参議院公式サイトから取得した議員情報と投票記録を可視化することを目的としています。",
    en: "A civic-tech project visualizing voting records of Japan's House of Councillors.",
  },
  view_official: { ja: "参議院公式プロフィール", en: "Official profile" },
  no_members: { ja: "該当する議員が見つかりません。", en: "No members found." },
  total_members: { ja: "議員数", en: "Members" },
  parties_breakdown: { ja: "会派別内訳", en: "By party" },
  data_note: {
    ja: "※ データは参議院公式ウェブサイトから抽出されたデータベース(GovWatchJapan/congressdata)に基づきます。",
    en: "Note: Data is from our database extracted from sangiin.go.jp (GovWatchJapan/congressdata).",
  },
  search_placeholder: { ja: "議員名で検索…", en: "Search by name…" },
  absence_rate: { ja: "欠席率", en: "Absence rate" },
  faction_changed: { ja: "会派変更あり", en: "Faction changed" },
  legislation: { ja: "議案", en: "Bill" },
  session_num: { ja: "国会回次", en: "Diet session" },
  view_on_sangiin: { ja: "参議院公式ページで見る", en: "View on Sangiin.go.jp" },
  bill_not_found: { ja: "議案が見つかりません。", en: "Bill not found." },
  vote_breakdown: { ja: "投票内訳", en: "Vote breakdown" },
  all_votes: { ja: "議員別投票", en: "All member votes" },
  no_bills: { ja: "該当する議案はありません。", en: "No bills found." },
};

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: keyof typeof T) => string }>({
  lang: "ja",
  setLang: () => {},
  t: (k) => T[k]?.ja ?? String(k),
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ja");
  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("lang") as Lang | null) : null;
    if (stored === "ja" || stored === "en") setLangState(stored);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };
  const t = (k: keyof typeof T) => T[k]?.[lang] ?? String(k);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
