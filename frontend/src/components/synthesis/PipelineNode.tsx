import { motion } from "motion/react";
import Icon from "../Icon";

type NodeStatus = "pending" | "active" | "completed";

interface PipelineNodeProps {
  label: string;
  iconName: string;
  status: NodeStatus;
  index: number;
}

export default function PipelineNode({ label, iconName, status, index }: PipelineNodeProps) {
  const isActive = status === "active";
  const isComplete = status === "completed";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.15, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col items-center gap-3"
    >
      {/* Node circle */}
      <div className={`relative ${isActive ? "w-[160px] h-[160px]" : "w-[120px] h-[120px]"} transition-all duration-500`}>
        {/* Rotating rings for active */}
        {isActive && (
          <>
            <div className="absolute inset-[-8px] orbit-cw-fast">
              <svg viewBox="0 0 176 176" className="w-full h-full">
                <circle cx="88" cy="88" r="84" fill="none" stroke="rgba(0,229,255,0.3)" strokeWidth="1" strokeDasharray="8 6" />
              </svg>
            </div>
            <div className="absolute inset-[-4px] orbit-ccw" style={{ animationDuration: "6s" }}>
              <svg viewBox="0 0 168 168" className="w-full h-full">
                <circle cx="84" cy="84" r="80" fill="none" stroke="rgba(0,229,255,0.15)" strokeWidth="0.5" strokeDasharray="4 8" />
              </svg>
            </div>
          </>
        )}

        {/* Glow halo for active */}
        {isActive && (
          <div
            className="absolute inset-[-20px] rounded-full animate-breathing"
            style={{
              background: "radial-gradient(circle, rgba(0,229,255,0.15) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
        )}

        {/* Main circle */}
        <div
          className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-500 ${
            isActive
              ? "glass-panel border-primary/30"
              : isComplete
                ? "glass-panel border-[rgba(0,255,136,0.2)]"
                : "glass-panel opacity-40"
          }`}
          style={{ borderRadius: "9999px" }}
        >
          <Icon
            name={iconName}
            size={isActive ? 40 : 32}
            className={`transition-all duration-300 ${
              isActive
                ? "text-primary spin-fast"
                : isComplete
                  ? "text-[#00ff88]"
                  : "text-muted"
            }`}
          />
        </div>
      </div>

      {/* Label */}
      <span
        className={`text-[10px] font-headline tracking-[0.15em] uppercase text-center ${
          isActive ? "text-primary" : isComplete ? "text-on-surface" : "text-muted"
        }`}
      >
        {label}
      </span>

      {/* Status indicator */}
      <span className={`text-[9px] font-mono tracking-wider ${
        isActive ? "text-primary animate-pulse" : isComplete ? "text-[#00ff88]" : "text-muted/50"
      }`}>
        {isActive ? "ACTIVE" : isComplete ? "DONE" : "PENDING"}
      </span>
    </motion.div>
  );
}
