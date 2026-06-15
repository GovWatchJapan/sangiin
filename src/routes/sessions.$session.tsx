import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { fetchBillsBySession, type Bill } from "@/lib/sangiin.functions";
import { useI18n } from "@/lib/i18n";
import { useMemo, useState } from "react";

const sessionBillsQO = (session: string) => queryOptions({
  queryKey: ["session-bills", session],
  queryFn: () => fetchBillsBySession({ data: { session } }),
  staleTime: 60 * 60 * 1000,
});

export const Route = createFileRoute("/sessions/$session")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(sessionBillsQO(params.session)),
  head: ({ params }) => ({
    meta: [
      { title: `第${params.session}回国会 法律案 — 国会ウォッチ` },
      { name: "description", content: `Bills submitted in Diet session ${params.session}.` },
    ],
  }),
  component: SessionPage,
});

const KIND: Record<string, { ja: string; en: string; cls: string }> = {
  "08": { ja: "閣法", en: "Cabinet",   cls: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  "09": { ja: "衆法", en: "House Rep.", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  "10": { ja: "参法", en: "Councillor", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
};

function SessionPage() {
  const { session } = Route.useParams();
  const { lang, t } = useI18n();
  const { data } = useSuspenseQuery(sessionBillsQO(session));
  const [filter, setFilter] = useState<"all" | "08" | "09" | "10">("all");
  const [q, setQ] = useState("");

  const bills = useMemo(() => {
    return data.bills.filter(b => {
      if (filter !== "all" && b.type !== filter) return false;
      if (q && !b.title.includes(q)) return false;
      return true;
    });
  }, [data.bills, filter, q]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <Link to="/sessions" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        ← {lang === "ja" ? "回次一覧" : "All sessions"}
      </Link>

      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-2">
          {t("session_num")}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
          {lang === "ja" ? `第${session}回国会` : `Diet Session ${session}`}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === "ja"
            ? `参議院に提出された法律案 ${data.bills.length} 件`
            : `${data.bills.length} bills submitted to the House of Councillors`}
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", "08", "09", "10"] as const).map(k => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === k
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:border-primary"
            }`}
          >
            {k === "all"
              ? (lang === "ja" ? "すべて" : "All")
              : KIND[k][lang]}
          </button>
        ))}
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={lang === "ja" ? "件名で検索…" : "Search title…"}
          className="ml-auto text-sm rounded-md border border-border bg-card px-3 py-1.5 w-48 focus:outline-none focus:border-primary"
        />
      </div>

      {data.bills.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">
          {lang === "ja"
            ? "この回次の法律案を取得できませんでした。"
            : "Could not fetch bills for this session."}
        </p>
      ) : (
        <ul className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
          {bills.map((b: Bill) => (
            <li key={`${b.session}-${b.type}-${b.number}`}>
              <Link
                to="/legislation/$session/$type/$number"
                params={{ session: b.session, type: b.type, number: b.number }}
                className="block px-4 py-3 hover:bg-accent/40 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <span className={`shrink-0 mt-0.5 text-[0.65rem] font-semibold px-2 py-0.5 rounded ${KIND[b.type]?.cls ?? "bg-secondary"}`}>
                    {KIND[b.type]?.[lang] ?? b.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium group-hover:text-primary leading-snug">{b.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                      {b.session}–{b.number}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
          {bills.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              {lang === "ja" ? "該当する法律案はありません。" : "No bills match."}
            </li>
          )}
        </ul>
      )}
    </main>
  );
}
