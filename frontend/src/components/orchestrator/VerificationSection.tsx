import { motion } from "motion/react";
import { RefreshCw } from "lucide-react";
import { stagger, fadeSlideUp, fadeScale, inViewport, buttonPress } from "../../lib/motion";

interface Props {
  isZh: boolean;
}

export default function VerificationSection({ isZh }: Props) {
  return (
    <section className="mt-12 relative">
      <div className="absolute inset-0 bg-tertiary/5 rounded-3xl blur-3xl pointer-events-none opacity-40" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        {...inViewport}
        className="glass-panel p-6 md:p-10 rounded-[2rem] border-t-2 border-t-tertiary/40 relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <motion.div
            variants={stagger(70)}
            initial="hidden"
            whileInView="show"
            {...inViewport}
            className="flex-1 space-y-6"
          >
            <motion.div
              variants={fadeSlideUp}
              className="inline-flex items-center gap-2 px-3 py-1 bg-tertiary/10 border border-tertiary/20 text-tertiary text-[10px] font-headline tracking-widest uppercase rounded"
            >
              {isZh ? "反幻觉安全层" : "Anti-Hallucination Safety Layer"}
            </motion.div>
            <motion.h3 variants={fadeSlideUp} className="text-2xl md:text-4xl font-headline font-black tracking-tighter text-on-surface uppercase leading-none">
              {isZh ? "核查层" : "Verification"}
              <span className="text-tertiary italic">&amp; {isZh ? "保真度" : "Fidelity"}</span>{" "}
              {isZh ? "智能体" : "Agent"}
            </motion.h3>
            <motion.p variants={fadeSlideUp} className="text-on-surface-variant font-body text-lg leading-relaxed max-w-2xl">
              {isZh
                ? "验证阶段处于活跃状态。正在将预测代谢输出与火星土壤化学模拟进行对比。设计层路径中未检测到逻辑不一致性。"
                : "Verification is active. Predicted metabolic output is being compared against martian soil chemistry models. No logical inconsistency detected in current design pathways."}
            </motion.p>
            <motion.div variants={fadeSlideUp} className="flex gap-4">
              <motion.button
                {...buttonPress}
                className="px-8 py-4 bg-tertiary text-on-tertiary font-headline font-bold text-sm rounded-full uppercase tracking-[0.2em] flex items-center gap-3 hover:scale-105 transition-all shadow-[0_0_20px_rgba(100,221,153,0.3)]"
              >
                <RefreshCw size={18} />
                {isZh ? "反馈回路" : "Feedback Loop"}
              </motion.button>
              <motion.button
                {...buttonPress}
                className="px-8 py-4 border border-outline-variant/30 text-on-surface-variant font-headline font-bold text-sm rounded-full uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-surface-container transition-all"
              >
                {isZh ? "验证批次" : "Validate Batch"}
              </motion.button>
            </motion.div>
          </motion.div>

          <motion.div
            variants={stagger(60)}
            initial="hidden"
            whileInView="show"
            {...inViewport}
            className="w-full lg:w-1/3 grid grid-cols-2 gap-4"
          >
            <motion.div variants={fadeScale} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/15 text-center">
              <p className="text-[10px] font-headline text-outline uppercase mb-2">{isZh ? "错误率" : "Error Rate"}</p>
              <p className="text-2xl font-headline font-bold text-tertiary">&lt; 0.001%</p>
            </motion.div>
            <motion.div variants={fadeScale} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/15 text-center">
              <p className="text-[10px] font-headline text-outline uppercase mb-2">{isZh ? "模拟周期" : "Simulation Cycles"}</p>
              <p className="text-2xl font-headline font-bold text-on-surface">50M+</p>
            </motion.div>
            <motion.div variants={fadeScale} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/15 text-center col-span-2">
              <p className="text-[10px] font-headline text-outline uppercase mb-2">{isZh ? "结构稳定性" : "Structural Stability"}</p>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-tertiary rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: "95%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  />
                </div>
                <span className="text-sm font-headline font-bold text-on-surface">95.4%</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
