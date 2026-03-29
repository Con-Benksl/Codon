import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Dna,
  FlaskConical,
  Shield,
  ChevronRight,
  CheckCircle2,
  Circle,
  Cpu,
  Download,
  Play,
  RotateCcw,
  AlertTriangle,
  Share2,
  Printer,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
} from "lucide-react";
import { useLocale } from "../i18n/context";
import { viewTransition, buttonPress } from "../lib/motion";

interface GeneModule {
  id: string;
  shortName: string;
  nameZh: string;
  nameEn: string;
  functionZh: string;
  functionEn: string;
  gcContent: number;
  length: number;
  expressionScore: number;
  color: string;
  borderColor: string;
  accentHex: string;
  type: "promoter" | "rbs" | "cds" | "terminator";
}

const MODULE_LIBRARY: GeneModule[] = [
  { id: "pcrABCD", shortName: "pcrABCD", nameZh: "高氯酸盐还原酶基因簇", nameEn: "Perchlorate Reductase Cluster", functionZh: "高氯酸盐还原路径核心模块", functionEn: "Core module for perchlorate reduction", gcContent: 62, length: 4820, expressionScore: 94, color: "text-primary", borderColor: "border-l-primary", accentHex: "#81cfff", type: "cds" },
  { id: "crtBIYEP", shortName: "crtBIYEP", nameZh: "类胡萝卜素合成基因簇", nameEn: "Carotenoid Synthesis Cluster", functionZh: "提供 UV 防护屏障", functionEn: "UV shielding via carotenoid synthesis", gcContent: 58, length: 6140, expressionScore: 87, color: "text-tertiary", borderColor: "border-l-tertiary", accentHex: "#64dd99", type: "cds" },
  { id: "cspA", shortName: "cspA", nameZh: "冷休克蛋白 A", nameEn: "Cold Shock Protein A", functionZh: "低温条件保持转录稳定", functionEn: "Stabilizes transcription at low temperature", gcContent: 44, length: 210, expressionScore: 91, color: "text-[#d4a843]", borderColor: "border-l-[#d4a843]", accentHex: "#d4a843", type: "cds" },
  { id: "recA_G267S", shortName: "recA*", nameZh: "重组酶 RecA G267S", nameEn: "RecA G267S Variant", functionZh: "增强 DNA 修复能力", functionEn: "Enhanced DNA repair capacity", gcContent: 55, length: 1062, expressionScore: 88, color: "text-secondary", borderColor: "border-l-secondary", accentHex: "#ffb4a1", type: "cds" },
  { id: "PrecA", shortName: "P_recA", nameZh: "SOS 响应启动子", nameEn: "SOS Responsive Promoter", functionZh: "UV 诱导转录", functionEn: "UV-induced transcription", gcContent: 47, length: 142, expressionScore: 76, color: "text-purple-400", borderColor: "border-l-purple-400", accentHex: "#c084fc", type: "promoter" },
  { id: "RBS_strong", shortName: "RBS-S", nameZh: "强核糖体结合位点", nameEn: "Strong Ribosome Binding Site", functionZh: "提升翻译效率", functionEn: "Improves translation efficiency", gcContent: 38, length: 18, expressionScore: 95, color: "text-cyan-400", borderColor: "border-l-cyan-400", accentHex: "#22d3ee", type: "rbs" },
  { id: "T7term", shortName: "T7-T", nameZh: "T7 终止子", nameEn: "T7 Terminator", functionZh: "正交终止，避免通读", functionEn: "Orthogonal termination and readthrough control", gcContent: 51, length: 64, expressionScore: 99, color: "text-outline", borderColor: "border-l-outline", accentHex: "#899299", type: "terminator" },
];

const TYPE_COLORS: Record<string, string> = {
  promoter: "#c084fc",
  rbs: "#22d3ee",
  cds: "#81cfff",
  terminator: "#899299",
};

