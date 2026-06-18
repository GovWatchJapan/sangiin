import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { loadDataset, type VoteChoice } from "@/lib/data";
import { PREF_BY_JA } from "@/lib/prefectures";
import { partyColor, partyLabel } from "@/lib/parties";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/member/$id")({
  head: ({ params }) => ({
    meta: [{ title: `議員 ${params.id} — 国会ウォッチ` }],
  }),
  component: MemberPage,
});

const CHOICE_LABEL: Record<VoteChoice, { ja: string; en: string; varName: string }> = {
  yea:      { ja: "賛成",    en: "Yea",     varName: "--yea" },
  nay:      { ja: "反対",    en: "Nay",     varName: "--nay" },
  abstain:  { ja: "投票なし", en: "No vote", varName: "--abstain" },
  absent:   { ja: "欠席",    en: "Absent",  varName: "--absent" },
  standing: { ja: "起立",    en: "Standing", varName: "--abstain" },
};

function MemberPage() {
  const { id } = Route.useParams();
  const { lang, t } = useI18n();
  const { data, isLoading } = useQuery({ queryKey: ["dataset"], queryFn: loadDataset, staleTime: Infinity });

  const member = data?.members.find((m) => m.id === id);
  const pref = member ? PREF_BY_JA[member.districtJa] : undefined;

  const votes = useMemo(() => {
    if (!data || !member) return [];
    const inner = data.voteIndex.get(member.id);
    if (!inner) return [];
    return data.bills
      .filter((b) => inner.has(b.id))
      .map((b) => ({ bill: b, choice: inner.get(b.id)! }));
  }, [data, member]);

  const tally = useMemo(() => {
    const t: Record<VoteChoice, number> = { yea: 0, nay: 0, abstain: 0, absent: 0, standing: 0 };
    for (const v of votes) t[v.choice]++;
    return t;
  }, [votes]);

  if (isLoading) {
    return <main className="max-w-3xl mx-auto p-10 text-center text-muted-foreground">{t("loading")}</main>;
  }
  if (!member) {
    return <main className="max-w-3xl mx-auto p-10 text-center text-muted-foreground">議員が見つかりません / Member not found</main>;
  }

  const districtSlug = pref?.slug ?? (member.districtJa === "比例" ? "hirei" : "hirei");

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <Link to="/district/$slug" params={{ slug: districtSlug }} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        ← {t("back")}
      </Link>

      <header className="flex items-center gap-5 mb-8">
        <span
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full grid place-items-center text-white font-display text-3xl shadow-md shrink-0"
          style={{ background: partyColor(member.partyJa) }}
        >
          {member.nameJa[0]}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">{member.nameJa}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="px-2 py-0.5 rounded text-white font-medium" style={{ background: partyColor(member.partyJa) }}>
              {partyLabel(member.partyJa, lang)}
            </span>
            <span className="text-muted-foreground">·</span>
            <span>{lang === "ja" ? member.districtJa : (pref?.en ?? member.districtJa)}</span>
            {member.termEnd && (<>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground text-xs">{t("term_end")} {member.termEnd}</span>
            </>)}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {member.absenceRate && <span>{t("absence_rate")}: <span className="tabular-nums">{member.absenceRate}</span></span>}
            {member.factionChanged && <span className="text-amber-600 dark:text-amber-400">⚠ {t("faction_changed")}</span>}
          </div>
          {member.profileUrl && (
            <a href={member.profileUrl} target="_blank" rel="noreferrer"
               className="mt-2 inline-block text-xs text-primary hover:underline">
              {t("view_official")} ↗
            </a>
          )}
        </div>
      </header>

      <section className="mb-6">
        <h2 className="font-display text-xl font-semibold mb-3">{t("voting_record")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {(["yea","nay","abstain"] as VoteChoice[]).map((c) => (
            <div key={c} className="rounded-md border border-border bg-card p-3 text-center">
              <div className="text-2xl font-display font-bold tabular-nums" style={{ color: `var(${CHOICE_LABEL[c].varName})` }}>
                {tally[c]}
              </div>
              <div className="text-[0.7rem] text-muted-foreground uppercase tracking-wide">
                {CHOICE_LABEL[c][lang]}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-secondary-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">{t("bill")}</th>
                <th className="text-left px-3 py-2.5 font-medium hidden sm:table-cell">{t("date")}</th>
                <th className="text-right px-4 py-2.5 font-medium">{t("vote")}</th>
              </tr>
            </thead>
            <tbody>
              {votes.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">—</td></tr>
              )}
              {votes.map(({ bill, choice }) => (
                <tr key={bill.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link
                      to="/vote/$id"
                      params={{ id: bill.id }}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {bill.title || bill.id}
                    </Link>
                    <div className="text-xs text-muted-foreground sm:hidden mt-0.5">
                      {bill.date} · {t("session_num")} {bill.session}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground tabular-nums hidden sm:table-cell text-xs">
                    {bill.date}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className="inline-block px-2.5 py-1 rounded text-white text-xs font-semibold uppercase tracking-wide min-w-[64px] text-center"
                      style={{ background: `var(${CHOICE_LABEL[choice].varName})` }}
                    >
                      {CHOICE_LABEL[choice][lang]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-muted-foreground italic">{t("data_note")}</p>
      </section>
    </main>
  );
}
