import { motion } from "motion/react";
import { Check, X, ExternalLink, ShieldCheck } from "lucide-react";
import { useDesigner } from "../../views/designer/DesignerContext";
import { viewTransition, fadeSlideUp, stagger } from "../../lib/motion";
import RollbackButton from "./RollbackButton";

function strategyStyle(strategy: string): string {
  const s = strategy.toLowerCase();
  if (s.includes("敲入") || s.includes("knock-in") || s.includes("insert"))
    return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
  if (s.includes("敲除") || s.includes("knockout"))
    return "bg-rose-500/10 text-rose-400 border-rose-500/30";
  if (s.includes("过表达") || s.includes("overexpr"))
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  if (s.includes("调控") || s.includes("replace"))
    return "bg-purple-500/10 text-purple-400 border-purple-500/30";
  return "bg-card text-text-muted border-border";
}

function burdenLevel(burden: string): number {
  const b = burden.toLowerCase();
  if (b.includes("高") || b.includes("high")) return 0.85;
  if (b.includes("中") || b.includes("medium")) return 0.55;
  if (b.includes("低") || b.includes("low")) return 0.25;
  return 0.5;
}

export default function GeneEditStep() {
  const { state, handleEditPlanSelect } = useDesigner();
  const candidates = state.editPlanCandidates;

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-10"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-headline text-text tracking-tight">Step 5 · 基因编辑方案</h2>
          <p className="text-lg text-text-muted mt-2">
            候选编辑策略与递送方案
          </p>
        </div>
        <RollbackButton label="重选蛋白" targetStep={4} />
      </div>

      {candidates.length === 0 ? (
        <div className="text-center py-20 text-text-muted text-lg border border-dashed border-white/15 rounded-2xl">
          等待编辑方案加载...
        </div>
      ) : (
        <motion.div
          variants={stagger(60)}
          initial="hidden"
          animate="show"
          className="space-y-5"
        >
          {candidates.map((p) => {
            const burden = burdenLevel(p.metabolic_burden);
            return (
              <motion.button
                key={p.id}
                variants={fadeSlideUp}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  void handleEditPlanSelect(p.id);
                }}
                className="w-full text-left p-7 rounded-2xl border border-white/20 bg-card-translucent hover:border-primary/40 hover:bg-primary/[0.04] transition-all duration-300"
              >
                <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr] gap-7">
                  {/* 左：基因信息 */}
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-xl font-semibold text-text font-mono">
                        {p.target_gene}
                      </span>
                      <span
                        className={`inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-md border ${strategyStyle(p.strategy)}`}
                      >
                        {p.strategy}
                      </span>
                    </div>
                    <div className="text-base text-text-muted italic mt-1">
                      来源：{p.source}
                    </div>
                    <div className="text-sm text-text-muted mt-2 line-clamp-2">
                      {p.codon_optimization_note}
                    </div>
                  </div>

                  {/* 中：载体+启动子 */}
                  <div className="space-y-1.5">
                    <div className="text-xs text-text-dim uppercase tracking-[0.2em] font-semibold">
                      递送
                    </div>
                    <div className="text-base text-text font-medium">{p.delivery_vector}</div>
                    <div className="text-xs text-text-dim uppercase tracking-[0.2em] font-semibold mt-3">
                      启动子
                    </div>
                    <div className="text-base text-text font-mono">{p.promoter}</div>
                  </div>

                  {/* 右：负担条+kill-switch+文献 */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm text-text-dim mb-1.5">
                        <span className="uppercase tracking-wider font-medium">代谢负担</span>
                        <span className="text-text font-medium">{p.metabolic_burden}</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${burden * 100}%` }}
                          transition={{ duration: 0.5 }}
                          className={
                            burden > 0.7
                              ? "h-full bg-rose-400"
                              : burden > 0.4
                                ? "h-full bg-yellow-400"
                                : "h-full bg-emerald-400"
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.has_kill_switch ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400 font-medium">
                          <ShieldCheck size={16} />
                          Kill-switch
                          <Check size={14} />
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sm text-text-dim font-medium">
                          <ShieldCheck size={16} />
                          Kill-switch
                          <X size={14} />
                        </span>
                      )}
                    </div>
                    {p.references.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {p.references.slice(0, 2).map((ref) => (
                          <a
                            key={ref}
                            href={`https://doi.org/${ref}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-md border border-white/15 bg-white/[0.04] text-text-muted hover:text-primary hover:border-primary/40"
                          >
                            DOI <ExternalLink size={12} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
