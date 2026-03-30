import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useLocale } from "../i18n/context";
import { viewTransition, glassEntrance } from "../lib/motion";
import ScoreRing from "../components/validation/ScoreRing";
import TraitGrid from "../components/validation/TraitGrid";
import Icon from "../components/Icon";

const TRAITS_ZH = [
  { label: "辐射抗性", value: "99%" },
  { label: "热耐受", value: "94%" },
  { label: "细胞完整性", value: "97%" },
  { label: "毒性过滤", value: "88%" },
  { label: "繁殖速率", value: "92%" },
  { label: "突变风险", value: "0.12%", isCritical: true },
];

const TRAITS_EN = [
  { label: "Radiation Resist.", value: "99%" },
  { label: "Thermal Tolerance", value: "94%" },
  { label: "Cell Integrity", value: "97%" },
  { label: "Toxicity Filter", value: "88%" },
  { label: "Reproduction Rate", value: "92%" },
  { label: "Mutation Risk", value: "0.12%", isCritical: true },
];

const DNA_CHARS = "ATCGATCGTTAACGCTAGCGATCGATTAGCGATCG";

export default function EnvironmentView() {
  const { locale } = useLocale();
  const isZh = locale === "zh";
  const traits = isZh ? TRAITS_ZH : TRAITS_EN;

  const [dnaStream, setDnaStream] = useState("");

  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % DNA_CHARS.length;
      const start = idx;
      const end = Math.min(idx + 40, DNA_CHARS.length);
      setDnaStream(DNA_CHARS.slice(start, end) + DNA_CHARS.slice(0, Math.max(0, 40 - (end - start))));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 min-h-full"
    >
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <p className="text-[10px] font-mono text-muted tracking-[0.2em] uppercase mb-2">
            {isZh ? "分子验证分析" : "Molecular Verification Analysis"}
          </p>
          <h1 className="text-4xl lg:text-5xl font-headline font-light tracking-[0.15em] uppercase text-on-surface">
            VALIDATION <span className="text-primary font-bold">CHAMBER</span>
          </h1>
          <p className="text-sm text-muted font-body mt-2">
            {isZh ? "目标 ID: M-77.BETA · D. radiodurans 工程株" : "Target ID: M-77.BETA · Engineered D. radiodurans Strain"}
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
            <span className="w-2 h-2 rounded-full bg-primary animate-dot-pulse" />
            <span className="text-[10px] font-mono text-muted tracking-widest uppercase">
              {isZh ? "实时验证" : "Live Validation"}
            </span>
          </div>
          <span className="text-[10px] font-mono text-muted">v4.2.1</span>
        </div>
      </motion.header>

      {/* Main split layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Metrics (40%) */}
        <motion.div
          variants={glassEntrance}
          initial="hidden"
          animate="show"
          className="lg:w-[40%] flex flex-col gap-6"
        >
          {/* Score Ring */}
          <div className="glass-panel p-8 flex justify-center">
            <ScoreRing score={98.4} label={isZh ? "已验证" : "VERIFIED"} />
          </div>

          {/* Trait Grid */}
          <div className="glass-panel p-6">
            <p className="text-[10px] font-mono text-muted tracking-[0.15em] uppercase mb-4">
              {isZh ? "生物特征矩阵" : "Bio-Trait Matrix"}
            </p>
            <TraitGrid traits={traits} />
          </div>
        </motion.div>

        {/* Right: 3D Viewer placeholder (60%) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="lg:flex-1 glass-panel p-6 min-h-[500px] flex flex-col"
        >
          {/* Viewer header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon name="3d_rotation" size={18} className="text-primary" />
              <span className="text-[10px] font-mono text-muted tracking-[0.15em] uppercase">
                {isZh ? "分子全息视图" : "Molecular Holo-Viewer"}
              </span>
            </div>
            <div className="flex gap-2">
              <button className="glass-panel-sm px-3 py-1.5 text-[10px] font-mono text-muted hover:text-primary transition-colors" style={{ borderRadius: "8px" }}>
                <Icon name="rotate_right" size={14} />
              </button>
              <button className="glass-panel-sm px-3 py-1.5 text-[10px] font-mono text-muted hover:text-primary transition-colors" style={{ borderRadius: "8px" }}>
                <Icon name="zoom_in" size={14} />
              </button>
            </div>
          </div>

          {/* 3D viewer area */}
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-[#020205]">
            {/* Simulated molecule visualization */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Background lighting */}
              <div className="absolute left-0 top-0 bottom-0 w-1/3" style={{ background: "linear-gradient(90deg, rgba(0,229,255,0.03) 0%, transparent 100%)" }} />
              <div className="absolute right-0 top-0 bottom-0 w-1/3" style={{ background: "linear-gradient(270deg, rgba(112,0,255,0.03) 0%, transparent 100%)" }} />

              {/* Rotating structure */}
              <div className="relative w-[250px] h-[250px]">
                {/* Outer ring */}
                <div className="absolute inset-0 spin-slow">
                  <svg viewBox="0 0 250 250" className="w-full h-full">
                    <circle cx="125" cy="125" r="120" fill="none" stroke="rgba(0,229,255,0.1)" strokeWidth="0.5" />
                    <circle cx="125" cy="125" r="100" fill="none" stroke="rgba(112,0,255,0.08)" strokeWidth="0.5" strokeDasharray="4 6" />
                    <circle cx="125" cy="125" r="80" fill="none" stroke="rgba(255,0,85,0.06)" strokeWidth="0.5" strokeDasharray="2 8" />
                  </svg>
                </div>

                {/* Inner ring (counter-rotate) */}
                <div className="absolute inset-[30px] orbit-ccw" style={{ animationDuration: "30s" }}>
                  <svg viewBox="0 0 190 190" className="w-full h-full">
                    <ellipse cx="95" cy="95" rx="90" ry="60" fill="none" stroke="rgba(0,229,255,0.08)" strokeWidth="0.5" transform="rotate(30 95 95)" />
                  </svg>
                </div>

                {/* Core */}
                <div className="absolute inset-[60px] flex items-center justify-center">
                  <div
                    className="w-[100px] h-[100px] rounded-full animate-breathing"
                    style={{
                      background: "radial-gradient(circle at 40% 35%, rgba(0,229,255,0.4) 0%, rgba(112,0,255,0.15) 60%, transparent 100%)",
                    }}
                  />
                  <div className="absolute">
                    <Icon name="hub" size={36} className="text-primary/60" />
                  </div>
                </div>
              </div>

              {/* Scanlines */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
                }}
              />
            </div>
          </div>

          {/* Bottom data stream */}
          <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-muted">
            <div className="flex gap-4">
              <span>RENDER: <span className="text-primary">ACTIVE</span></span>
              <span>FPS: <span className="text-on-surface">60</span></span>
              <span>POLYS: <span className="text-on-surface">1.2M</span></span>
            </div>
            <div className="overflow-hidden w-64 text-right">
              <span className="text-primary/40 tracking-wider">{dnaStream}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
