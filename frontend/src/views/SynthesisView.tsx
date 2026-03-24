import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
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
  type: "promoter" | "rbs" | "cds" | "terminator";
}

const MODULE_LIBRARY: GeneModule[] = [
  { id: "pcrABCD", shortName: "pcrABCD", nameZh: "高氯酸盐还原酶基因簇", nameEn: "Perchlorate Reductase Cluster", functionZh: "高氯酸盐还原路径核心模块", functionEn: "Core module for perchlorate reduction", gcContent: 62, length: 4820, expressionScore: 94, color: "text-primary", borderColor: "border-l-primary", type: "cds" },
  { id: "crtBIYEP", shortName: "crtBIYEP", nameZh: "类胡萝卜素合成基因簇", nameEn: "Carotenoid Synthesis Cluster", functionZh: "提供 UV 防护屏障", functionEn: "UV shielding via carotenoid synthesis", gcContent: 58, length: 6140, expressionScore: 87, color: "text-tertiary", borderColor: "border-l-tertiary", type: "cds" },
  { id: "cspA", shortName: "cspA", nameZh: "冷休克蛋白 A", nameEn: "Cold Shock Protein A", functionZh: "低温条件保持转录稳定", functionEn: "Stabilizes transcription at low temperature", gcContent: 44, length: 210, expressionScore: 91, color: "text-[#d4a843]", borderColor: "border-l-[#d4a843]", type: "cds" },
  { id: "recA_G267S", shortName: "recA*", nameZh: "重组酶 RecA G267S", nameEn: "RecA G267S Variant", functionZh: "增强 DNA 修复能力", functionEn: "Enhanced DNA repair capacity", gcContent: 55, length: 1062, expressionScore: 88, color: "text-secondary", borderColor: "border-l-secondary", type: "cds" },
  { id: "PrecA", shortName: "P_recA", nameZh: "SOS 响应启动子", nameEn: "SOS Responsive Promoter", functionZh: "UV 诱导转录", functionEn: "UV-induced transcription", gcContent: 47, length: 142, expressionScore: 76, color: "text-purple-400", borderColor: "border-l-purple-400", type: "promoter" },
  { id: "RBS_strong", shortName: "RBS-S", nameZh: "强核糖体结合位点", nameEn: "Strong Ribosome Binding Site", functionZh: "提升翻译效率", functionEn: "Improves translation efficiency", gcContent: 38, length: 18, expressionScore: 95, color: "text-cyan-400", borderColor: "border-l-cyan-400", type: "rbs" },
  { id: "T7term", shortName: "T7-T", nameZh: "T7 终止子", nameEn: "T7 Terminator", functionZh: "正交终止，避免通读", functionEn: "Orthogonal termination and readthrough control", gcContent: 51, length: 64, expressionScore: 99, color: "text-outline", borderColor: "border-l-outline", type: "terminator" },
];

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

