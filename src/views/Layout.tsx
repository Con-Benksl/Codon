/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
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

type ViewKey = "orchestrator" | "environment";

const viewRouteMap: Record<string, ViewKey> = {
  "/": "orchestrator",
  "/orchestrator": "orchestrator",
  "/environment": "environment",
};

const routeFromView: Record<ViewKey, string> = {
  orchestrator: "/orchestrator",
  environment: "/environment",
};

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const activeView = viewRouteMap[location.pathname] ?? "orchestrator";

  const goTo = (view: ViewKey) => {
    navigate(routeFromView[view]);
    setDrawerOpen(false);
  };

  /**
   * 侧边栏导航内容
   * @param showLabels — 抽屉模式传 true，始终显示标签；桌面悬浮模式传 false
   */
  const renderSideNav = (showLabels: boolean) => (
    <>
      <div className="p-4 flex flex-col gap-4 flex-1">
        <NavItem
          icon={LayoutGrid}
          label="协调者 (Orchestrator)"
          active={activeView === "orchestrator"}
          alwaysShowLabel={showLabels}
          onClick={() => goTo("orchestrator")}
        />
        <NavItem
          icon={Zap}
          label="环境 (Environment)"
          active={activeView === "environment"}
          alwaysShowLabel={showLabels}
          onClick={() => goTo("environment")}
        />
        <NavItem icon={FlaskConical} label="合成 (Synthesis)" disabled alwaysShowLabel={showLabels} />
        <NavItem icon={Microscope} label="仿真 (Simulation)" disabled alwaysShowLabel={showLabels} />
        <NavItem icon={Rocket} label="输出 (Output)" disabled alwaysShowLabel={showLabels} />
      </div>
      <div className="p-4 border-t border-outline-variant/10 flex flex-col gap-2">
        <NavItem icon={Terminal} label="诊断 (Diagnostics)" disabled alwaysShowLabel={showLabels} />
        <NavItem icon={Settings} label="设置 (Settings)" disabled alwaysShowLabel={showLabels} />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary/30 selection:text-primary">
      {/* Background layers */}
      <Starfield />
      <AmbientGlow />

      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-6 h-16 bg-surface-container/60 backdrop-blur-xl border-b border-outline-variant/15 shadow-[0_20px_50px_rgba(78,168,217,0.08)]">
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

        {/* 顶部导航 — 仅中大屏 */}
        <nav className="hidden md:flex items-center gap-8 font-headline tracking-tighter text-sm uppercase">
          <button
            onClick={() => goTo("orchestrator")}
            className={`transition-colors ${
              activeView === "orchestrator"
                ? "text-primary border-b-2 border-primary pb-1"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            协调者
          </button>
          <button
            onClick={() => goTo("environment")}
            className={`transition-colors ${
              activeView === "environment"
                ? "text-primary border-b-2 border-primary pb-1"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            环境层
          </button>
          <button
            disabled
            aria-disabled="true"
            title="设计层（即将推出）"
            className="text-on-surface-variant/40 cursor-not-allowed select-none"
          >
            设计层
          </button>
          <button
            disabled
            aria-disabled="true"
            title="核查层（即将推出）"
            className="text-on-surface-variant/40 cursor-not-allowed select-none"
          >
            核查层
          </button>
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <button className="hidden md:block p-2 rounded-full hover:bg-surface-variant/50 transition-all duration-200">
            <Network size={20} className="text-primary" />
          </button>
          <button className="hidden md:block p-2 rounded-full hover:bg-surface-variant/50 transition-all duration-200">
            <Globe size={20} className="text-on-surface-variant" />
          </button>
          <button className="p-2 rounded-full hover:bg-surface-variant/50 active:bg-surface-variant transition-all duration-200 relative">
            <Bell size={20} className="text-on-surface-variant" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full" />
          </button>
          <Avatar
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0ORAVkaDRfKC82WQH48o6Rjy5A95bZ4XjbHS3YXCDhMCiHR3YoxMrA6rwY87HwOwJWMPfqa5A04Oa70ZGs03X-KYZYXA10i3duNza9ItcrgEMx27wjFiQ6RqX68VSKLgyX7OC0s04IL54AwM2efdCbIcM91_zDVq2obIhIAKstq-qGcrd_BLCRba696_E52aEmk4wHJFAEzXLV5r9SJHNjFe__o7MzFmfwks_fQqrXkpogdoWs2E3BQyUfUtSw2oM-JXTbRtINWU"
            alt="User Profile"
            name="Mars Operator"
            size={32}
          />
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
            {/* 抽屉主体 */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 h-full w-72 z-50 bg-background border-r border-outline-variant/20 flex flex-col md:hidden shadow-2xl"
              aria-label="主导航菜单"
            >
              {/* 抽屉头部 */}
              <div className="flex items-center justify-between px-4 h-16 border-b border-outline-variant/15 shrink-0">
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
                  <span className="text-primary ml-1">
                    {activeView === "orchestrator" ? "协调者视图" : "环境监测视图"}
                  </span>
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

      {/* 主内容区 */}
      <main className="ml-0 md:ml-20 pt-16 md:pt-20 pb-8 px-4 md:px-8 min-h-screen">
        <AnimatePresence mode="wait">
          <div key={location.pathname}>
            <Outlet />
          </div>
        </AnimatePresence>
      </main>

      {/* Mars 状态球 — 仅 xl+ 显示 */}
      <MarsStatusGlobe
        activeView={activeView}
        onNavigate={() => goTo("environment")}
      />
    </div>
  );
}
