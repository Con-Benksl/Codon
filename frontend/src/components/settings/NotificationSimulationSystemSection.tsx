import type { Dispatch, SetStateAction } from "react";
import { motion } from "motion/react";
import { stagger } from "../../lib/motion";
import type { SettingsState } from "./types";
import { SectionBlock, SelectField, ToggleSwitch } from "./SettingsPrimitives";

interface SectionProps {
  settings: SettingsState;
  setSettings: Dispatch<SetStateAction<SettingsState>>;
}

export function NotificationsSection({ settings, setSettings }: SectionProps) {
  return (
    <motion.div variants={stagger(70)} initial="hidden" animate="show" className="space-y-4">
      <SectionBlock title="ALERT CHANNELS">
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between"><span className="text-on-surface-variant">In-App Alerts</span><ToggleSwitch checked={settings.inAppAlerts} onClick={() => setSettings((prev) => ({ ...prev, inAppAlerts: !prev.inAppAlerts }))} /></div>
          <div className="h-px bg-outline-variant/20" />
          <div className="flex items-center justify-between"><span className="text-on-surface-variant">Audio Alerts</span><ToggleSwitch checked={settings.audioAlerts} onClick={() => setSettings((prev) => ({ ...prev, audioAlerts: !prev.audioAlerts }))} /></div>
          <div className="h-px bg-outline-variant/20" />
          <div className="flex items-center justify-between"><span className="text-on-surface-variant">Desktop Push</span><ToggleSwitch checked={settings.desktopPush} onClick={() => setSettings((prev) => ({ ...prev, desktopPush: !prev.desktopPush }))} /></div>
        </div>
      </SectionBlock>

      <SectionBlock title="ALERT THRESHOLDS">
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between"><span className="text-on-surface-variant">CRITICAL Alerts</span><ToggleSwitch checked={settings.criticalAlerts} onClick={() => setSettings((prev) => ({ ...prev, criticalAlerts: !prev.criticalAlerts }))} /></div>
          <div className="h-px bg-outline-variant/20" />
          <div className="flex items-center justify-between"><span className="text-on-surface-variant">WARNING Alerts</span><ToggleSwitch checked={settings.warningAlerts} onClick={() => setSettings((prev) => ({ ...prev, warningAlerts: !prev.warningAlerts }))} /></div>
          <div className="h-px bg-outline-variant/20" />
          <div className="flex items-center justify-between"><span className="text-on-surface-variant">INFO Alerts</span><ToggleSwitch checked={settings.infoAlerts} onClick={() => setSettings((prev) => ({ ...prev, infoAlerts: !prev.infoAlerts }))} /></div>
          <div className="h-px bg-outline-variant/20" />
          <div className="flex items-center justify-between"><span className="text-on-surface-variant">Agent Events</span><ToggleSwitch checked={settings.agentEvents} onClick={() => setSettings((prev) => ({ ...prev, agentEvents: !prev.agentEvents }))} /></div>
        </div>
      </SectionBlock>

      <SectionBlock title="QUIET HOURS">
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">Enable Quiet Hours</span>
            <ToggleSwitch checked={settings.quietHoursEnabled} onClick={() => setSettings((prev) => ({ ...prev, quietHoursEnabled: !prev.quietHoursEnabled }))} />
          </div>
          <div className="h-px bg-outline-variant/20" />
          <div className={`flex items-center gap-3 ${settings.quietHoursEnabled ? "opacity-100" : "opacity-50"}`}>
            <span className="text-on-surface-variant">From</span>
            <input
              type="time"
              disabled={!settings.quietHoursEnabled}
              value={settings.quietFrom}
              onChange={(event) => setSettings((prev) => ({ ...prev, quietFrom: event.target.value }))}
              className="bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-body rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary/50"
            />
            <span className="text-on-surface-variant">To</span>
            <input
              type="time"
              disabled={!settings.quietHoursEnabled}
              value={settings.quietTo}
              onChange={(event) => setSettings((prev) => ({ ...prev, quietTo: event.target.value }))}
              className="bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-body rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
      </SectionBlock>
    </motion.div>
  );
}

