// Scrape Sangiin committee rosters → public/data/committees.json
// Usage: bun run scripts/scrape_committees.ts
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// Manually curated from
// https://www.sangiin.go.jp/japanese/kon_kokkaijyoho/index.html
// (常任委員会 + 特別委員会 + 調査会 + 審査会). Slugs are stable English-ish ids.
const COMMITTEES: Array<{ code: string; nameJa: string; slug: string; kind: "standing" | "special" | "research" | "review" }> = [
  // 常任委員会
  { code: "0063", nameJa: "内閣委員会",       slug: "naikaku",          kind: "standing" },
  { code: "0064", nameJa: "総務委員会",       slug: "soumu",            kind: "standing" },
  { code: "0065", nameJa: "法務委員会",       slug: "houmu",            kind: "standing" },
  { code: "0066", nameJa: "外交防衛委員会",   slug: "gaikou-bouei",     kind: "standing" },
  { code: "0067", nameJa: "財政金融委員会",   slug: "zaisei-kinyuu",    kind: "standing" },
  { code: "0068", nameJa: "文教科学委員会",   slug: "bunkyou-kagaku",   kind: "standing" },
  { code: "0069", nameJa: "厚生労働委員会",   slug: "kousei-roudou",    kind: "standing" },
  { code: "0070", nameJa: "農林水産委員会",   slug: "nourin-suisan",    kind: "standing" },
  { code: "0071", nameJa: "経済産業委員会",   slug: "keizai-sangyou",   kind: "standing" },
  { code: "0072", nameJa: "国土交通委員会",   slug: "kokudo-koutsuu",   kind: "standing" },
  { code: "0073", nameJa: "環境委員会",       slug: "kankyou",          kind: "standing" },
  { code: "0062", nameJa: "国家基本政策委員会", slug: "kokka-kihon",    kind: "standing" },
  { code: "0027", nameJa: "予算委員会",       slug: "yosan",            kind: "standing" },
  { code: "0028", nameJa: "決算委員会",       slug: "kessan",           kind: "standing" },
  { code: "0061", nameJa: "行政監視委員会",   slug: "gyousei-kanshi",   kind: "standing" },
  { code: "0029", nameJa: "議院運営委員会",   slug: "giin-unei",        kind: "standing" },
  { code: "0031", nameJa: "懲罰委員会",       slug: "choubatsu",        kind: "standing" },
  // 特別委員会
  { code: "0436", nameJa: "災害対策及び東日本大震災復興特別委員会", slug: "saigai-shinsai", kind: "special" },
  { code: "0437", nameJa: "沖縄・北方問題及び地方に関する特別委員会", slug: "okinawa-hoppou-chihou", kind: "special" },
  { code: "0435", nameJa: "政治改革に関する特別委員会", slug: "seiji-kaikaku", kind: "special" },
  { code: "0415", nameJa: "北朝鮮による拉致問題等に関する特別委員会", slug: "rachi", kind: "special" },
  { code: "0438", nameJa: "政府開発援助及び国際協力・人道支援等に関する特別委員会", slug: "oda-jindou", kind: "special" },
  { code: "0440", nameJa: "デジタル社会の形成及び人工知能の活用等に関する特別委員会", slug: "digital-ai", kind: "special" },
  { code: "0439", nameJa: "消費者問題に関する特別委員会", slug: "shouhisha", kind: "special" },
  { code: "0418", nameJa: "東日本大震災復興特別委員会", slug: "fukkou", kind: "special" }, // may 404; tolerate
];

type Member = { id: string; role: "委員長" | "理事" | "委員"; partyShort: string };
type CommitteeOut = { code: string; nameJa: string; slug: string; kind: string; members: Member[] };

function roleOf(s: string): Member["role"] {
  const t = s.replace(/\s|&nbsp;/g, "");
  if (t.includes("委員長")) return "委員長";
  if (t.includes("理事")) return "理事";
  return "委員";
}

async function fetchCommittee(code: string): Promise<Member[] | null> {
  const url = `https://www.sangiin.go.jp/japanese/joho1/kousei/konkokkai/current/list/l${code}.htm`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`SKIP ${code}: HTTP ${res.status}`);
    return null;
  }
  const html = await res.text();
  const members: Member[] = [];
  // Iterate <tr> blocks
  const trs = html.split(/<tr[\s>]/i).slice(1);
  for (const tr of trs) {
    const m = tr.match(/profile\/(\d+)\.htm/);
    if (!m) continue;
    const id = m[1];
    // Get all <td>...</td> cells.
    const cells = Array.from(tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).map((x) =>
      x[1].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim(),
    );
    const role = roleOf(cells[0] ?? "");
    const partyShort = (cells[2] ?? "").replace(/[（）()]/g, "").trim();
    members.push({ id, role, partyShort });
  }
  return members;
}

async function main() {
  const out: CommitteeOut[] = [];
  for (const c of COMMITTEES) {
    const members = await fetchCommittee(c.code);
    if (!members || members.length === 0) {
      console.warn(`empty: ${c.nameJa} (${c.code})`);
      continue;
    }
    out.push({ code: c.code, nameJa: c.nameJa, slug: c.slug, kind: c.kind, members });
    console.log(`${c.nameJa}: ${members.length} members`);
    await new Promise((r) => setTimeout(r, 250));
  }
  const path = "public/data/committees.json";
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify({ session: "221", committees: out }, null, 2));
  console.log(`wrote ${path}: ${out.length} committees`);
}

main().catch((e) => { console.error(e); process.exit(1); });
