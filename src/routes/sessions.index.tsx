import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { fetchCurrentSession } from "@/lib/sangiin.functions";
import { useI18n } from "@/lib/i18n";

const currentSessionQO = queryOptions({
  queryKey: ["current-session"],
  queryFn: () => fetchCurrentSession(),
  staleTime: 60 * 60 * 1000,
});

export const Route = createFileRoute("/sessions/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(currentSessionQO),
  head: () => ({
    meta: [
      { title: "国会回次一覧 — 国会ウォッチ" },
      { name: "description", content: "Browse bills by Diet session / 国会回次から法律案を閲覧" },
    ],
  }),
  component: SessionsIndex,
});

function SessionsIndex() {
  const { lang, t } = useI18n();
  const { data: current } = useSuspenseQuery(currentSessionQO);
  const currentNum = parseInt(current || "221", 10) || 221;
  // List the current session and several previous ones.
  const sessions = Array.from({ length: 10 }, (_, i) => currentNum - i);

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
          {lang === "ja" ? "回次を選んで法律案を見る" : "Pick a session to browse bills"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {lang === "ja"
            ? "各回次の参議院に提出された法律案の一覧を表示します。"
            : "Shows the list of bills submitted to the House of Councillors in that Diet session."}
        </p>
      </header>

      <ul className="grid sm:grid-cols-2 gap-3">
        {sessions.map((n) => {
          const isCurrent = String(n) === current;
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
                  {isCurrent && (
                    <div className="text-[0.7rem] text-primary uppercase tracking-wide mt-0.5">
                      {lang === "ja" ? "現在の国会" : "Current"}
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