const TYPE_LABELS = {
  zh: { promoter: "启动子", rbs: "RBS", cds: "编码序列", terminator: "终止子" },
  en: { promoter: "PROMOTER", rbs: "RBS", cds: "CDS", terminator: "TERMINATOR" },
} as const;

const VALIDATION_CHECKS = [
  { id: "orthogonality", labelZh: "正交性验证", labelEn: "Orthogonality", descZh: "T7 转录系统与宿主隔离", descEn: "T7 system isolated from host" },
  { id: "gc_balance", labelZh: "GC 含量均衡", labelEn: "GC Balance", descZh: "全序列 GC 52±8%", descEn: "Whole-sequence GC at 52±8%" },
  { id: "codon_opt", labelZh: "密码子优化", labelEn: "Codon Optimization", descZh: "适配 D. radiodurans", descEn: "Adapted for D. radiodurans" },
  { id: "biosafety", labelZh: "生物安全模块", labelEn: "Biosafety Module", descZh: "生态安全约束已就绪", descEn: "Ecological safeguards are ready" },
];

const VERIFY_LAYERS = [
  { id: "env", color: "#ffb4a1", score: 97, labelZh: "环境解析层", labelEn: "Environment Parsing", summaryZh: "约束参数解析完成，环境约束已写入。", summaryEn: "Constraint parsing finished and constraints loaded." },
  { id: "design", color: "#81cfff", score: 91, labelZh: "设计层", labelEn: "Design Layer", summaryZh: "基因回路仿真通过，代谢通量达标。", summaryEn: "Circuit simulation passed, flux balance met." },
  { id: "verify", color: "#64dd99", score: 95, labelZh: "验证层", labelEn: "Verification", summaryZh: "结构预测通过，低温稳定性达标，生物安全兼容。", summaryEn: "Structure confirmed, cryo-stable, biosafety compliant." },
];

const EXPORT_OPTIONS = [
  { id: "sbol", label: "SBOL 2.3", descZh: "标准合成生物学开放格式", descEn: "Standard synthetic biology format", icon: Dna, ext: ".xml" },
  { id: "genbank", label: "GenBank", descZh: "NCBI 序列注释格式", descEn: "NCBI sequence annotation format", icon: FileText, ext: ".gb" },
  { id: "json", label: "JSON API", descZh: "机器可读设计数据流", descEn: "Machine-readable data stream", icon: Cpu, ext: ".json" },
];

const PRINT_JOBS = [
  { id: "JOB-001", name: "XENO_BIO_v1.0.4 Alpha", status: "done" as const, progress: 100, etaZh: "完成", etaEn: "Done" },
  { id: "JOB-002", name: "XENO_BIO_v1.0.4 Beta", status: "printing" as const, progress: 62, etaZh: "约 18 min", etaEn: "~18 min" },
];

