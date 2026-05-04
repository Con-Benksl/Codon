import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  FolderOpen,
  Dna,
  BarChart3,
  Globe,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";
import { useLocale } from "../i18n/context";
import { useAuth } from "../auth/context";

const NAV_ITEMS = [
  { path: "/", icon: Home, key: "nav.home" },
  { path: "/designer", icon: Dna, key: "nav.designer" },
  { path: "/projects", icon: FolderOpen, key: "nav.projects" },
  { path: "/analysis", icon: BarChart3, key: "nav.analysis" },
];

export default function Sidebar() {
  const { t, locale, setLocale } = useLocale();
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={`sticky top-0 flex flex-col h-screen flex-shrink-0 bg-surface border-r border-white/10 transition-all duration-200 ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      <div className="flex items-center justify-between px-6 h-14 border-b border-white/10">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <span className="text-primary text-lg leading-none">◆</span>
            <span className="font-headline font-bold text-sm tracking-[0.25em] text-text">
              CODON
            </span>
          </Link>
        )}
        {collapsed && (
          <Link to="/" className="mx-auto text-primary text-lg leading-none">
            ◆
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg text-text-dim hover:text-text-muted transition-colors ${
            collapsed ? "mx-auto mt-2" : ""
          }`}
        >
          <ChevronLeft
            size={22}
            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <nav className="flex-1 py-5 px-3 space-y-1.5">
        {!collapsed && (
          <div className="px-4 py-3 text-xs uppercase tracking-[0.2em] text-text-dim font-semibold">
            {locale === "zh" ? "导航" : "Navigation"}
          </div>
        )}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : item.path === "/designer"
                ? location.pathname.includes("/designer")
                : item.path === "/projects"
                  ? location.pathname.startsWith("/projects") &&
                    !location.pathname.includes("/designer")
                  : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-lg font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted hover:text-text hover:bg-white/[0.04]"
              } ${collapsed ? "justify-center px-0" : ""}`}
              title={collapsed ? t(item.key) : undefined}
            >
              <Icon size={24} strokeWidth={1.6} />
              {!collapsed && t(item.key)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4 space-y-2">
        <button
          onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
          className={`flex items-center gap-4 w-full px-4 py-3 rounded-xl text-base font-medium text-text-muted hover:text-text hover:bg-white/[0.04] transition-colors ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <Globe size={22} strokeWidth={1.6} />
          {!collapsed && (locale === "zh" ? "English" : "中文")}
        </button>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-4 w-full px-4 py-3 rounded-xl text-base font-medium text-text-muted hover:text-danger hover:bg-danger/5 transition-colors ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <LogOut size={22} strokeWidth={1.6} />
          {!collapsed && t("common.logout")}
        </button>
      </div>
    </aside>
  );
}
