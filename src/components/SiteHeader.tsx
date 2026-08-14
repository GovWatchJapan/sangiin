import { Link } from "@tanstack/react-router";
import { useI18n, type Lang } from "@/lib/i18n";

export function SiteHeader() {
  const { lang, setLang, t } = useI18n();
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 group">
          <span className="w-9 h-9 rounded-md bg-primary text-primary-foreground grid place-items-center font-display text-xl font-bold shadow-sm">
            参
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-lg sm:text-xl font-semibold">{t("site_title")}</span>
            <span className="text-[0.7rem] text-muted-foreground hidden sm:block">{t("site_tag")}</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {(["ja", "en"] as Lang[]).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                lang === l
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={lang === l}
            >
              {l === "ja" ? "日本語" : "EN"}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