export default function SynthesisView() {
  const { locale } = useLocale();
  const isZh = locale === "zh";
  const [canvasModules, setCanvasModules] = useState<GeneModule[]>([MODULE_LIBRARY[4], MODULE_LIBRARY[5], MODULE_LIBRARY[0], MODULE_LIBRARY[6]]);
  const [selectedModule, setSelectedModule] = useState<GeneModule | null>(MODULE_LIBRARY[0]);
  const [compileState, setCompileState] = useState<"idle" | "running" | "done">("idle");
  const [validationPassed, setValidationPassed] = useState<string[]>([]);
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [exportSelected, setExportSelected] = useState("sbol");
  const [downloading, setDownloading] = useState(false);
  const timerIds = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => {
    timerIds.current.forEach(clearTimeout);
  }, []);

  const addToCanvas = (mod: GeneModule) => {
    if (!canvasModules.find((m) => m.id === mod.id)) {
      setCanvasModules((prev) => [...prev, mod]);
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
    VALIDATION_CHECKS.forEach((check, i) => {
      const id = setTimeout(() => {
        setValidationPassed((prev) => [...prev, check.id]);
        if (i === VALIDATION_CHECKS.length - 1) setCompileState("done");
      }, 450 + i * 500);
      timerIds.current.push(id);
    });
  };

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 1200);
  };

  const totalLength = useMemo(() => canvasModules.reduce((sum, m) => sum + m.length, 0), [canvasModules]);
  const avgGC = useMemo(() => canvasModules.length ? Math.round(canvasModules.reduce((sum, m) => sum + m.gcContent, 0) / canvasModules.length) : 0, [canvasModules]);
  const overallScore = useMemo(() => Math.round(VERIFY_LAYERS.reduce((s, l) => s + l.score, 0) / VERIFY_LAYERS.length), []);

  return (
    <motion.div variants={viewTransition} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col pt-2">
      <section className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-headline tracking-widest uppercase rounded">{isZh ? "合成生物学" : "SYN BIO"}</span>
            <span className="px-3 py-1 bg-tertiary/10 border border-tertiary/20 text-tertiary text-[10px] font-headline tracking-widest uppercase rounded">{isZh ? "基因装配" : "GENE ASSEMBLY"}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black font-headline text-on-background tracking-[0.02em] leading-none">
            {isZh ? "基因模块 " : "Gene Module "}
            <span className="text-primary">{isZh ? "合成装配" : "Assembly"}</span>
          </h2>
          <p className="text-sm text-on-surface-variant max-w-lg font-body">
            {isZh ? "从模块库选择功能单元，编译验证后生成标准化设计 ID。" : "Select modules from the library and compile to generate a standardized design ID."}
          </p>
        </div>
        <div className="panel-corner glass-panel p-4 rounded-xl flex gap-5 border-l-4 border-l-primary shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-headline text-on-surface-variant uppercase tracking-widest">{isZh ? "总长度" : "LENGTH"}</p>
            <p className="text-xl font-data font-bold text-primary">{totalLength.toLocaleString()}<span className="text-xs font-body text-on-surface-variant ml-1">bp</span></p>
          </div>
          <div className="h-8 w-px bg-outline-variant/20 self-center" />
          <div className="text-center">
            <p className="text-[9px] font-headline text-on-surface-variant uppercase tracking-widest">GC%</p>
            <p className="text-xl font-data font-bold text-tertiary">{avgGC}%</p>
          </div>
          <div className="h-8 w-px bg-outline-variant/20 self-center" />
          <div className="text-center">
            <p className="text-[9px] font-headline text-on-surface-variant uppercase tracking-widest">{isZh ? "模块数" : "MODULES"}</p>
            <p className="text-xl font-data font-bold text-on-surface">{canvasModules.length}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 flex-1">
        {/* Module library sidebar */}
        <aside className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical size={13} className="text-secondary" />
            <h3 className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">{isZh ? "基因功能模块库" : "MODULE LIBRARY"}</h3>
          </div>
          {MODULE_LIBRARY.map((mod) => {
            const inCanvas = !!canvasModules.find((m) => m.id === mod.id);
            return (
              <motion.div
                key={mod.id}
                whileHover={{ x: 3, transition: { duration: 0.15 } }}
                onClick={() => { setSelectedModule(mod); if (!inCanvas) addToCanvas(mod); }}
                className={`glass-panel p-3 rounded-xl border-l-2 ${mod.borderColor} cursor-pointer transition-all group ${selectedModule?.id === mod.id ? "ring-1 ring-primary/30" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-data font-semibold" style={{ color: mod.accentHex }}>{mod.shortName}</span>
                  <span className="text-[8px] font-data text-on-surface-variant/50">{mod.length} bp</span>
                </div>
                <p className="text-[10px] font-headline font-semibold text-on-surface leading-snug">{isZh ? mod.nameZh : mod.nameEn}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span
                    className="text-[8px] font-headline uppercase px-1.5 py-0.5 rounded"
                    style={{ color: TYPE_COLORS[mod.type], background: `${TYPE_COLORS[mod.type]}18` }}
                  >
                    {TYPE_LABELS[locale][mod.type]}
                  </span>
                  <span className="text-[9px] font-data" style={{ color: "#64dd99" }}>
                    {isZh ? "表达" : "Exp"} {mod.expressionScore}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </aside>

        {/* Right column */}
        <section className="space-y-5">
          <div className="panel-corner glass-panel p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu size={13} className="text-primary" />
                <h3 className="font-headline font-bold text-[10px] uppercase tracking-widest">{isZh ? "装配画布" : "ASSEMBLY CANVAS"}</h3>
              </div>
              <button
                onClick={() => { setCanvasModules([]); setCompileState("idle"); setValidationPassed([]); }}
                className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant/50 hover:text-on-surface transition-colors"
              >
                <RotateCcw size={13} />
              </button>
            </div>

            <div
              className="rounded-xl p-4 min-h-[120px] flex items-center"
              style={{ background: "#070b0f", border: "1px solid rgba(129,207,255,0.1)" }}
            >
              {canvasModules.length === 0 ? (
                <div className="w-full flex items-center justify-center">
                  <p className="text-[10px] font-data text-on-surface-variant/25 uppercase tracking-[0.2em]">
                    {isZh ? "// 从左侧添加基因元件" : "// ADD GENE ELEMENTS FROM LEFT"}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-1 flex-wrap">
                  {canvasModules.map((mod, idx) => (
                    <div key={mod.id} className="flex items-center gap-1">
                      <div className="group relative">
                        <div
                          className="px-3 py-2 rounded font-data text-xs leading-none cursor-pointer"
                          style={{
                            background: `${mod.accentHex}15`,
                            border: `1px solid ${mod.accentHex}35`,
                            color: mod.accentHex,
                            minWidth: "60px",
                            textAlign: "center",
                          }}
                        >
                          <div className="text-[8px] opacity-50 mb-0.5 uppercase">{TYPE_LABELS[locale][mod.type]}</div>
                          <div className="font-semibold">{mod.shortName}</div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFromCanvas(mod.id); }}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-secondary/80 text-on-secondary text-[9px] items-center justify-center hidden group-hover:flex"
                        >
                          ×
                        </button>
                      </div>
                      {idx < canvasModules.length - 1 && (
                        <ChevronRight size={12} className="text-outline-variant/40 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="glass-panel p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Dna size={13} className="text-secondary" />
                <h3 className="font-headline font-bold text-[10px] uppercase tracking-widest">{isZh ? "属性检查器" : "INSPECTOR"}</h3>
              </div>
              {selectedModule ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-data text-sm font-semibold" style={{ color: selectedModule.accentHex }}>{selectedModule.shortName}</span>
                    <span className="text-[8px] font-headline uppercase px-1.5 py-0.5 rounded"
                      style={{ color: TYPE_COLORS[selectedModule.type], background: `${TYPE_COLORS[selectedModule.type]}18` }}>
                      {TYPE_LABELS[locale][selectedModule.type]}
                    </span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant font-body">{isZh ? selectedModule.functionZh : selectedModule.functionEn}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: isZh ? "GC 含量" : "GC", value: `${selectedModule.gcContent}%` },
                      { label: isZh ? "长度" : "LENGTH", value: `${selectedModule.length} bp` },
                      { label: isZh ? "表达评分" : "EXPRESSION", value: String(selectedModule.expressionScore) },
                      { label: isZh ? "类型" : "TYPE", value: TYPE_LABELS[locale][selectedModule.type] },
                    ].map((item) => (
                      <div key={item.label} className="bg-surface-container-lowest p-2 rounded-lg">
                        <p className="text-[8px] font-headline text-on-surface-variant/50 uppercase tracking-wider">{item.label}</p>
                        <p className="text-sm font-data font-bold text-on-surface mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {(selectedModule.gcContent < 40 || selectedModule.gcContent > 65) && (
                    <p className="text-[9px] text-secondary flex items-center gap-1">
                      <AlertTriangle size={9} />
                      {isZh ? "GC 偏离建议范围 40-65%" : "GC outside recommended 40-65%"}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant/40 text-center mt-8 font-data">{isZh ? "// 点击模块查看属性" : "// SELECT MODULE TO INSPECT"}</p>
              )}
            </div>

            <div className="glass-panel p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield size={13} className="text-tertiary" />
                  <h3 className="font-headline font-bold text-[10px] uppercase tracking-widest">{isZh ? "编译验证" : "COMPILE"}</h3>
                </div>
                {compileState === "done" && (
                  <span className="text-[8px] font-headline uppercase px-2 py-0.5 rounded-full border border-tertiary/30 bg-tertiary/10 text-tertiary">
                    {isZh ? "通过" : "PASSED"}
                  </span>
                )}
              </div>
              <div className="space-y-1.5 mb-3">
                {VALIDATION_CHECKS.map((check) => {
                  const passed = validationPassed.includes(check.id);
                  return (
                    <div key={check.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-container-lowest">
                      <AnimatePresence mode="wait">
                        {passed ? (
                          <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
                            <CheckCircle2 size={13} className="text-tertiary" />
                          </motion.div>
                        ) : (
                          <Circle size={13} className="text-outline-variant/40" />
                        )}
                      </AnimatePresence>
                      <div>
                        <p className={`text-[9px] font-headline font-bold transition-colors ${passed ? "text-on-surface" : "text-on-surface/40"}`}>
                          {isZh ? check.labelZh : check.labelEn}
                        </p>
                        <p className="text-[8px] text-on-surface-variant/40 font-body">{isZh ? check.descZh : check.descEn}</p>
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
                  className="flex-1 py-2 bg-tertiary text-on-tertiary font-headline font-bold text-[10px] rounded-lg uppercase tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <Play size={11} />
                  {compileState === "running" ? (isZh ? "验证中..." : "Validating...") : (isZh ? "编译设计" : "Compile")}
                </motion.button>
                {compileState === "done" && (
                  <button className="px-3 py-2 bg-primary/15 text-primary border border-primary/30 font-headline font-bold text-[10px] rounded-lg uppercase tracking-wider flex items-center gap-1.5">
                    <Download size={11} />SBOL
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-outline-variant/15 pt-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-outline-variant/20" />
              <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-outline-variant/20 bg-surface-container-low">
                <div className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                <span className="text-[9px] font-headline uppercase tracking-[0.15em] text-on-surface-variant/60">
                  {isZh ? "输出结果" : "OUTPUT RESULTS"}
                </span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-outline-variant/20" />
            </div>

            {/* Design ID row */}
            <div className="panel-corner glass-panel p-4 rounded-xl border border-primary/15 mb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2.5 flex-1">
                  <Dna size={18} className="text-primary shrink-0" />
                  <div>
                    <p className="text-[8px] font-headline text-on-surface-variant uppercase tracking-widest">{isZh ? "设计规范书 ID" : "DESIGN SPEC ID"}</p>
                    <p className="font-data text-primary text-xs font-bold mt-0.5">XENO_BIO_v1.0.4_PATH_8842-B-ALPHA</p>
                  </div>
                </div>
                <div className="flex gap-4 text-center">
                  {[
                    { label: isZh ? "序列" : "SEQ", value: "12,234 bp" },
                    { label: isZh ? "路径" : "PATH", value: "7" },
                    { label: isZh ? "评分" : "SCORE", value: `${overallScore}/100` },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[8px] font-headline text-on-surface-variant/50 uppercase">{item.label}</p>
                      <p className="text-sm font-data font-bold text-on-surface">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Verification layers */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={12} className="text-tertiary" />
                  <p className="text-[9px] font-headline uppercase tracking-widest text-on-surface-variant">{isZh ? "三层验证报告" : "3-LAYER VALIDATION"}</p>
                </div>
                {VERIFY_LAYERS.map((layer) => {
                  const expanded = expandedLayer === layer.id;
                  return (
                    <div key={layer.id} className="glass-panel rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedLayer(expanded ? null : layer.id)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-surface-container-high/30 transition-colors text-left"
                      >
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: layer.color }} />
                        <p className="flex-1 text-[10px] font-headline font-bold text-on-surface">{isZh ? layer.labelZh : layer.labelEn}</p>
                        <span className="font-data text-sm font-bold" style={{ color: layer.color }}>{layer.score}</span>
                        <CheckCircle2 size={12} style={{ color: layer.color }} />
                        {expanded ? <ChevronUp size={11} className="text-outline shrink-0" /> : <ChevronDown size={11} className="text-outline shrink-0" />}
                      </button>
                      <AnimatePresence>
                        {expanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <p className="px-4 pb-3 text-[9px] text-on-surface-variant font-body border-t border-outline-variant/10 pt-2">
                              {isZh ? layer.summaryZh : layer.summaryEn}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Export + Print */}
              <div className="space-y-4">
                {/* Export */}
                <div className="glass-panel p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Download size={12} className="text-primary" />
                    <p className="text-[9px] font-headline uppercase tracking-widest">{isZh ? "导出格式" : "EXPORT"}</p>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {EXPORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setExportSelected(opt.id)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all text-[10px] ${exportSelected === opt.id ? "bg-primary/10 border border-primary/30 text-primary" : "border border-outline-variant/10 text-on-surface-variant hover:bg-surface-container-low"}`}
                      >
                        <span className="font-headline font-bold">{opt.label}</span>
                        <span className="font-data opacity-50 text-[8px]">{opt.ext}</span>
                        <span className="ml-auto text-[8px] font-body opacity-60">{isZh ? opt.descZh : opt.descEn}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      {...buttonPress}
                      onClick={handleDownload}
                      className="flex-1 py-2 bg-primary text-on-primary font-headline font-bold text-[9px] rounded-lg uppercase tracking-widest flex items-center justify-center gap-1.5"
                    >
                      <Download size={11} />{downloading ? (isZh ? "生成中..." : "Generating...") : (isZh ? "下载" : "Download")}
                    </motion.button>
                    <button className="px-3 py-2 border border-outline-variant/20 text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors">
                      <Share2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Print queue */}
                <div className="glass-panel p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Printer size={12} className="text-secondary" />
                      <p className="text-[9px] font-headline uppercase tracking-widest">{isZh ? "生物打印队列" : "BIOPRINT QUEUE"}</p>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  </div>
                  {PRINT_JOBS.map((job) => (
                    <div key={job.id} className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/10 mb-1.5 last:mb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-data text-outline">{job.id}</span>
                        <span className="text-[8px] font-headline uppercase text-on-surface-variant">{job.status}</span>
                      </div>
                      <p className="text-[9px] font-headline font-semibold text-on-surface mb-1">{job.name}</p>
                      {job.status !== "queued" && (
                        <div className="h-0.5 bg-surface-container-high rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${job.status === "done" ? "bg-tertiary" : "bg-primary"}`} style={{ width: `${job.progress}%` }} />
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[8px] font-data text-outline">{job.progress}%</span>
                        <div className="flex items-center gap-1 text-[8px] text-outline">
                          <Clock size={7} />{isZh ? job.etaZh : job.etaEn}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Traceability */}
                <div className="glass-panel p-3 rounded-xl border border-outline-variant/10">
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink size={11} className="text-outline/50" />
                    <p className="text-[9px] font-headline uppercase tracking-widest text-on-surface-variant/60">{isZh ? "数据溯源" : "TRACEABILITY"}</p>
                  </div>
                  <div className="space-y-1 font-data text-[9px] text-on-surface-variant/50">
                    {(isZh
                      ? ["NASA PDS v4 · Jezero 数据集", "NCBI GenBank · D. radiodurans R1", "AlphaFold DB · PcrA 结构预测"]
                      : ["NASA PDS v4 · Jezero dataset", "NCBI GenBank · D. radiodurans R1", "AlphaFold DB · PcrA structure"]
                    ).map((src) => (
                      <div key={src} className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-outline-variant/40 shrink-0" />
                        {src}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
