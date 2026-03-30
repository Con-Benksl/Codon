import { motion } from "motion/react";
import { cardSlideIn, cardHover } from "../../lib/motion";
import Icon from "../Icon";

type AgentStatus = "active" | "standby" | "processing";

interface AgentCardProps {
  name: string;
  subtitle: string;
  status: AgentStatus;
  uptimeLabel: string;
  uptimeValue: string;
  metricLabel: string;
  metricValue: string;
  iconName: string;
}

const STATUS_CONFIG: Record<AgentStatus, { dotClass: string; label: string; glowClass: string }> = {
  active: {
    dotClass: "bg-primary animate-dot-pulse",
    label: "ACTIVE",
    glowClass: "shadow-[0_0_12px_rgba(0,229,255,0.4)]",
  },
  standby: {
    dotClass: "bg-muted",
    label: "STANDBY",
    glowClass: "",
  },
  processing: {
    dotClass: "bg-accent-violet animate-dot-pulse",
    label: "PROCESSING",
    glowClass: "shadow-[0_0_12px_rgba(112,0,255,0.4)]",
  },
};

export default function AgentCard({
  name,
  subtitle,
  status,
  uptimeLabel,
  uptimeValue,
  metricLabel,
  metricValue,
  iconName,
}: AgentCardProps) {
  const cfg = STATUS_CONFIG[status];

  return (
    <motion.div
      variants={cardSlideIn}
      {...cardHover}
      className="glass-panel w-[240px] h-[300px] p-6 flex flex-col gap-4 cursor-default group"
    >
      {/* Status dot + label */}
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${cfg.dotClass} ${cfg.glowClass}`} />
        <span className="text-[10px] font-mono tracking-widest text-muted uppercase">{cfg.label}</span>
      </div>

      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center">
        <Icon
          name={iconName}
          size={28}
          className={status === "active" ? "text-primary" : status === "processing" ? "text-accent-violet" : "text-muted"}
        />
      </div>

      {/* Name */}
      <div>
        <h3 className="font-headline font-bold text-on-surface text-sm tracking-[0.05em] uppercase">{name}</h3>
        <p className="text-[11px] text-muted font-body mt-1">{subtitle}</p>
      </div>

      {/* Metrics */}
      <div className="mt-auto flex gap-4">
        <div>
          <p className="text-[9px] font-mono text-muted uppercase tracking-wider">{uptimeLabel}</p>
          <p className="text-sm font-mono font-bold text-on-surface">{uptimeValue}</p>
        </div>
        <div className="pl-4 border-l border-[rgba(255,255,255,0.08)]">
          <p className="text-[9px] font-mono text-muted uppercase tracking-wider">{metricLabel}</p>
          <p className="text-sm font-mono font-bold text-primary">{metricValue}</p>
        </div>
      </div>
    </motion.div>
  );
}
