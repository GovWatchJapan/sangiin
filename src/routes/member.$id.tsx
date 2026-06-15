import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, queryOptions } from "@tanstack/react-query";
import { fetchMembers, fetchMemberProfile, fetchVotableBills, type Bill } from "@/lib/sangiin.functions";
import { PREF_BY_JA } from "@/lib/prefectures";
import { partyColor, partyLabel } from "@/lib/parties";
import { choiceFor, type VoteChoice } from "@/lib/mock-votes";
import { useI18n } from "@/lib/i18n";

const membersQO = queryOptions({
  queryKey: ["members"],
  queryFn: () => fetchMembers(),
  staleTime: 60 * 60 * 1000,
});

const votableBillsQO = queryOptions({
  queryKey: ["votable-bills"],
  queryFn: () => fetchVotableBills(),
  staleTime: 60 * 60 * 1000,
});

const profileQO = (profileUrl: string) => queryOptions({
  queryKey: ["member-profile", profileUrl],
  queryFn: () => fetchMemberProfile({ data: { profileUrl } }),
  staleTime: 60 * 60 * 1000,
});

export const Route = createFileRoute("/member/$id")({
  loader: async ({ context, params }) => {
    const members = await context.queryClient.ensureQueryData(membersQO);
    const m = members.find(x => x.id === params.id);
    if (!m) throw notFound();
    context.queryClient.ensureQueryData(votableBillsQO);
    return { member: m };
  },
  head: ({ loaderData }) => {
    const m = loaderData?.member;
    const title = m ? `${m.nameJa} — 国会ウォッチ` : "国会ウォッチ";
    return { meta: [{ title }, { name: "description", content: m ? `${m.nameJa}（${m.partyJa}・${m.districtJa}）の投票行動・所属委員会` : "" }] };
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

  const profile = useQuery(profileQO(member.profileUrl));
  const billsQ = useQuery(votableBillsQO);

  // Pick up to 10 real bills as the voting subjects.
  const bills: Bill[] = (billsQ.data?.bills ?? []).slice(0, 10);
  const votes = bills.map((b, i) => ({ bill: b, choice: choiceFor(member, i) }));

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
          {profile.data?.electionInfo && (
            <p className="mt-1 text-xs text-muted-foreground">{profile.data.electionInfo}</p>
          )}
          <a href={member.profileUrl} target="_blank" rel="noreferrer"
             className="mt-2 inline-block text-xs text-primary hover:underline">
            {t("view_official")} ↗
          </a>
        </div>
      </header>

      {/* Committees */}
      <section className="mb-8">
        <h2 className="font-display text-xl font-semibold mb-3">{t("committees")}</h2>
        <div className="rounded-lg border border-border bg-card p-4">
          {profile.isLoading ? (
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          ) : profile.data && profile.data.committees.length > 0 ? (
            <>
              {profile.data.asOf && (
                <p className="text-xs text-muted-foreground mb-2">{profile.data.asOf}</p>
              )}
              <ul className="space-y-1.5">
                {profile.data.committees.map((c, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("no_committees")}</p>
          )}
        </div>
      </section>

      {/* Voting Record */}
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
                <th className="text-left px-3 py-2.5 font-medium hidden sm:table-cell">{t("session_num")}</th>
                <th className="text-right px-4 py-2.5 font-medium">{t("vote")}</th>
              </tr>
            </thead>
            <tbody>
              {billsQ.isLoading && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">{t("loading")}</td></tr>
              )}
              {!billsQ.isLoading && votes.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">—</td></tr>
              )}
              {votes.map(({ bill, choice }) => (
                <tr key={`${bill.session}-${bill.type}-${bill.number}`} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link
                      to="/legislation/$session/$type/$number"
                      params={{ session: bill.session, type: bill.type, number: bill.number }}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {bill.title}
                    </Link>
                    <div className="text-xs text-muted-foreground sm:hidden mt-0.5">
                      {t("session_num")} {bill.session} · {t("bill_number")} {bill.number}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground tabular-nums hidden sm:table-cell">
                    {bill.session}–{bill.number}
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

      {profile.data?.careerSummary && (
        <section className="mb-6">
          <h2 className="font-display text-xl font-semibold mb-3">{t("career")}</h2>
          <div className="rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
            {profile.data.careerSummary}
          </div>
        </section>
      )}
    </main>
  );
}
