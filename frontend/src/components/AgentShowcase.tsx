import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { setDriftRight } from "../lib/scroll-progress";

/* ── Pipeline node data ────────────────────────────────────────── */

interface PipelineNode {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
}

const nodes: PipelineNode[] = [
  {
    id: "input",
    label: "INPUT",
    title: "\u73af\u5883\u5b9a\u4e49",
    subtitle: "9 dims \u00b7 any extreme",
    icon: "\ud83c\udf0d",
    color: "#34d399",
  },
  {
    id: "process",
    label: "PROCESSING",
    title: "\u5e95\u76d8 + \u86cb\u767d + \u65b9\u6848",
    subtitle: "30 chassis \u00b7 46 proteins",
    icon: "\ud83e\uddec",
    color: "#38bdf8",
  },
  {
    id: "output",
    label: "OUTPUT",
    title: "\u52a8\u6001\u6a21\u62df",
    subtitle: "scipy ODE \u00b7 200 steps",
    icon: "\u26a1",
    color: "#a78bfa",
  },
];

/* ── Component ──────────────────────────────────────────────────── */

export default function AgentShowcase() {
  const sectionRef = useRef<HTMLElement>(null);

  // Drive driftRight based on this section's visibility
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    let rafId = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vpH = window.innerHeight;
      const sectionH = rect.height;

      // Drift zone: from section top entering viewport bottom
      // to section center reaching viewport center
      // Total travel = vpH + sectionH/2 (a much longer scroll range)
      const travel = vpH + sectionH * 0.5;
      // distFromStart: 0 when section top is at viewport bottom,
      // increases as user scrolls down
      const distFromStart = vpH - rect.top;

      if (distFromStart <= 0 || rect.bottom < -vpH * 0.3) {
        // Not reached yet, or scrolled well past
        setDriftRight(0);
      } else {
        const progress = Math.max(0, Math.min(1, distFromStart / travel));
        setDriftRight(progress);
      }
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(rafId);
      setDriftRight(0);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden py-24 border-t border-white/[0.04]"
    >
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="text-center mb-20 px-6 relative z-10"
      >
        <span className="text-[10px] font-mono text-primary/80 tracking-[0.3em] uppercase">
          AGENT COLLABORATION
        </span>
        <h2 className="font-headline text-3xl md:text-4xl font-bold text-white tracking-tight mt-3">
          多智能体协作流水线
        </h2>
        <p className="mt-4 text-white/70 text-base md:text-lg max-w-lg mx-auto text-glow">
          数据在 Agent 之间自动流转，从环境解析到回路验证，全程 AI 驱动
        </p>
      </motion.div>

      {/* Pipeline nodes — DnaParticles stream lines flow through background */}
      <div className="relative z-10 mx-auto max-w-5xl min-h-[320px] md:min-h-[380px] px-6">
        <div className="h-full min-h-[320px] md:min-h-[380px] flex items-center justify-around px-2 md:px-12">
          {nodes.map((node, i) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0.7, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-col items-center gap-3"
            >
              {/* Glowing hub */}
              <div
                className="relative w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle, ${node.color}18 0%, ${node.color}06 60%, transparent 80%)`,
                  boxShadow: `0 0 60px ${node.color}15, 0 0 120px ${node.color}08`,
                }}
              >
                {/* Inner circle */}
                <div
                  className="rounded-full border flex items-center justify-center"
                  style={{
                    width: "72px",
                    height: "72px",
                    borderColor: `${node.color}30`,
                    background: `radial-gradient(circle, ${node.color}10 0%, rgba(15,21,35,0.85) 100%)`,
                  }}
                >
                  <span className="text-3xl md:text-4xl">{node.icon}</span>
                </div>
                {/* Slow pulse ring */}
                <div
                  className="absolute inset-[-4px] rounded-full opacity-15"
                  style={{
                    border: `1px solid ${node.color}`,
                    animation: "ping 3s cubic-bezier(0, 0, 0.2, 1) infinite",
                  }}
                />
              </div>

              {/* Text */}
              <span
                className="text-[10px] font-mono tracking-[0.2em] uppercase mt-1"
                style={{ color: node.color }}
              >
                {node.label}
              </span>
              <span className="text-base md:text-lg font-semibold text-white">
                {node.title}
              </span>
              <span className="text-xs md:text-sm text-white/50 text-center max-w-[160px] text-glow">
                {node.subtitle}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom metrics */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="relative z-10 mt-14 flex justify-center gap-6 md:gap-10 px-6 flex-wrap"
      >
        {[
          { label: "FITNESS", value: "0.94", color: "#34d399" },
          { label: "SAFETY", value: "0.91", color: "#38bdf8" },
          { label: "LATENCY", value: "4.2s", color: "#a78bfa" },
          { label: "AGENTS", value: "6", color: "#fbbf24" },
        ].map((m) => (
          <div key={m.label} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
            <span className="text-[11px] font-mono tracking-wider text-white/50">{m.label}</span>
            <span className="text-[11px] font-mono font-semibold text-white">{m.value}</span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
