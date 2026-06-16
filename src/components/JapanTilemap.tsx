import { Link } from "@tanstack/react-router";
import { PREFECTURES, REGION_COLOR } from "@/lib/prefectures";
import { useI18n } from "@/lib/i18n";

const GRID_COLS = 11;
const GRID_ROWS = 12;

export function JapanTilemap({ counts }: { counts?: Record<string, number> }) {
  const { lang, t } = useI18n();
  const tiles = PREFECTURES;

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
        {tiles.map(p => {
          const isHirei = p.slug === "hirei";
          return (
            <Link
              key={p.slug}
              to="/district/$slug"
              params={{ slug: p.slug }}
              className={`group relative flex items-center justify-center rounded-md text-[0.65rem] sm:text-xs font-medium text-foreground/90 hover:text-foreground hover:ring-2 hover:ring-primary hover:scale-[1.06] transition-all shadow-sm ${isHirei ? "ring-1 ring-primary/60 ring-dashed text-sm sm:text-base" : ""}`}
              style={{
                gridColumn: isHirei ? `${p.x + 1} / span 2` : p.x + 1,
                gridRow: isHirei ? `${p.y + 1} / span 2` : p.y + 1,
                background: REGION_COLOR[p.region],
              }}
              title={isHirei ? t("proportional") : `${p.ja} / ${p.en}`}
            >
              <span className="leading-tight text-center px-0.5 truncate">
                {isHirei ? t("proportional") : (lang === "ja" ? p.ja : p.en)}
              </span>
              {counts && counts[p.slug] != null && (
                <span className="absolute bottom-0.5 right-1 text-[0.7rem] sm:text-xs font-semibold tabular-nums text-foreground/80">
                  {counts[p.slug]}
                </span>
              )}

            </Link>
          );
        })}
      </div>
    </div>
  );
}
