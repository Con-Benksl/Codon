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
  ExternalLink,
} from "lucide-react";
import { useLocale } from "../i18n/context";
import { viewTransition, buttonPress } from "../lib/motion";

interface VerifyLayer {
  id: string;
  icon: ElementType;
  color: string;
  score: number;
  status: "passed" | "pending";
  labelZh: string;
  labelEn: string;
  summaryZh: string;
  summaryEn: string;
  detailsZh: string[];
  detailsEn: string[];
}

const VERIFY_LAYERS: VerifyLayer[] = [
  { id: "env", icon: FlaskConical, color: "text-secondary", score: 97, status: "passed", labelZh: "环境解析层", labelEn: "Environment Parsing", summaryZh: "约束参数解析完成，环境约束已写入。", summaryEn: "Constraint parsing finished and environment constraints are loaded.", detailsZh: ["高氯酸盐浓度区间覆盖完成", "UV-C 通量建模已确认", "温度梯度图谱同步完成"], detailsEn: ["Perchlorate interval coverage complete", "UV-C flux model confirmed", "Thermal gradient map synchronized"] },
  { id: "gene", icon: Dna, color: "text-secondary", score: 92, status: "passed", labelZh: "基因映射层", labelEn: "Gene Mapping", summaryZh: "核心功能基因注释与映射已完成。", summaryEn: "Core functional gene annotation and mapping completed.", detailsZh: ["功能簇定位已完成", "防护相关模块通过验证", "低温活性标注已同步"], detailsEn: ["Functional clusters localized", "Protection modules validated", "Low-temperature activity labels synced"] },
  { id: "circuit", icon: Cpu, color: "text-primary", score: 87, status: "passed", labelZh: "回路设计层", labelEn: "Circuit Design", summaryZh: "逻辑门仿真通过，正交评分稳定。", summaryEn: "Logic-gate simulation passed with stable orthogonality.", detailsZh: ["UV 开关响应稳定", "阈值校准通过", "正交转录隔离成功"], detailsEn: ["UV switch response is stable", "Threshold calibration passed", "Orthogonal transcription isolated"] },
  { id: "metab", icon: Network, color: "text-primary", score: 95, status: "passed", labelZh: "代谢兼容层", labelEn: "Metabolic Compatibility", summaryZh: "通量平衡分析通过，毒性中间体受控。", summaryEn: "Flux balance analysis passed with controlled toxic intermediates.", detailsZh: ["可行解空间稳定", "生物量通量达标", "双菌共生计量匹配"], detailsEn: ["Feasible solution space stable", "Biomass flux meets target", "Stoichiometry matched for coculture"] },
  { id: "struct", icon: Layers, color: "text-primary", score: 90, status: "passed", labelZh: "结构预测层", labelEn: "Structure Prediction", summaryZh: "关键蛋白结构预测完成，低温稳定性达标。", summaryEn: "Key protein structures predicted with qualified low-temp stability.", detailsZh: ["结构置信度高", "低温 MD 稳定", "突变优化通过"], detailsEn: ["High structure confidence", "Stable in low-temp MD", "Mutation optimization passed"] },
  { id: "verify", icon: Shield, color: "text-tertiary", score: 99, status: "passed", labelZh: "核查层", labelEn: "Verification", summaryZh: "反幻觉安全层通过，逻辑一致性正常。", summaryEn: "Anti-hallucination safety layer passed with consistent logic.", detailsZh: ["误差率低于 0.001%", "路径一致性验证通过", "生物安全等级兼容"], detailsEn: ["Error below 0.001%", "Path consistency validated", "Biosafety level compatible"] },
];

const EXPORT_OPTIONS = [
  { id: "sbol", label: "SBOL 2.3", descZh: "标准合成生物学开放格式", descEn: "Standard synthetic biology open format", icon: Dna, ext: ".xml" },
  { id: "genbank", label: "GenBank", descZh: "NCBI 序列注释格式", descEn: "NCBI sequence annotation format", icon: FileText, ext: ".gb" },
  { id: "pdf", label: "PDF", descZh: "完整设计说明与验证证书", descEn: "Complete design spec and validation certificate", icon: FileText, ext: ".pdf" },
  { id: "json", label: "JSON API", descZh: "机器可读设计数据流", descEn: "Machine-readable design data stream", icon: Cpu, ext: ".json" },
];

