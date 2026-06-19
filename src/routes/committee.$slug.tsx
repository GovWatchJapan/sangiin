import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { loadDataset } from "@/lib/data";
import { loadCommittees, committeeKindLabel, type CommitteeRole } from "@/lib/committees";
import { PREF_BY_JA } from "@/lib/prefectures";
import { partyColor, partyLabel } from "@/lib/parties";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/committee/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `委員会 ${params.slug} — 国会ウォッチ` }],
  }),
  component: CommitteePage,
});

const ROLE_ORDER: CommitteeRole[] = ["委員長", "理事", "委員"];
const ROLE_LABEL: Record<CommitteeRole, { ja: string; en: string }> = {
  "委員長": { ja: "委員長", en: "Chair" },
  "理事":   { ja: "理事",   en: "Director" },
  "委員":   { ja: "委員",   en: "Member" },
};

function CommitteePage() {
  const { slug } = Route.useParams();
  const { lang, t } = useI18n();
  const ds = useQuery({ queryKey: ["dataset"], queryFn: loadDataset, staleTime: Infinity });
  const cs = useQuery({ queryKey: ["committees"], queryFn: loadCommittees, staleTime: Infinity });

  const committee = cs.data?.bySlug.get(slug);

  const rows = useMemo(() => {
    if (!committee || !ds.data) return [];
    const memberMap = new Map(ds.data.members.map((m) => [m.id, m]));
    return committee.members.map((cm) => ({ cm, member: memberMap.get(cm.id) }));
  }, [committee, ds.data]);

  const grouped = useMemo(() => {
    const g: Record<CommitteeRole, typeof rows> = { "委員長": [], "理事": [], "委員": [] };
    for (const r of rows) g[r.cm.role].push(r);
    return g;
  }, [rows]);

  if (ds.isLoading || cs.isLoading) {
    return <main className="max-w-3xl mx-auto p-10 text-center text-muted-foreground">{t("loading")}</main>;
  }
  if (!committee) {
    return <main className="max-w-3xl mx-auto p-10 text-center text-muted-foreground">委員会が見つかりません / Committee not found</main>;
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        ← {t("back")}
      </Link>

      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] font-semibold mb-1 text-muted-foreground">
          {committeeKindLabel(committee.kind, lang)}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
          {committee.nameJa}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {rows.length} {t("members")}
        </p>
      </header>

      {ROLE_ORDER.map((role) => {
        const list = grouped[role];
        if (list.length === 0) return null;
        return (
          <section key={role} className="mb-8">
            <h2 className="font-display text-lg font-semibold mb-3">
              {ROLE_LABEL[role][lang]} <span className="text-muted-foreground text-sm font-normal">({list.length})</span>
            </h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {list.map(({ cm, member }) => {
                const partyJa = member?.partyJa ?? cm.partyShort;
                const color = partyColor(partyJa);
                const pref = member ? PREF_BY_JA[member.districtJa] : undefined;
                const name = member?.nameJa ?? cm.id;
                return (
                  <li key={cm.id}>
                    <Link
                      to="/member/$id"
                      params={{ id: cm.id }}
                      className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-primary hover:shadow-md transition-all"
                      style={{ borderLeft: `4px solid ${color}` }}
                    >
                      <span
                        className="w-10 h-10 rounded-full grid place-items-center text-white font-display text-base shrink-0"
                        style={{ background: color }}
                        aria-hidden
                      >
                        {name[0]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-base font-semibold truncate">{name}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="px-1.5 py-0.5 rounded text-white text-[0.65rem] font-medium" style={{ background: color }}>
                            {partyLabel(partyJa, lang)}
                          </span>
                          {member && <span>{lang === "ja" ? member.districtJa : (pref?.en ?? member.districtJa)}</span>}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
