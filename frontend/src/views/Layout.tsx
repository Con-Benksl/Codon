/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, Fragment } from "react";
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
} from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { NavItem, Starfield, AmbientGlow, MarsStatusGlobe, Avatar } from "../components";

// ── 导航配置 — 单一数据源，添加新视图只需增加一项 ──
interface NavConfig {
  key: string;
  path: string;
  label: string;
  labelShort: string;   // 顶部导航/抽屉当前页显示
  icon: LucideIcon;
  disabled?: boolean;
  group: "main" | "util";
}

const NAV_ITEMS: NavConfig[] = [
  { key: "orchestrator", path: "/orchestrator", label: "协调者 (Orchestrator)", labelShort: "协调者", icon: LayoutGrid, group: "main" },
  { key: "environment",  path: "/environment",  label: "环境 (Environment)",    labelShort: "环境层",  icon: Zap,         group: "main" },
  { key: "synthesis",    path: "/synthesis",    label: "合成 (Synthesis)",      labelShort: "合成层",  icon: FlaskConical, group: "main" },
  { key: "simulation",   path: "/simulation",   label: "仿真 (Simulation)",     labelShort: "仿真层",  icon: Microscope,  group: "main" },
  { key: "output",       path: "/output",       label: "输出 (Output)",         labelShort: "输出层",  icon: Rocket,      group: "main" },
  { key: "diagnostics",  path: "/diagnostics",  label: "诊断 (Diagnostics)",    labelShort: "诊断",    icon: Terminal,    group: "util", disabled: true },
  { key: "settings",     path: "/settings",     label: "设置 (Settings)",       labelShort: "设置",    icon: Settings,    group: "util", disabled: true },
];

const MAIN_NAV = NAV_ITEMS.filter((n) => n.group === "main");
const UTIL_NAV = NAV_ITEMS.filter((n) => n.group === "util");

function getActiveKey(pathname: string): string {
  const match = NAV_ITEMS.find((n) => pathname === n.path || pathname.startsWith(n.path + "/"));
  return match?.key ?? "orchestrator";
}

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const activeKey = getActiveKey(location.pathname);
  const activeNav = NAV_ITEMS.find((n) => n.key === activeKey)!;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

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
      {/* Background layers */}
      <Starfield />
      <AmbientGlow />

      {/* TopAppBar — safe-h-header 让高度包含刘海安全区；safe-top 将内容推到安全区下方 */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-6 safe-h-header safe-top bg-surface-container/60 backdrop-blur-xl border-b border-outline-variant/15 shadow-[0_20px_50px_rgba(78,168,217,0.08)]">
        <div className="flex items-center gap-3">
          {/* 汉堡菜单 — 仅移动端，点击打开抽屉 */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-surface-variant/50 active:bg-surface-variant transition-all"
            onClick={() => setDrawerOpen(true)}
            aria-label="打开导航菜单"
          >
            <Menu size={20} className="text-on-surface-variant" />
          </button>

          <span className="text-xl md:text-2xl font-black tracking-tighter text-primary italic font-headline">
            MARTIAN BIOLAB AI
          </span>
          <div className="h-4 w-px bg-outline-variant/30 hidden md:block" />
          <h1 className="font-headline font-bold text-sm tracking-wider uppercase hidden lg:block text-on-surface-variant">
            火星定植生物体 多智能体设计系统
          </h1>
        </div>

        {/* 顶部导航 — 仅中大屏，由 MAIN_NAV 驱动 */}
        <nav className="hidden md:flex items-center gap-8 font-headline tracking-tighter text-sm uppercase">
          {MAIN_NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => goTo(item)}
              disabled={item.disabled}
              aria-disabled={item.disabled}
              title={item.disabled ? `${item.labelShort}（即将推出）` : undefined}
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
          <button className="hidden md:block p-3 rounded-full hover:bg-surface-variant/50 transition-all duration-200">
            <Globe size={20} className="text-on-surface-variant" />
          </button>
          <button className="p-3 rounded-full hover:bg-surface-variant/50 active:bg-surface-variant transition-all duration-200 relative">
            <Bell size={20} className="text-on-surface-variant" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full" />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="rounded-full hover:ring-2 hover:ring-primary/30 transition-all"
            aria-label="用户登录"
          >
            <Avatar
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0ORAVkaDRfKC82WQH48o6Rjy5A95bZ4XjbHS3YXCDhMCiHR3YoxMrA6rwY87HwOwJWMPfqa5A04Oa70ZGs03X-KYZYXA10i3duNza9ItcrgEMx27wjFiQ6RqX68VSKLgyX7OC0s04IL54AwM2efdCbIcM91_zDVq2obIhIAKstq-qGcrd_BLCRba696_E52aEmk4wHJFAEzXLV5r9SJHNjFe__o7MzFmfwks_fQqrXkpogdoWs2E3BQyUfUtSw2oM-JXTbRtINWU"
              alt="User Profile"
              name="Mars Operator"
              size={32}
            />
          </button>
        </div>
      </header>

      {/* 移动端侧边栏抽屉 */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-background/70 z-50 md:hidden"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            {/* 抽屉主体 — drag="x" 左滑关闭（dragConstraints.right=0 禁止右滑超出） */}
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
              aria-label="主导航菜单"
            >
              {/* 抽屉头部 — 高度与主 Header 同步，包含顶部安全区 */}
              <div className="flex items-center justify-between px-4 safe-h-header safe-top border-b border-outline-variant/15 shrink-0">
                <span className="text-base font-black tracking-tighter text-primary italic font-headline">
                  MARTIAN BIOLAB AI
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-lg hover:bg-surface-variant/50 active:bg-surface-variant transition-all"
                  aria-label="关闭导航菜单"
                >
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>
              {/* 当前页面指示器 */}
              <div className="px-4 py-3 border-b border-outline-variant/10">
                <p className="text-[10px] text-on-surface-variant font-headline uppercase tracking-widest">
                  当前：
                  <span className="text-primary ml-1">{activeNav.labelShort}视图</span>
                </p>
              </div>
              {renderSideNav(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 桌面端侧边栏 — 仅 md+ 显示，hover 展开 */}
      <aside className="hidden md:flex fixed left-0 top-16 h-[calc(100vh-64px)] z-40 flex-col bg-background border-r border-outline-variant/15 w-20 hover:w-64 transition-all duration-300 group overflow-hidden">
        {renderSideNav(false)}
      </aside>

      {/* 主内容区 — safe-pt-main 包含 header + 刘海安全区；safe-pb-main 包含 Home 条 */}
      <main className="ml-0 md:ml-20 safe-pt-main safe-pb-main px-4 md:px-8 min-h-screen">
        <Outlet />
      </main>

      {/* Mars 状态球 — 仅 xl+ 显示 */}
      <MarsStatusGlobe
        activeView={activeKey as "orchestrator" | "environment" | "synthesis" | "simulation" | "output" | "diagnostics" | "settings"}
        onNavigate={() => goTo(NAV_ITEMS.find((n) => n.key === "environment")!)}
      />
    </div>
  );
}
