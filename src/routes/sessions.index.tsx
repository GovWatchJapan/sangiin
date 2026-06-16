import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { loadDataset, AVAILABLE_SESSIONS } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/sessions/")({
  head: () => ({
    meta: [
      { title: "国会回次一覧 — 国会ウォッチ" },
      { name: "description", content: "Browse votes by Diet session" },
    ],
  }),
  component: SessionsIndex,
});

function SessionsIndex() {
  const { lang, t } = useI18n();
  const { data } = useQuery({ queryKey: ["dataset"], queryFn: loadDataset, staleTime: Infinity });
  const sessions = data?.sessions?.length ? data.sessions : [...AVAILABLE_SESSIONS];

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
      <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        ← {t("back")}
      </Link>
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-2">
          {lang === "ja" ? "国会回次" : "Diet Sessions"}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
          {lang === "ja" ? "回次を選んで本会議投票を見る" : "Pick a session to browse votes"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {lang === "ja"
            ? "各回次の参議院本会議における投票記録を一覧表示します。"
            : "Shows the list of plenary votes in that Diet session of the House of Councillors."}
        </p>
      </header>

      <ul className="grid sm:grid-cols-2 gap-3">
        {sessions.map((n) => {
          const count = data?.billsBySession.get(n)?.length ?? 0;
          return (
            <li key={n}>
              <Link
                to="/sessions/$session"
                params={{ session: String(n) }}
                className="group flex items-center justify-between rounded-lg border border-border bg-card px-4 py-4 hover:border-primary hover:bg-accent/40 transition-colors"
              >
                <div>
                  <div className="font-display text-lg font-semibold">
                    {lang === "ja" ? `第${n}回国会` : `Session ${n}`}
                  </div>
                  {count > 0 && (
                    <div className="text-[0.7rem] text-muted-foreground mt-0.5 tabular-nums">
                      {count} {lang === "ja" ? "件の投票" : "votes"}
                    </div>
                  )}
                </div>
                <span className="text-muted-foreground group-hover:text-primary">→</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
