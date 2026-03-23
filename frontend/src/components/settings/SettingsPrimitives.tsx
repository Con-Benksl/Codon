import type { ReactNode } from "react";
import { motion } from "motion/react";
import { fadeSlideUp } from "../../lib/motion";

export function SectionBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <motion.section variants={fadeSlideUp} className="rounded-xl p-4 md:p-5 bg-surface-container-low border border-outline-variant/20">
      <h2 className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-widest mb-4">{title}</h2>
      {children}
    </motion.section>
  );
}

export function ToggleSwitch({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-10 h-5 rounded-full transition-colors ${
        checked ? "bg-primary/80" : "bg-surface-container-highest"
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-on-background transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function SelectField({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-body rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary/50"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
