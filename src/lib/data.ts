// Static data layer. Loads bundled CSVs (in /public/data) and exposes
// memberships, bills, and votes derived from them. No server code.
import Papa from "papaparse";

export type VoteChoice = "yea" | "nay" | "abstain" | "absent" | "standing";

export type Member = {
  id: string;            // stable id (profile number, or hashed name fallback)
  nameJa: string;
  partyJa: string;
  districtJa: string;
  termEnd: string;
  profileUrl: string;
  factionChanged: boolean;
  absenceRate: string;   // e.g. "0.0%"
};

export type Bill = {
  id: string;            // e.g. "217-0620-v001"
  session: string;       // e.g. "217"
  date: string;          // Japanese-era string e.g. "令和07年6月20日"
  dateKey: string;       // YYYYMMDD numeric for sorting (best-effort)
  title: string;
  sangiinUrl: string;
  committeeSlug?: string; // resolved via bill_committees.json when available
};

/** Normalize a bill title so titles from different sangiin pages can be matched. */
export function normalizeBillTitle(s: string): string {
  return (s ?? "")
    .replace(/\u3000/g, " ")
    .replace(/^日程第[０-９0-9〇一二三四五六七八九十百千]+\s*/, "")
    .replace(/（[^（）]*）\s*$/g, "")
    .replace(/\([^()]*\)\s*$/g, "")
    .replace(/\s+/g, "")
    .trim();
}

export type Vote = {
  billId: string;
  memberId: string;
  choice: VoteChoice;
};

export type Dataset = {
  members: Member[];
  bills: Bill[];
  votes: Vote[];
  /** memberId -> billId -> choice */
  voteIndex: Map<string, Map<string, VoteChoice>>;
  /** session -> Bill[] (sorted by date desc) */
  billsBySession: Map<string, Bill[]>;
  sessions: string[]; // sorted desc
};

// Sessions whose CSVs are bundled. To add more, drop a file in
// public/data/votes_{session}.csv and append the number here.
export const AVAILABLE_SESSIONS = ["221","219", "217", "214"] as const;

function csvUrl(session: string): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return `${base}/data/votes_${session}.csv`;
}

function choiceFromJa(s: string): VoteChoice {
  const v = (s ?? "").trim();
  if (v === "賛成") return "yea";
  if (v === "反対") return "nay";
  if (v === "投票なし" || v === "棄権") return "abstain";
  if (v === "欠席") return "absent";
  // Blank cell = standing vote (起立採決) per spec
  return "standing";
}

function memberIdFromProfileUrl(url: string, fallbackName: string): string {
  const m = url.match(/profile\/(\d+)\.htm/);
  if (m) return m[1];
  // Stable hash fallback for members with no profile URL (older sessions)
  let h = 0;
  for (let i = 0; i < fallbackName.length; i++) {
    h = (h * 31 + fallbackName.charCodeAt(i)) | 0;
  }
  return `n${(h >>> 0).toString(36)}`;
}

const JP_ERA_OFFSET: Record<string, number> = { 令和: 2018, 平成: 1988, 昭和: 1925 };
function eraToDateKey(s: string): string {
  if (!s) return "";
  const m = s.match(/^(令和|平成|昭和)(\d+)年(\d+)月(\d+)日/);
  if (!m) return "";
  const [, era, y, mo, d] = m;
  const year = JP_ERA_OFFSET[era] + parseInt(y, 10);
  return `${year}${mo.padStart(2, "0")}${d.padStart(2, "0")}`;
}

async function fetchCsvRows(session: string): Promise<string[][]> {
  const res = await fetch(csvUrl(session));
  if (!res.ok) throw new Error(`Failed to load votes_${session}.csv (${res.status})`);
  const text = (await res.text()).replace(/^\uFEFF/, "");
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: false });
  return parsed.data as string[][];
}

type SessionParse = {
  bills: Bill[];
  members: Member[];
  votes: Vote[];
};

