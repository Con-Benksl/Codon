/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { AnimatePresence } from "motion/react";
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
  Network
} from "lucide-react";
import { NavItem, Starfield, AmbientGlow, MarsStatusGlobe } from "./components";
import OrchestratorView from "./views/OrchestratorView";
import EnvironmentView from "./views/EnvironmentView";

export default function App() {
  const [activeView, setActiveView] = useState<"orchestrator" | "environment">("orchestrator");

  return (
    <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary/30 selection:text-primary">
      {/* Background layers */}
      <Starfield />
      <AmbientGlow />

      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-surface-container/60 backdrop-blur-xl border-b border-outline-variant/15 shadow-[0_20px_50px_rgba(78,168,217,0.08)]">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-black tracking-tighter text-primary italic font-headline">MARTIAN BIOLAB AI</span>
          <div className="h-4 w-px bg-outline-variant/30 hidden md:block"></div>
          <h1 className="font-headline font-bold text-sm tracking-wider uppercase hidden lg:block text-on-surface-variant">火星定植生物体 多智能体设计系统</h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 font-headline tracking-tighter text-sm uppercase">
          <button 
            onClick={() => setActiveView("orchestrator")}
            className={`transition-colors ${activeView === "orchestrator" ? "text-primary border-b-2 border-primary pb-1" : "text-on-surface-variant hover:text-primary"}`}
          >
            协调者
          </button>
          <button 
            onClick={() => setActiveView("environment")}
            className={`transition-colors ${activeView === "environment" ? "text-primary border-b-2 border-primary pb-1" : "text-on-surface-variant hover:text-primary"}`}
          >
            环境层
          </button>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">设计层</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">核查层</a>
        </nav>

        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-surface-variant/50 transition-all duration-200">
            <Network size={20} className="text-primary" />
          </button>
          <button className="p-2 rounded-full hover:bg-surface-variant/50 transition-all duration-200">
            <Globe size={20} className="text-on-surface-variant" />
          </button>
          <button className="p-2 rounded-full hover:bg-surface-variant/50 transition-all duration-200 relative">
            <Bell size={20} className="text-on-surface-variant" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full"></span>
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0ORAVkaDRfKC82WQH48o6Rjy5A95bZ4XjbHS3YXCDhMCiHR3YoxMrA6rwY87HwOwJWMPfqa5A04Oa70ZGs03X-KYZYXA10i3duNza9ItcrgEMx27wjFiQ6RqX68VSKLgyX7OC0s04IL54AwM2efdCbIcM91_zDVq2obIhIAKstq-qGcrd_BLCRba696_E52aEmk4wHJFAEzXLV5r9SJHNjFe__o7MzFmfwks_fQqrXkpogdoWs2E3BQyUfUtSw2oM-JXTbRtINWU" 
              alt="User Profile" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      {/* SideNavBar */}
      <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] z-40 flex flex-col bg-background border-r border-outline-variant/15 w-20 hover:w-64 transition-all duration-300 group overflow-hidden">
        <div className="p-4 flex flex-col gap-6 flex-1">
          <NavItem 
            icon={LayoutGrid} 
            label="协调者 (Orchestrator)" 
            active={activeView === "orchestrator"} 
            onClick={() => setActiveView("orchestrator")}
          />
          <NavItem 
            icon={Zap} 
            label="环境 (Environment)" 
            active={activeView === "environment"} 
            onClick={() => setActiveView("environment")}
          />
          <NavItem icon={FlaskConical} label="合成 (Synthesis)" />
          <NavItem icon={Microscope} label="仿真 (Simulation)" />
          <NavItem icon={Rocket} label="输出 (Output)" />
        </div>
        <div className="p-4 border-t border-outline-variant/10 flex flex-col gap-2">
          <NavItem icon={Terminal} label="诊断 (Diagnostics)" />
          <NavItem icon={Settings} label="设置 (Settings)" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-20 pt-20 pb-24 px-8 min-h-screen">
        <AnimatePresence mode="wait">
          {activeView === "orchestrator" ? (
            <OrchestratorView key="orchestrator" />
          ) : (
            <EnvironmentView key="environment" />
          )}
        </AnimatePresence>
      </main>

      {/* Interactive Mars Status Globe */}
      <MarsStatusGlobe
        activeView={activeView}
        onNavigate={() => setActiveView("environment")}
      />
    </div>
  );
}
