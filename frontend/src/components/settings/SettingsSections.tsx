import type { Dispatch, SetStateAction } from "react";
import { DisplaySection, UserSection } from "./UserDisplaySection";
import {
  NotificationsSection,
  SimulationSection,
  SystemSection,
} from "./NotificationSimulationSystemSection";
import type { SettingsSectionKey, SettingsState } from "./types";

interface SettingsSectionContentProps {
  activeSection: SettingsSectionKey;
  settings: SettingsState;
  setSettings: Dispatch<SetStateAction<SettingsState>>;
}

export type { SettingsSectionKey, SettingsState } from "./types";

export default function SettingsSectionContent({ activeSection, settings, setSettings }: SettingsSectionContentProps) {
  if (activeSection === "user") {
    return <UserSection settings={settings} setSettings={setSettings} />;
  }
  if (activeSection === "display") {
    return <DisplaySection settings={settings} setSettings={setSettings} />;
  }
  if (activeSection === "notifications") {
    return <NotificationsSection settings={settings} setSettings={setSettings} />;
  }
  if (activeSection === "simulation") {
    return <SimulationSection settings={settings} setSettings={setSettings} />;
  }
  return <SystemSection settings={settings} setSettings={setSettings} />;
}
