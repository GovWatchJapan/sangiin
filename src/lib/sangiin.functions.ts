import { createServerFn } from "@tanstack/react-start";

export type Member = {
  id: string;            // profile id e.g. "7016004"
  nameJa: string;        // 議員名 (漢字)
  nameKana: string;      // ふりがな
  partyJa: string;       // 会派
  districtJa: string;    // 選挙区 (e.g. "東京", "比例")
  termEnd: string;       // 任期満了 (Japanese era string)
  profileUrl: string;
};

export type MemberProfile = {
  committees: string[];           // e.g. ["外交防衛委員会（理）", "行政監視委員会"]
  electionInfo: string;           // 当選回数等
  careerSummary: string;          // 経歴
  asOf: string;                   // 役職等の現在日付
};

export type Bill = {
  session: string;                // 提出回次 e.g. "217"
  type: string;                   // "08" 内閣, "09" 衆法, "10" 参法
  number: string;                 // 提出番号 (no zero-pad)
  title: string;                  // 件名
  meisaiUrl: string;              // detail page on sangiin
  summaryPdfUrl?: string;         // 議案要旨 PDF
  fullTextPdfUrl?: string;        // 提出法律案 PDF
};

export type BillDetail = Bill & {
  kind: string;                   // 種別 / 提出者区分
  sponsorRaw: string;             // 発議者 (e.g. "秋野公造君   外3名")
  sponsorName: string;            // normalized lead sponsor (no 君/spaces)
  submittedDate: string;
  status: string;                 // 議決・継続結果
  table: Array<{ label: string; value: string }>; // misc metadata for display
};

const LIST_URL = "https://www.sangiin.go.jp/japanese/joho1/kousei/giin/current/giin.htm";
const GIAN_URL = "https://www.sangiin.go.jp/japanese/joho1/kousei/gian/current/gian.htm";

const stripTags = (s: string) =>
  s.replace(/<br\s*\/?>/gi, " / ").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

const stripTagsKeepBreaks = (s: string) =>
  s.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();

function parseMembers(html: string, baseUrl: string): Member[] {
  const members: Member[] = [];
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  for (const m of html.matchAll(rowRe)) {
    const row = m[1];
    const linkMatch = row.match(/<a\s+href="([^"]*\/profile\/(\d+)\.htm)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;
    const [, href, id, nameHtml] = linkMatch;
    const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(x => x[1]);
    if (tds.length < 5) continue;
    members.push({
      id,
      nameJa: stripTags(nameHtml),
      nameKana: stripTags(tds[1] ?? ""),
      partyJa: stripTags(tds[2] ?? ""),
      districtJa: stripTags(tds[3] ?? ""),
      termEnd: stripTags(tds[4] ?? ""),
      profileUrl: new URL(href, baseUrl).href,
    });
  }
  return members;
}

async function resolveRedirect(startUrl: string): Promise<string> {
  const res = await fetch(startUrl, { redirect: "follow" });
  const html = await res.text();
  const m = html.match(/location\.replace\("([^"]+)"\)/);
  if (m) {
    const path = m[1];
    return path.startsWith("http") ? path : `https://www.sangiin.go.jp${path}`;
  }
  return startUrl;
}

export const fetchMembers = createServerFn({ method: "GET" }).handler(async (): Promise<Member[]> => {
  try {
    const url = await resolveRedirect(LIST_URL);
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error(`Upstream ${res.status}`);
    const html = await res.text();
    const members = parseMembers(html, url);
    if (members.length === 0) throw new Error("Parsed zero members; HTML format may have changed.");
    return members;
  } catch (e) {
    console.error("fetchMembers failed:", e);
    return [];
  }
});

// ---------- Member profile (committees + bio) ----------

function parseProfile(html: string): MemberProfile {
  const committees: string[] = [];
  let electionInfo = "";
  let careerSummary = "";
  let asOf = "";

  const dlRe = /<dl class="profile-detail">([\s\S]*?)<\/dl>/gi;
  for (const m of html.matchAll(dlRe)) {
    const block = m[1];
    const dt = stripTags((block.match(/<dt>([\s\S]*?)<\/dt>/i)?.[1]) ?? "");
    const ddRaw = (block.match(/<dd>([\s\S]*?)<\/dd>/i)?.[1]) ?? "";
    if (dt.includes("役職")) {
      const text = stripTagsKeepBreaks(ddRaw);
      const lines = text.split("\n").map(s => s.trim()).filter(Boolean);
      // First line is often "令和X年X月X日現在"
      if (lines[0]?.includes("現在")) {
        asOf = lines.shift() ?? "";
      }
      for (const ln of lines) committees.push(ln);
    } else if (dt.includes("選挙区") || dt.includes("当選")) {
      electionInfo = stripTags(ddRaw);
    }
  }

  const career = html.match(/<p class="profile2">([\s\S]*?)<\/p>/i);
  if (career) careerSummary = stripTags(career[1]);

  return { committees, electionInfo, careerSummary, asOf };
}

export const fetchMemberProfile = createServerFn({ method: "GET" })
  .inputValidator((d: { profileUrl: string }) => d)
  .handler(async ({ data }): Promise<MemberProfile> => {
    try {
      const res = await fetch(data.profileUrl, { redirect: "follow" });
      if (!res.ok) throw new Error(`Upstream ${res.status}`);
      const html = await res.text();
      return parseProfile(html);
    } catch (e) {
      console.error("fetchMemberProfile failed:", e);
      return { committees: [], electionInfo: "", careerSummary: "", asOf: "" };
    }
  });

