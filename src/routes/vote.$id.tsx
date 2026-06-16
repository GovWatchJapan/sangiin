import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { loadDataset, votesForBill, type VoteChoice } from "@/lib/data";
import { partyColor, partyLabel } from "@/lib/parties";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/vote/$id")({
  head: ({ params }) => ({
    meta: [{ title: `議案 ${params.id} — 国会ウォッチ` }],
  }),
  component: VotePage,
});

const CHOICE_LABEL: Record<VoteChoice, { ja: string; en: string; varName: string }> = {
  yea:      { ja: "賛成",    en: "Yea",     varName: "--yea" },
  nay:      { ja: "反対",    en: "Nay",     varName: "--nay" },
  abstain:  { ja: "投票なし", en: "No vote", varName: "--abstain" },
  absent:   { ja: "欠席",    en: "Absent",  varName: "--absent" },
  standing: { ja: "起立",    en: "Standing", varName: "--abstain" },
};

const ORDER: VoteChoice[] = ["yea", "nay", "abstain", "absent", "standing"];

function VotePage() {
  const { id } = Route.useParams();
  const { lang, t } = useI18n();
  const { data, isLoading } = useQuery({ queryKey: ["dataset"], queryFn: loadDataset, staleTime: Infinity });
  const [filter, setFilter] = useState<VoteChoice | "all">("all");

  const bill = data?.bills.find((b) => b.id === id);

  const memberVotes = useMemo(
    () => (data && bill ? votesForBill(data, bill.id) : []),
    [data, bill],
  );

  const tally = useMemo(() => {
    const t: Record<VoteChoice, number> = { yea: 0, nay: 0, abstain: 0, absent: 0, standing: 0 };
    for (const v of memberVotes) t[v.choice]++;
    return t;
  }, [memberVotes]);

  const partyTally = useMemo(() => {
    const m = new Map<string, Record<VoteChoice, number>>();
    for (const { member, choice } of memberVotes) {
      let r = m.get(member.partyJa);
      if (!r) { r = { yea: 0, nay: 0, abstain: 0, absent: 0, standing: 0 }; m.set(member.partyJa, r); }
      r[choice]++;
    }
    return Array.from(m.entries()).sort((a, b) => {
      const sumA = ORDER.reduce((s, k) => s + a[1][k], 0);
      const sumB = ORDER.reduce((s, k) => s + b[1][k], 0);
      return sumB - sumA;
    });
  }, [memberVotes]);

  const filtered = useMemo(
    () => filter === "all" ? memberVotes : memberVotes.filter((v) => v.choice === filter),
    [memberVotes, filter],
  );

  if (isLoading) {
    return <main className="max-w-3xl mx-auto p-10 text-center text-muted-foreground">{t("loading")}</main>;
  }
  if (!bill) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">{t("bill_not_found")}</p>
        <Link to="/" className="inline-block mt-4 text-sm text-primary hover:underline">← {t("back")}</Link>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <Link to="/sessions/$session" params={{ session: bill.session }} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        ← {lang === "ja" ? `第${bill.session}回国会` : `Session ${bill.session}`}
      </Link>

      <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
          {t("legislation")}
        </span>
        <span className="font-mono">{bill.id}</span>
      </div>

      <h1 className="font-display text-2xl sm:text-3xl font-bold leading-snug mb-2">
        {bill.title || bill.id}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {t("date")}: {bill.date} · {t("session_num")} {bill.session}
      </p>

      <div className="mb-6">
        <a
          href={bill.sangiinUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm hover:opacity-90 transition-opacity"
        >
          {t("view_on_sangiin")} ↗
        </a>
      </div>

      {/* Tally */}
      <section className="mb-8">
        <h2 className="font-display text-xl font-semibold mb-3">{t("vote_breakdown")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
          {ORDER.map((c) => (
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

        {partyTally.length > 0 && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-secondary text-secondary-foreground uppercase tracking-wide">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">{t("party")}</th>
                  {ORDER.map((c) => (
                    <th key={c} className="text-right px-2 py-2 font-medium" style={{ color: `var(${CHOICE_LABEL[c].varName})` }}>
                      {CHOICE_LABEL[c][lang]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {partyTally.map(([party, counts]) => (
                  <tr key={party} className="border-t border-border">
                    <td className="px-3 py-2">
                      <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: partyColor(party) }} />
                      {partyLabel(party, lang)}
                    </td>
                    {ORDER.map((c) => (
                      <td key={c} className="px-2 py-2 text-right tabular-nums">{counts[c] || ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Per-member */}
      <section className="mb-6">
        <h2 className="font-display text-xl font-semibold mb-3">{t("all_votes")}</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setFilter("all")}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}
          >
            {lang === "ja" ? "すべて" : "All"} ({memberVotes.length})
          </button>
          {ORDER.filter((c) => tally[c] > 0).map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filter === c ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}
            >
              {CHOICE_LABEL[c][lang]} ({tally[c]})
            </button>
          ))}
        </div>

        <ul className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
          {filtered.map(({ member, choice }) => (
            <li key={member.id}>
              <Link
                to="/member/$id"
                params={{ id: member.id }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/40 transition-colors text-sm"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: `var(${CHOICE_LABEL[choice].varName})` }}
                  title={CHOICE_LABEL[choice][lang]}
                />
                <span className="font-medium">{member.nameJa}</span>
                <span className="text-xs text-muted-foreground">{partyLabel(member.partyJa, lang)}</span>
                <span className="text-xs text-muted-foreground ml-auto">{member.districtJa}</span>
              </Link>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">—</li>
          )}
        </ul>
      </section>
    </main>
  );
}
