import { motion } from "motion/react";
import { stagger, fadeSlideUp, fadeScale } from "../../lib/motion";
import { FallbackImage } from "../index";

interface Stats {
  nodes: number;
  confidence: number;
  latency: number;
}

interface Props {
  isZh: boolean;
  stats: Stats;
}

export default function OrchestratorCore({ isZh, stats }: Props) {
  return (
    <section className="mb-12 flex justify-center relative">
      <div className="absolute -bottom-12 left-1/2 w-px h-12 bg-gradient-to-b from-primary to-transparent" />
      <motion.div
        variants={fadeScale}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.35 }}
        className="glass-panel p-4 md:p-8 rounded-3xl w-full max-w-4xl border-t-2 border-t-primary/40 glow-primary relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center p-2 relative">
              <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin [animation-duration:3s]" />
              <FallbackImage
                src="https://picsum.photos/seed/synthetic-biology/400/400"
                alt="Synthetic Biology Core"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary text-on-primary px-2 py-1 rounded text-[10px] font-bold uppercase">
              Alpha-01
            </div>
          </div>

          <motion.div
            variants={stagger(60)}
            initial="hidden"
            animate="show"
            className="space-y-4 text-center md:text-left"
          >
            <motion.div variants={fadeSlideUp}>
              <h4 className="font-headline font-bold text-2xl text-primary tracking-tighter">
                {isZh ? "协调者智能体" : "Orchestrator Agent"}
              </h4>
              <p className="text-[10px] text-on-surface-variant font-headline tracking-[0.2em] uppercase">
                {isZh ? "多智能体任务分解引擎" : "Multi-agent task decomposition engine"}
              </p>
            </motion.div>
            <motion.p variants={fadeSlideUp} className="text-on-surface-variant font-body leading-relaxed max-w-xl italic">
              {isZh
                ? "正在初始化火星岩石自养生物设计的深度任务分解。主要目标：设计用于高氯酸盐还原和太阳辐射防护的代谢途径。"
                : "Initializing deep task decomposition for martian lithoautotrophic design. Primary target: pathways for perchlorate reduction and radiation shielding."}
            </motion.p>
            <motion.div variants={fadeSlideUp} className="flex gap-3 md:gap-4 justify-center md:justify-start">
              {([
                { keyZh: "逻辑节点", keyEn: "Logic Nodes", value: stats.nodes.toLocaleString() },
                { keyZh: "置信度", keyEn: "Confidence", value: `${stats.confidence}%` },
                { keyZh: "延迟", keyEn: "Latency", value: `${stats.latency}ms` },
              ] as const).map((stat, i) => (
                <div key={i} className="flex items-center gap-3 md:gap-4">
                  {i > 0 && <div className="h-8 w-px bg-outline-variant/30" />}
                  <div className="text-center">
                    <span className="block text-[10px] text-outline font-headline uppercase">
                      {isZh ? stat.keyZh : stat.keyEn}
                    </span>
                    <motion.span
                      key={stat.value}
                      initial={{ opacity: 0.4, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-lg font-headline font-bold text-on-surface block"
                    >
                      {stat.value}
                    </motion.span>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