const PRINT_JOBS = [
  { id: "JOB-001", name: "XENO_BIO_v1.0.4 Alpha", status: "done" as const, progress: 100, etaZh: "完成", etaEn: "Done" },
  { id: "JOB-002", name: "XENO_BIO_v1.0.4 Beta", status: "printing" as const, progress: 62, etaZh: "约 18 min", etaEn: "About 18 min" },
  { id: "JOB-003", name: "XENO_BIO_v1.0.5 Candidate", status: "queued" as const, progress: 0, etaZh: "排队中", etaEn: "Queued" },
];

export default function OutputView() {
  const { locale } = useLocale();
  const isZh = locale === "zh";
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [exportSelected, setExportSelected] = useState("sbol");
  const [downloading, setDownloading] = useState(false);
  const overallScore = Math.round(VERIFY_LAYERS.reduce((sum, l) => sum + l.score, 0) / VERIFY_LAYERS.length);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 1200);
  };

  return (
    <motion.div variants={viewTransition} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col pt-2">
      <section className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-3">
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-tertiary/10 border border-tertiary/20 text-tertiary text-[10px] font-headline tracking-widest uppercase rounded flex items-center gap-1.5"><CheckCircle2 size={10} />{isZh ? "全层验证通过" : "All Layers Passed"}</span>
            <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-headline tracking-widest uppercase rounded">{isZh ? "生物打印就绪" : "Bioprint Ready"}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black font-headline text-on-background tracking-tighter leading-none">{isZh ? "设计 " : "Design "} <span className="text-tertiary">{isZh ? "输出中心" : "Output Hub"}</span></h2>
          <p className="text-sm text-on-surface-variant max-w-lg">{isZh ? `完整设计已通过 6 层验证，综合评分 ${overallScore}/100。` : `Design has passed all six layers with an overall score of ${overallScore}/100.`}</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl border-t-2 border-t-tertiary/40 glow-tertiary text-center min-w-[160px]">
          <p className="text-[10px] font-headline text-on-surface-variant uppercase tracking-widest mb-1">{isZh ? "综合评分" : "Overall Score"}</p>
          <p className="text-5xl font-headline font-black text-tertiary">{overallScore}</p>
          <p className="text-[10px] text-outline font-headline mt-1">/ 100</p>
        </div>
      </section>

      <section className="mb-8 glass-panel p-4 md:p-6 rounded-2xl border border-primary/20">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <Dna size={24} className="text-primary" />
            <div>
              <p className="text-[10px] font-headline text-on-surface-variant uppercase tracking-widest">{isZh ? "设计规范书 ID" : "Design Spec ID"}</p>
              <p className="font-mono text-primary text-sm font-bold">XENO_BIO_v1.0.4_PATH_ID_8842-B-ALPHA</p>
            </div>
          </div>
          <div className="flex-1 hidden md:block h-px bg-outline-variant/20" />
          <div className="flex flex-wrap gap-3 text-center">
            {[
              { labelZh: "总序列长", labelEn: "Length", value: "12,234 bp" },
              { labelZh: "基因模块", labelEn: "Modules", value: "4" },
              { labelZh: "代谢路径", labelEn: "Pathways", value: "7" },
              { labelZh: "生存评分", labelEn: "Survival", value: "78%" },
            ].map((item) => (
              <div key={item.labelEn} className="text-center px-3">
                <p className="text-[9px] font-headline text-outline uppercase">{isZh ? item.labelZh : item.labelEn}</p>
                <p className="text-sm font-headline font-bold text-on-surface">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2 mb-2"><Shield size={14} className="text-tertiary" /><h3 className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">{isZh ? "多层验证报告" : "Layered Validation"}</h3></div>
          {VERIFY_LAYERS.map((layer) => {
            const Icon = layer.icon;
            const expanded = expandedLayer === layer.id;
            return (
              <div key={layer.id} className="glass-panel rounded-xl overflow-hidden">
                <button onClick={() => setExpandedLayer(expanded ? null : layer.id)} className="w-full flex items-center gap-4 p-4 hover:bg-surface-container-high/50 transition-colors text-left">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-tertiary/15"><Icon size={16} className={layer.color} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap"><span className="font-headline font-bold text-sm text-on-surface">{isZh ? layer.labelZh : layer.labelEn}</span></div>
                    <p className="text-[10px] text-on-surface-variant mt-0.5 truncate">{isZh ? layer.summaryZh : layer.summaryEn}</p>
                  </div>
                  <div className="text-center shrink-0"><span className="text-xl font-headline font-black text-tertiary">{layer.score}</span><p className="text-[9px] text-outline">/100</p></div>
                  {layer.status === "passed" ? <CheckCircle2 size={18} className="text-tertiary" /> : <Circle size={18} className="text-outline" />}
                  {expanded ? <ChevronUp size={14} className="text-outline shrink-0" /> : <ChevronDown size={14} className="text-outline shrink-0" />}
                </button>
                <AnimatePresence>
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 border-t border-outline-variant/10 pt-3 space-y-1.5">
                        {(isZh ? layer.detailsZh : layer.detailsEn).map((d) => (
                          <div key={d} className={`text-xs text-on-surface-variant pl-3 border-l-2 ${layer.color.replace("text-", "border-")} py-0.5`}>{d}</div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-4"><Download size={14} className="text-primary" /><h3 className="font-headline font-bold text-xs uppercase tracking-widest">{isZh ? "导出格式" : "Export Format"}</h3></div>
            <div className="space-y-2 mb-4">
              {EXPORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button key={opt.id} onClick={() => setExportSelected(opt.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${exportSelected === opt.id ? "border-primary/40 bg-primary/10" : "border-outline-variant/15 hover:bg-surface-container-low"}`}>
                    <Icon size={14} className={exportSelected === opt.id ? "text-primary" : "text-outline"} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-headline font-bold ${exportSelected === opt.id ? "text-primary" : "text-on-surface"}`}>{opt.label} <span className="font-mono text-[9px] opacity-60">{opt.ext}</span></p>
                      <p className="text-[9px] text-on-surface-variant truncate">{isZh ? opt.descZh : opt.descEn}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <motion.button {...buttonPress} onClick={handleDownload} className="flex-1 py-2.5 bg-primary text-on-primary font-headline font-bold text-xs rounded-lg uppercase tracking-widest flex items-center justify-center gap-2">
                <Download size={13} />{downloading ? (isZh ? "生成中..." : "Generating...") : (isZh ? "下载" : "Download")}
              </motion.button>
              <button className="px-3 py-2.5 border border-outline-variant/30 text-on-surface-variant rounded-lg"><Share2 size={14} /></button>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><Printer size={14} className="text-secondary" /><h3 className="font-headline font-bold text-xs uppercase tracking-widest">{isZh ? "生物打印队列" : "Bioprint Queue"}</h3></div><span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /></div>
            <div className="space-y-3">
              {PRINT_JOBS.map((job) => (
                <div key={job.id} className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/10">
                  <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-mono text-outline">{job.id}</span><span className="text-[9px] font-headline uppercase">{job.status}</span></div>
                  <p className="text-xs text-on-surface font-headline font-semibold mb-2">{job.name}</p>
                  {job.status !== "queued" && <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden"><div className={`h-full rounded-full ${job.status === "done" ? "bg-tertiary" : "bg-primary"}`} style={{ width: `${job.progress}%` }} /></div>}
                  <div className="flex items-center justify-between mt-1"><span className="text-[9px] text-outline">{isZh ? "进度" : "Progress"}: {job.progress}%</span><div className="flex items-center gap-1 text-[9px] text-outline"><Clock size={8} />{isZh ? job.etaZh : job.etaEn}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-3"><ExternalLink size={13} className="text-outline" /><h3 className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">{isZh ? "数据溯源" : "Data Traceability"}</h3></div>
            <div className="space-y-1.5 text-[10px] text-on-surface-variant">
              {(isZh
                ? ["NASA PDS v4 · Jezero 数据集", "NCBI GenBank · D. radiodurans R1", "AlphaFold DB · PcrA 结构预测"]
                : ["NASA PDS v4 · Jezero dataset", "NCBI GenBank · D. radiodurans R1", "AlphaFold DB · PcrA structure"]).map((src) => (
                <div key={src} className="flex items-center gap-2">{src}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
