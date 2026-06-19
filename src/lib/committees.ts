// Loads the bundled committee roster JSON (scraped from sangiin.go.jp)
// and exposes helpers to look up committees by slug or by member id.
export type CommitteeRole = "委員長" | "理事" | "委員";

export type CommitteeMember = {
  id: string;          // matches data.ts Member.id (profile number)
  role: CommitteeRole;
  partyShort: string;  // e.g. "自民"
};

export type Committee = {
  code: string;        // e.g. "0063"
  nameJa: string;      // e.g. "内閣委員会"
  slug: string;        // e.g. "naikaku"
  kind: "standing" | "special" | "research" | "review";
  members: CommitteeMember[];
};

export type CommitteesData = {
  session: string;
  committees: Committee[];
  bySlug: Map<string, Committee>;
  /** memberId -> Array<{ committee, role }> */
  byMember: Map<string, Array<{ committee: Committee; role: CommitteeRole }>>;
};

function jsonUrl(): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return `${base}/data/committees.json`;
}

let promise: Promise<CommitteesData> | null = null;

export function loadCommittees(): Promise<CommitteesData> {
  if (promise) return promise;
  promise = (async () => {
    const res = await fetch(jsonUrl());
    if (!res.ok) throw new Error(`committees.json: ${res.status}`);
    const raw = (await res.json()) as { session: string; committees: Committee[] };
    const bySlug = new Map<string, Committee>();
    const byMember = new Map<string, Array<{ committee: Committee; role: CommitteeRole }>>();
    for (const c of raw.committees) {
      bySlug.set(c.slug, c);
      for (const m of c.members) {
        const arr = byMember.get(m.id) ?? [];
        arr.push({ committee: c, role: m.role });
        byMember.set(m.id, arr);
      }
    }
    return { session: raw.session, committees: raw.committees, bySlug, byMember };
  })();
  return promise;
}

const KIND_LABEL: Record<Committee["kind"], { ja: string; en: string }> = {
  standing: { ja: "常任委員会", en: "Standing committee" },
  special:  { ja: "特別委員会", en: "Special committee" },
  research: { ja: "調査会",     en: "Research council" },
  review:   { ja: "審査会",     en: "Review board" },
};

export function committeeKindLabel(kind: Committee["kind"], lang: "ja" | "en"): string {
  return KIND_LABEL[kind][lang];
}