export default function SynthesisView() {
  const { locale } = useLocale();
  const isZh = locale === "zh";
  const [canvasModules, setCanvasModules] = useState<GeneModule[]>([MODULE_LIBRARY[4], MODULE_LIBRARY[5], MODULE_LIBRARY[0], MODULE_LIBRARY[6]]);
  const [selectedModule, setSelectedModule] = useState<GeneModule | null>(MODULE_LIBRARY[0]);
  const [compileState, setCompileState] = useState<"idle" | "running" | "done">("idle");
  const [validationPassed, setValidationPassed] = useState<string[]>([]);
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

  const totalLength = canvasModules.reduce((sum, m) => sum + m.length, 0);
  const avgGC = canvasModules.length ? Math.round(canvasModules.reduce((sum, m) => sum + m.gcContent, 0) / canvasModules.length) : 0;

  return (
    <motion.div variants={viewTransition} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col pt-2">
      <section className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-3">
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-headline tracking-widest uppercase rounded">{isZh ? "合成生物学" : "SYN BIO"}</span>
            <span className="px-3 py-1 bg-tertiary/10 border border-tertiary/20 text-tertiary text-[10px] font-headline tracking-widest uppercase rounded">{isZh ? "基因装配" : "GENE ASSEMBLY"}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black font-headline text-on-background tracking-tighter leading-none">{isZh ? "基因模块 " : "Gene Module "} <span className="text-primary">{isZh ? "合成装配" : "Assembly"}</span></h2>
          <p className="text-sm text-on-surface-variant max-w-lg">{isZh ? "从模块库选择功能单元，编译验证后生成标准化设计 ID。" : "Select modules from the library and compile to generate a standardized design ID."}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl flex gap-6 border-l-4 border-l-primary">
          <div className="text-center"><p className="text-[10px] font-headline text-on-surface-variant uppercase tracking-widest">{isZh ? "总长度" : "Length"}</p><p className="text-xl font-headline font-bold text-primary">{totalLength.toLocaleString()} bp</p></div>
          <div className="h-8 w-px bg-outline-variant/20 self-center" />
          <div className="text-center"><p className="text-[10px] font-headline text-on-surface-variant uppercase tracking-widest">GC%</p><p className="text-xl font-headline font-bold text-tertiary">{avgGC}%</p></div>
          <div className="h-8 w-px bg-outline-variant/20 self-center" />
          <div className="text-center"><p className="text-[10px] font-headline text-on-surface-variant uppercase tracking-widest">{isZh ? "模块数" : "Modules"}</p><p className="text-xl font-headline font-bold text-on-surface">{canvasModules.length}</p></div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 flex-1">
        <aside className="space-y-3">
          <div className="flex items-center gap-2 mb-2"><FlaskConical size={14} className="text-secondary" /><h3 className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">{isZh ? "基因功能模块库" : "Module Library"}</h3></div>
          {MODULE_LIBRARY.map((mod) => {
            const inCanvas = !!canvasModules.find((m) => m.id === mod.id);
            return (
              <div key={mod.id} onClick={() => { setSelectedModule(mod); if (!inCanvas) addToCanvas(mod); }} className={`glass-panel p-3 rounded-xl border-l-2 ${mod.borderColor} cursor-pointer ${selectedModule?.id === mod.id ? "ring-1 ring-primary/40" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold font-mono ${mod.color}`}>{mod.shortName}</span>
                  <span className="text-[9px] text-outline">{mod.length} bp</span>
                </div>
                <p className="text-xs text-on-surface font-headline font-semibold">{isZh ? mod.nameZh : mod.nameEn}</p>
                <p className="text-[10px] text-on-surface-variant mt-1">{isZh ? mod.functionZh : mod.functionEn}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[9px] text-outline">{TYPE_LABELS[locale][mod.type]}</span>
                  <span className="text-[9px] text-tertiary">{isZh ? "表达" : "Exp"} {mod.expressionScore}</span>
                </div>
              </div>
            );
          })}
        </aside>

        <section className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Cpu size={14} className="text-primary" /><h3 className="font-headline font-bold text-xs uppercase tracking-widest">{isZh ? "装配画布" : "Assembly Canvas"}</h3></div>
              <button onClick={() => { setCanvasModules([]); setCompileState("idle"); setValidationPassed([]); }} className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant"><RotateCcw size={14} /></button>
            </div>
            <div className="flex items-end gap-2 flex-wrap min-h-[140px]">
              {canvasModules.map((mod, idx) => (
                <div key={mod.id} className="flex items-center gap-2">
                  <div className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/20">
                    <p className={`text-[10px] font-mono ${mod.color}`}>{mod.shortName}</p>
                    <p className="text-[9px] text-outline">{TYPE_LABELS[locale][mod.type]}</p>
                  </div>
                  {idx < canvasModules.length - 1 && <ChevronRight size={14} className="text-outline" />}
                  <button onClick={() => removeFromCanvas(mod.id)} className="text-[10px] text-secondary hover:opacity-80">×</button>
                </div>
              ))}
              {canvasModules.length === 0 && (
                <div className="w-full h-24 flex items-center justify-center text-on-surface-variant/40 text-xs font-headline uppercase tracking-widest border-2 border-dashed border-outline-variant/20 rounded-xl">
                  {isZh ? "从左侧模块库添加元件" : "Add components from the library"}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-5 rounded-xl">
              <div className="flex items-center gap-2 mb-4"><Dna size={14} className="text-secondary" /><h3 className="font-headline font-bold text-xs uppercase tracking-widest">{isZh ? "属性检查器" : "Inspector"}</h3></div>
              {selectedModule ? (
                <div className="space-y-3">
                  <p className={`text-sm font-bold font-mono ${selectedModule.color}`}>{selectedModule.shortName}</p>
                  <p className="text-xs text-on-surface">{isZh ? selectedModule.nameZh : selectedModule.nameEn}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-surface-container-low p-2 rounded-lg"><p className="text-[9px] text-outline">{isZh ? "GC 含量" : "GC"}</p><p className="text-sm font-headline font-bold text-on-surface">{selectedModule.gcContent}%</p></div>
                    <div className="bg-surface-container-low p-2 rounded-lg"><p className="text-[9px] text-outline">{isZh ? "长度" : "Length"}</p><p className="text-sm font-headline font-bold text-on-surface">{selectedModule.length} bp</p></div>
                    <div className="bg-surface-container-low p-2 rounded-lg"><p className="text-[9px] text-outline">{isZh ? "类型" : "Type"}</p><p className="text-sm font-headline font-bold text-on-surface">{TYPE_LABELS[locale][selectedModule.type]}</p></div>
                    <div className="bg-surface-container-low p-2 rounded-lg"><p className="text-[9px] text-outline">{isZh ? "表达评分" : "Expression"}</p><p className="text-sm font-headline font-bold text-on-surface">{selectedModule.expressionScore}</p></div>
                  </div>
                  {(selectedModule.gcContent < 40 || selectedModule.gcContent > 65) && <p className="text-[9px] text-secondary mt-1 flex items-center gap-1"><AlertTriangle size={9} />{isZh ? "GC 偏离建议范围 40-65%" : "GC outside recommended 40-65%"}</p>}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant/50 text-center mt-8">{isZh ? "点击模块查看属性" : "Select a module to inspect"}</p>
              )}
            </div>

            <div className="glass-panel p-5 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><Shield size={14} className="text-tertiary" /><h3 className="font-headline font-bold text-xs uppercase tracking-widest">{isZh ? "编译与验证" : "Compile & Validate"}</h3></div>
                {compileState === "done" && <span className="text-[9px] text-tertiary border border-tertiary/30 bg-tertiary/10 px-2 py-0.5 rounded-full font-headline uppercase">{isZh ? "通过" : "Passed"}</span>}
              </div>
              <div className="space-y-2 mb-4">
                {VALIDATION_CHECKS.map((check) => {
                  const passed = validationPassed.includes(check.id);
                  return (
                    <div key={check.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface-container-low">
                      {passed ? <CheckCircle2 size={14} className="text-tertiary" /> : <Circle size={14} className="text-outline-variant" />}
                      <div>
                        <p className="text-[10px] font-headline font-bold text-on-surface">{isZh ? check.labelZh : check.labelEn}</p>
                        <p className="text-[9px] text-on-surface-variant">{isZh ? check.descZh : check.descEn}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <motion.button {...buttonPress} onClick={handleCompile} disabled={canvasModules.length < 2 || compileState === "running"} className="flex-1 py-2.5 bg-tertiary text-on-tertiary font-headline font-bold text-xs rounded-lg uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40">
                  <Play size={13} />
                  {compileState === "running" ? (isZh ? "验证中..." : "Validating...") : (isZh ? "编译设计" : "Compile")}
                </motion.button>
                {compileState === "done" && (
                  <button className="px-4 py-2.5 bg-primary/20 text-primary border border-primary/30 font-headline font-bold text-xs rounded-lg uppercase tracking-widest flex items-center gap-2">
                    <Download size={13} />SBOL
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
