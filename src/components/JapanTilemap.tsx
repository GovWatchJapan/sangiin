import { Link } from "@tanstack/react-router";
import { PREFECTURES, REGION_COLOR } from "@/lib/prefectures";
import { useI18n } from "@/lib/i18n";

const GRID_COLS = 11;
const GRID_ROWS = 12;

export function JapanTilemap({ counts }: { counts?: Record<string, number> }) {
  const { lang, t } = useI18n();
  const tiles = PREFECTURES.filter(p => p.slug !== "hirei");
  const hirei = PREFECTURES.find(p => p.slug === "hirei")!;

  return (
    <div className="w-full">
      <div
        className="grid gap-1.5 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
          aspectRatio: `${GRID_COLS} / ${GRID_ROWS}`,
          maxWidth: "min(720px, 92vw)",
        }}
      >
        {tiles.map(p => (
          <Link
            key={p.slug}
            to="/district/$slug"
            params={{ slug: p.slug }}
            className="group relative flex items-center justify-center rounded-md text-[0.65rem] sm:text-xs font-medium text-foreground/90 hover:text-foreground hover:ring-2 hover:ring-primary hover:scale-[1.06] transition-all shadow-sm"
            style={{
              gridColumn: p.x + 1,
              gridRow: p.y + 1,
              background: REGION_COLOR[p.region],
            }}
            title={`${p.ja} / ${p.en}`}
          >
            <span className="leading-tight text-center px-0.5 truncate">
              {lang === "ja" ? p.ja : p.en}
            </span>
            {counts && counts[p.slug] != null && (
              <span className="absolute bottom-0.5 right-1 text-[0.55rem] tabular-nums opacity-70">
                {counts[p.slug]}
              </span>
            )}
          </Link>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <Link
          to="/district/$slug"
          params={{ slug: hirei.slug }}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 text-sm font-medium hover:border-primary hover:text-primary transition-colors shadow-sm"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-primary" />
          {t("proportional")}
          {counts && counts[hirei.slug] != null && (
            <span className="ml-1 text-xs text-muted-foreground tabular-nums">({counts[hirei.slug]})</span>
          )}
        </Link>
      </div>
    </div>
  );
}
