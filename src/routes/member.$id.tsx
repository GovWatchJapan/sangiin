import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { fetchMembers } from "@/lib/sangiin.functions";
import { PREF_BY_JA } from "@/lib/prefectures";
import { partyColor, partyLabel } from "@/lib/parties";
import { votesFor, type VoteChoice } from "@/lib/mock-votes";
import { useI18n } from "@/lib/i18n";
import { useMemo } from "react";

const membersQO = queryOptions({
  queryKey: ["members"],
  queryFn: () => fetchMembers(),
  staleTime: 60 * 60 * 1000,
});

export const Route = createFileRoute("/member/$id")({
  loader: async ({ context, params }) => {
    const members = await context.queryClient.ensureQueryData(membersQO);
    const m = members.find(x => x.id === params.id);
    if (!m) throw notFound();
    return { member: m };
  },
  head: ({ loaderData }) => {
    const m = loaderData?.member;
    const title = m ? `${m.nameJa} — 国会ウォッチ` : "国会ウォッチ";
    return { meta: [{ title }, { name: "description", content: m ? `${m.nameJa}（${m.partyJa}・${m.districtJa}）の投票行動` : "" }] };
  },
  component: MemberPage,
  notFoundComponent: () => (
    <div className="max-w-2xl mx-auto p-10 text-center text-muted-foreground">議員が見つかりません / Member not found</div>
  ),
});

const CHOICE_LABEL: Record<VoteChoice, { ja: string; en: string; varName: string }> = {
  yea:     { ja: "賛成", en: "Yea",     varName: "--yea" },
  nay:     { ja: "反対", en: "Nay",     varName: "--nay" },
  abstain: { ja: "棄権", en: "Abstain", varName: "--abstain" },
  absent:  { ja: "欠席", en: "Absent",  varName: "--absent" },
};

function MemberPage() {
  const { id } = Route.useParams();
  const { lang, t } = useI18n();
  const { data: members } = useSuspenseQuery(membersQO);
  const member = members.find(m => m.id === id)!;
  const pref = PREF_BY_JA[member.districtJa];
  const votes = useMemo(() => votesFor(member), [member]);

  const tally = votes.reduce<Record<VoteChoice, number>>((acc, v) => {
    acc[v.choice] = (acc[v.choice] ?? 0) + 1;
    return acc;
  }, { yea: 0, nay: 0, abstain: 0, absent: 0 });

  const districtSlug = pref?.slug ?? "hirei";

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
          <p className="text-muted-foreground mt-1">{member.nameKana}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="px-2 py-0.5 rounded text-white font-medium" style={{ background: partyColor(member.partyJa) }}>
              {partyLabel(member.partyJa, lang)}
            </span>
            <span className="text-muted-foreground">·</span>
            <span>{lang === "ja" ? member.districtJa : (pref?.en ?? member.districtJa)}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground text-xs">{t("term_end")} {member.termEnd}</span>
          </div>
          <a href={member.profileUrl} target="_blank" rel="noreferrer"
             className="mt-2 inline-block text-xs text-primary hover:underline">
            {t("view_official")} ↗
          </a>
        </div>
      </header>

      <section className="mb-6">
        <h2 className="font-display text-xl font-semibold mb-3">{t("voting_record")}</h2>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {(["yea","nay","abstain","absent"] as VoteChoice[]).map(c => (
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
              {votes.map(v => (
                <tr key={v.billId} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-medium">{lang === "ja" ? v.billJa : v.billEn}</div>
                    <div className="text-xs text-muted-foreground sm:hidden">{v.date}</div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground tabular-nums hidden sm:table-cell">{v.date}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className="inline-block px-2.5 py-1 rounded text-white text-xs font-semibold uppercase tracking-wide min-w-[64px] text-center"
                      style={{ background: `var(${CHOICE_LABEL[v.choice].varName})` }}
                    >
                      {CHOICE_LABEL[v.choice][lang]}
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
