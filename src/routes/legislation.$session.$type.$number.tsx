import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { fetchBill } from "@/lib/sangiin.functions";
import { useI18n } from "@/lib/i18n";

const billQO = (session: string, type: string, number: string) =>
  queryOptions({
    queryKey: ["bill", session, type, number],
    queryFn: () => fetchBill({ data: { session, type, number } }),
    staleTime: 60 * 60 * 1000,
  });

export const Route = createFileRoute("/legislation/$session/$type/$number")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(billQO(params.session, params.type, params.number)),
  head: ({ loaderData, params }) => {
    const title = loaderData?.title
      ? `${loaderData.title} — 国会ウォッチ`
      : `議案 ${params.session}-${params.number}`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData?.title ?? "" },
      ],
    };
  },
  component: LegislationPage,
});

const KIND_MAP: Record<string, { ja: string; en: string }> = {
  "08": { ja: "内閣提出法律案", en: "Cabinet-submitted bill" },
  "09": { ja: "衆法（衆議院議員提出）", en: "House of Representatives member bill" },
  "10": { ja: "参法（参議院議員提出）", en: "House of Councillors member bill" },
};

function LegislationPage() {
  const params = Route.useParams();
  const { lang, t } = useI18n();
  const { data: bill } = useSuspenseQuery(billQO(params.session, params.type, params.number));

  if (!bill) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">{t("bill_not_found")}</p>
        <Link to="/" className="inline-block mt-4 text-sm text-primary hover:underline">← {t("back")}</Link>
      </main>
    );
  }

  const kindLabel = KIND_MAP[bill.type]?.[lang] ?? bill.kind;
  const billId = `${bill.session}-${bill.type}-${String(bill.number).padStart(3, "0")}`;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
          {t("legislation")}
        </span>
        <span className="font-mono">{billId}</span>
      </div>

      <h1 className="font-display text-2xl sm:text-3xl font-bold leading-snug mb-2">
        {bill.title}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">{kindLabel}</p>

      {/* Metadata */}
      <div className="rounded-lg border border-border bg-card overflow-hidden mb-6">
        <dl className="divide-y divide-border text-sm">
          <Row label={t("session_num")} value={bill.session} />
          <Row label={t("bill_number")} value={bill.number} />
          <Row label={t("kind")} value={bill.kind || kindLabel} />
          {bill.sponsorRaw && <Row label={t("sponsor")} value={bill.sponsorRaw} />}
          {bill.submittedDate && <Row label={t("submitted")} value={bill.submittedDate} />}
          {bill.status && <Row label={t("status")} value={bill.status} />}
        </dl>
      </div>

      {/* Summary / links */}
      <section className="mb-6">
        <h2 className="font-display text-lg font-semibold mb-3">{t("summary_pdf")}</h2>
        <div className="flex flex-wrap gap-3">
          {bill.summaryPdfUrl && (
            <a
              href={bill.summaryPdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm hover:border-primary hover:text-primary transition-colors"
            >
              📄 {t("summary_pdf")} ↗
            </a>
          )}
          {bill.fullTextPdfUrl && (
            <a
              href={bill.fullTextPdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm hover:border-primary hover:text-primary transition-colors"
            >
              📜 {t("fulltext_pdf")} ↗
            </a>
          )}
          <a
            href={bill.meisaiUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm hover:opacity-90 transition-opacity"
          >
            {t("view_on_sangiin")} ↗
          </a>
        </div>
        {!bill.summaryPdfUrl && (
          <p className="mt-3 text-xs text-muted-foreground italic">
            {lang === "ja"
              ? "議案要旨PDFは公開されていません。詳細は参議院公式ページをご覧ください。"
              : "Bill summary PDF not yet published. See the official page for details."}
          </p>
        )}
      </section>

      {/* Progress table */}
      {bill.table.length > 0 && (
        <section className="mb-6">
          <h2 className="font-display text-lg font-semibold mb-3">{t("bill_progress")}</h2>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <dl className="divide-y divide-border text-sm">
              {bill.table.map((r, i) => (
                <Row key={i} label={r.label} value={r.value} />
              ))}
            </dl>
          </div>
        </section>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-4 px-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium break-words">{value || "—"}</dd>
    </div>
  );
}
