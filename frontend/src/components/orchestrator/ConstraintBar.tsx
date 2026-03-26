import { useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, Plus } from "lucide-react";
import { stagger } from "../../lib/motion";

interface Props {
  isZh: boolean;
  constraints: string[];
  inputValue: string;
  isOrchestrating?: boolean;
  hasRuns?: boolean;
  onInputChange: (v: string) => void;
  onAddConstraint: () => void;
  onRemoveConstraint: (tag: string) => void;
  onOrchestrate?: () => void;
}

export default function ConstraintBar({
  isZh, constraints, inputValue,
  onInputChange, onAddConstraint, onRemoveConstraint,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-3">
      <motion.div
        variants={stagger(50)}
        initial="hidden"
        animate="show"
        className="flex flex-wrap gap-2"
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
              className="px-3 py-1.5 bg-surface-container-highest rounded-full border border-outline-variant/30 text-xs font-headline flex items-center gap-2 group"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${["bg-secondary", "bg-tertiary", "bg-primary", "bg-orange-400", "bg-violet-400"][i % 5]}`} />
              {tag}
              <button
                onClick={() => onRemoveConstraint(tag)}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 hover:text-secondary"
                aria-label={`${isZh ? "移除" : "Remove"} ${tag}`}
              >
                <X size={9} />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-highest rounded-full border border-dashed border-outline-variant/40 hover:border-primary/50 transition-colors">
          <Search size={11} className="text-outline-variant shrink-0" />
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onAddConstraint(); }}
            className="bg-transparent border-none focus:outline-none text-xs font-headline text-outline placeholder:text-outline-variant/50 w-24"
            placeholder={isZh ? "添加约束..." : "Add constraint..."}
            type="text"
          />
          {inputValue.trim() && (
            <button onClick={onAddConstraint} className="text-primary hover:brightness-125">
              <Plus size={11} />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
