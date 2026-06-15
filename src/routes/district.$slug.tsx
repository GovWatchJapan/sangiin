import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { loadDataset } from "@/lib/data";
import { PREF_BY_SLUG } from "@/lib/prefectures";
import { partyColor, partyLabel } from "@/lib/parties";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/district/$slug")({
  loader: ({ params }) => {
    if (!PREF_BY_SLUG[params.slug]) throw notFound();
    return { slug: params.slug };
  },
  head: ({ params }) => {
    const p = PREF_BY_SLUG[params.slug];
    const title = p ? `${p.ja} / ${p.en} — 国会ウォッチ` : "国会ウォッチ";
    return { meta: [{ title }, { name: "description", content: `${p?.ja ?? ""} 選出の参議院議員一覧。` }] };
  },
  component: DistrictPage,
  notFoundComponent: () => (
    <div className="max-w-2xl mx-auto p-10 text-center text-muted-foreground">該当する選挙区がありません / District not found</div>
  ),
});

function DistrictPage() {
  const { slug } = Route.useParams();
  const { lang, t } = useI18n();
  const { data, isLoading } = useQuery({ queryKey: ["dataset"], queryFn: loadDataset, staleTime: Infinity });
  const pref = PREF_BY_SLUG[slug]!;
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const members = data?.members ?? [];
    const targetJa = pref.slug === "hirei" ? "比例" : pref.ja;
    const list = members.filter((m) => m.districtJa === targetJa || (pref.slug !== "hirei" && m.districtJa.includes(pref.ja)));
    const q = query.trim();
    if (!q) return list;
    return list.filter((m) => m.nameJa.includes(q));
  }, [data, pref, query]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        ← {t("back")}
      </Link>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">
            {pref.slug === "hirei"
              ? (lang === "ja" ? "比例代表" : "Proportional Representation")
              : (lang === "ja" ? "選挙区" : "Electoral District")}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold">
            {lang === "ja" ? pref.ja : pref.en}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {filtered.length} {t("members")}
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search_placeholder")}
          className="w-full sm:w-64 rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </header>

      {isLoading ? (
        <p className="text-muted-foreground text-center py-12">{t("loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">{t("no_members")}</p>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {filtered.map((m) => (
            <li key={m.id}>
              <Link
                to="/member/$id"
                params={{ id: m.id }}
                className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary hover:shadow-md transition-all"
              >
                <span
                  className="w-12 h-12 rounded-full grid place-items-center text-white font-display text-lg shrink-0"
                  style={{ background: partyColor(m.partyJa) }}
                  aria-hidden
                >
                  {m.nameJa[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg font-semibold truncate">{m.nameJa}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="px-1.5 py-0.5 rounded text-white font-medium" style={{ background: partyColor(m.partyJa) }}>
                      {partyLabel(m.partyJa, lang)}
                    </span>
                    {m.termEnd && <span className="text-muted-foreground">{t("term_end")}: {m.termEnd}</span>}
                  </div>
                </div>
                <span className="text-muted-foreground group-hover:text-primary transition-colors">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
