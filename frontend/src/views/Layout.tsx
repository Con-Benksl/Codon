/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, Fragment } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  Zap,
  FlaskConical,
  Microscope,
  Rocket,
  Terminal,
  Settings,
  Bell,
  Globe,
  Network,
  Menu,
  X,
  FolderOpen,
  LogOut,
  LogIn,
  ChevronDown,
} from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { NavItem, Starfield, AmbientGlow, MarsStatusGlobe, Avatar } from "../components";
import { getCurrentUser, logout, type User } from "../api";
import { useLocale } from "../i18n/context";

interface NavConfig {
  key: string;
  path: string;
  label: string;
  labelShort: string;
  icon: LucideIcon;
  disabled?: boolean;
  group: "main" | "util";
}

function buildNavItems(t: (k: string) => string): NavConfig[] {
  return [
    {
      key: "projects",
      path: "/projects",
      label: t("nav_label.projects"),
      labelShort: t("nav.projects"),
      icon: FolderOpen,
      group: "main",
    },
    {
      key: "orchestrator",
      path: "/orchestrator",
      label: t("nav_label.orchestrator"),
      labelShort: t("nav.orchestrator"),
      icon: LayoutGrid,
      group: "main",
    },
    {
      key: "environment",
      path: "/environment",
      label: t("nav_label.environment"),
      labelShort: t("nav.environment"),
      icon: Zap,
      group: "main",
    },
    {
      key: "synthesis",
      path: "/synthesis",
      label: t("nav_label.synthesis"),
      labelShort: t("nav.synthesis"),
      icon: FlaskConical,
      group: "main",
    },
    {
      key: "simulation",
      path: "/simulation",
      label: t("nav_label.simulation"),
      labelShort: t("nav.simulation"),
      icon: Microscope,
      group: "main",
    },
    {
      key: "output",
      path: "/output",
      label: t("nav_label.output"),
      labelShort: t("nav.output"),
      icon: Rocket,
      group: "main",
    },
    {
      key: "diagnostics",
      path: "/diagnostics",
      label: t("nav_label.diagnostics"),
      labelShort: t("nav.diagnostics"),
      icon: Terminal,
      group: "util",
    },
    {
      key: "settings",
      path: "/settings",
      label: t("nav_label.settings"),
      labelShort: t("nav.settings"),
      icon: Settings,
      group: "util",
    },
  ];
}

