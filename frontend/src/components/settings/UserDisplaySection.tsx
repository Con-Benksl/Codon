import type { Dispatch, SetStateAction } from "react";
import { motion } from "motion/react";
import { KeyRound, Pencil, ShieldCheck } from "lucide-react";
import { buttonPress, cardHover, stagger } from "../../lib/motion";
import type { SettingsState } from "./types";
import { SectionBlock, SelectField, ToggleSwitch } from "./SettingsPrimitives";

interface SectionProps {
  settings: SettingsState;
  setSettings: Dispatch<SetStateAction<SettingsState>>;
}

export function UserSection({ settings, setSettings }: SectionProps) {
  return (
    <motion.div variants={stagger(70)} initial="hidden" animate="show" className="space-y-4">
      <SectionBlock title="PROFILE INFORMATION">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 text-primary font-headline font-bold text-xl flex items-center justify-center">
              CW
            </div>
            <div>
              <p className="text-lg font-headline font-bold text-on-surface">Dr. Chen Wei</p>
              <p className="text-sm text-on-surface-variant">Mission Commander</p>
              <p className="text-xs text-on-surface-variant">mars-biolab-alpha@esa.int</p>
            </div>
          </div>
          <motion.button
            {...buttonPress}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/30 text-primary text-[11px] font-headline tracking-widest uppercase rounded-lg hover:bg-primary/20 transition-colors"
          >
            <Pencil size={13} />
            EDIT PROFILE
          </motion.button>
        </div>
      </SectionBlock>

      <SectionBlock title="ACCESS & PERMISSIONS">
        <div className="space-y-3 text-xs font-body">
          <div className="flex items-center justify-between gap-2">
            <span className="text-on-surface-variant">Role</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-headline uppercase tracking-wide bg-primary/15 text-primary">MISSION COMMANDER</span>
          </div>
          <div className="h-px bg-outline-variant/20" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-on-surface-variant">Clearance</span>
            <span className="text-on-surface">Level 5 - Full Access</span>
          </div>
          <div className="h-px bg-outline-variant/20" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-on-surface-variant">Active Since</span>
            <span className="text-on-surface">Sol 47 (2026-03-01)</span>
          </div>
          <div className="h-px bg-outline-variant/20" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-on-surface-variant">Session</span>
            <div className="flex items-center gap-3">
              <span className="text-on-surface">8h 23m</span>
              <button className="px-3 py-1 rounded-lg border border-secondary/30 bg-secondary/10 text-secondary text-[10px] font-headline uppercase tracking-widest">
                TERMINATE SESSION
              </button>
            </div>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock title="AUTHENTICATION">
        <div className="space-y-3 text-xs font-body">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-on-surface-variant">Password</p>
              <p className="text-on-surface text-sm">●●●●●●●●  Last changed 30d ago</p>
            </div>
            <button className="px-3 py-1 rounded-lg border border-primary/30 bg-primary/10 text-primary text-[10px] font-headline uppercase tracking-widest">
              CHANGE PASSWORD
            </button>
          </div>
          <div className="h-px bg-outline-variant/20" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <KeyRound size={14} className="text-primary" />
              <div>
                <p className="text-on-surface">2FA</p>
                <p className="text-on-surface-variant">Authenticator App</p>
              </div>
            </div>
            <ToggleSwitch checked={settings.twoFactor} onClick={() => setSettings((prev) => ({ ...prev, twoFactor: !prev.twoFactor }))} />
          </div>
          <div className="h-px bg-outline-variant/20" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-on-surface-variant" />
              <div>
                <p className="text-on-surface">Biometric</p>
                <p className="text-on-surface-variant">Not configured</p>
              </div>
            </div>
            <ToggleSwitch checked={settings.biometric} onClick={() => setSettings((prev) => ({ ...prev, biometric: !prev.biometric }))} />
          </div>
        </div>
      </SectionBlock>
    </motion.div>
  );
}

