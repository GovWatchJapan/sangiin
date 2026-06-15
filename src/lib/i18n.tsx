import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ja" | "en";

type Dict = Record<string, { ja: string; en: string }>;

export const T: Dict = {
  site_title: { ja: "国会ウォッチ", en: "Diet Watch Japan" },
  site_tag: { ja: "参議院議員の投票行動を市民の手に", en: "Tracking how Japan's councillors vote" },
  pick_district: { ja: "選挙区を選んでください", en: "Select a district" },
  proportional: { ja: "比例代表", en: "Proportional" },
  members: { ja: "議員", en: "Members" },
  party: { ja: "会派", en: "Party / Caucus" },
  district: { ja: "選挙区", en: "District" },
  term_end: { ja: "任期満了", en: "Term ends" },
  voting_record: { ja: "投票記録", en: "Voting record" },
  back: { ja: "戻る", en: "Back" },
  source: { ja: "出典", en: "Source" },
  yea: { ja: "賛成", en: "Yea" },
  nay: { ja: "反対", en: "Nay" },
  abstain: { ja: "棄権", en: "Abstain" },
  absent: { ja: "欠席", en: "Absent" },
  bill: { ja: "議案名", en: "Bill" },
  date: { ja: "日付", en: "Date" },
  vote: { ja: "投票", en: "Vote" },
  loading: { ja: "読み込み中…", en: "Loading…" },
  about: { ja: "このサイトについて", en: "About" },
  about_body: {
    ja: "本サイトは市民活動として、参議院公式サイトから議員情報を取得し、各議員の投票行動を可視化することを目的としています。データは参議院公式ウェブサイトに基づきます。",
    en: "A civic-tech project visualizing the voting behavior of members of Japan's House of Councillors. Member data is sourced from the official Sangiin website.",
  },
  view_official: { ja: "参議院公式プロフィール", en: "Official profile" },
  no_members: { ja: "該当する議員が見つかりません。", en: "No members found." },
  total_members: { ja: "議員数", en: "Members" },
  parties_breakdown: { ja: "会派別内訳", en: "By party" },
  data_note: {
    ja: "※ 投票記録は現在サンプルデータです。実際の本会議投票は今後追加予定です。",
    en: "Note: Voting records shown are illustrative samples. Real plenary vote data will be added.",
  },
  search_placeholder: { ja: "議員名で検索…", en: "Search by name…" },
  committees: { ja: "所属委員会・役職", en: "Committee membership" },
  sponsored_bills: { ja: "発議した法律案", en: "Bills sponsored" },
  career: { ja: "経歴", en: "Career" },
  no_committees: { ja: "委員会情報は取得できませんでした。", en: "No committee data available." },
  no_sponsored: { ja: "現国会で発議者となった法律案はありません。", en: "No bills sponsored in the current session." },
  legislation: { ja: "法律案", en: "Legislation" },
  legislation_id: { ja: "議案ID", en: "Bill ID" },
  session_num: { ja: "国会回次", en: "Diet session" },
  bill_number: { ja: "提出番号", en: "Submission no." },
  kind: { ja: "種別", en: "Type" },
  sponsor: { ja: "発議者", en: "Sponsor" },
  submitted: { ja: "提出日", en: "Submitted" },
  status: { ja: "結果", en: "Result" },
  summary_pdf: { ja: "議案要旨（PDF）", en: "Bill summary (PDF)" },
  fulltext_pdf: { ja: "提出法律案（PDF）", en: "Full bill text (PDF)" },
  view_on_sangiin: { ja: "参議院公式ページで見る", en: "View on Sangiin.go.jp" },
  bill_not_found: { ja: "法律案が見つかりません。", en: "Bill not found." },
  bill_progress: { ja: "審議経過", en: "Progress" },
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
