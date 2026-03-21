import { useEffect } from "react";
import { motion } from "motion/react";
import { X, ExternalLink, Circle, ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { AgentDetail } from "../data/agentDetails";

interface DetailPanelProps {
  agent: AgentDetail;
  onClose: () => void;
}

const statusMap = {
  active: { label: "运行中", color: "bg-tertiary" },
  idle: { label: "空闲", color: "bg-outline" },
  processing: { label: "处理中", color: "bg-primary animate-pulse" },
} as const;

const logLevelColor = {
  info: "text-primary",
  warn: "text-[#d4a843]",
  success: "text-tertiary",
  error: "text-secondary",
} as const;

const sourceStatusColor = {
  connected: "bg-tertiary",
  syncing: "bg-primary animate-pulse",
  offline: "bg-outline",
} as const;

const trendIcon = {
  up: ArrowUp,
  down: ArrowDown,
  stable: Minus,
} as const;

const trendColor = {
  up: "text-tertiary",
  down: "text-secondary",
  stable: "text-outline",
} as const;

const accentMap = {
  primary: {
    border: "border-l-primary",
    bg: "bg-primary/10",
    text: "text-primary",
    glow: "shadow-[0_0_30px_rgba(129,207,255,0.15)]",
  },
  secondary: {
    border: "border-l-secondary",
    bg: "bg-secondary/10",
    text: "text-secondary",
    glow: "shadow-[0_0_30px_rgba(255,180,161,0.15)]",
  },
  tertiary: {
    border: "border-l-tertiary",
    bg: "bg-tertiary/10",
    text: "text-tertiary",
    glow: "shadow-[0_0_30px_rgba(100,221,153,0.15)]",
  },
} as const;

export default function DetailPanel({ agent, onClose }: DetailPanelProps) {
  const accent = accentMap[agent.color];
  const Icon = agent.icon;
  const status = statusMap[agent.status];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.aside
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className={`fixed right-0 top-0 h-full w-full max-w-[560px] z-50 bg-surface-container border-l border-outline-variant/15 ${accent.glow} flex flex-col`}
      >
        {/* Header */}
        <div className={`p-6 border-b border-outline-variant/15 border-l-4 ${accent.border}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${accent.bg} flex items-center justify-center`}>
                <Icon size={20} className={accent.text} />
              </div>
              <div>
                <h2 className="font-headline font-bold text-lg text-on-surface tracking-tight">{agent.name}</h2>
                <p className="text-[11px] text-on-surface-variant font-headline tracking-wider uppercase">{agent.subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-variant/50 transition-colors"
              aria-label="关闭详情面板"
            >
              <X size={18} className="text-on-surface-variant" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] font-headline tracking-widest uppercase text-on-surface-variant">
              <span className={`w-2 h-2 rounded-full ${status.color}`} />
              {status.label}
            </span>
            <span className="text-[10px] text-outline">|</span>
            <span className="text-[10px] font-mono text-outline">{agent.id.toUpperCase()}</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <p className="text-sm text-on-surface-variant leading-relaxed">{agent.description}</p>

          {/* Metrics Grid */}
          <div>
            <h3 className="text-[10px] font-headline font-bold tracking-widest uppercase text-on-surface-variant mb-3">关键指标</h3>
            <div className="grid grid-cols-2 gap-3">
              {agent.metrics.map((m) => {
                const TrendIcon = m.trend ? trendIcon[m.trend] : null;
                const tColor = m.trend ? trendColor[m.trend] : "";
                return (
                  <div key={m.label} className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-outline font-headline uppercase">{m.label}</span>
                      {TrendIcon && <TrendIcon size={10} className={tColor} />}
                    </div>
                    <span className="text-lg font-headline font-bold text-on-surface">{m.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Sources */}
          <div>
            <h3 className="text-[10px] font-headline font-bold tracking-widest uppercase text-on-surface-variant mb-3">数据源连接</h3>
            <div className="space-y-2">
              {agent.dataSources.map((ds) => (
                <div key={ds.id} className="flex items-center justify-between px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${sourceStatusColor[ds.status]}`} />
                    <span className="text-xs text-on-surface">{ds.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-outline">{ds.id}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div>
            <h3 className="text-[10px] font-headline font-bold tracking-widest uppercase text-on-surface-variant mb-3">活动日志</h3>
            <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/10 p-3 space-y-2">
              {agent.logs.map((log, i) => (
                <div key={i} className="flex gap-2 text-[11px]">
                  <span className="text-outline font-mono shrink-0">{log.time}</span>
                  <Circle size={6} className={`${logLevelColor[log.level]} shrink-0 mt-1`} fill="currentColor" />
                  <span className={`${logLevelColor[log.level]} leading-snug`}>{log.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Findings */}
          <div>
            <h3 className="text-[10px] font-headline font-bold tracking-widest uppercase text-on-surface-variant mb-3">核心发现</h3>
            <div className="space-y-2">
              {agent.findings.map((f, i) => (
                <div key={i} className={`text-xs text-on-surface-variant leading-relaxed pl-3 border-l-2 ${accent.border} py-1`}>
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* References */}
          <div>
            <h3 className="text-[10px] font-headline font-bold tracking-widest uppercase text-on-surface-variant mb-3">参考文献</h3>
            <div className="space-y-3">
              {agent.references.map((ref, i) => (
                <div key={i} className="flex gap-2 group">
                  <ExternalLink size={12} className="text-outline shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                  <div className="text-[11px] text-on-surface-variant leading-snug">
                    <span className="text-on-surface">{ref.authors}</span>{" "}
                    <span className="italic">"{ref.title}"</span>{" "}
                    <span className={accent.text}>{ref.journal}</span> ({ref.year})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant/15 flex gap-3">
          <button className={`flex-1 py-2.5 ${accent.bg} ${accent.text} font-headline font-bold text-xs rounded-lg uppercase tracking-widest hover:brightness-125 transition-all border border-current/20`}>
            查看完整报告
          </button>
          <button className="px-4 py-2.5 border border-outline-variant/30 text-on-surface-variant font-headline font-bold text-xs rounded-lg uppercase tracking-widest hover:bg-surface-container-high transition-all">
            导出
          </button>
        </div>
      </motion.aside>
    </>
  );
}
