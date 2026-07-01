// Scrape Sangiin 付託委員会別一覧 pages for each session → public/data/bill_committees.json
// Produces: { [session]: { [normalizedBillTitle]: committeeSlug } }
// Usage: bun run scripts/scrape_bill_committees.ts
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const SESSIONS = ["221", "219", "217", "214"];

// Map committee code (as it appears in iinkai/iXXXX.htm) → slug used by /committee/$slug
const CODE_TO_SLUG: Record<string, string> = {
  "0063": "naikaku",
  "0064": "soumu",
  "0065": "houmu",
  "0066": "gaikou-bouei",
  "0067": "zaisei-kinyuu",
  "0068": "bunkyou-kagaku",
  "0069": "kousei-roudou",
  "0070": "nourin-suisan",
  "0071": "keizai-sangyou",
  "0072": "kokudo-koutsuu",
  "0073": "kankyou",
  "0062": "kokka-kihon",
  "0027": "yosan",
  "0028": "kessan",
  "0061": "gyousei-kanshi",
  "0029": "giin-unei",
  "0031": "choubatsu",
  "0436": "saigai-shinsai",
  "0437": "okinawa-hoppou-chihou",
  "0435": "seiji-kaikaku",
  "0415": "rachi",
  "0438": "oda-jindou",
  "0439": "shouhisha",
  "0440": "digital-ai",
  "0418": "fukkou",
};

/** Normalize a bill title for cross-source matching. */
export function normTitle(s: string): string {
  return s
    .replace(/\u3000/g, " ")
    .replace(/^日程第[０-９0-9〇一二三四五六七八九十百千]+\s*/, "")
    .replace(/（[^（）]*）\s*$/g, "")
    .replace(/\([^()]*\)\s*$/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}

async function fetchIndex(session: string): Promise<Array<{ code: string; url: string }>> {
  const url = `https://www.sangiin.go.jp/japanese/joho1/kousei/gian/${session}/iinkai.htm`;
  const res = await fetch(url);
  if (!res.ok) { console.warn(`SKIP session ${session}: HTTP ${res.status}`); return []; }
  const html = await res.text();
  const found: Array<{ code: string; url: string }> = [];
  const re = /href="(?:\.\/)?iinkai\/i(\d{4})\.htm"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const code = m[1];
    found.push({
      code,
      url: `https://www.sangiin.go.jp/japanese/joho1/kousei/gian/${session}/iinkai/i${code}.htm`,
    });
  }
  return found;
}

async function fetchCommitteeBills(url: string): Promise<string[]> {
  const res = await fetch(url);
  if (!res.ok) return [];
  const html = await res.text();
  // Bill title links go to meisai/mXXXX.htm
  const titles: string[] = [];
  const re = /<a[^>]*href="[^"]*meisai\/m[^"]*\.htm"[^>]*>([^<]+)<\/a>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    titles.push(stripTags(m[1]));
  }
  return titles;
}

async function main() {
  const out: Record<string, Record<string, string>> = {};
  for (const session of SESSIONS) {
    console.log(`\n=== session ${session} ===`);
    const idx = await fetchIndex(session);
    const map: Record<string, string> = {};
    for (const { code, url } of idx) {
      const slug = CODE_TO_SLUG[code];
      if (!slug) { console.warn(`  no slug for code ${code}, skipping`); continue; }
      const titles = await fetchCommitteeBills(url);
      for (const t of titles) {
        const key = normTitle(t);
        if (!key) continue;
        if (!map[key]) map[key] = slug; // first wins (bill may be co-referred; rare)
      }
      console.log(`  ${slug}: ${titles.length} bills`);
      await new Promise((r) => setTimeout(r, 200));
    }
    out[session] = map;
    console.log(`  total: ${Object.keys(map).length} bills mapped`);
  }
  const path = "public/data/bill_committees.json";
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(out, null, 2));
  console.log(`\nwrote ${path}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
