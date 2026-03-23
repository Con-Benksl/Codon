import { useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bell, FlaskConical, Monitor, Server, User2 } from "lucide-react";
import { buttonPress, fadeScale, viewTransition } from "../lib/motion";
import SettingsSectionContent, {
  type SettingsSectionKey,
  type SettingsState,
} from "../components/settings/SettingsSections";

const NAV_ITEMS: Array<{
  key: SettingsSectionKey;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}> = [
  { key: "user", label: "USER PROFILE", icon: User2 },
  { key: "display", label: "DISPLAY", icon: Monitor },
  { key: "notifications", label: "NOTIFICATIONS", icon: Bell },
  { key: "simulation", label: "SIMULATION", icon: FlaskConical },
  { key: "system", label: "SYSTEM", icon: Server },
];

const INITIAL_SETTINGS: SettingsState = {
  twoFactor: true,
  biometric: false,
  themePreset: "deep-space",
  accentColor: "blue",
  language: "中文",
  dataUnits: "SI",
  dateFormat: "ISO",
  reducedMotion: true,
  autoCollapseSidebar: true,
  widgetMarsGlobe: true,
  widgetStatusBar: true,
  widgetWeatherFeed: false,
  widgetAgentCount: true,
  widgetSolCalendar: false,
  widgetQuickActions: true,
  inAppAlerts: true,
  audioAlerts: false,
  desktopPush: true,
  criticalAlerts: true,
  warningAlerts: true,
  infoAlerts: false,
  agentEvents: true,
  quietHoursEnabled: false,
  quietFrom: "22:00",
  quietTo: "07:00",
  timeScale: 1,
  gravity: 0.38,
  atmosphere: "Mars Thin",
  growthModel: "Agent-Based",
  mutationRate: 0.001,
  batchSize: 2847,
  autoSave: true,
  apiEndpoint: "https://api.mars-lab.esa/",
  authToken: "********",
  timeoutSeconds: 30,
  retryLimit: 3,
};

export default function SettingsView() {
  const [activeSection, setActiveSection] = useState<SettingsSectionKey>("user");
  const [settings, setSettings] = useState<SettingsState>(INITIAL_SETTINGS);

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col gap-6 p-4 md:p-8 min-h-full"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-background">SETTINGS</h1>
        <p className="text-sm text-on-surface-variant font-body">系统配置与个人偏好</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6 min-h-[520px]">
        <aside className="md:w-[200px] shrink-0">
          <div className="glass-panel rounded-xl p-2 border border-outline-variant/20">
            <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = item.key === activeSection;
                return (
                  <motion.button
                    key={item.key}
                    type="button"
                    {...buttonPress}
                    onClick={() => setActiveSection(item.key)}
                    className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-left min-w-max md:min-w-0"
                  >
                    {active && <motion.span layoutId="settings-indicator" className="absolute inset-0 rounded-lg bg-surface-container" />}
                    <Icon size={14} className={`relative z-10 ${active ? "text-primary" : "text-on-surface-variant"}`} />
                    <span
                      className={`relative z-10 text-[11px] font-headline uppercase tracking-widest ${
                        active ? "text-primary" : "text-on-surface-variant"
                      }`}
                    >
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </nav>
          </div>
        </aside>

        <section className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              variants={fadeScale}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="glass-panel rounded-xl p-4 md:p-5 border border-outline-variant/20"
            >
              <SettingsSectionContent
                activeSection={activeSection}
                settings={settings}
                setSettings={setSettings}
              />
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </motion.div>
  );
}

