import type { ComponentType } from "react";
import {
  Bot,
  Cable,
  CloudFog,
  Clock3,
  Droplets,
  Gauge,
  Radiation,
  ShieldCheck,
  Thermometer,
  Wind,
} from "lucide-react";

export type StatusTone = "success" | "warning" | "critical" | "muted";

export interface StatusCard {
  id: string;
  label: string;
  value: string;
  badge: string;
  tone: StatusTone;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export interface SensorItem {
  id: string;
  name: string;
  valueLabel: string;
  rangeLabel: string;
  value: number;
  min: number;
  max: number;
  status: string;
  tone: StatusTone;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export interface AgentItem {
  id: string;
  name: string;
  subsystem: string;
  load: number;
  status: "RUNNING" | "IDLE" | "BUSY" | "DEGRADED" | "OFFLINE";
  latency: string;
}

export interface PerformanceMetric {
  id: string;
  label: string;
  value: number;
  note: string;
  tone: "primary" | "secondary";
}

export interface LogItem {
  id: string;
  time: string;
  type: "INFO" | "OK" | "WARN" | "ERROR";
  message: string;
}

export const STATUS_STYLE: Record<StatusTone, { text: string; badge: string; dot: string }> = {
  success: {
    text: "text-tertiary",
    badge: "bg-tertiary/10 text-tertiary border-tertiary/25",
    dot: "bg-tertiary",
  },
  warning: {
    text: "text-secondary",
    badge: "bg-secondary/10 text-secondary border-secondary/25",
    dot: "bg-secondary",
  },
  critical: {
    text: "text-error",
    badge: "bg-error/10 text-error border-error/25",
    dot: "bg-error",
  },
  muted: {
    text: "text-on-surface-variant",
    badge: "bg-surface-container-highest text-on-surface-variant border-outline-variant/25",
    dot: "bg-on-surface-variant",
  },
};

export const LOG_TYPE_STYLE: Record<LogItem["type"], string> = {
  INFO: "bg-primary/10 text-primary/70",
  OK: "bg-tertiary/10 text-tertiary",
  WARN: "bg-secondary/10 text-secondary",
  ERROR: "bg-error/10 text-error",
};

export const statusCards: StatusCard[] = [
  {
    id: "system-status",
    label: "SYSTEM STATUS",
    value: "NOMINAL",
    badge: "ONLINE",
    tone: "success",
    icon: ShieldCheck,
  },
  {
    id: "active-agents",
    label: "ACTIVE AGENTS",
    value: "6 / 8",
    badge: "RUNNING",
    tone: "success",
    icon: Bot,
  },
  {
    id: "data-pipeline",
    label: "DATA PIPELINE",
    value: "↑ 2.4 MB/s",
    badge: "STABLE",
    tone: "success",
    icon: Cable,
  },
  {
    id: "last-sync",
    label: "LAST SYNC",
    value: "2s ago",
    badge: "LIVE",
    tone: "success",
    icon: Clock3,
  },
];

export const sensors: SensorItem[] = [
  {
    id: "o2",
    name: "O2 CONCENTRATION",
    valueLabel: "21.3%",
    rangeLabel: "19.5% - 23.5%",
    value: 21.3,
    min: 19.5,
    max: 23.5,
    status: "OPTIMAL",
    tone: "success",
    icon: Wind,
  },
  {
    id: "co2",
    name: "CO2 LEVEL",
    valueLabel: "0.04%",
    rangeLabel: "< 0.1%",
    value: 0.04,
    min: 0,
    max: 0.1,
    status: "NORMAL",
    tone: "success",
    icon: CloudFog,
  },
  {
    id: "pressure",
    name: "ATMOSPHERIC PRESSURE",
    valueLabel: "101.3 kPa",
    rangeLabel: "95 - 106 kPa",
    value: 101.3,
    min: 95,
    max: 106,
    status: "NOMINAL",
    tone: "success",
    icon: Gauge,
  },
  {
    id: "temperature",
    name: "TEMPERATURE",
    valueLabel: "22.7 C",
    rangeLabel: "18 - 26 C",
    value: 22.7,
    min: 18,
    max: 26,
    status: "NOMINAL",
    tone: "success",
    icon: Thermometer,
  },
  {
    id: "humidity",
    name: "HUMIDITY",
    valueLabel: "68%",
    rangeLabel: "40 - 70%",
    value: 68,
    min: 40,
    max: 70,
    status: "WARNING",
    tone: "warning",
    icon: Droplets,
  },
  {
    id: "radiation",
    name: "RADIATION INDEX",
    valueLabel: "0.12 mSv/h",
    rangeLabel: "< 0.5 mSv/h",
    value: 0.12,
    min: 0,
    max: 0.5,
    status: "SAFE",
    tone: "success",
    icon: Radiation,
  },
];

export const pipeline: AgentItem[] = [
  { id: "orchestrator", name: "ORCHESTRATOR", subsystem: "Agent Core", load: 5, status: "RUNNING", latency: "2.3ms" },
  { id: "env-monitor", name: "ENV MONITOR", subsystem: "Environment", load: 4, status: "RUNNING", latency: "4.1ms" },
  { id: "synthesis", name: "SYNTHESIS ENGINE", subsystem: "Synthesis", load: 5, status: "IDLE", latency: "0ms" },
  { id: "sim-runner", name: "SIM RUNNER", subsystem: "Simulation", load: 3, status: "BUSY", latency: "89ms" },
  { id: "formatter", name: "OUTPUT FORMATTER", subsystem: "Output", load: 5, status: "RUNNING", latency: "1.2ms" },
  { id: "diag-core", name: "DIAGNOSTICS CORE", subsystem: "Diagnostics", load: 5, status: "RUNNING", latency: "0.8ms" },
  { id: "collector", name: "DATA COLLECTOR", subsystem: "Background", load: 2, status: "DEGRADED", latency: "-" },
  { id: "backup-sync", name: "BACKUP SYNC", subsystem: "Background", load: 0, status: "OFFLINE", latency: "-" },
];

export const performanceMetrics: PerformanceMetric[] = [
  { id: "cpu", label: "CPU USAGE", value: 63, note: "4 cores active", tone: 63 > 80 ? "secondary" : "primary" },
  { id: "memory", label: "MEMORY", value: 78, note: "3.1 / 4.0 GB", tone: 78 > 85 ? "secondary" : "primary" },
  { id: "network", label: "NETWORK I/O", value: 24, note: "↑ 0.8 MB/s  ↓ 1.6 MB/s", tone: "primary" },
];

export const logs: LogItem[] = [
  { id: "l1", time: "14:32:07", type: "INFO", message: "Synthesis engine completed batch #2847" },
  { id: "l2", time: "14:31:54", type: "OK", message: "O2 sensor calibration verified" },
  { id: "l3", time: "14:31:12", type: "WARN", message: "Humidity approaching upper threshold (68%)" },
  { id: "l4", time: "14:30:45", type: "INFO", message: "Agent ORCHESTRATOR heartbeat nominal" },
  { id: "l5", time: "14:29:33", type: "OK", message: "Data pipeline synchronized - 2847 records" },
  { id: "l6", time: "14:28:19", type: "INFO", message: "Simulation tick #15402 complete" },
  { id: "l7", time: "14:27:01", type: "ERROR", message: "Backup sync connection timeout - retrying" },
];

export function clampPercent(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  const percent = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, percent));
}

export function loadDots(load: number): string {
  return `${"●".repeat(Math.max(0, load))}${"○".repeat(Math.max(0, 5 - load))}`;
}

export function agentTone(status: AgentItem["status"]): StatusTone {
  if (status === "DEGRADED") return "warning";
  if (status === "OFFLINE") return "muted";
  if (status === "BUSY") return "warning";
  return "success";
}
