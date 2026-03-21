import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Thermometer, Radiation, Wind } from "lucide-react";

interface MarsStatusGlobeProps {
  activeView: string;
  onNavigate: () => void;
}

const viewTheme = {
  orchestrator: {
    glow: "rgba(78,168,217,0.35)",
    border: "border-primary/30",
    ring: "border-primary/15",
    text: "text-primary",
    bg: "from-primary/20 to-primary/5",
  },
  environment: {
    glow: "rgba(100,221,153,0.35)",
    border: "border-tertiary/30",
    ring: "border-tertiary/15",
    text: "text-tertiary",
    bg: "from-tertiary/20 to-tertiary/5",
  },
} as const;

const metrics = [
  { icon: Thermometer, label: "表面温度", value: "-60°C", color: "text-primary" },
  { icon: Radiation, label: "辐射通量", value: "450 mSv", color: "text-secondary" },
  { icon: Wind, label: "大气压力", value: "0.61 kPa", color: "text-tertiary" },
];

export default function MarsStatusGlobe({ activeView, onNavigate }: MarsStatusGlobeProps) {
  const [hovered, setHovered] = useState(false);
  const theme = viewTheme[activeView as keyof typeof viewTheme] ?? viewTheme.orchestrator;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
      className="fixed bottom-8 right-8 z-40 hidden xl:flex items-end gap-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Expanded metrics panel */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: 12, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="glass-panel rounded-xl p-3 mb-2 border border-outline-variant/20 min-w-[160px]"
          >
            <p className="text-[9px] font-headline font-bold text-on-surface-variant uppercase tracking-widest mb-2">
              Mars Status
            </p>
            <div className="space-y-2">
              {metrics.map((m) => (
                <div key={m.label} className="flex items-center gap-2">
                  <m.icon size={12} className={m.color} />
                  <div className="flex-1">
                    <p className="text-[9px] text-on-surface-variant leading-none">{m.label}</p>
                    <p className={`text-xs font-headline font-bold ${m.color}`}>{m.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-outline-variant/10">
              <p className="text-[8px] text-on-surface-variant text-center uppercase tracking-widest">
                点击进入环境层
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Globe */}
      <motion.button
        onClick={onNavigate}
        animate={{
          boxShadow: hovered
            ? `0 0 30px ${theme.glow}, 0 0 60px ${theme.glow.replace("0.35", "0.15")}`
            : `0 0 15px ${theme.glow.replace("0.35", "0.15")}`,
        }}
        transition={{ duration: 0.3 }}
        className={`relative w-14 h-14 rounded-full cursor-pointer bg-gradient-to-br ${theme.bg} border ${theme.border} overflow-hidden`}
        aria-label="Mars status — click to view environment"
      >
        {/* Outer pulse ring */}
        <motion.div
          className={`absolute -inset-2 rounded-full border ${theme.ring}`}
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Spinning image */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLOnBpzwdG-9pxlP3Pho-Kze-P_c05g3uGAbBqKmt7JJ45b-qosrm5J1nSsLjjBsmOVck9cpX4nbm2ZopOykyDf4SN4eAF_q-4FzbeW-qB3kCvrEULNHUiYHBxLmC4IwWRPM_yqz9NwPpRGAkMn6JHjaGF8Qp4rAnEwn6FiSVpqVZlQTGZVrc8lGKPH7NC2PN-talRQBHvrBB1gzqPgB-0jT5kb8mowOdIBx3_LxfYiC9UwOb0zdE_MMP8sB_h-mXVzftdZ-UBqRM"
            alt="Mars Globe"
            className="w-[200%] h-full object-cover opacity-60 mix-blend-screen mars-orbit"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/5 rounded-full" />

        {/* Online indicator */}
        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-tertiary border-2 border-background animate-pulse" />
      </motion.button>
    </motion.div>
  );
}
