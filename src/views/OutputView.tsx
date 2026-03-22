import { useState } from "react";
import type { ElementType } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Circle,
  Download,
  Share2,
  FileText,
  Dna,
  FlaskConical,
  Cpu,
  Network,
  Layers,
  Shield,
  Printer,
  Clock,
  ChevronDown,
  ChevronUp,
  Zap,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { stagger, fadeSlideUp, fadeScale, viewTransition, buttonPress, inViewport } from "../lib/motion";

// ── 验证层级 ──
interface VerifyLayer {
  id: string;
  label: string;
  labelEn: string;
  icon: ElementType;
  color: string;
  status: "passed" | "warning" | "pending";
  score: number;
  summary: string;
  details: string[];
}

const VERIFY_LAYERS: VerifyLayer[] = [
  {
    id: "env", label: "环境解析层", labelEn: "Environment Parsing", icon: FlaskConical, color: "text-secondary", status: "passed", score: 97,
    summary: "Jezero 火山口约束参数已全量解析，186 条环境约束导入完成。",
    details: ["高氯酸盐浓度 0.5-1.0 wt% 完全覆盖", "UV-C 通量 3.6 W/m² — 防护策略确认", "土壤 pH 梯度图谱分辨率 10m", "热震荡周期 687 sol 建模完成"],
  },
  {
    id: "gene", label: "基因映射层", labelEn: "Gene Function Mapping", icon: Dna, color: "text-secondary", status: "passed", score: 92,
    summary: "428 个基因簇功能注释完成，4 模块基因盒已确认。",
    details: ["pcrABCD 高氯酸盐还原核心基因簇定位", "crtBIYEP 类胡萝卜素 UV 防护确认", "cspA 冷休克蛋白低温活性验证", "recA G267S 突变体 DNA 修复 +340%"],
  },
  {
    id: "circuit", label: "回路设计层", labelEn: "Genetic Circuit Design", icon: Cpu, color: "text-primary", status: "passed", score: 87,
    summary: "12 个逻辑门仿真通过，正交性评分 0.94，Kill Switch 就绪。",
    details: ["UV Toggle Switch v3 响应时间 4.2 min", "高氯酸盐感应 AND 门阈值校准 0.3 wt%", "T7/T3 正交转录系统隔离", "mazEF Kill Switch 生态安全就绪"],
  },
  {
    id: "metab", label: "代谢兼容层", labelEn: "Metabolic Compatibility", icon: Network, color: "text-primary", status: "passed", score: 95,
    summary: "FBA 通量平衡分析 342 个可行解，毒性中间体 ClO₃⁻ 控制方案确认。",
    details: ["1847 个代谢反应全量映射", "双菌共生氧气化学计量匹配", "生物量通量 0.42 h⁻¹", "理论倍增时间 18.7 h@0.6kPa CO₂"],
  },
  {
    id: "struct", label: "结构预测层", labelEn: "Structure Prediction", icon: Layers, color: "text-primary", status: "passed", score: 90,
    summary: "AlphaFold2/ESMFold 预测 156 个结构，低温稳定化突变通过率 90.5%。",
    details: ["PcrA pLDDT=91.2 活性位点完整", "RecA G267S -40°C MD 仿真稳定", "OmpF 变体 -60°C 通道开放率 67%", "CrtI Pro→Hyp 热稳定性修正完成"],
  },
  {
    id: "verify", label: "核查层", labelEn: "Verification & Fidelity", icon: Shield, color: "text-tertiary", status: "passed", score: 99,
    summary: "反幻觉安全层通过，50M+ 仿真周期无逻辑矛盾，误差率 < 0.001%。",
    details: ["代谢输出与土壤化学模拟对比完成", "设计层路径逻辑一致性验证通过", "生物安全等级评估：BSL-1 兼容", "结构稳定性 95.4%"],
  },
];

// ── 导出选项 ──
const EXPORT_OPTIONS = [
  { id: "sbol", label: "SBOL 2.3", desc: "标准合成生物学开放语言格式", icon: Dna, ext: ".xml" },
  { id: "genbank", label: "GenBank", desc: "NCBI GenBank 序列注释格式", icon: FileText, ext: ".gb" },
  { id: "pdf", label: "PDF 报告", desc: "完整设计说明与验证证书", icon: FileText, ext: ".pdf" },
  { id: "json", label: "JSON API", desc: "机器可读设计数据流", icon: Cpu, ext: ".json" },
];

// ── 生物打印任务 ──
interface PrintJob {
  id: string;
  name: string;
  status: "queued" | "printing" | "done";
  progress: number;
  eta: string;
}