export function SimulationSection({ settings, setSettings }: SectionProps) {
  return (
    <motion.div variants={stagger(70)} initial="hidden" animate="show" className="space-y-4">
      <SectionBlock title="SIMULATION PARAMETERS">
        <div className="space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1.5"><span className="text-on-surface-variant">Time Scale</span><span className="text-on-surface">{settings.timeScale.toFixed(1)}x</span></div>
            <input type="range" min={0.1} max={10} step={0.1} value={settings.timeScale} onChange={(event) => setSettings((prev) => ({ ...prev, timeScale: Number(event.target.value) }))} className="w-full accent-primary h-1" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5"><span className="text-on-surface-variant">Gravity</span><span className="text-on-surface">{settings.gravity.toFixed(2)}g</span></div>
            <input type="range" min={0.1} max={1} step={0.01} value={settings.gravity} onChange={(event) => setSettings((prev) => ({ ...prev, gravity: Number(event.target.value) }))} className="w-full accent-primary h-1" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-on-surface-variant">Atmospheric</span>
            <SelectField value={settings.atmosphere} onChange={(value) => setSettings((prev) => ({ ...prev, atmosphere: value }))} options={["Mars Thin", "Terraformed", "Earth-like"]} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-on-surface-variant">Solar Distance</span>
            <span className="text-on-surface">1.524 AU</span>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock title="BIOLOGY ENGINE">
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-on-surface-variant">Growth Model</span>
            <SelectField value={settings.growthModel} onChange={(value) => setSettings((prev) => ({ ...prev, growthModel: value }))} options={["Linear", "Logistic", "Agent-Based"]} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5"><span className="text-on-surface-variant">Mutation Rate</span><span className="text-on-surface">{settings.mutationRate.toFixed(3)} per generation</span></div>
            <input type="range" min={0} max={0.01} step={0.0001} value={settings.mutationRate} onChange={(event) => setSettings((prev) => ({ ...prev, mutationRate: Number(event.target.value) }))} className="w-full accent-primary h-1" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-on-surface-variant">Batch Size</span>
            <input
              type="number"
              min={1}
              value={settings.batchSize}
              onChange={(event) => setSettings((prev) => ({ ...prev, batchSize: Number(event.target.value) }))}
              className="w-40 bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-body rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-on-surface">Auto-Save</p>
              <p className="text-on-surface-variant">every 100 ticks</p>
            </div>
            <ToggleSwitch checked={settings.autoSave} onClick={() => setSettings((prev) => ({ ...prev, autoSave: !prev.autoSave }))} />
          </div>
        </div>
      </SectionBlock>

      <SectionBlock title="DANGER ZONE">
        <div className="flex flex-wrap items-center gap-2">
          <button className="px-4 py-2 rounded-lg bg-secondary/10 border border-secondary/30 text-secondary text-[11px] font-headline tracking-widest uppercase hover:bg-secondary/20 transition-colors">RESET TO DEFAULTS</button>
          <button className="px-4 py-2 rounded-lg bg-secondary/10 border border-secondary/30 text-secondary text-[11px] font-headline tracking-widest uppercase hover:bg-secondary/20 transition-colors">CLEAR SIMULATION DATA</button>
        </div>
      </SectionBlock>
    </motion.div>
  );
}

export function SystemSection({ settings, setSettings }: SectionProps) {
  return (
    <motion.div variants={stagger(70)} initial="hidden" animate="show" className="space-y-4">
      <SectionBlock title="CONNECTIONS">
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-on-surface-variant">API Endpoint</span>
            <input
              type="text"
              value={settings.apiEndpoint}
              onChange={(event) => setSettings((prev) => ({ ...prev, apiEndpoint: event.target.value }))}
              className="w-full md:w-[320px] bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-body rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-on-surface-variant">Auth Token</span>
            <div className="flex items-center gap-2 w-full md:w-[320px]">
              <input
                type="password"
                value={settings.authToken}
                onChange={(event) => setSettings((prev) => ({ ...prev, authToken: event.target.value }))}
                className="flex-1 bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-body rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary/50"
              />
              <button className="px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-[10px] font-headline uppercase tracking-widest">VERIFY</button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-on-surface-variant">Timeout</span>
            <input type="number" min={1} value={settings.timeoutSeconds} onChange={(event) => setSettings((prev) => ({ ...prev, timeoutSeconds: Number(event.target.value) }))} className="w-28 bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-body rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary/50" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-on-surface-variant">Retry Limit</span>
            <input type="number" min={0} value={settings.retryLimit} onChange={(event) => setSettings((prev) => ({ ...prev, retryLimit: Number(event.target.value) }))} className="w-28 bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-body rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary/50" />
          </div>
          <div className="flex justify-end">
            <button className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-[11px] font-headline tracking-widest uppercase hover:bg-primary/20 transition-colors">SAVE CHANGES</button>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock title="DATA MANAGEMENT">
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between"><span className="text-on-surface-variant">Cache Size</span><div className="flex items-center gap-2"><span className="text-on-surface">1.2 GB</span><button className="px-3 py-1 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container">CLEAR CACHE</button></div></div>
          <div className="h-px bg-outline-variant/20" />
          <div className="flex items-center justify-between"><span className="text-on-surface-variant">Local Storage</span><div className="flex items-center gap-2"><span className="text-on-surface">847 MB</span><button className="px-3 py-1 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container">EXPORT DATA</button></div></div>
          <div className="h-px bg-outline-variant/20" />
          <div className="flex items-center justify-between"><span className="text-on-surface-variant">Last Backup</span><div className="flex items-center gap-2"><span className="text-on-surface">2h ago</span><button className="px-3 py-1 rounded-lg border border-primary/30 bg-primary/10 text-primary">BACKUP NOW</button></div></div>
        </div>
      </SectionBlock>

      <SectionBlock title="ABOUT">
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between"><span className="text-on-surface-variant">Version</span><span className="text-on-surface">Mars Biolab Dashboard v2.4.1</span></div>
          <div className="h-px bg-outline-variant/20" />
          <div className="flex items-center justify-between"><span className="text-on-surface-variant">Build</span><span className="text-on-surface">2026.03.23-alpha</span></div>
          <div className="h-px bg-outline-variant/20" />
          <div className="flex items-center justify-between"><span className="text-on-surface-variant">Commit</span><span className="text-on-surface font-mono">a7f3c92</span></div>
          <div className="h-px bg-outline-variant/20" />
          <div className="flex items-center justify-between"><span className="text-on-surface-variant">License</span><span className="text-on-surface">ESA Research License</span></div>
          <div className="flex justify-end pt-1">
            <button className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container text-[10px] font-headline uppercase tracking-widest">CHECK FOR UPDATES</button>
          </div>
        </div>
      </SectionBlock>
    </motion.div>
  );
}
