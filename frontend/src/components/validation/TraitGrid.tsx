import { motion } from "motion/react";
import { stagger, cardSlideIn } from "../../lib/motion";

interface Trait {
  label: string;
  value: string;
  isCritical?: boolean;
}

interface TraitGridProps {
  traits: Trait[];
}

export default function TraitGrid({ traits }: TraitGridProps) {
  return (
    <motion.div
      variants={stagger(80)}
      initial="hidden"
      animate="show"
      className="grid grid-cols-3 gap-3"
    >
      {traits.map((trait, i) => (
        <motion.button
          key={i}
          variants={cardSlideIn}
          className={`group glass-panel-sm px-4 py-3 flex flex-col items-start gap-1 transition-all duration-300 hover:bg-[rgba(255,255,255,0.06)] hover:border-primary/30 hover:shadow-[0_0_15px_rgba(0,229,255,0.15)] hover:-translate-y-[2px] ${
            trait.isCritical ? "border-secondary/20" : ""
          }`}
          style={{ borderRadius: "16px" }}
        >
          <span className="text-[10px] font-mono text-muted tracking-wider uppercase">
            {trait.label}
          </span>
          <span
            className={`text-lg font-headline font-bold ${
              trait.isCritical ? "text-secondary" : "text-primary"
            }`}
          >
            {trait.value}
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
}
