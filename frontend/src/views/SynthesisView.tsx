import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Dna,
  FlaskConical,
  Shield,
  Thermometer,
  Zap,
  ChevronRight,
  CheckCircle2,
  Circle,
  Cpu,
  Download,
  Play,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { stagger, fadeSlideUp, fadeScale, viewTransition, cardHover, buttonPress, inViewport } from "../lib/motion";

// ── 基因模块定义 ──
interface GeneModule {
  id: string;
  name: string;
  shortName: string;
  function: string;
  gcContent: number;
  length: number;
  expressionScore: number;
  color: string;
  borderColor: string;
  type: "promoter" | "rbs" | "cds" | "terminator";
}

const MODULE_LIBRARY: GeneModule[] = [
  { id: "pcrABCD", name: "高氯酸盐还原酶基因簇", shortName: "pcrABCD", function: "高氯酸盐还原 / ClO₄⁻ → Cl⁻ + O₂", gcContent: 62, length: 4820, expressionScore: 94, color: "text-primary", borderColor: "border-l-primary", type: "cds" },
  { id: "crtBIYEP", name: "类胡萝卜素合成基因簇", shortName: "crtBIYEP", function: "UV 防护屏障 / 吸收峰 450-520nm", gcContent: 58, length: 6140, expressionScore: 87, color: "text-tertiary", borderColor: "border-l-tertiary", type: "cds" },
  { id: "cspA", name: "冷休克蛋白 A", shortName: "cspA", function: "低温 mRNA 稳定 / -20°C 活性保持", gcContent: 44, length: 210, expressionScore: 91, color: "text-[#d4a843]", borderColor: "border-l-[#d4a843]", type: "cds" },
  { id: "recA_G267S", name: "重组酶 RecA G267S 突变体", shortName: "recA*", function: "DNA 修复增强 / 低温活性 +340%", gcContent: 55, length: 1062, expressionScore: 88, color: "text-secondary", borderColor: "border-l-secondary", type: "cds" },
  { id: "PrecA", name: "SOS 响应启动子", shortName: "P_recA", function: "UV 诱导转录 / 强度中等", gcContent: 47, length: 142, expressionScore: 76, color: "text-purple-400", borderColor: "border-l-purple-400", type: "promoter" },
  { id: "RBS_strong", name: "强核糖体结合位点", shortName: "RBS-S", function: "翻译效率 ×4 基准", gcContent: 38, length: 18, expressionScore: 95, color: "text-cyan-400", borderColor: "border-l-cyan-400", type: "rbs" },
  { id: "T7term", name: "T7 终止子", shortName: "T7-T", function: "正交终止，防止通读", gcContent: 51, length: 64, expressionScore: 99, color: "text-outline", borderColor: "border-l-outline", type: "terminator" },
  { id: "mazEF", name: "毒素/抗毒素 Kill Switch", shortName: "mazEF", function: "生态逃逸防护 / 营养缺陷触发", gcContent: 49, length: 730, expressionScore: 82, color: "text-secondary", borderColor: "border-l-secondary", type: "cds" },
];

const TYPE_LABELS: Record<GeneModule["type"], string> = {
  promoter: "启动子", rbs: "RBS", cds: "编码序列", terminator: "终止子",
};
const TYPE_COLORS: Record<GeneModule["type"], string> = {
  promoter: "bg-purple-400/20 text-purple-400 border-purple-400/30",
  rbs: "bg-cyan-400/20 text-cyan-400 border-cyan-400/30",
  cds: "bg-primary/20 text-primary border-primary/30",
  terminator: "bg-outline/20 text-outline border-outline/30",
};

// SBOL 形状颜色映射
const SBOL_FILL: Record<GeneModule["type"], string> = {
  promoter: "#c084fc",
  rbs: "#22d3ee",
  cds: "#81cfff",
  terminator: "#899299",
};

