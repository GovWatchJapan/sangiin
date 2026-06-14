import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { fetchMembers } from "@/lib/sangiin.functions";
import { JapanTilemap } from "@/components/JapanTilemap";
import { useI18n } from "@/lib/i18n";
import { PREF_BY_JA } from "@/lib/prefectures";
import { useMemo } from "react";


const membersQO = queryOptions({
  queryKey: ["members"],
  queryFn: () => fetchMembers(),
  staleTime: 60 * 60 * 1000,
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "国会ウォッチ — Diet Watch Japan" },
      { name: "description", content: "都道府県の選挙区を選んで参議院議員の投票行動を確認できます。Click a prefecture to see councillors and their votes." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(membersQO),
  component: Index,
});

function Index() {
  const { t, lang } = useI18n();
  const { data: members } = useSuspenseQuery(membersQO);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const x of members) {
      const pref = PREF_BY_JA[x.districtJa];
      const slug = pref?.slug ?? (x.districtJa === "比例" ? "hirei" : null);
      if (slug) m[slug] = (m[slug] ?? 0) + 1;
    }
    return m;
  }, [members]);

  const partyCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const x of members) m[x.partyJa] = (m[x.partyJa] ?? 0) + 1;
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [members]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 sm:py-16">
      <section className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">
          {lang === "ja" ? "参議院 · 投票行動データベース" : "House of Councillors · Voting Database"}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight">
          {t("pick_district")}
        </h1>
        <p className="mt-4 text-muted-foreground">
          {lang === "ja"
            ? "地図のタイルをクリックして、その選挙区の議員一覧と投票記録をご覧ください。"
            : "Tap a prefecture tile to see councillors from that district and their voting records."}
        </p>
      </section>

      <JapanTilemap counts={counts} />

      {members.length === 0 ? (
        <p className="mt-10 text-center text-sm text-destructive">
          {lang === "ja"
            ? "参議院サイトからデータを取得できませんでした。時間をおいて再度お試しください。"
            : "Could not fetch data from sangiin.go.jp. Please try again later."}
        </p>
      ) : (
        <section className="mt-16 grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-center">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="text-3xl font-display font-bold tabular-nums">{members.length}</div>
            <div className="text-xs text-muted-foreground mt-1">{t("total_members")}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 sm:col-span-2 text-left">
            <div className="text-xs text-muted-foreground mb-2">{t("parties_breakdown")}</div>
            <div className="flex flex-wrap gap-1.5">
              {partyCounts.map(([p, n]) => (
                <span key={p} className="text-xs bg-secondary px-2 py-1 rounded">
                  <strong>{p}</strong> <span className="text-muted-foreground tabular-nums">{n}</span>
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="mt-20 text-center text-xs text-muted-foreground">
        <p>{t("about_body")}</p>
        <p className="mt-2">
          {t("source")}:{" "}
          <a href="https://www.sangiin.go.jp/japanese/joho1/kousei/giin/current/giin.htm"
             className="underline hover:text-primary" target="_blank" rel="noreferrer">
            sangiin.go.jp
          </a>
        </p>
      </footer>
    </main>
  );
}