const PRINT_JOBS: PrintJob[] = [
  { id: "JOB-001", name: "XENO_BIO_v1.0.4 — Alpha 批次", status: "done", progress: 100, eta: "完成" },
  { id: "JOB-002", name: "XENO_BIO_v1.0.4 — Beta 批次", status: "printing", progress: 62, eta: "约 18 min" },
  { id: "JOB-003", name: "XENO_BIO_v1.0.5 — 候补序列", status: "queued", progress: 0, eta: "排队中" },
];

const STATUS_CONFIG = {
  done:     { label: "完成",   color: "text-tertiary",  bg: "bg-tertiary/10",  dot: "bg-tertiary" },
  printing: { label: "打印中", color: "text-primary",   bg: "bg-primary/10",   dot: "bg-primary animate-pulse" },
  queued:   { label: "排队",   color: "text-outline",   bg: "bg-outline/10",   dot: "bg-outline" },
};

export default function OutputView() {
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [exportSelected, setExportSelected] = useState<string>("sbol");
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 1800);
  };

  const overallScore = Math.round(VERIFY_LAYERS.reduce((sum, l) => sum + l.score, 0) / VERIFY_LAYERS.length);

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
        className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
      >
        <div className="space-y-3">
          <motion.div variants={fadeSlideUp} className="flex gap-2">
            <span className="px-3 py-1 bg-tertiary/10 border border-tertiary/20 text-tertiary text-[10px] font-headline tracking-widest uppercase rounded flex items-center gap-1.5">
              <CheckCircle2 size={10} /> 全层验证通过
            </span>
            <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-headline tracking-widest uppercase rounded">生物打印就绪</span>
          </motion.div>
          <motion.h2
            variants={fadeSlideUp}
            className="text-3xl md:text-4xl font-black font-headline text-on-background tracking-tighter leading-none"
          >
            设计 <span className="text-tertiary">输出</span> 中心
          </motion.h2>
          <motion.p variants={fadeSlideUp} className="text-sm text-on-surface-variant max-w-lg">
            完整设计规范经 6 层验证，综合评分 {overallScore}/100。可导出标准化文件或提交生物打印队列。
          </motion.p>
        </div>

        {/* 综合评分 */}
        <motion.div variants={fadeScale} className="glass-panel p-5 rounded-2xl border-t-2 border-t-tertiary/40 glow-tertiary text-center min-w-[160px]">
          <p className="text-[10px] font-headline text-on-surface-variant uppercase tracking-widest mb-1">综合验证评分</p>
          <p className="text-5xl font-headline font-black text-tertiary">{overallScore}</p>
          <p className="text-[10px] text-outline font-headline mt-1">/ 100</p>
          <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden mt-3">
            <motion.div
              className="h-full bg-tertiary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${overallScore}%` }}
              transition={{ duration: 1.2, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          </div>
        </motion.div>
      </motion.section>

      {/* ── 设计规范 ID ── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-8 glass-panel p-4 md:p-6 rounded-2xl border border-primary/20"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <Dna size={24} className="text-primary" />
            <div>
              <p className="text-[10px] font-headline text-on-surface-variant uppercase tracking-widest">设计规范书 ID</p>
              <p className="font-mono text-primary text-sm font-bold">XENO_BIO_v1.0.4_PATH_ID_8842-B-ALPHA</p>
            </div>
          </div>
          <div className="flex-1 hidden md:block h-px bg-outline-variant/20" />
          <div className="flex flex-wrap gap-3 text-center">
            {[
              { label: "总序列长", value: "12,234 bp" },
              { label: "基因模块", value: "4 盒" },
              { label: "代谢路径", value: "7 条" },
              { label: "生存评分", value: "78%" },
            ].map((item) => (
              <div key={item.label} className="text-center px-3">
                <p className="text-[9px] font-headline text-outline uppercase">{item.label}</p>
                <p className="text-sm font-headline font-bold text-on-surface">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── 左侧：层级验证清单 ── */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={14} className="text-tertiary" />
            <h3 className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">多层验证报告</h3>
          </div>

          {VERIFY_LAYERS.map((layer, idx) => {
            const Icon = layer.icon;
            const expanded = expandedLayer === layer.id;
            return (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + idx * 0.06 }}
                className="glass-panel rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedLayer(expanded ? null : layer.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-surface-container-high/50 transition-colors text-left"
                >
                  {/* 状态图标 */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    layer.status === "passed" ? "bg-tertiary/15" : "bg-outline/10"
                  }`}>
                    <Icon size={16} className={layer.color} />
                  </div>

                  {/* 标签 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-headline font-bold text-sm text-on-surface">{layer.label}</span>
                      <span className="text-[9px] text-outline font-mono">{layer.labelEn}</span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-0.5 truncate">{layer.summary}</p>
                  </div>

                  {/* 评分 */}
                  <div className="text-center shrink-0">
                    <span className={`text-xl font-headline font-black ${layer.score >= 90 ? "text-tertiary" : "text-on-surface"}`}>{layer.score}</span>
                    <p className="text-[9px] text-outline">/100</p>
                  </div>

                  {/* 通过徽章 */}
                  <div className="shrink-0">
                    {layer.status === "passed" ? (
                      <CheckCircle2 size={18} className="text-tertiary" />
                    ) : (
                      <Circle size={18} className="text-outline" />
                    )}
                  </div>

                  {expanded ? <ChevronUp size={14} className="text-outline shrink-0" /> : <ChevronDown size={14} className="text-outline shrink-0" />}
                </button>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-outline-variant/10 pt-3">
                        <div className="space-y-1.5">
                          {layer.details.map((d, i) => (
                            <div key={i} className={`text-xs text-on-surface-variant pl-3 border-l-2 ${layer.color.replace("text-", "border-")} py-0.5 leading-snug`}>
                              {d}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* ── 右侧：导出 + 打印队列 ── */}
        <div className="space-y-6">

          {/* 导出选项 */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="glass-panel p-5 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <Download size={14} className="text-primary" />
              <h3 className="font-headline font-bold text-xs uppercase tracking-widest">导出格式</h3>
            </div>

            <div className="space-y-2 mb-4">
              {EXPORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setExportSelected(opt.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      exportSelected === opt.id
                        ? "border-primary/40 bg-primary/10"
                        : "border-outline-variant/15 hover:bg-surface-container-low"
                    }`}
                  >
                    <Icon size={14} className={exportSelected === opt.id ? "text-primary" : "text-outline"} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-headline font-bold ${exportSelected === opt.id ? "text-primary" : "text-on-surface"}`}>
                        {opt.label} <span className="font-mono text-[9px] opacity-60">{opt.ext}</span>
                      </p>
                      <p className="text-[9px] text-on-surface-variant truncate">{opt.desc}</p>
                    </div>
                    {exportSelected === opt.id && <CheckCircle2 size={12} className="text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <motion.button
                {...buttonPress}
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 py-2.5 bg-primary text-on-primary font-headline font-bold text-xs rounded-lg uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-[0_0_15px_rgba(129,207,255,0.3)] disabled:opacity-60"
              >
                <Download size={13} />
                {downloading ? "生成中..." : "下载"}
              </motion.button>
              <motion.button
                {...buttonPress}
                className="px-3 py-2.5 border border-outline-variant/30 text-on-surface-variant font-headline font-bold text-xs rounded-lg uppercase hover:bg-surface-container transition-all"
              >
                <Share2 size={14} />
              </motion.button>
            </div>
          </motion.div>

          {/* 生物打印队列 */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="glass-panel p-5 rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Printer size={14} className="text-secondary" />
                <h3 className="font-headline font-bold text-xs uppercase tracking-widest">生物打印队列</h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            </div>

            <div className="space-y-3">
              {PRINT_JOBS.map((job) => {
                const cfg = STATUS_CONFIG[job.status];
                return (
                  <div key={job.id} className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        <span className="text-[10px] font-mono text-outline">{job.id}</span>
                      </div>
                      <span className={`text-[9px] font-headline uppercase px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} border-current/20`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface font-headline font-semibold mb-2 leading-snug">{job.name}</p>
                    {job.status !== "queued" && (
                      <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${job.status === "done" ? "bg-tertiary" : "bg-primary"}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${job.progress}%` }}
                          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] text-outline font-headline">进度: {job.progress}%</span>
                      <div className="flex items-center gap-1 text-[9px] text-outline">
                        <Clock size={8} /> {job.eta}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <motion.button
              {...buttonPress}
              className="w-full mt-4 py-2.5 bg-secondary/15 text-secondary border border-secondary/30 font-headline font-bold text-xs rounded-lg uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-secondary/25 transition-all"
            >
              <Printer size={13} />
              提交新打印任务
            </motion.button>
          </motion.div>

          {/* 溯源链接 */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            className="glass-panel p-4 rounded-xl border border-outline-variant/10"
          >
            <div className="flex items-center gap-2 mb-3">
              <ExternalLink size={13} className="text-outline" />
              <h3 className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">数据溯源</h3>
            </div>
            <div className="space-y-1.5">
              {["NASA PDS v4 · Jezero 数据集", "NCBI GenBank · D. radiodurans R1", "AlphaFold DB · PcrA 结构预测", "iGEM Registry · 标准部件 23 件"].map((src) => (
                <div key={src} className="text-[10px] text-on-surface-variant flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
                  <Zap size={8} className="shrink-0 text-outline" />
                  {src}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
