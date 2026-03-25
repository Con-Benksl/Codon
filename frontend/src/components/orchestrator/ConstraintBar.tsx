import { useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Thermometer, Search, X, Plus, Play, RefreshCw, Loader2 } from "lucide-react";
import { stagger, buttonPress } from "../../lib/motion";

interface Props {
  isZh: boolean;
  constraints: string[];
  inputValue: string;
  isOrchestrating: boolean;
  hasRuns: boolean;
  onInputChange: (v: string) => void;
  onAddConstraint: () => void;
  onRemoveConstraint: (tag: string) => void;
  onOrchestrate: () => void;
}

export default function ConstraintBar({
  isZh, constraints, inputValue, isOrchestrating, hasRuns,
  onInputChange, onAddConstraint, onRemoveConstraint, onOrchestrate,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="mb-8"
    >
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
          <div className="flex items-center gap-3 shrink-0">
            <Thermometer className="text-primary" size={32} />
            <h3 className="font-headline font-bold text-lg uppercase tracking-tight">
              {isZh ? "火星环境约束参数" : "Martian Constraint Parameters"}
            </h3>
          </div>

          <motion.div
            variants={stagger(50)}
            initial="hidden"
            animate="show"
            className="flex flex-wrap gap-2 flex-1"
          >
            <AnimatePresence mode="popLayout">
              {constraints.map((tag, i) => (
                <motion.span
                  key={tag}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.04, transition: { duration: 0.15 } }}
                  className="px-3 py-2 bg-surface-container-highest rounded-full border border-outline-variant/30 text-xs font-headline flex items-center gap-2 group"
                >
                  <span className={`w-2 h-2 rounded-full ${["bg-secondary", "bg-tertiary", "bg-primary", "bg-orange-400", "bg-purple-400"][i % 5]}`} />
                  {tag}
                  <button
                    onClick={() => onRemoveConstraint(tag)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-secondary"
                    aria-label={`${isZh ? "移除" : "Remove"} ${tag}`}
                  >
                    <X size={10} />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>

            <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-highest rounded-full border border-dashed border-outline-variant/40 hover:border-primary/50 transition-colors">
              <Search size={12} className="text-outline-variant shrink-0" />
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onAddConstraint(); }}
                className="bg-transparent border-none focus:outline-none text-xs font-headline text-outline placeholder:text-outline-variant/50 w-28"
                placeholder={isZh ? "添加约束..." : "Add constraint..."}
                type="text"
              />
              {inputValue.trim() && (
                <button onClick={onAddConstraint} className="text-primary hover:brightness-125">
                  <Plus size={12} />
                </button>
              )}
            </div>
          </motion.div>

          <motion.button
            {...buttonPress}
            onClick={onOrchestrate}
            disabled={isOrchestrating}
            className={`px-6 py-2 font-headline font-bold text-xs rounded-full uppercase tracking-widest transition-all flex items-center gap-2 ${
              isOrchestrating
                ? "bg-primary/50 text-on-primary/70 cursor-wait"
                : "bg-primary text-on-primary hover:brightness-110 shadow-[0_0_15px_rgba(129,207,255,0.4)]"
            }`}
          >
            {isOrchestrating ? (
              <><Loader2 size={14} className="animate-spin" />{isZh ? "运行中..." : "Running..."}</>
            ) : hasRuns ? (
              <><RefreshCw size={14} />{isZh ? "重新运行" : "Re-run"}</>
            ) : (
              <><Play size={14} />{isZh ? "启动编排" : "Run Orchestration"}</>
            )}
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}