function parseSession(session: string, rows: string[][]): SessionParse {
  if (rows.length < 5) return { bills: [], members: [], votes: [] };
  const idRow = rows[0];
  const titleRow = rows[1];
  const dateRow = rows[2];
  const headerRow = rows[3];

  // Bill columns start at index 7 (cols 1-7 are member metadata)
  const bills: Bill[] = [];
  for (let c = 7; c < idRow.length; c++) {
    const id = (idRow[c] ?? "").trim();
    if (!id) continue;
    const date = (dateRow[c] ?? "").trim();
    bills.push({
      id,
      session,
      date,
      dateKey: eraToDateKey(date),
      title: (titleRow[c] ?? "").trim(),
      sangiinUrl: (headerRow[c] ?? "").trim(),
    });
  }

  const members: Member[] = [];
  const votes: Vote[] = [];
  for (let r = 4; r < rows.length; r++) {
    const row = rows[r];
    if (!row || !row[0]?.trim()) continue;
    const nameJa = row[0].trim();
    const partyJa = (row[1] ?? "").trim();
    const districtJa = (row[2] ?? "").trim();
    const termEnd = (row[3] ?? "").trim();
    const profileUrl = (row[4] ?? "").trim();
    const factionChanged = (row[5] ?? "").trim().toLowerCase() === "true";
    const absenceRate = (row[6] ?? "").trim();
    const id = memberIdFromProfileUrl(profileUrl, nameJa);
    members.push({ id, nameJa, partyJa, districtJa, termEnd, profileUrl, factionChanged, absenceRate });
    for (let c = 7; c < row.length && c < idRow.length; c++) {
      const billId = (idRow[c] ?? "").trim();
      if (!billId) continue;
      votes.push({ billId, memberId: id, choice: choiceFromJa(row[c] ?? "") });
    }
  }

  return { bills, members, votes };
}

let datasetPromise: Promise<Dataset> | null = null;

export function loadDataset(): Promise<Dataset> {
  if (datasetPromise) return datasetPromise;
  datasetPromise = (async () => {
    const results = await Promise.all(
      AVAILABLE_SESSIONS.map(async (s) => {
        try {
          const rows = await fetchCsvRows(s);
          return parseSession(s, rows);
        } catch (e) {
          console.error(`Failed loading session ${s}`, e);
          return { bills: [], members: [], votes: [] } as SessionParse;
        }
      }),
    );

    // Merge bills (unique by id) and votes
    const billMap = new Map<string, Bill>();
    const allVotes: Vote[] = [];
    for (const r of results) {
      for (const b of r.bills) if (!billMap.has(b.id)) billMap.set(b.id, b);
      allVotes.push(...r.votes);
    }

    // Only show members from the latest session (largest session number).
    // Older session CSVs are still parsed so historical votes/bills are
    // available, but the canonical roster is the most recent one.
    const latestIdx = AVAILABLE_SESSIONS
      .map((s, i) => ({ s: parseInt(s, 10), i }))
      .sort((a, b) => b.s - a.s)[0]?.i ?? 0;
    const memberMap = new Map<string, Member>();
    for (const m of results[latestIdx]?.members ?? []) {
      memberMap.set(m.id, m);
    }


    const bills = Array.from(billMap.values()).sort((a, b) =>
      (b.dateKey || b.id).localeCompare(a.dateKey || a.id),
    );
    const members = Array.from(memberMap.values()).sort((a, b) =>
      a.nameJa.localeCompare(b.nameJa, "ja"),
    );

    const voteIndex = new Map<string, Map<string, VoteChoice>>();
    for (const v of allVotes) {
      let inner = voteIndex.get(v.memberId);
      if (!inner) { inner = new Map(); voteIndex.set(v.memberId, inner); }
      inner.set(v.billId, v.choice);
    }

    const billsBySession = new Map<string, Bill[]>();
    for (const b of bills) {
      const arr = billsBySession.get(b.session) ?? [];
      arr.push(b);
      billsBySession.set(b.session, arr);
    }

    const sessions = Array.from(billsBySession.keys()).sort((a, b) => b.localeCompare(a));

    return { members, bills, votes: allVotes, voteIndex, billsBySession, sessions };
  })();
  return datasetPromise;
}

export function getBill(ds: Dataset, id: string): Bill | undefined {
  return ds.bills.find((b) => b.id === id);
}

export function votesForBill(ds: Dataset, billId: string): Array<{ member: Member; choice: VoteChoice }> {
  const out: Array<{ member: Member; choice: VoteChoice }> = [];
  for (const m of ds.members) {
    const c = ds.voteIndex.get(m.id)?.get(billId);
    if (c) out.push({ member: m, choice: c });
  }
  return out;
}