// ---------- Bills ----------

function parseBillList(html: string, baseUrl: string): Bill[] {
  const bills: Bill[] = [];
  // Match all rows that contain a meisai/m...htm link
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  for (const m of html.matchAll(rowRe)) {
    const row = m[1];
    const linkMatch = row.match(/<a href="([^"]*\/meisai\/m(\d{3})(\d{2})(\d{3})(\d{3})\.htm)"[^>]*>([\s\S]*?)<\/a>/);
    if (!linkMatch) continue;
    const [, href, , type, , numPadded, title] = linkMatch;
    // Pull session/number from the row's first two <td>s when present
    const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(x => stripTags(x[1]));
    const session = (tds[0] && /^\d+$/.test(tds[0])) ? tds[0] : "";
    const number = (tds[1] && /^\d+$/.test(tds[1])) ? tds[1] : String(parseInt(numPadded, 10));
    const meisaiUrl = new URL(href, baseUrl).href;
    // PDF links in the same row
    const pdfs = [...row.matchAll(/<a href="([^"]+\.pdf)"[^>]*>([^<]+)<\/a>/g)];
    let summaryPdfUrl: string | undefined;
    let fullTextPdfUrl: string | undefined;
    for (const p of pdfs) {
      const label = stripTags(p[2]);
      const url = new URL(p[1], baseUrl).href;
      if (label.includes("要旨")) summaryPdfUrl = url;
      else if (label.includes("法律案") || label.includes("提出")) fullTextPdfUrl = url;
    }
    bills.push({
      session,
      type,
      number,
      title: stripTags(title),
      meisaiUrl,
      summaryPdfUrl,
      fullTextPdfUrl,
    });
  }
  return bills;
}

function normalizeName(s: string): string {
  return s.replace(/[君]/g, "").replace(/\s+/g, "").replace(/[　]/g, "");
}

function parseBillDetail(html: string, base: Bill): BillDetail {
  const table: Array<{ label: string; value: string }> = [];
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let kind = "";
  let sponsorRaw = "";
  let submittedDate = "";
  let status = "";
  for (const m of html.matchAll(rowRe)) {
    const row = m[1];
    const th = row.match(/<th[^>]*>([\s\S]*?)<\/th>/i);
    if (!th) continue;
    const label = stripTags(th[1]);
    const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(x => stripTags(x[1]));
    if (tds.length === 0) continue;
    const value = tds.join(" / ");
    table.push({ label, value });
    if (label === "種別" || label === "提出者区分") kind = kind ? `${kind} / ${value}` : value;
    if (label === "発議者" || label === "提出者") sponsorRaw = value;
    if (label === "提出日") submittedDate = value;
    if (label === "議決・継続結果" || label === "議決") status = value;
  }
  const sponsorName = normalizeName(sponsorRaw.split("外")[0] ?? "");
  return { ...base, kind, sponsorRaw, sponsorName, submittedDate, status, table };
}

// Lightweight list of bills from the current session (no detail expansion).
// Used to populate the illustrative voting record on member pages with real
// bills that link to legislation detail pages.
export const fetchVotableBills = createServerFn({ method: "GET" }).handler(async (): Promise<{
  session: string;
  bills: Bill[];
}> => {
  try {
    const url = await resolveRedirect(GIAN_URL);
    const session = url.match(/\/gian\/(\d+)\//)?.[1] ?? "";
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error(`Upstream ${res.status}`);
    const html = await res.text();
    const bills = parseBillList(html, url);
    return { session, bills };
  } catch (e) {
    console.error("fetchVotableBills failed:", e);
    return { session: "", bills: [] };
  }
});


export const fetchBill = createServerFn({ method: "GET" })
  .inputValidator((d: { session: string; type: string; number: string }) => d)
  .handler(async ({ data }): Promise<BillDetail | null> => {
    try {
      const s = data.session;
      const t = data.type;
      const n = data.number.padStart(3, "0");
      const meisaiUrl = `https://www.sangiin.go.jp/japanese/joho1/kousei/gian/${s}/meisai/m${s}${t}${s}${n}.htm`;
      const res = await fetch(meisaiUrl, { redirect: "follow" });
      if (!res.ok) throw new Error(`Upstream ${res.status}`);
      const html = await res.text();
      // Title is on the page in a table row with <th>件名</th>
      const titleMatch = html.match(/<th[^>]*>件名<\/th>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i);
      const title = titleMatch ? stripTags(titleMatch[1]) : "";
      // PDF links on the detail page point to summary / full text
      let summaryPdfUrl: string | undefined;
      let fullTextPdfUrl: string | undefined;
      for (const m of html.matchAll(/<a[^>]*href="([^"]+\.pdf)"[^>]*>([\s\S]*?)<\/a>/g)) {
        const label = stripTags(m[2]);
        const url = new URL(m[1], meisaiUrl).href;
        if (label.includes("要旨")) summaryPdfUrl = url;
        else if (label.includes("法律案") || label.includes("提出")) fullTextPdfUrl = url;
      }
      const base: Bill = {
        session: s,
        type: t,
        number: data.number,
        title,
        meisaiUrl,
        summaryPdfUrl,
        fullTextPdfUrl,
      };
      return parseBillDetail(html, base);
    } catch (e) {
      console.error("fetchBill failed:", e);
      return null;
    }
  });
