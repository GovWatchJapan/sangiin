// Deterministic illustrative voting records per member. Will be replaced when
// real plenary vote data is wired in.
import type { Member } from "./sangiin.functions";

export type VoteChoice = "yea" | "nay" | "abstain" | "absent";
export type VoteRecord = {
  billId: string;
  billJa: string;
  billEn: string;
  date: string;        // ISO
  choice: VoteChoice;
};

const SAMPLE_BILLS: { billJa: string; billEn: string; date: string }[] = [
  { billJa: "令和7年度予算案",                        billEn: "FY2025 General Budget",                       date: "2025-03-28" },
  { billJa: "防衛費財源確保法案",                     billEn: "Defense Funding Source Act",                  date: "2025-04-12" },
  { billJa: "こども・子育て支援法改正案",             billEn: "Child & Childcare Support Act Amendment",     date: "2025-05-20" },
  { billJa: "再生可能エネルギー特別措置法改正案",     billEn: "Renewable Energy Special Measures Amendment", date: "2025-06-05" },
  { billJa: "デジタル社会形成基本法改正案",           billEn: "Digital Society Basic Act Amendment",         date: "2024-11-18" },
  { billJa: "経済安全保障推進法改正案",               billEn: "Economic Security Promotion Act Amendment",   date: "2024-12-04" },
  { billJa: "労働基準法改正案",                       billEn: "Labor Standards Act Amendment",               date: "2025-02-14" },
  { billJa: "出入国管理及び難民認定法改正案",         billEn: "Immigration Control & Refugee Act Amendment", date: "2024-10-22" },
  { billJa: "選択的夫婦別姓関連法案",                 billEn: "Selective Separate Surnames Bill",            date: "2025-05-29" },
  { billJa: "原子力基本法改正案",                     billEn: "Atomic Energy Basic Act Amendment",           date: "2024-09-12" },
];

// Deterministic hash from member id
function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Each party has a base inclination for/against each bill index — members of
// that party tend to vote the same, with occasional defection.
const PARTY_BIAS: Record<string, VoteChoice[]> = {
  "自民":   ["yea","yea","yea","abstain","yea","yea","abstain","yea","nay","yea"],
  "公明":   ["yea","yea","yea","yea","yea","yea","yea","abstain","yea","abstain"],
  "立憲":   ["nay","nay","yea","yea","abstain","nay","yea","nay","yea","nay"],
  "維新":   ["abstain","yea","yea","yea","yea","yea","yea","abstain","yea","yea"],
  "民主":   ["abstain","yea","yea","yea","yea","yea","yea","abstain","yea","abstain"],
  "共産":   ["nay","nay","yea","yea","nay","nay","yea","nay","yea","nay"],
  "れ新":   ["nay","nay","yea","yea","nay","nay","yea","nay","yea","nay"],
  "参政":   ["nay","yea","nay","abstain","nay","yea","nay","yea","nay","nay"],
  "社民":   ["nay","nay","yea","yea","nay","nay","yea","nay","yea","nay"],
  "みら":   ["abstain","abstain","yea","yea","yea","abstain","yea","abstain","yea","abstain"],
  "N党":    ["abstain","abstain","abstain","abstain","abstain","abstain","abstain","abstain","abstain","abstain"],
  "無所属": ["abstain","abstain","yea","yea","abstain","abstain","yea","abstain","yea","abstain"],
};

export function votesFor(member: Pick<Member, "id" | "partyJa">): VoteRecord[] {
  const bias = PARTY_BIAS[member.partyJa] ?? PARTY_BIAS["無所属"];
  const h = hash(member.id);
  return SAMPLE_BILLS.map((b, i) => {
    const base = bias[i] ?? "abstain";
    // 12% chance of defection -> swap to opposite, 8% chance absent
    const r = ((h >> i) & 0xff) / 255;
    let choice: VoteChoice = base;
    if (r < 0.08) choice = "absent";
    else if (r < 0.20) choice = base === "yea" ? "nay" : base === "nay" ? "yea" : "abstain";
    return { billId: `b${i + 1}`, billJa: b.billJa, billEn: b.billEn, date: b.date, choice };
  });
}