function getActiveKey(pathname: string, navItems: NavConfig[]): string {
  const match = navItems.find((n) => pathname === n.path || pathname.startsWith(`${n.path}/`));
  return match?.key ?? "orchestrator";
}

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { locale, setLocale, t } = useLocale();

  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const NAV_ITEMS = buildNavItems(t);
  const MAIN_NAV = NAV_ITEMS.filter((n) => n.group === "main");
  const UTIL_NAV = NAV_ITEMS.filter((n) => n.group === "util");

  const activeKey = getActiveKey(location.pathname, NAV_ITEMS);
  const activeNav = NAV_ITEMS.find((n) => n.key === activeKey) ?? NAV_ITEMS[0];

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
      setDrawerOpen(false);
    }
  };

  const renderSideNav = (showLabels: boolean) => (
    <>
      <div className="p-4 flex flex-col gap-4 flex-1">
        {MAIN_NAV.map((item) => (
          <Fragment key={item.key}>
            <NavItem
              icon={item.icon}
              label={item.label}
              active={activeKey === item.key}
              disabled={item.disabled}
              alwaysShowLabel={showLabels}
              onClick={() => goTo(item)}
            />
          </Fragment>
        ))}
      </div>

      <div className="p-4 border-t border-outline-variant/10 flex flex-col gap-2 safe-bottom">
        {UTIL_NAV.map((item) => (
          <Fragment key={item.key}>
            <NavItem
              icon={item.icon}
              label={item.label}
              disabled={item.disabled}
              alwaysShowLabel={showLabels}
              onClick={() => goTo(item)}
            />
          </Fragment>
        ))}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary/30 selection:text-primary">
      <Starfield />
      <AmbientGlow />

      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-6 safe-h-header safe-top bg-surface-container/60 backdrop-blur-xl border-b border-outline-variant/15 shadow-[0_20px_50px_rgba(78,168,217,0.08)]">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-surface-variant/50 active:bg-surface-variant transition-all"
            onClick={() => setDrawerOpen(true)}
            aria-label={t("header.openMenu")}
          >
            <Menu size={20} className="text-on-surface-variant" />
          </button>

          <span className="text-xl md:text-2xl font-black tracking-tighter text-primary italic font-headline">
            MARTIAN BIOLAB AI
          </span>
          <div className="h-4 w-px bg-outline-variant/30 hidden md:block" />
          <h1 className="font-headline font-bold text-sm tracking-wider uppercase hidden lg:block text-on-surface-variant">
            {t("header.subtitle")}
          </h1>
        </div>

        <nav className="hidden md:flex items-center gap-8 font-headline tracking-tighter text-sm uppercase">
          {MAIN_NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => goTo(item)}
              disabled={item.disabled}
              aria-disabled={item.disabled}
              title={item.disabled ? `${item.labelShort} (${t("header.comingSoon")})` : undefined}
              className={`transition-colors ${
                item.disabled
                  ? "text-on-surface-variant/40 cursor-not-allowed select-none"
                  : activeKey === item.key
                    ? "text-primary border-b-2 border-primary pb-1"
                    : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {item.labelShort}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <button className="hidden md:block p-3 rounded-full hover:bg-surface-variant/50 transition-all duration-200">
            <Network size={20} className="text-primary" />
          </button>

          <button
            onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
            className="hidden md:flex items-center gap-1 p-3 rounded-full hover:bg-surface-variant/50 relative"
            aria-label="Toggle language"
          >
            <Globe size={20} className={locale === "en" ? "text-primary" : "text-on-surface-variant"} />
            <span className="text-[9px] font-headline font-bold text-primary leading-none">
              {t("header.langLabel")}
            </span>
          </button>

          <button className="p-3 rounded-full hover:bg-surface-variant/50 active:bg-surface-variant transition-all duration-200 relative">
            <Bell size={20} className="text-on-surface-variant" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full" />
          </button>

          {user ? (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-surface-variant/40 transition-all group"
                aria-label={t("header.userMenu")}
              >
                <Avatar alt={user.username} name={user.username} size={32} />
                <ChevronDown
                  size={12}
                  className={`text-on-surface-variant/50 transition-transform duration-200 hidden md:block ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="absolute right-0 top-[calc(100%+8px)] w-56 glass-panel rounded-xl border border-outline-variant/20 shadow-[0_16px_40px_rgba(0,0,0,0.4)] overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-outline-variant/15">
                      <div className="flex items-center gap-3">
                        <Avatar alt={user.username} name={user.username} size={36} />
                        <div className="min-w-0">
                          <p className="font-headline font-bold text-on-surface text-xs uppercase tracking-tight truncate">
                            {user.username}
                          </p>
                          <p className="text-[10px] text-on-surface-variant/60 font-body truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          navigate("/projects");
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors text-left"
                      >
                        <FolderOpen size={14} className="text-primary/70 shrink-0" />
                        <span className="text-xs font-headline uppercase tracking-wider">{t("header.myProjects")}</span>
                      </button>

                      <div className="h-px bg-outline-variant/10 my-1" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-secondary/10 transition-colors text-left"
                      >
                        <LogOut size={14} className="shrink-0" />
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-headline tracking-wider uppercase hover:bg-primary/20 transition-colors"
            >
              <LogIn size={16} />
              <span className="hidden md:inline">{t("header.signIn")}</span>
            </button>
          )}
        </div>
      </header>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-background/70 z-50 md:hidden"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              drag="x"
              dragConstraints={{ right: 0 }}
              dragElastic={{ right: 0, left: 0.3 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60 || info.velocity.x < -400) setDrawerOpen(false);
              }}
              className="fixed left-0 top-0 h-full w-72 z-50 bg-background border-r border-outline-variant/20 flex flex-col md:hidden shadow-2xl"
              aria-label="Primary navigation"
            >
              <div className="flex items-center justify-between px-4 safe-h-header safe-top border-b border-outline-variant/15 shrink-0">
                <span className="text-base font-black tracking-tighter text-primary italic font-headline">
                  MARTIAN BIOLAB AI
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-lg hover:bg-surface-variant/50 active:bg-surface-variant transition-all"
                  aria-label={t("header.closeMenu")}
                >
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>

              <div className="px-4 py-3 border-b border-outline-variant/10">
                <p className="text-[10px] text-on-surface-variant font-headline uppercase tracking-widest">
                  {t("header.current")}
                  <span className="text-primary ml-1">
                    {activeNav.labelShort} {t("header.view")}
                  </span>
                </p>
              </div>

              {renderSideNav(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside className="hidden md:flex fixed left-0 top-16 h-[calc(100vh-64px)] z-40 flex-col bg-background border-r border-outline-variant/15 w-20 hover:w-64 transition-all duration-300 group overflow-hidden">
        {renderSideNav(false)}
      </aside>

      <main className="ml-0 md:ml-20 safe-pt-main safe-pb-main px-4 md:px-8 min-h-screen">
        <Outlet />
      </main>

      <MarsStatusGlobe
        activeView={
          activeKey as
            | "projects"
            | "orchestrator"
            | "environment"
            | "synthesis"
            | "simulation"
            | "output"
            | "diagnostics"
            | "settings"
        }
        onNavigate={() => {
          const environmentItem = NAV_ITEMS.find((n) => n.key === "environment");
          if (environmentItem) goTo(environmentItem);
        }}
      />
    </div>
  );
}