export function DisplaySection({ settings, setSettings }: SectionProps) {
  const themes = [
    { id: "deep-space", label: "DEEP SPACE" },
    { id: "mars-dust", label: "MARS DUST" },
    { id: "nebula-drift", label: "NEBULA DRIFT" },
  ];

  const accents = [
    { id: "blue", label: "Blue", className: "bg-primary" },
    { id: "green", label: "Green", className: "bg-tertiary" },
    { id: "coral", label: "Coral", className: "bg-secondary" },
    { id: "gold", label: "Gold", className: "bg-on-surface" },
  ];

  return (
    <motion.div variants={stagger(70)} initial="hidden" animate="show" className="space-y-4">
      <SectionBlock title="THEME & APPEARANCE">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-on-surface-variant mb-2">Color Theme</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {themes.map((theme) => (
                <motion.button
                  key={theme.id}
                  {...buttonPress}
                  {...cardHover}
                  onClick={() => setSettings((prev) => ({ ...prev, themePreset: theme.id }))}
                  className={`rounded-lg p-3 border text-left transition-colors ${
                    settings.themePreset === theme.id
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-outline-variant/25 bg-surface-container text-on-surface-variant"
                  }`}
                >
                  <p className="text-xs font-headline font-bold uppercase tracking-widest">{theme.label}</p>
                  <p className="text-[10px] mt-1 uppercase tracking-wide">
                    {settings.themePreset === theme.id ? "ACTIVE" : "AVAILABLE"}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-on-surface-variant">Accent Color</span>
            {accents.map((accent) => (
              <button
                key={accent.id}
                type="button"
                onClick={() => setSettings((prev) => ({ ...prev, accentColor: accent.id }))}
                className={`inline-flex items-center gap-2 px-2 py-1 rounded-md border ${
                  settings.accentColor === accent.id
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-outline-variant/25 text-on-surface-variant"
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${accent.className}`} />
                {accent.label}
              </button>
            ))}
          </div>
        </div>
      </SectionBlock>

      <SectionBlock title="INTERFACE">
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-on-surface-variant">Language</span>
            <SelectField value={settings.language} onChange={(value) => setSettings((prev) => ({ ...prev, language: value }))} options={["中文", "English"]} />
          </div>
          <div className="h-px bg-outline-variant/20" />
          <div className="flex items-center justify-between gap-3">
            <span className="text-on-surface-variant">Data Units</span>
            <SelectField value={settings.dataUnits} onChange={(value) => setSettings((prev) => ({ ...prev, dataUnits: value }))} options={["SI", "Imperial"]} />
          </div>
          <div className="h-px bg-outline-variant/20" />
          <div className="flex items-center justify-between gap-3">
            <span className="text-on-surface-variant">Date Format</span>
            <SelectField value={settings.dateFormat} onChange={(value) => setSettings((prev) => ({ ...prev, dateFormat: value }))} options={["ISO", "Local"]} />
          </div>
          <div className="h-px bg-outline-variant/20" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-on-surface">Animations</p>
              <p className="text-on-surface-variant">Reduced motion</p>
            </div>
            <ToggleSwitch checked={settings.reducedMotion} onClick={() => setSettings((prev) => ({ ...prev, reducedMotion: !prev.reducedMotion }))} />
          </div>
          <div className="h-px bg-outline-variant/20" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-on-surface">Sidebar</p>
              <p className="text-on-surface-variant">Auto-collapse</p>
            </div>
            <ToggleSwitch checked={settings.autoCollapseSidebar} onClick={() => setSettings((prev) => ({ ...prev, autoCollapseSidebar: !prev.autoCollapseSidebar }))} />
          </div>
        </div>
      </SectionBlock>

      <SectionBlock title="DASHBOARD WIDGETS">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-on-surface">
          <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-primary" checked={settings.widgetMarsGlobe} onChange={(event) => setSettings((prev) => ({ ...prev, widgetMarsGlobe: event.target.checked }))} />Mars Globe</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-primary" checked={settings.widgetStatusBar} onChange={(event) => setSettings((prev) => ({ ...prev, widgetStatusBar: event.target.checked }))} />Status Bar</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-primary" checked={settings.widgetWeatherFeed} onChange={(event) => setSettings((prev) => ({ ...prev, widgetWeatherFeed: event.target.checked }))} />Weather Feed</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-primary" checked={settings.widgetAgentCount} onChange={(event) => setSettings((prev) => ({ ...prev, widgetAgentCount: event.target.checked }))} />Agent Count</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-primary" checked={settings.widgetSolCalendar} onChange={(event) => setSettings((prev) => ({ ...prev, widgetSolCalendar: event.target.checked }))} />Sol Calendar</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-primary" checked={settings.widgetQuickActions} onChange={(event) => setSettings((prev) => ({ ...prev, widgetQuickActions: event.target.checked }))} />Quick Actions</label>
        </div>
      </SectionBlock>
    </motion.div>
  );
}
