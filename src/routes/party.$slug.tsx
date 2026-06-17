import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { loadDataset } from "@/lib/data";
import { PREF_BY_JA } from "@/lib/prefectures";
import { partyColor, partyLabel, PARTY } from "@/lib/parties";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/party/$slug")({
  head: ({ params }) => {
    const ja = decodeURIComponent(params.slug);
    const en = PARTY[ja]?.en ?? ja;
    return {
      meta: [
        { title: `${ja} / ${en} — 国会ウォッチ` },
        { name: "description", content: `${ja} 所属の参議院議員一覧。Members belonging to ${en}.` },
      ],
    };
  },
  component: PartyPage,
});

function PartyPage() {
  const { slug } = Route.useParams();
  const partyJa = decodeURIComponent(slug);
  const { lang, t } = useI18n();
  const { data, isLoading } = useQuery({ queryKey: ["dataset"], queryFn: loadDataset, staleTime: Infinity });
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const members = data?.members ?? [];
    const list = members.filter((m) => m.partyJa === partyJa);
    const q = query.trim();
    if (!q) return list;
    return list.filter((m) => m.nameJa.includes(q));
  }, [data, partyJa, query]);

  const color = partyColor(partyJa);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        ← {t("back")}
      </Link>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] font-semibold mb-1" style={{ color }}>
            {t("party")}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold flex items-center gap-3">
            <span className="inline-block w-3 h-8 rounded-sm" style={{ background: color }} aria-hidden />
            {partyLabel(partyJa, lang)}
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
          {filtered.map((m) => {
            const pref = PREF_BY_JA[m.districtJa];
            return (
              <li key={m.id}>
                <Link
                  to="/member/$id"
                  params={{ id: m.id }}
                  className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary hover:shadow-md transition-all"
                  style={{ borderLeft: `4px solid ${partyColor(m.partyJa)}` }}
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
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{lang === "ja" ? m.districtJa : (pref?.en ?? m.districtJa)}</span>
                      {m.termEnd && <><span>·</span><span>{t("term_end")}: {m.termEnd}</span></>}
                    </div>
                  </div>
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
