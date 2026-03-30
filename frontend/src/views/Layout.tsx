/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Starfield, AmbientGlow, Avatar, TelemetryTicker, Icon } from "../components";
import { getCurrentUser, logout, type User } from "../api";
import { useLocale } from "../i18n/context";

interface NavConfig {
  key: string;
  path: string;
  label: string;
  labelShort: string;
  iconName: string;
  disabled?: boolean;
}

function buildNavItems(t: (k: string) => string): NavConfig[] {
  return [
    {
      key: "orchestrator",
      path: "/orchestrator",
      label: t("nav_label.orchestrator"),
      labelShort: t("nav.orchestrator"),
      iconName: "hub",
    },
    {
      key: "command",
      path: "/command",
      label: t("nav_label.command"),
      labelShort: t("nav.command"),
      iconName: "chat",
    },
    {
      key: "synthesis",
      path: "/synthesis",
      label: t("nav_label.synthesis"),
      labelShort: t("nav.synthesis"),
      iconName: "science",
    },
    {
      key: "environment",
      path: "/environment",
      label: t("nav_label.environment"),
      labelShort: t("nav.environment"),
      iconName: "biotech",
    },
    {
      key: "projects",
      path: "/projects",
      label: t("nav_label.projects"),
      labelShort: t("nav.projects"),
      iconName: "folder_open",
    },
  ];
}

function getActiveKey(pathname: string, navItems: NavConfig[]): string {
  const match = navItems.find((n) => pathname === n.path || pathname.startsWith(`${n.path}/`));
  return match?.key ?? "orchestrator";
}

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { locale, setLocale, t } = useLocale();

  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const NAV_ITEMS = buildNavItems(t);
  const activeKey = getActiveKey(location.pathname, NAV_ITEMS);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login");
  };

  const goTo = (item: NavConfig) => {
    if (!item.disabled) {
      navigate(item.path);
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-on-background font-body selection:bg-primary/30 selection:text-primary">
      <Starfield />
      <AmbientGlow />

      {/* ── Header ── */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 lg:px-10 h-16 bg-[rgba(5,5,10,0.6)] backdrop-blur-[48px] border-b border-[rgba(255,255,255,0.06)]">
        {/* Left: Logo + Mobile hamburger */}
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors"
            onClick={() => setMobileMenuOpen(true)}
            aria-label={t("header.openMenu")}
          >
            <Icon name="menu" size={22} className="text-muted" />
          </button>

          <span className="text-lg font-bold tracking-[0.15em] text-primary font-headline uppercase">
            MARTIAN BIOLAB
          </span>
        </div>

        {/* Center: Horizontal nav (desktop) */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => goTo(item)}
              disabled={item.disabled}
              className={`relative px-4 py-2 text-xs font-headline tracking-[0.1em] uppercase transition-colors rounded-lg ${
                item.disabled
                  ? "text-muted/40 cursor-not-allowed"
                  : activeKey === item.key
                    ? "text-primary"
                    : "text-muted hover:text-on-surface hover:bg-[rgba(255,255,255,0.03)]"
              }`}
            >
              {item.labelShort}
              {activeKey === item.key && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Right: Live indicator + Lang + User */}
        <div className="flex items-center gap-3">
          {/* Live feed indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-dot-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-muted uppercase">Live</span>
          </div>

          {/* Language toggle */}
          <button
            onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors"
            aria-label="Toggle language"
          >
            <Icon name="language" size={18} className="text-muted" />
            <span className="text-[10px] font-headline font-bold text-primary tracking-wider">
              {t("header.langLabel")}
            </span>
          </button>

          {/* User menu */}
          {user ? (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                aria-label={t("header.userMenu")}
              >
                <Avatar alt={user.username} name={user.username} size={30} />
                <Icon
                  name="expand_more"
                  size={16}
                  className={`text-muted transition-transform duration-200 hidden md:block ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="absolute right-0 top-[calc(100%+8px)] w-56 glass-panel-sm overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
                      <div className="flex items-center gap-3">
                        <Avatar alt={user.username} name={user.username} size={36} />
                        <div className="min-w-0">
                          <p className="font-headline font-bold text-on-surface text-xs uppercase tracking-tight truncate">
                            {user.username}
                          </p>
                          <p className="text-[10px] text-muted truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-1.5">
                      <button
                        onClick={() => { navigate("/projects"); setMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted hover:text-on-surface hover:bg-[rgba(255,255,255,0.04)] transition-colors text-left"
                      >
                        <Icon name="folder_open" size={16} className="text-primary/70" />
                        <span className="text-xs font-headline uppercase tracking-wider">{t("header.myProjects")}</span>
                      </button>

                      <div className="h-px bg-[rgba(255,255,255,0.06)] my-1" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted hover:text-secondary hover:bg-secondary/10 transition-colors text-left"
                      >
                        <Icon name="logout" size={16} />
                        <span className="text-xs font-headline uppercase tracking-wider">{t("header.signOut")}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-headline tracking-wider uppercase hover:bg-primary/20 transition-colors"
            >
              <Icon name="login" size={16} />
              <span className="hidden md:inline">{t("header.signIn")}</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Mobile Menu Overlay ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-[rgba(5,5,10,0.8)] z-50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="fixed top-0 left-0 right-0 z-50 lg:hidden glass-panel rounded-b-[32px] p-6 pt-20"
            >
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)]"
                aria-label={t("header.closeMenu")}
              >
                <Icon name="close" size={22} className="text-muted" />
              </button>

              <nav className="flex flex-col gap-2">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => goTo(item)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-colors ${
                      activeKey === item.key
                        ? "text-primary bg-primary/10"
                        : "text-muted hover:text-on-surface hover:bg-[rgba(255,255,255,0.03)]"
                    }`}
                  >
                    <Icon name={item.iconName} size={22} />
                    <span className="text-sm font-headline tracking-[0.05em] uppercase">{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* Mobile lang toggle */}
              <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                <button
                  onClick={() => { setLocale(locale === "zh" ? "en" : "zh"); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted hover:text-on-surface hover:bg-[rgba(255,255,255,0.03)] transition-colors w-full text-left"
                >
                  <Icon name="language" size={22} />
                  <span className="text-sm font-headline tracking-wider">{t("header.langLabel")}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <main className="pt-20 pb-14 px-6 lg:px-10 min-h-screen">
        <Outlet />
      </main>

      {/* ── Bottom Telemetry Ticker ── */}
      <TelemetryTicker />
    </div>
  );
}
