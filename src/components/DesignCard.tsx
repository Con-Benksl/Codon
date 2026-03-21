import { motion, useInView } from "motion/react";
import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { cardHover } from "../lib/motion";

interface DesignCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  steps?: number;
  tag: string;
  onClick?: () => void;
}

export default function DesignCard({ icon: Icon, title, description, steps, tag, onClick }: DesignCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <motion.div
      ref={ref}
      {...cardHover}
      onClick={onClick}
      className={`glass-panel p-5 rounded-xl border-l-2 border-l-primary${onClick ? " cursor-pointer" : ""}`}
    >
      <div className="flex justify-between items-start mb-4">
        <Icon size={20} className="text-primary/70" />
        <span className="text-[10px] font-headline text-primary bg-primary/10 px-2 py-0.5 rounded">{tag}</span>
      </div>
      <h4 className="font-headline font-bold text-on-surface text-sm uppercase mb-2">{title}</h4>
      <p className="text-xs text-on-surface-variant font-body leading-relaxed mb-4">{description}</p>
      {steps !== undefined && (
        <div className="flex gap-1">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className={`h-1 flex-1 rounded-full ${i < steps ? "bg-primary" : "bg-primary/20"}`}
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ transformOrigin: "left" }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
