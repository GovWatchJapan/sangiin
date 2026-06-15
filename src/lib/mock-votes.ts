// Deterministic illustrative voting choices per member, applied to a real
// list of bills fetched from sangiin.go.jp. Will be replaced when real
// plenary vote data is wired in.
import type { Member } from "./sangiin.functions";

export type VoteChoice = "yea" | "nay" | "abstain" | "absent";

// Deterministic hash from member id
function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Each party has a base inclination per bill index — members of that party
// tend to vote the same way, with occasional defection.
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

export function choiceFor(member: Pick<Member, "id" | "partyJa">, index: number): VoteChoice {
  const bias = PARTY_BIAS[member.partyJa] ?? PARTY_BIAS["無所属"];
  const base = bias[index % bias.length] ?? "abstain";
  const h = hash(member.id);
  const r = ((h >> index) & 0xff) / 255;
  if (r < 0.08) return "absent";
  if (r < 0.20) return base === "yea" ? "nay" : base === "nay" ? "yea" : "abstain";
  return base;
}
