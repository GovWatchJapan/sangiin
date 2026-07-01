import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { loadDataset } from "@/lib/data";
import { loadCommittees } from "@/lib/committees";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/sessions/$session")({
  head: ({ params }) => ({
    meta: [
      { title: `第${params.session}回国会 投票一覧 — 国会ウォッチ` },
      { name: "description", content: `Votes held in Diet session ${params.session}.` },
    ],
  }),
  component: SessionPage,
});

function SessionPage() {
  const { session } = Route.useParams();
  const { lang, t } = useI18n();
  const { data, isLoading } = useQuery({ queryKey: ["dataset"], queryFn: loadDataset, staleTime: Infinity });
  const { data: committees } = useQuery({ queryKey: ["committees"], queryFn: loadCommittees, staleTime: Infinity });
  const [q, setQ] = useState("");
  const [committeeFilter, setCommitteeFilter] = useState<string>("all");

  const allBills = useMemo(() => data?.billsBySession.get(session) ?? [], [data, session]);

  const bills = useMemo(() => {
    let list = allBills;
    if (committeeFilter === "none") list = list.filter((b) => !b.committeeSlug);
    else if (committeeFilter !== "all") list = list.filter((b) => b.committeeSlug === committeeFilter);
    if (q) list = list.filter((b) => b.title.includes(q) || b.id.includes(q));
    return list;
  }, [allBills, q, committeeFilter]);

  const availableCommittees = useMemo(() => {
    if (!committees) return [];
    const counts = new Map<string, number>();
    for (const b of allBills) {
      if (!b.committeeSlug) continue;
      counts.set(b.committeeSlug, (counts.get(b.committeeSlug) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([slug, n]) => ({ slug, n, name: committees.bySlug.get(slug)?.nameJa ?? slug }))
      .sort((a, b) => b.n - a.n);
  }, [allBills, committees]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <Link to="/sessions" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        ← {lang === "ja" ? "回次一覧" : "All sessions"}
      </Link>

      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-2">
          {t("session_num")}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
          {lang === "ja" ? `第${session}回国会` : `Diet Session ${session}`}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === "ja"
            ? `参議院本会議の投票 ${bills.length} 件`
            : `${bills.length} plenary votes`}
        </p>
      </header>

      <div className="mb-4">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={lang === "ja" ? "件名で検索…" : "Search title…"}
          className="w-full sm:w-72 text-sm rounded-md border border-border bg-card px-3 py-1.5 focus:outline-none focus:border-primary"
        />
      </div>

      {availableCommittees.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <span className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mr-1">
            {lang === "ja" ? "付託委員会" : "Referred committee"}:
          </span>
          {[
            { slug: "all", name: lang === "ja" ? "すべて" : "All", n: allBills.length },
            ...availableCommittees,
            { slug: "none", name: lang === "ja" ? "その他/未分類" : "Other", n: allBills.filter(b => !b.committeeSlug).length },
          ].map((c) => {
            const active = committeeFilter === c.slug;
            return (
              <button
                key={c.slug}
                onClick={() => setCommitteeFilter(c.slug)}
                className={`px-2 py-0.5 rounded-full border text-[0.7rem] transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {c.name} <span className="tabular-nums opacity-75">({c.n})</span>
              </button>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <p className="text-center text-sm text-muted-foreground py-12">{t("loading")}</p>
      ) : bills.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">{t("no_bills")}</p>
      ) : (
        <ul className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
          {bills.map((b) => (
            <li key={b.id}>
              <Link
                to="/vote/$id"
                params={{ id: b.id }}
                className="block px-4 py-3 hover:bg-accent/40 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <span className="shrink-0 mt-0.5 text-[0.65rem] font-mono text-muted-foreground tabular-nums">
                    {b.date}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium group-hover:text-primary leading-snug">
                      {b.title || b.id}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-mono">{b.id}</div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
