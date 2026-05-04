import { Link, useLocation } from "react-router-dom";
import { Globe } from "lucide-react";
import { useLocale } from "../i18n/context";

const NAV_ITEMS = [
  { path: "/", key: "nav.home" },
  { path: "/designer", key: "nav.designer" },
  { path: "/projects", key: "nav.projects" },
  { path: "/analysis", key: "nav.analysis" },
];

export default function TopNav() {
  const { t, locale, setLocale } = useLocale();
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14 bg-bg/80 backdrop-blur-sm border-b border-border">
      <Link to="/" className="flex items-center gap-2">
        <span className="text-primary text-lg leading-none">◆</span>
        <span className="font-headline font-bold text-[14px] tracking-[0.25em] text-text">
          CODON
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-6">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`text-[13px] tracking-wide transition-colors relative py-1 ${
                isActive
                  ? "text-text font-medium"
                  : "text-text-muted hover:text-text font-light"
              }`}
            >
              {t(item.key)}
              {isActive && (
                <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
          className="p-1.5 rounded-md text-text-muted hover:text-text transition-colors"
        >
          <Globe size={16} />
        </button>
        <Link
          to="/projects"
          className="hidden md:block text-xs font-semibold px-4 py-2 bg-primary text-bg rounded-lg hover:bg-primary/90 transition-colors"
        >
          {t("home.cta")}
        </Link>
      </div>
    </nav>
  );
}
