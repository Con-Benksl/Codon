import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FlaskConical,
  RefreshCw,
  Cpu,
  Network,
  Dna,
  Bug,
  Layers,
  Database,
  Thermometer,
  Search,
  Terminal,
  Download,
  Share2,
} from "lucide-react";
import { Badge, AnalysisCard, DesignCard, DetailPanel } from "../components";
import { agentDetails } from "../data/agentDetails";
import {
  stagger,
  fadeSlideUp,
  fadeScale,
  viewTransition,
  cardHover,
  buttonPress,
  inViewport,
} from "../lib/motion";

export default function OrchestratorView() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const activeAgent = selectedAgent ? agentDetails[selectedAgent] : null;

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1"
    >
      {/* ── Hero Section ── */}
      <motion.section
        variants={stagger(70)}
        initial="hidden"
        animate="show"
        className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6"
      >
        <div className="space-y-4">
          <motion.div variants={fadeSlideUp} className="flex gap-2">
            <Badge color="primary">合成生物学</Badge>
            <Badge color="secondary">行星地质</Badge>
            <Badge color="tertiary">多智能体 AI</Badge>
          </motion.div>
          <motion.h2
            variants={fadeSlideUp}
            className="text-5xl font-black font-headline text-on-background tracking-tighter max-w-2xl leading-none"
          >
            生物群落合成 <span className="text-primary italic">协调者</span>
          </motion.h2>
        </div>
        <motion.div
          variants={fadeSlideUp}
          className="glass-panel p-4 rounded-xl flex items-center gap-6 border-l-4 border-l-tertiary"
        >
          <div className="text-right">
            <p className="text-[10px] font-headline text-on-surface-variant uppercase tracking-widest">大气压力</p>
            <p className="text-xl font-headline font-bold text-tertiary">0.61 kPa</p>
          </div>
          <div className="h-10 w-px bg-outline-variant/20" />
          <div className="text-right">
            <p className="text-[10px] font-headline text-on-surface-variant uppercase tracking-widest">辐射通量</p>
            <p className="text-xl font-headline font-bold text-secondary">450 mSv/yr</p>
          </div>
        </motion.div>
      </motion.section>

      {/* ── Environmental Constraints ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="mb-8"
      >
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="flex items-center gap-3 shrink-0">
              <Thermometer className="text-primary" size={32} />
              <h3 className="font-headline font-bold text-lg uppercase tracking-tight">火星环境约束参数</h3>
            </div>
            <motion.div
              variants={stagger(50)}
              initial="hidden"
              animate="show"
              className="flex flex-wrap gap-2 flex-1"
            >
              {["UV-B/C 辐射暴露", "高氯酸盐 (ClO4-)", "95% CO2 饱和度", "FE2O3 粉尘浓度"].map((tag, i) => (
                <motion.span
                  key={tag}
                  variants={fadeSlideUp}
                  whileHover={{ scale: 1.04, transition: { duration: 0.15 } }}
                  className="px-4 py-2 bg-surface-container-highest rounded-full border border-outline-variant/30 text-xs font-headline flex items-center gap-2"
                >
                  <span className={`w-2 h-2 rounded-full ${["bg-secondary", "bg-tertiary", "bg-primary", "bg-orange-400"][i]}`} /> {tag}
                </motion.span>
              ))}
              <div className="flex items-center gap-2 px-4 py-2">
                <Search size={14} className="text-outline-variant" />
                <input className="bg-transparent border-none focus:ring-0 text-xs font-headline text-outline placeholder:text-outline-variant/50 w-32" placeholder="添加约束..." type="text" />
              </div>
            </motion.div>
            <motion.button
              {...buttonPress}
              className="px-6 py-2 bg-primary text-on-primary font-headline font-bold text-xs rounded-full uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_15px_rgba(129,207,255,0.4)]"
            >
              更新模型
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* ── Orchestrator Agent (Hero Card) ── */}
      <section className="mb-12 flex justify-center relative">
        <div className="absolute -bottom-12 left-1/2 w-px h-12 bg-gradient-to-b from-primary to-transparent" />
        <motion.div
          variants={fadeScale}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.35 }}
          className="glass-panel p-8 rounded-3xl w-full max-w-4xl border-t-2 border-t-primary/40 glow-primary relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center p-2 relative">
                <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin [animation-duration:3s]" />
                <img
                  src="https://picsum.photos/seed/synthetic-biology/400/400"
                  alt="Synthetic Biology Core"
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-primary text-on-primary px-2 py-1 rounded text-[10px] font-bold uppercase">Alpha-01</div>
            </div>
            <motion.div
              variants={stagger(60)}
              initial="hidden"
              animate="show"
              className="space-y-4 text-center md:text-left"
            >
              <motion.div variants={fadeSlideUp}>
                <h4 className="font-headline font-bold text-2xl text-primary tracking-tighter">协调者智能体</h4>
                <p className="text-[10px] text-on-surface-variant font-headline tracking-[0.2em] uppercase">多智能体任务分解引擎</p>
              </motion.div>
              <motion.p variants={fadeSlideUp} className="text-on-surface-variant font-body leading-relaxed max-w-xl italic">
                "正在初始化火星岩石自养生物设计的深度任务分解。主要目标：设计用于高氯酸盐还原和太阳辐射防护的代谢途径。"
              </motion.p>
              <motion.div variants={fadeSlideUp} className="flex gap-4 justify-center md:justify-start">
                <div className="text-center">
                  <span className="block text-[10px] text-outline font-headline uppercase">逻辑节点</span>
                  <span className="text-lg font-headline font-bold text-on-surface">1,240</span>
                </div>
                <div className="h-8 w-px bg-outline-variant/30" />
                <div className="text-center">
                  <span className="block text-[10px] text-outline font-headline uppercase">置信度</span>
                  <span className="text-lg font-headline font-bold text-on-surface">98.4%</span>
                </div>
                <div className="h-8 w-px bg-outline-variant/30" />
                <div className="text-center">
                  <span className="block text-[10px] text-outline font-headline uppercase">延迟</span>
                  <span className="text-lg font-headline font-bold text-on-surface">14ms</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── Layers Grid ── */}
      <motion.div
        variants={stagger(100)}
        initial="hidden"
        whileInView="show"
        {...inViewport}
        className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative"
      >
        {/* Analysis Layer */}
        <motion.div variants={fadeSlideUp} className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Database size={16} className="text-secondary" />
            <h3 className="font-headline font-bold text-sm tracking-widest uppercase">分析层 <span className="text-on-surface-variant/40">v2.4</span></h3>
          </div>
          <motion.div
            variants={stagger(80)}
            initial="hidden"
            whileInView="show"
            {...inViewport}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <motion.div variants={fadeSlideUp}>
              <AnalysisCard
                icon={FlaskConical}
                title="环境解析"
                description="绘制土壤毒性梯度和热震荡模式，以实现最佳生物群落部署。"
                progress={75}
                tag="环境解析"
                onClick={() => setSelectedAgent("env-parse")}
              />
            </motion.div>
            <motion.div variants={fadeSlideUp}>
              <AnalysisCard
                icon={Bug}
                title="极端微生物"
                description="检索耐辐射奇球菌变体数据库，以获取辐射抗性性状。"
                progress={50}
                tag="生物规范"
                onClick={() => setSelectedAgent("extremophile")}
              />
            </motion.div>
            <motion.div variants={fadeSlideUp} className="md:col-span-2">
              <motion.div
                {...cardHover}
                onClick={() => setSelectedAgent("gene-func")}
                className="glass-panel p-5 rounded-xl border-l-2 border-l-secondary flex gap-6 items-center cursor-pointer"
              >
                <Dna size={40} className="text-secondary" />
                <div className="flex-1">
                  <h4 className="font-headline font-bold text-on-surface text-sm uppercase mb-1">基因功能映射</h4>
                  <p className="text-xs text-on-surface-variant font-body">交叉引用用于大气固氮的代谢基因簇。</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-headline text-on-surface-variant block">匹配率</span>
                  <span className="text-lg font-headline font-bold text-secondary">92%</span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Design Layer */}
        <motion.div variants={fadeSlideUp} className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Cpu size={16} className="text-primary" />
            <h3 className="font-headline font-bold text-sm tracking-widest uppercase">设计层 <span className="text-on-surface-variant/40">原型_0</span></h3>
          </div>
          <motion.div
            variants={stagger(80)}
            initial="hidden"
            whileInView="show"
            {...inViewport}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <motion.div variants={fadeSlideUp}>
              <DesignCard
                icon={Terminal}
                title="回路设计"
                description="编码用于环境感应和响应触发的切换开关。"
                steps={2}
                tag="合成逻辑"
                onClick={() => setSelectedAgent("circuit-design")}
              />
            </motion.div>
            <motion.div variants={fadeSlideUp}>
              <DesignCard
                icon={Network}
                title="代谢兼容性"
                description="在高氯酸盐环境中模拟生物量通量，以确保生存。"
                steps={3}
                tag="代谢映射"
                onClick={() => setSelectedAgent("metab-compat")}
              />
            </motion.div>
            <motion.div variants={fadeSlideUp} className="md:col-span-2">
              <motion.div
                {...cardHover}
                onClick={() => setSelectedAgent("struct-predict")}
                className="glass-panel p-5 rounded-xl border-l-2 border-l-primary flex gap-6 items-center cursor-pointer"
              >
                <Layers size={40} className="text-primary" />
                <div className="flex-1">
                  <h4 className="font-headline font-bold text-on-surface text-sm uppercase mb-1">结构预测</h4>
                  <p className="text-xs text-on-surface-variant font-body">利用深度学习折叠膜蛋白，以实现耐寒功能。</p>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border border-primary bg-surface-container-high flex items-center justify-center">
                    <Network size={12} className="text-primary" />
                  </div>
                  <div className="w-8 h-8 rounded-full border border-primary bg-surface-container-high flex items-center justify-center">
                    <Terminal size={12} className="text-primary" />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── Verification Agent ── */}
      <section className="mt-12 relative">
        <div className="absolute inset-0 bg-tertiary/5 rounded-3xl blur-3xl pointer-events-none opacity-40" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          {...inViewport}
          className="glass-panel p-10 rounded-[2rem] border-t-2 border-t-tertiary/40 relative overflow-hidden"
        >
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <motion.div
              variants={stagger(70)}
              initial="hidden"
              whileInView="show"
              {...inViewport}
              className="flex-1 space-y-6"
            >
              <motion.div variants={fadeSlideUp} className="inline-flex items-center gap-2 px-3 py-1 bg-tertiary/10 border border-tertiary/20 text-tertiary text-[10px] font-headline tracking-widest uppercase rounded">
                反幻觉安全层
              </motion.div>
              <motion.h3 variants={fadeSlideUp} className="text-4xl font-headline font-black tracking-tighter text-on-surface uppercase leading-none">
                核查层 <span className="text-tertiary italic">&amp; 保真度</span> 智能体
              </motion.h3>
              <motion.p variants={fadeSlideUp} className="text-on-surface-variant font-body text-lg leading-relaxed max-w-2xl">
                验证阶段处于活跃状态。正在将预测的代谢输出与火星土壤化学模拟进行对比。设计层代谢途径中未检测到逻辑不一致性。
              </motion.p>
              <motion.div variants={fadeSlideUp} className="flex gap-4">
                <motion.button
                  {...buttonPress}
                  className="px-8 py-4 bg-tertiary text-on-tertiary font-headline font-bold text-sm rounded-full uppercase tracking-[0.2em] flex items-center gap-3 hover:scale-105 transition-all shadow-[0_0_20px_rgba(100,221,153,0.3)]"
                >
                  <RefreshCw size={18} />
                  反馈回路
                </motion.button>
                <motion.button
                  {...buttonPress}
                  className="px-8 py-4 border border-outline-variant/30 text-on-surface-variant font-headline font-bold text-sm rounded-full uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-surface-container transition-all"
                >
                  验证批次
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
                <p className="text-[10px] font-headline text-outline uppercase mb-2">错误率</p>
                <p className="text-2xl font-headline font-bold text-tertiary">&lt; 0.001%</p>
              </motion.div>
              <motion.div variants={fadeScale} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/15 text-center">
                <p className="text-[10px] font-headline text-outline uppercase mb-2">模拟周期</p>
                <p className="text-2xl font-headline font-bold text-on-surface">50M+</p>
              </motion.div>
              <motion.div variants={fadeScale} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/15 text-center col-span-2">
                <p className="text-[10px] font-headline text-outline uppercase mb-2">结构稳定性</p>
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

      {/* ── Output Bar ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        {...inViewport}
        className="mt-12"
      >
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/15 flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <Database size={18} className="text-primary" />
            <span className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">设计规范书：</span>
          </div>
          <div className="flex-1 bg-surface-container-lowest px-4 py-2 rounded font-mono text-xs text-primary/70 overflow-hidden text-ellipsis whitespace-nowrap">
            XENO_BIO_v1.0.4_PATH_ID_8842-B-ALPHA_CONSTRAINED_STABLE
          </div>
          <div className="flex gap-2">
            <motion.button {...buttonPress} className="p-2 hover:bg-surface-container rounded transition-colors text-on-surface-variant">
              <Download size={18} />
            </motion.button>
            <motion.button {...buttonPress} className="p-2 hover:bg-surface-container rounded transition-colors text-on-surface-variant">
              <Share2 size={18} />
            </motion.button>
            <motion.button
              {...buttonPress}
              className="px-6 py-2 bg-primary/20 text-primary border border-primary/30 rounded font-headline font-bold text-[10px] uppercase tracking-widest hover:bg-primary/30 transition-all"
            >
              执行生物打印
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* ── Detail Panel ── */}
      <AnimatePresence>
        {activeAgent && (
          <DetailPanel
            agent={activeAgent}
            onClose={() => setSelectedAgent(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
