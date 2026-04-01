import { Link, useLocation } from "react-router-dom";
import {
  Home,
  FolderOpen,
  Dna,
  MessageSquare,
  BarChart3,
  Globe,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";
import { useLocale } from "../i18n/context";
import { logout } from "../api/auth";
import Avatar from "./Avatar";

const NAV_ITEMS = [
  { path: "/", icon: Home, key: "nav.home" },
  { path: "/projects", icon: FolderOpen, key: "nav.projects" },
  { path: "/designer", icon: Dna, key: "nav.designer" },
  { path: "/chat", icon: MessageSquare, key: "nav.chat" },
  { path: "/analysis", icon: BarChart3, key: "nav.analysis" },
];

export default function Sidebar() {
  const { t, locale, setLocale } = useLocale();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <aside
      className={`flex flex-col h-screen bg-surface border-r border-border transition-all duration-200 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <span className="text-primary text-lg">◇</span>
            <span className="font-headline font-semibold text-[15px] tracking-wide text-text">
              CODON
            </span>
          </Link>
        )}
        {collapsed && (
          <Link to="/" className="mx-auto text-primary text-lg">
            ◇
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1 rounded-md text-text-dim hover:text-text-muted transition-colors ${
            collapsed ? "mx-auto mt-2" : ""
          }`}
        >
          <ChevronLeft
            size={16}
            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {!collapsed && (
          <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-text-dim">
            {t("nav.home") === "首页" ? "导航" : "Navigation"}
          </div>
        )}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                isActive
                  ? "bg-primary/8 text-primary"
                  : "text-text-muted hover:text-text hover:bg-card"
              } ${collapsed ? "justify-center px-0" : ""}`}
              title={collapsed ? t(item.key) : undefined}
            >
              <Icon size={18} strokeWidth={1.5} />
              {!collapsed && t(item.key)}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-3 space-y-1">
        <button
          onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] text-text-muted hover:text-text hover:bg-card transition-colors ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <Globe size={18} strokeWidth={1.5} />
          {!collapsed && (locale === "zh" ? "English" : "中文")}
        </button>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] text-text-muted hover:text-danger hover:bg-danger/5 transition-colors ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <LogOut size={18} strokeWidth={1.5} />
          {!collapsed && t("common.logout")}
        </button>
      </div>
    </aside>
  );
}
