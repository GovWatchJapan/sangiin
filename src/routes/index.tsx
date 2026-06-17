import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { loadDataset } from "@/lib/data";
import { JapanTilemap } from "@/components/JapanTilemap";
import { useI18n } from "@/lib/i18n";
import { PREF_BY_JA } from "@/lib/prefectures";
import { partyColor, partyLabel } from "@/lib/parties";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "国会ウォッチ — Diet Watch Japan" },
      { name: "description", content: "都道府県の選挙区を選んで参議院議員の投票行動を確認できます。Click a prefecture to see councillors and their votes." },
    ],
  }),
  component: Index,
});

function Index() {
  const { t, lang } = useI18n();
  const { data, isLoading } = useQuery({ queryKey: ["dataset"], queryFn: loadDataset, staleTime: Infinity });
  const members = data?.members ?? [];

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const x of members) {
      // District cell may list multiple prefectures joined by "・" (e.g. 鳥取・島根)
      const parts = x.districtJa.split("・").map(s => s.trim()).filter(Boolean);
      for (const part of parts) {
        const pref = PREF_BY_JA[part];
        const slug = pref?.slug ?? (part === "比例" ? "hirei" : null);
        if (slug) m[slug] = (m[slug] ?? 0) + 1;
      }
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

      <section className="mt-10 max-w-2xl mx-auto">
        <Link
          to="/sessions"
          className="group flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4 hover:border-primary hover:bg-accent/40 transition-colors"
        >
          <div>
            <div className="font-display text-lg font-semibold group-hover:text-primary">
              {lang === "ja" ? "国会回次から議案を見る" : "Browse votes by Diet session"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {lang === "ja"
                ? "回次を選んで、その国会の本会議投票記録を一覧表示します。"
                : "Pick a session to see the plenary votes held in that Diet."}
            </div>
          </div>
          <span className="text-muted-foreground group-hover:text-primary text-xl">→</span>
        </Link>
      </section>

      {isLoading ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">{t("loading")}</p>
      ) : members.length === 0 ? (
        <p className="mt-10 text-center text-sm text-destructive">
          {lang === "ja" ? "データを読み込めませんでした。" : "Could not load data."}
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
                <Link
                  key={p}
                  to="/party/$slug"
                  params={{ slug: encodeURIComponent(p) }}
                  className="group inline-flex items-center gap-1.5 text-xs rounded px-2 py-1 border border-border bg-card hover:bg-accent/40 hover:border-primary transition-colors"
                  style={{ borderLeft: `3px solid ${partyColor(p)}` }}
                  aria-label={`${partyLabel(p, lang)} (${n})`}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: partyColor(p) }}
                    aria-hidden
                  />
                  <strong className="group-hover:text-primary">{partyLabel(p, lang)}</strong>
                  <span className="text-muted-foreground tabular-nums">{n}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="mt-20 text-center text-xs text-muted-foreground">
        <p>{t("about_body")}</p>
        <p className="mt-2">
          {t("source")}:{" "}
          <a href="https://github.com/GovWatchJapan/congressdata" className="underline hover:text-primary" target="_blank" rel="noreferrer">
            GovWatchJapan/congressdata
          </a>
        </p>
      </footer>
    </main>
  );
}
