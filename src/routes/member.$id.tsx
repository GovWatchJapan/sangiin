import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { loadDataset, type VoteChoice } from "@/lib/data";
import { loadCommittees } from "@/lib/committees";
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
  const { data: committees } = useQuery({ queryKey: ["committees"], queryFn: loadCommittees, staleTime: Infinity });

  const member = data?.members.find((m) => m.id === id);
  const pref = member ? PREF_BY_JA[member.districtJa] : undefined;

  const [committeeFilter, setCommitteeFilter] = useState<string>("all");

  const allVotes = useMemo(() => {
    if (!data || !member) return [];
    const inner = data.voteIndex.get(member.id);
    if (!inner) return [];
    return data.bills
      .filter((b) => inner.has(b.id))
      .map((b) => ({ bill: b, choice: inner.get(b.id)! }));
  }, [data, member]);

  const votes = useMemo(() => {
    if (committeeFilter === "all") return allVotes;
    if (committeeFilter === "none") return allVotes.filter((v) => !v.bill.committeeSlug);
    return allVotes.filter((v) => v.bill.committeeSlug === committeeFilter);
  }, [allVotes, committeeFilter]);

  // Committees represented in this member's voting history (for the filter chips).
  const availableCommittees = useMemo(() => {
    if (!committees) return [];
    const counts = new Map<string, number>();
    for (const { bill } of allVotes) {
      if (!bill.committeeSlug) continue;
      counts.set(bill.committeeSlug, (counts.get(bill.committeeSlug) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([slug, n]) => ({ slug, n, name: committees.bySlug.get(slug)?.nameJa ?? slug }))
      .sort((a, b) => b.n - a.n);
  }, [allVotes, committees]);

  const tally = useMemo(() => {
    const t: Record<VoteChoice, number> = { yea: 0, nay: 0, abstain: 0, absent: 0, standing: 0 };
    for (const v of votes) t[v.choice]++;
    return t;
  }, [votes]);

  // Outlier votes: bills where this member voted differently from their party's majority.
  // Only counts substantive choices (yea/nay/abstain), needs party with >=3 voters
  // on the bill, and a clear majority (>50%).
  const outliers = useMemo(() => {
    if (!data || !member) return [] as Array<{ bill: typeof votes[number]["bill"]; choice: VoteChoice; partyChoice: VoteChoice; partyShare: string }>;
    const partyMembers = data.members.filter((m) => m.partyJa === member.partyJa);
    const SUBSTANTIVE: VoteChoice[] = ["yea", "nay", "abstain"];
    const out: Array<{ bill: typeof votes[number]["bill"]; choice: VoteChoice; partyChoice: VoteChoice; partyShare: string }> = [];
    for (const { bill, choice } of votes) {
      if (!SUBSTANTIVE.includes(choice)) continue;
      const counts: Record<VoteChoice, number> = { yea: 0, nay: 0, abstain: 0, absent: 0, standing: 0 };
      let total = 0;
      for (const pm of partyMembers) {
        if (pm.id === member.id) continue;
        const c = data.voteIndex.get(pm.id)?.get(bill.id);
        if (!c || !SUBSTANTIVE.includes(c)) continue;
        counts[c]++;
        total++;
      }
      if (total < 3) continue;
      let topChoice: VoteChoice = "yea";
      let topCount = -1;
      for (const c of SUBSTANTIVE) {
        if (counts[c] > topCount) { topCount = counts[c]; topChoice = c; }
      }
      if (topCount / total <= 0.5) continue;
      if (topChoice === choice) continue;
      out.push({ bill, choice, partyChoice: topChoice, partyShare: `${topCount}/${total}` });
    }
    return out;
  }, [data, member, votes]);

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
          {(() => {
            const memberships = committees?.byMember.get(member.id) ?? [];
            if (memberships.length === 0) return null;
            return (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {memberships.map(({ committee, role }) => (
                  <Link
                    key={committee.slug}
                    to="/committee/$slug"
                    params={{ slug: committee.slug }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border bg-card text-[0.7rem] text-foreground hover:border-primary hover:text-primary transition-colors"
                    title={role}
                  >
                    {role !== "委員" && (
                      <span className="text-[0.6rem] font-semibold text-primary">{role}</span>
                    )}
                    <span>{committee.nameJa}</span>
                  </Link>
                ))}
              </div>
            );
          })()}
          {member.profileUrl && (
            <a href={member.profileUrl} target="_blank" rel="noreferrer"
               className="mt-2 inline-block text-xs text-primary hover:underline">
              {t("view_official")} ↗
            </a>
          )}
        </div>
      </header>

      <section className="mb-8">
        <h2 className="font-display text-xl font-semibold mb-1">
          {lang === "ja" ? "会派と異なる投票" : "Votes against party majority"}
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          {lang === "ja"
            ? "同じ会派の過半数と異なる投票をした議案を抽出しています(会派内の有効投票3票以上、過半数あり)。"
            : "Bills where this member's vote diverged from their caucus majority (≥3 substantive party votes, clear majority)."}
        </p>
        {outliers.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            {lang === "ja" ? "会派の多数派と異なる投票は見つかりませんでした。" : "No outlier votes found."}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-secondary-foreground text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">{t("bill")}</th>
                  <th className="text-right px-3 py-2.5 font-medium">{lang === "ja" ? "本人" : "Member"}</th>
                  <th className="text-right px-4 py-2.5 font-medium">{lang === "ja" ? "会派多数" : "Party majority"}</th>
                </tr>
              </thead>
              <tbody>
                {outliers.map(({ bill, choice, partyChoice, partyShare }) => (
                  <tr key={bill.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link to="/vote/$id" params={{ id: bill.id }} className="font-medium hover:text-primary hover:underline">
                        {bill.title || bill.id}
                      </Link>
                      <div className="text-xs text-muted-foreground mt-0.5">{bill.date}</div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-white text-xs font-semibold uppercase tracking-wide min-w-[56px] text-center"
                            style={{ background: `var(${CHOICE_LABEL[choice].varName})` }}>
                        {CHOICE_LABEL[choice][lang]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-white text-xs font-semibold uppercase tracking-wide min-w-[56px] text-center"
                            style={{ background: `var(${CHOICE_LABEL[partyChoice].varName})` }}>
                        {CHOICE_LABEL[partyChoice][lang]}
                      </span>
                      <div className="text-[0.65rem] text-muted-foreground tabular-nums mt-0.5">{partyShare}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="font-display text-xl font-semibold mb-3">{t("voting_record")}</h2>
        {availableCommittees.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[0.7rem] uppercase tracking-wide text-muted-foreground mr-1">
              {lang === "ja" ? "委員会で絞込" : "Filter by committee"}:
            </span>
            {[
              { slug: "all", name: lang === "ja" ? "すべて" : "All", n: allVotes.length },
              ...availableCommittees,
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
