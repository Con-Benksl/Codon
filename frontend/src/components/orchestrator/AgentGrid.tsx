import { motion } from "motion/react";
import { Satellite, Cpu, ShieldCheck } from "lucide-react";
import { stagger, fadeSlideUp, cardHover, inViewport } from "../../lib/motion";
import { agentDetails } from "../../data/agentDetails";

interface Props {
  isZh: boolean;
  onSelectAgent: (id: string) => void;
}

const AGENTS = [
  {
    id: "env-agent",
    icon: Satellite,
    accentColor: "#ffb4a1",
    accentVar: "secondary",
    borderClass: "border-l-secondary",
    glowClass: "from-secondary/10",
    tagBg: "bg-secondary/10 border-secondary/30 text-secondary",
    statusDot: "bg-secondary",
  },
  {
    id: "design-agent",
    icon: Cpu,
    accentColor: "#81cfff",
    accentVar: "primary",
    borderClass: "border-l-primary",
    glowClass: "from-primary/10",
    tagBg: "bg-primary/10 border-primary/30 text-primary",
    statusDot: "bg-primary",
  },
  {
    id: "verify-agent",
    icon: ShieldCheck,
    accentColor: "#64dd99",
    accentVar: "tertiary",
    borderClass: "border-l-tertiary",
    glowClass: "from-tertiary/10",
    tagBg: "bg-tertiary/10 border-tertiary/30 text-tertiary",
    statusDot: "bg-tertiary",
  },
] as const;

export default function AgentGrid({ isZh, onSelectAgent }: Props) {
  return (
    <motion.div
      variants={stagger(120)}
      initial="hidden"
      whileInView="show"
      {...inViewport}
      className="flex flex-col gap-5"
    >
      {AGENTS.map((agentMeta, idx) => {
        const detail = agentDetails[agentMeta.id];
        const Icon = agentMeta.icon;
        const isProcessing = detail.status === "processing";

        return (
          <motion.div
            key={agentMeta.id}
            variants={fadeSlideUp}
            {...cardHover}
            onClick={() => onSelectAgent(agentMeta.id)}
            className={`panel-corner glass-panel rounded-xl border-l-[3px] ${agentMeta.borderClass} cursor-pointer group relative overflow-hidden`}
          >
            {/* Background gradient on hover */}
            <div className={`absolute inset-0 bg-gradient-to-r ${agentMeta.glowClass} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

            <div className="relative z-10 p-5 flex gap-5 items-start">
              {/* Icon block */}
              <div
                className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center relative"
                style={{
                  background: `${agentMeta.accentColor}15`,
                  border: `1px solid ${agentMeta.accentColor}30`,
                  boxShadow: `0 0 16px ${agentMeta.accentColor}20`,
                }}
              >
                <Icon size={22} style={{ color: agentMeta.accentColor }} />
                {isProcessing && (
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 48 48">
                    <circle
                      cx="24" cy="24" r="22"
                      fill="none"
                      stroke={agentMeta.accentColor}
                      strokeWidth="1.5"
                      strokeDasharray="20 70"
                      className="agent-processing"
                      opacity="0.6"
                    />
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                  <h3 className="font-headline font-bold text-sm tracking-[0.06em] text-on-surface uppercase">
                    {detail.name}
                  </h3>
                  <span className="text-[9px] font-mono text-on-surface-variant/50 tracking-wider">
                    {detail.subtitle}
                  </span>
                  {/* Step number badge */}
                  <span
                    className="ml-auto text-[9px] font-headline font-bold tracking-widest px-2 py-0.5 rounded-full border"
                    style={{
                      color: agentMeta.accentColor,
                      borderColor: `${agentMeta.accentColor}40`,
                      background: `${agentMeta.accentColor}10`,
                    }}
                  >
                    STEP {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed mb-3 font-body">
                  {detail.description}
                </p>

                {/* Capability chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {detail.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className={`text-[9px] font-headline font-bold px-2 py-0.5 rounded-full border tracking-wider uppercase ${agentMeta.tagBg}`}
                    >
                      {cap}
                    </span>
                  ))}
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {detail.metrics.map((metric) => (
                    <div key={metric.label} className="flex flex-col">
                      <span className="font-data text-xs font-semibold" style={{ color: agentMeta.accentColor }}>
                        {metric.value}
                      </span>
                      <span className="text-[9px] text-on-surface-variant/60 font-body leading-tight mt-0.5">
                        {metric.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="shrink-0 flex flex-col items-end gap-2 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-2 h-2 rounded-full ${agentMeta.statusDot} ${isProcessing ? "animate-pulse" : ""}`}
                    style={!isProcessing ? { boxShadow: `0 0 6px ${agentMeta.accentColor}` } : {}}
                  />
                  <span className="text-[9px] font-headline uppercase tracking-widest text-on-surface-variant/60">
                    {detail.status}
                  </span>
                </div>
                <span className="text-[8px] font-data text-on-surface-variant/30 tracking-widest">
                  {isZh ? "点击查看详情" : "CLICK FOR DETAIL"}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
