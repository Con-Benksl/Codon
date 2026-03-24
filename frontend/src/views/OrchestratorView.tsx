import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
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
  X,
  Plus,
} from "lucide-react";
import { Badge, AnalysisCard, DesignCard, DetailPanel, FallbackImage } from "../components";
import { agentDetails } from "../data/agentDetails";
import { useLocale } from "../i18n/context";
import {
  stagger,
  fadeSlideUp,
  fadeScale,
  viewTransition,
  cardHover,
  buttonPress,
  inViewport,
} from "../lib/motion";

const DEFAULT_CONSTRAINTS = {
  zh: ["UV-B/C 辐射暴露", "高氯酸盐 (ClO4-)", "95% CO2 饱和度", "Fe2O3 粉尘浓度"],
  en: ["UV-B/C exposure", "Perchlorate (ClO4-)", "95% CO2 saturation", "Fe2O3 dust density"],
} as const;

export default function OrchestratorView() {
  const { locale } = useLocale();
  const isZh = locale === "zh";
  const t = <T,>(zh: T, en: T) => (isZh ? zh : en);

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [constraints, setConstraints] = useState<string[]>(() => [...DEFAULT_CONSTRAINTS[locale]]);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const activeAgent = selectedAgent ? agentDetails[selectedAgent] : null;

  useEffect(() => {
    const allDefaults = [...DEFAULT_CONSTRAINTS.zh, ...DEFAULT_CONSTRAINTS.en];
    setConstraints((prev) => {
      if (prev.length === 0 || prev.every((item) => allDefaults.includes(item))) {
        return [...DEFAULT_CONSTRAINTS[locale]];
      }
      return prev;
    });
  }, [locale]);

  const addConstraint = () => {
    const val = inputValue.trim();
    if (val && !constraints.includes(val)) {
      setConstraints((prev) => [...prev, val]);
    }
    setInputValue("");
  };

  const removeConstraint = (tag: string) => {
    setConstraints((prev) => prev.filter((c) => c !== tag));
  };

  const [stats, setStats] = useState({ nodes: 1240, confidence: 98.4, latency: 14 });
  useEffect(() => {
    const id = setInterval(() => {
      setStats({
        nodes: 1240 + Math.floor(Math.random() * 10 - 4),
        confidence: parseFloat((98.4 + (Math.random() * 0.3 - 0.15)).toFixed(1)),
        latency: 14 + Math.floor(Math.random() * 4 - 2),
      });
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1"
    >
      <motion.section
        variants={stagger(70)}
        initial="hidden"
        animate="show"
        className="mb-8 md:mb-12 pt-2 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6"
      >
        <div className="space-y-4">
          <motion.div variants={fadeSlideUp} className="flex gap-2">
            <Badge color="primary">{t("合成生物学", "Synthetic Biology")}</Badge>
            <Badge color="secondary">{t("行星地质", "Planetary Geology")}</Badge>
            <Badge color="tertiary">{t("多智能体 AI", "Multi-Agent AI")}</Badge>
          </motion.div>
          <motion.h2
            variants={fadeSlideUp}
            className="text-3xl md:text-5xl font-black font-headline text-on-background tracking-tighter max-w-2xl leading-none"
          >
            {t("生物群落合成", "Biota Synthesis")} <span className="text-primary">{t("协调者", "Orchestrator")}</span>
          </motion.h2>
        </div>

        <motion.div
          variants={fadeSlideUp}
          className="glass-panel p-4 rounded-xl flex items-center justify-around md:justify-start w-full md:w-auto gap-0 md:gap-6 border-l-4 border-l-tertiary"
        >
          <div className="text-center md:text-right">
            <p className="text-[10px] font-headline text-on-surface-variant uppercase tracking-widest">{t("大气压力", "Atmospheric Pressure")}</p>
            <p className="text-xl font-headline font-bold text-tertiary">0.61 kPa</p>
          </div>
          <div className="h-10 w-px bg-outline-variant/20" />
          <div className="text-center md:text-right">
            <p className="text-[10px] font-headline text-on-surface-variant uppercase tracking-widest">{t("辐射通量", "Radiation Flux")}</p>
            <p className="text-xl font-headline font-bold text-secondary">450 mSv/yr</p>
          </div>
        </motion.div>
      </motion.section>

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
              <h3 className="font-headline font-bold text-lg uppercase tracking-tight">{t("火星环境约束参数", "Martian Constraint Parameters")}</h3>
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
                      onClick={() => removeConstraint(tag)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-secondary"
                      aria-label={`${t("移除", "Remove")} ${tag}`}
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
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addConstraint();
                  }}
                  className="bg-transparent border-none focus:outline-none text-xs font-headline text-outline placeholder:text-outline-variant/50 w-28"
                  placeholder={t("添加约束...", "Add constraint...")}
                  type="text"
                />
                {inputValue.trim() && (
                  <button onClick={addConstraint} className="text-primary hover:brightness-125">
                    <Plus size={12} />
                  </button>
                )}
              </div>
            </motion.div>
            <motion.button
              {...buttonPress}
              className="px-6 py-2 bg-primary text-on-primary font-headline font-bold text-xs rounded-full uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_15px_rgba(129,207,255,0.4)]"
            >
              {t("更新模型", "Update Model")}
            </motion.button>
          </div>
        </div>
      </motion.section>

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
              <div className="absolute -bottom-2 -right-2 bg-primary text-on-primary px-2 py-1 rounded text-[10px] font-bold uppercase">Alpha-01</div>
            </div>
            <motion.div
              variants={stagger(60)}
              initial="hidden"
              animate="show"
              className="space-y-4 text-center md:text-left"
            >
              <motion.div variants={fadeSlideUp}>
                <h4 className="font-headline font-bold text-2xl text-primary tracking-tighter">{t("协调者智能体", "Orchestrator Agent")}</h4>
                <p className="text-[10px] text-on-surface-variant font-headline tracking-[0.2em] uppercase">{t("多智能体任务分解引擎", "Multi-agent task decomposition engine")}</p>
              </motion.div>
              <motion.p variants={fadeSlideUp} className="text-on-surface-variant font-body leading-relaxed max-w-xl italic">
                {t(
                  "正在初始化火星岩石自养生物设计的深度任务分解。主要目标：设计用于高氯酸盐还原和太阳辐射防护的代谢途径。",
                  "Initializing deep task decomposition for martian lithoautotrophic design. Primary target: pathways for perchlorate reduction and radiation shielding."
                )}
              </motion.p>
              <motion.div variants={fadeSlideUp} className="flex gap-3 md:gap-4 justify-center md:justify-start">
                <div className="text-center">
                  <span className="block text-[10px] text-outline font-headline uppercase">{t("逻辑节点", "Logic Nodes")}</span>
                  <motion.span
                    key={stats.nodes}
                    initial={{ opacity: 0.4, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-lg font-headline font-bold text-on-surface block"
                  >
                    {stats.nodes.toLocaleString()}
                  </motion.span>
                </div>
                <div className="h-8 w-px bg-outline-variant/30" />
                <div className="text-center">
                  <span className="block text-[10px] text-outline font-headline uppercase">{t("置信度", "Confidence")}</span>
                  <motion.span
                    key={stats.confidence}
                    initial={{ opacity: 0.4, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-lg font-headline font-bold text-on-surface block"
                  >
                    {stats.confidence}%
                  </motion.span>
                </div>
                <div className="h-8 w-px bg-outline-variant/30" />
                <div className="text-center">
                  <span className="block text-[10px] text-outline font-headline uppercase">{t("延迟", "Latency")}</span>
                  <motion.span
                    key={stats.latency}
                    initial={{ opacity: 0.4, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-lg font-headline font-bold text-on-surface block"
                  >
                    {stats.latency}ms
                  </motion.span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <motion.div
        variants={stagger(100)}
        initial="hidden"
        whileInView="show"
        {...inViewport}
        className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative"
      >
        <motion.div variants={fadeSlideUp} className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Database size={16} className="text-secondary" />
            <h3 className="font-headline font-bold text-sm tracking-widest uppercase">{t("分析层", "Analysis Layer")} <span className="text-on-surface-variant/40">v2.4</span></h3>
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
                title={t("环境解析", "Environment Parsing")}
                description={t("绘制土壤毒性梯度和热震荡模式，以实现最佳生物群落部署。", "Maps soil toxicity gradients and thermal shock patterns for optimal biota deployment.")}
                progress={75}
                tag={t("环境解析", "Env Parse")}
                onClick={() => setSelectedAgent("env-parse")}
              />
            </motion.div>
            <motion.div variants={fadeSlideUp}>
              <AnalysisCard
                icon={Bug}
                title={t("极端微生物", "Extremophile")}
                description={t("检索耐辐射奇球菌变体数据库，以获取辐射抗性性状。", "Screens extremophile variants to mine radiation resistance traits.")}
                progress={50}
                tag={t("生物规范", "Bio Profile")}
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
                  <h4 className="font-headline font-bold text-on-surface text-sm uppercase mb-1">{t("基因功能映射", "Gene Function Mapping")}</h4>
                  <p className="text-xs text-on-surface-variant font-body">{t("交叉引用用于大气固氮的代谢基因簇。", "Cross-references metabolic clusters for atmospheric nitrogen fixation.")}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-headline text-on-surface-variant block">{t("匹配率", "Match Rate")}</span>
                  <span className="text-lg font-headline font-bold text-secondary">92%</span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div variants={fadeSlideUp} className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Cpu size={16} className="text-primary" />
            <h3 className="font-headline font-bold text-sm tracking-widest uppercase">{t("设计层", "Design Layer")} <span className="text-on-surface-variant/40">{t("原型_0", "PROTO_0")}</span></h3>
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
                title={t("回路设计", "Circuit Design")}
                description={t("编码用于环境感应和响应触发的切换开关。", "Builds switch logic for sensing-triggered responses.")}
                steps={2}
                tag={t("合成逻辑", "Syn Logic")}
                onClick={() => setSelectedAgent("circuit-design")}
              />
            </motion.div>
            <motion.div variants={fadeSlideUp}>
              <DesignCard
                icon={Network}
                title={t("代谢兼容性", "Metabolic Compatibility")}
                description={t("在高氯酸盐环境中模拟生物量通量，以确保生存。", "Simulates biomass flux in perchlorate-rich conditions for survival assurance.")}
                steps={3}
                tag={t("代谢映射", "Metabolic Map")}
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
                  <h4 className="font-headline font-bold text-on-surface text-sm uppercase mb-1">{t("结构预测", "Structure Prediction")}</h4>
                  <p className="text-xs text-on-surface-variant font-body">{t("利用深度学习折叠蛋白，以实现耐寒功能。", "Applies deep folding models to engineer cold-resilient proteins.")}</p>
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
              <motion.div variants={fadeSlideUp} className="inline-flex items-center gap-2 px-3 py-1 bg-tertiary/10 border border-tertiary/20 text-tertiary text-[10px] font-headline tracking-widest uppercase rounded">
                {t("反幻觉安全层", "Anti-Hallucination Safety Layer")}
              </motion.div>
              <motion.h3 variants={fadeSlideUp} className="text-2xl md:text-4xl font-headline font-black tracking-tighter text-on-surface uppercase leading-none">
                {t("核查层", "Verification")}<span className="text-tertiary italic">&amp; {t("保真度", "Fidelity")}</span> {t("智能体", "Agent")}
              </motion.h3>
              <motion.p variants={fadeSlideUp} className="text-on-surface-variant font-body text-lg leading-relaxed max-w-2xl">
                {t("验证阶段处于活跃状态。正在将预测代谢输出与火星土壤化学模拟进行对比。设计层路径中未检测到逻辑不一致性。", "Verification is active. Predicted metabolic output is being compared against martian soil chemistry models. No logical inconsistency detected in current design pathways.")}
              </motion.p>
              <motion.div variants={fadeSlideUp} className="flex gap-4">
                <motion.button
                  {...buttonPress}
                  className="px-8 py-4 bg-tertiary text-on-tertiary font-headline font-bold text-sm rounded-full uppercase tracking-[0.2em] flex items-center gap-3 hover:scale-105 transition-all shadow-[0_0_20px_rgba(100,221,153,0.3)]"
                >
                  <RefreshCw size={18} />
                  {t("反馈回路", "Feedback Loop")}
                </motion.button>
                <motion.button
                  {...buttonPress}
                  className="px-8 py-4 border border-outline-variant/30 text-on-surface-variant font-headline font-bold text-sm rounded-full uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-surface-container transition-all"
                >
                  {t("验证批次", "Validate Batch")}
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
                <p className="text-[10px] font-headline text-outline uppercase mb-2">{t("错误率", "Error Rate")}</p>
                <p className="text-2xl font-headline font-bold text-tertiary">&lt; 0.001%</p>
              </motion.div>
              <motion.div variants={fadeScale} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/15 text-center">
                <p className="text-[10px] font-headline text-outline uppercase mb-2">{t("模拟周期", "Simulation Cycles")}</p>
                <p className="text-2xl font-headline font-bold text-on-surface">50M+</p>
              </motion.div>
              <motion.div variants={fadeScale} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/15 text-center col-span-2">
                <p className="text-[10px] font-headline text-outline uppercase mb-2">{t("结构稳定性", "Structural Stability")}</p>
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
            <span className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">{t("设计规范书：", "Design Spec:")}</span>
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
              onClick={() => navigate("/output")}
              className="px-6 py-2 bg-primary/20 text-primary border border-primary/30 rounded font-headline font-bold text-[10px] uppercase tracking-widest hover:bg-primary/30 transition-all"
            >
              {t("执行生物打印", "Run Bioprint")}
            </motion.button>
          </div>
        </div>
      </motion.section>

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
