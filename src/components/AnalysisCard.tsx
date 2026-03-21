import { motion, useInView } from "motion/react";
import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { cardHover } from "../lib/motion";

interface AnalysisCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  progress?: number;
  tag: string;
  onClick?: () => void;
}

export default function AnalysisCard({ icon: Icon, title, description, progress, tag, onClick }: AnalysisCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <motion.div
      ref={ref}
      {...cardHover}
      onClick={onClick}
      className={`glass-panel p-5 rounded-xl border-l-2 border-l-secondary${onClick ? " cursor-pointer" : ""}`}
    >
      <div className="flex justify-between items-start mb-4">
        <Icon size={20} className="text-secondary/70" />
        <span className="text-[10px] font-headline text-secondary bg-secondary/10 px-2 py-0.5 rounded">{tag}</span>
      </div>
      <h4 className="font-headline font-bold text-on-surface text-sm uppercase mb-2">{title}</h4>
      <p className="text-xs text-on-surface-variant font-body leading-relaxed mb-4">{description}</p>
      {progress !== undefined && (
        <div className="w-full bg-surface-container-lowest h-1 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-secondary rounded-full"
            initial={{ width: 0 }}
            animate={inView ? { width: `${progress}%` } : { width: 0 }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
          />
        </div>
      )}
    </motion.div>
  );
}
