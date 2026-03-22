import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

interface EnvironmentalCardProps {
  title: string;
  icon: LucideIcon;
  value: string;
  unit?: string;
  description: string;
  color?: "primary" | "secondary" | "tertiary" | "warning";
  progress?: { current: number; min: string; max: string };
  index?: number;
}

const colorMap = {
  primary: "text-primary border-primary/20",
  secondary: "text-secondary border-secondary/20",
  tertiary: "text-tertiary border-tertiary/20",
  warning: "text-[#d4a843] border-[#d4a843]/20",
} as const;

export default function EnvironmentalCard({ title, icon: Icon, value, unit, description, color = "primary", progress, index = 0 }: EnvironmentalCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ x: 4, transition: { duration: 0.15 } }}
      className={`glass-panel rounded-xl p-4 border border-outline-variant/10 ${color === "secondary" ? "hazard-glow" : ""}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] font-bold tracking-widest uppercase ${colorMap[color].split(" ")[0]}`}>{title}</span>
        <Icon size={16} className={colorMap[color].split(" ")[0]} />
      </div>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-headline font-bold text-on-surface">{value}</span>
        {unit && <span className="text-sm text-on-surface-variant">{unit}</span>}
      </div>
      {progress && (
        <>
          <div className="relative h-2 w-full bg-surface-container-lowest rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary-container rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress.current}%` }}
              transition={{ duration: 1, delay: 0.4 + index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[11px] text-on-surface-variant uppercase tracking-tighter">
            <span>{progress.min}</span>
            <span>{progress.max}</span>
          </div>
        </>
      )}
      <div className={`text-[11px] leading-relaxed border-l-2 pl-3 ${color === "secondary" ? "text-secondary border-secondary/30" : "text-on-surface-variant border-primary/30"}`}>
        {description}
      </div>
    </motion.div>
  );
}
