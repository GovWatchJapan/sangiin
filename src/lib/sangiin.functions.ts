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

const LIST_URL = "https://www.sangiin.go.jp/japanese/joho1/kousei/giin/current/giin.htm";

const stripTags = (s: string) =>
  s.replace(/<br\s*\/?>/gi, " / ").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

function parseMembers(html: string, baseUrl: string): Member[] {
  const members: Member[] = [];
  // Each member row contains a profile link followed by 5 td cells.
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  for (const m of html.matchAll(rowRe)) {
    const row = m[1];
    const linkMatch = row.match(/<a\s+href="([^"]*\/profile\/(\d+)\.htm)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;
    const [, href, id, nameHtml] = linkMatch;
    const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(x => x[1]);
    if (tds.length < 5) continue;
    const nameKana = stripTags(tds[1] ?? "");
    const partyJa  = stripTags(tds[2] ?? "");
    const districtJa = stripTags(tds[3] ?? "");
    const termEnd  = stripTags(tds[4] ?? "");
    members.push({
      id,
      nameJa: stripTags(nameHtml),
      nameKana,
      partyJa,
      districtJa,
      termEnd,
      profileUrl: new URL(href, baseUrl).href,
    });
  }
  return members;
}

// Resolves the canonical current-session URL (sangiin redirects via meta/JS).
async function resolveCurrent(): Promise<string> {
  const res = await fetch(LIST_URL, { redirect: "follow" });
  const html = await res.text();
  const m = html.match(/location\.replace\("([^"]+)"\)/);
  if (m) {
    const path = m[1];
    return path.startsWith("http") ? path : `https://www.sangiin.go.jp${path}`;
  }
  return LIST_URL;
}

export const fetchMembers = createServerFn({ method: "GET" }).handler(async (): Promise<Member[]> => {
  try {
    const url = await resolveCurrent();
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error(`Upstream ${res.status}`);
    const html = await res.text();
    const members = parseMembers(html);
    if (members.length === 0) throw new Error("Parsed zero members; HTML format may have changed.");
    return members;
  } catch (e) {
    console.error("fetchMembers failed:", e);
    return [];
  }
});