// 验证检查项
const VALIDATION_CHECKS = [
  { id: "orthogonality", label: "正交性验证", desc: "T7 转录系统与宿主隔离" },
  { id: "gc_balance", label: "GC 含量均衡", desc: "全序列 GC 52±8%" },
  { id: "codon_opt", label: "密码子优化", desc: "适配 D. radiodurans" },
  { id: "killswitch", label: "Kill Switch 完整", desc: "mazEF 生态安全模块" },
];

export default function SynthesisView() {
  const [canvasModules, setCanvasModules] = useState<GeneModule[]>([
    MODULE_LIBRARY[4], // P_recA
    MODULE_LIBRARY[5], // RBS
    MODULE_LIBRARY[0], // pcrABCD
    MODULE_LIBRARY[6], // T7 term
  ]);
  const [selectedModule, setSelectedModule] = useState<GeneModule | null>(MODULE_LIBRARY[0]);
  const [compileState, setCompileState] = useState<"idle" | "running" | "done">("idle");
  const [validationPassed, setValidationPassed] = useState<string[]>([]);
  const timerIds = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => { timerIds.current.forEach(clearTimeout); };
  }, []);

  const addToCanvas = (mod: GeneModule) => {
    if (!canvasModules.find((m) => m.id === mod.id)) {
      // 终止子始终放最后
      const hasTerminator = canvasModules.find((m) => m.type === "terminator");
      if (hasTerminator) {
        setCanvasModules((prev) => {
          const without = prev.filter((m) => m.type !== "terminator");
          return [...without, mod, hasTerminator];
        });
      } else {
        setCanvasModules((prev) => [...prev, mod]);
      }
    }
  };

  const removeFromCanvas = (id: string) => {
    setCanvasModules((prev) => prev.filter((m) => m.id !== id));
  };

  const handleCompile = () => {
    timerIds.current.forEach(clearTimeout);
    timerIds.current = [];
    setCompileState("running");
    setValidationPassed([]);
    const checks = [...VALIDATION_CHECKS];
    checks.forEach((check, i) => {
      const id = setTimeout(() => {
        setValidationPassed((prev) => [...prev, check.id]);
        if (i === checks.length - 1) setCompileState("done");
      }, 500 + i * 600);
      timerIds.current.push(id);
    });
  };

  const totalLength = canvasModules.reduce((sum, m) => sum + m.length, 0);
  const avgGC = canvasModules.length
    ? Math.round(canvasModules.reduce((sum, m) => sum + m.gcContent, 0) / canvasModules.length)
    : 0;

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 flex flex-col pt-2"
    >
      {/* ── Header ── */}
      <motion.section
        variants={stagger(60)}
        initial="hidden"
        animate="show"
        className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
      >
        <div className="space-y-3">
          <motion.div variants={fadeSlideUp} className="flex gap-2">
            <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-headline tracking-widest uppercase rounded">合成生物学</span>
            <span className="px-3 py-1 bg-tertiary/10 border border-tertiary/20 text-tertiary text-[10px] font-headline tracking-widest uppercase rounded">基因装配</span>
          </motion.div>
          <motion.h2
            variants={fadeSlideUp}
            className="text-3xl md:text-4xl font-black font-headline text-on-background tracking-tighter leading-none"
          >
            基因模块 <span className="text-primary">合成装配</span>
          </motion.h2>
          <motion.p variants={fadeSlideUp} className="text-sm text-on-surface-variant max-w-lg">
            从模块库中选择基因功能单元，拖入装配画布，编译验证后生成标准 SBOL 设计文件。
          </motion.p>
        </div>
        <motion.div variants={fadeSlideUp} className="glass-panel p-4 rounded-xl flex gap-6 border-l-4 border-l-primary">
          <div className="text-center">
            <p className="text-[10px] font-headline text-on-surface-variant uppercase tracking-widest">总长度</p>
            <p className="text-xl font-headline font-bold text-primary">{totalLength.toLocaleString()} bp</p>
          </div>
          <div className="h-8 w-px bg-outline-variant/20 self-center" />
          <div className="text-center">
            <p className="text-[10px] font-headline text-on-surface-variant uppercase tracking-widest">均 GC%</p>
            <p className="text-xl font-headline font-bold text-tertiary">{avgGC}%</p>
          </div>
          <div className="h-8 w-px bg-outline-variant/20 self-center" />
          <div className="text-center">
            <p className="text-[10px] font-headline text-on-surface-variant uppercase tracking-widest">模块数</p>
            <p className="text-xl font-headline font-bold text-on-surface">{canvasModules.length}</p>
          </div>
        </motion.div>
      </motion.section>

      {/* ── Main Layout ── */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1">

        {/* ── 左侧：模块库 ── */}
        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="w-full lg:w-72 shrink-0 space-y-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical size={14} className="text-secondary" />
            <h3 className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">基因功能模块库</h3>
          </div>
          {MODULE_LIBRARY.map((mod) => {
            const inCanvas = !!canvasModules.find((m) => m.id === mod.id);
            return (
              <motion.div
                key={mod.id}
                {...cardHover}
                onClick={() => { setSelectedModule(mod); if (!inCanvas) addToCanvas(mod); }}
                className={`glass-panel p-3 rounded-xl border-l-2 ${mod.borderColor} cursor-pointer relative overflow-hidden ${
                  selectedModule?.id === mod.id ? "ring-1 ring-primary/40" : ""
                } ${inCanvas ? "opacity-60" : ""}`}
              >
                {inCanvas && (
                  <span className="absolute top-1.5 right-1.5 text-[9px] font-headline text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full border border-tertiary/20">已装配</span>
                )}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className={`text-[10px] font-bold font-mono ${mod.color}`}>{mod.shortName}</span>
                    <p className="text-xs text-on-surface font-headline font-semibold mt-0.5 leading-snug">{mod.name}</p>
                  </div>
                </div>
                <p className="text-[10px] text-on-surface-variant mb-2 leading-snug">{mod.function}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] px-2 py-0.5 rounded border font-headline uppercase ${TYPE_COLORS[mod.type]}`}>
                    {TYPE_LABELS[mod.type]}
                  </span>
                  <span className="text-[9px] text-outline font-mono">{mod.length} bp</span>
                  <span className="ml-auto text-[9px] text-on-surface-variant font-headline">表达: <span className="text-tertiary">{mod.expressionScore}</span></span>
                </div>
              </motion.div>
            );
          })}
        </motion.aside>

        {/* ── 中央 + 右侧 ── */}
        <div className="flex flex-col gap-6 flex-1 min-w-0">

          {/* SBOL 装配画布 */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-panel p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu size={14} className="text-primary" />
                <h3 className="font-headline font-bold text-xs uppercase tracking-widest">SBOL 装配画布</h3>
              </div>
              <div className="flex gap-2">
                <motion.button
                  {...buttonPress}
                  onClick={() => { setCanvasModules([]); setCompileState("idle"); setValidationPassed([]); }}
                  className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant"
                  title="清空画布"
                >
                  <RotateCcw size={14} />
                </motion.button>
              </div>
            </div>

            {/* DNA 主链 + 模块可视化 */}
            <div className="relative overflow-x-auto">
              {/* 骨架线 */}
              <div className="h-px bg-outline-variant/30 absolute top-[68px] left-0 right-0" />
              <div className="h-px bg-outline-variant/20 absolute top-[72px] left-0 right-0" />

              <div className="flex items-end gap-1 pb-2 min-w-max">
                {/* 5' 端 */}
                <div className="flex flex-col items-center shrink-0 mr-2">
                  <span className="text-[9px] font-mono text-outline mb-1">5'</span>
                  <div className="w-8 h-px bg-outline/40" style={{ marginBottom: 44 }} />
                </div>

                <AnimatePresence mode="popLayout">
                  {canvasModules.map((mod, idx) => (
                    <motion.div
                      key={mod.id}
                      layout
                      initial={{ opacity: 0, y: -12, scale: 0.85 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ type: "spring", damping: 22, stiffness: 260 }}
                      className="flex flex-col items-center group relative"
                    >
                      {/* SBOL 图形 */}
                      <svg width={mod.type === "cds" ? 72 : mod.type === "promoter" ? 40 : mod.type === "rbs" ? 28 : 32} height={60} className="mb-1">
                        {mod.type === "promoter" && (
                          <>
                            <line x1="20" y1="50" x2="20" y2="20" stroke={SBOL_FILL[mod.type]} strokeWidth="2" />
                            <polyline points="20,20 30,30 20,40" fill="none" stroke={SBOL_FILL[mod.type]} strokeWidth="2" />
                          </>
                        )}
                        {mod.type === "rbs" && (
                          <ellipse cx="14" cy="40" rx="10" ry="8" fill={SBOL_FILL[mod.type]} opacity="0.8" />
                        )}
                        {mod.type === "cds" && (
                          <polygon points="0,50 52,50 72,36 52,22 0,22" fill={SBOL_FILL[mod.type]} opacity="0.25" stroke={SBOL_FILL[mod.type]} strokeWidth="1.5" />
                        )}
                        {mod.type === "terminator" && (
                          <>
                            <line x1="16" y1="50" x2="16" y2="22" stroke={SBOL_FILL[mod.type]} strokeWidth="2" />
                            <line x1="6" y1="22" x2="26" y2="22" stroke={SBOL_FILL[mod.type]} strokeWidth="2" />
                          </>
                        )}
                      </svg>

                      {/* 标签 */}
                      <span className={`text-[9px] font-bold font-mono ${mod.color} max-w-[72px] text-center leading-tight block`}>
                        {mod.shortName}
                      </span>

                      {/* 连接箭头（非最后一个） */}
                      {idx < canvasModules.length - 1 && (
                        <div className="absolute -right-3 top-[38px] text-outline-variant/50">
                          <ChevronRight size={14} />
                        </div>
                      )}

                      {/* 删除按钮 */}
                      <button
                        onClick={() => removeFromCanvas(mod.id)}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary text-on-secondary text-[9px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold"
                        aria-label={`移除 ${mod.shortName}`}
                      >
                        ×
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* 3' 端 */}
                <div className="flex flex-col items-center shrink-0 ml-2">
                  <span className="text-[9px] font-mono text-outline mb-1">3'</span>
                  <div className="w-8 h-px bg-outline/40" style={{ marginBottom: 44 }} />
                </div>
              </div>

              {canvasModules.length === 0 && (
                <div className="h-24 flex items-center justify-center text-on-surface-variant/40 text-xs font-headline uppercase tracking-widest border-2 border-dashed border-outline-variant/20 rounded-xl">
                  从左侧模块库点击添加基因元件
                </div>
              )}
            </div>
          </motion.section>

          {/* 属性检查器 + 编译验证 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 属性检查器 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="glass-panel p-5 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <Dna size={14} className="text-secondary" />
                <h3 className="font-headline font-bold text-xs uppercase tracking-widest">属性检查器</h3>
              </div>

              {selectedModule ? (
                <div className="space-y-3">
                  <div>
                    <p className={`text-sm font-bold font-mono ${selectedModule.color}`}>{selectedModule.shortName}</p>
                    <p className="text-xs text-on-surface font-headline font-semibold mt-0.5">{selectedModule.name}</p>
                    <p className="text-[10px] text-on-surface-variant mt-1 leading-snug">{selectedModule.function}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {[
                      { label: "GC 含量", value: `${selectedModule.gcContent}%` },
                      { label: "序列长度", value: `${selectedModule.length} bp` },
                      { label: "元件类型", value: TYPE_LABELS[selectedModule.type] },
                      { label: "表达评分", value: `${selectedModule.expressionScore}/100` },
                    ].map((item) => (
                      <div key={item.label} className="bg-surface-container-low p-2 rounded-lg">
                        <p className="text-[9px] text-outline font-headline uppercase">{item.label}</p>
                        <p className="text-sm font-headline font-bold text-on-surface">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {/* GC 含量进度条 */}
                  <div>
                    <div className="flex justify-between text-[9px] text-outline mb-1">
                      <span>GC 含量分布</span>
                      <span>{selectedModule.gcContent}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedModule.gcContent}%` }}
                        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                      />
                    </div>
                    {(selectedModule.gcContent < 40 || selectedModule.gcContent > 65) && (
                      <p className="text-[9px] text-secondary mt-1 flex items-center gap-1">
                        <AlertTriangle size={9} /> GC 含量偏离推荐范围 40-65%
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant/50 font-headline uppercase tracking-widest text-center mt-8">
                  点击模块查看属性
                </p>
              )}
            </motion.div>

            {/* 编译验证 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="glass-panel p-5 rounded-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-tertiary" />
                  <h3 className="font-headline font-bold text-xs uppercase tracking-widest">编译 &amp; 验证</h3>
                </div>
                {compileState === "done" && (
                  <span className="text-[9px] text-tertiary border border-tertiary/30 bg-tertiary/10 px-2 py-0.5 rounded-full font-headline uppercase">通过</span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                {VALIDATION_CHECKS.map((check) => {
                  const passed = validationPassed.includes(check.id);
                  const running = compileState === "running" && !passed && validationPassed.length === VALIDATION_CHECKS.indexOf(check) ;
                  return (
                    <div key={check.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface-container-low">
                      {passed ? (
                        <CheckCircle2 size={14} className="text-tertiary shrink-0" />
                      ) : (
                        <Circle size={14} className={`shrink-0 ${running ? "text-primary animate-pulse" : "text-outline-variant"}`} />
                      )}
                      <div>
                        <p className="text-[10px] font-headline font-bold text-on-surface">{check.label}</p>
                        <p className="text-[9px] text-on-surface-variant">{check.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <motion.button
                  {...buttonPress}
                  onClick={handleCompile}
                  disabled={canvasModules.length < 2 || compileState === "running"}
                  className="flex-1 py-2.5 bg-tertiary text-on-tertiary font-headline font-bold text-xs rounded-lg uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40 hover:brightness-110 transition-all shadow-[0_0_15px_rgba(100,221,153,0.25)]"
                >
                  <Play size={13} />
                  {compileState === "running" ? "验证中..." : "编译设计"}
                </motion.button>
                {compileState === "done" && (
                  <motion.button
                    {...buttonPress}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-4 py-2.5 bg-primary/20 text-primary border border-primary/30 font-headline font-bold text-xs rounded-lg uppercase tracking-widest flex items-center gap-2 hover:bg-primary/30 transition-all"
                  >
                    <Download size={13} />
                    SBOL
                  </motion.button>
                )}
              </div>

              {canvasModules.length < 2 && (
                <p className="text-[9px] text-on-surface-variant/50 text-center mt-2">至少添加 2 个模块才能编译</p>
              )}
            </motion.div>
          </div>

          {/* 序列概要预览 */}
          {compileState === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="glass-panel p-4 rounded-xl border border-tertiary/20"
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap size={13} className="text-tertiary" />
                <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-tertiary">编译产物 — SBOL 设计 ID</span>
              </div>
              <div className="font-mono text-xs text-primary/80 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/10 overflow-x-auto whitespace-nowrap">
                XENO_SYN_{canvasModules.map((m) => m.shortName).join("-")}_GC{avgGC}_LEN{totalLength}_VALID
              </div>
              <div className="flex gap-3 mt-3">
                <div className="text-center flex-1 bg-surface-container-low p-2 rounded-lg">
                  <p className="text-[9px] text-outline font-headline uppercase">模块数</p>
                  <p className="text-sm font-headline font-bold text-on-surface">{canvasModules.length}</p>
                </div>
                <div className="text-center flex-1 bg-surface-container-low p-2 rounded-lg">
                  <p className="text-[9px] text-outline font-headline uppercase">总长</p>
                  <p className="text-sm font-headline font-bold text-primary">{totalLength.toLocaleString()} bp</p>
                </div>
                <div className="text-center flex-1 bg-surface-container-low p-2 rounded-lg">
                  <p className="text-[9px] text-outline font-headline uppercase">验证状态</p>
                  <p className="text-sm font-headline font-bold text-tertiary">PASSED</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
