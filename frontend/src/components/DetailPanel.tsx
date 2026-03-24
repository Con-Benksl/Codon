import { useEffect, useMemo, useRef } from "react";
import { motion } from "motion/react";
import { X, ExternalLink, Circle, ArrowUp, ArrowDown, Minus, Sparkles } from "lucide-react";
import type { AgentDetail } from "../data/agentDetails";
import type { AgentRun } from "../api/agents";
import { useLocale } from "../i18n/context";

interface DetailPanelProps {
  agent: AgentDetail;
  agentRun?: AgentRun;
  onClose: () => void;
}

interface AgentOverride {
  name: string;
  subtitle?: string;
  description: string;
  metricLabels: string[];
  dataSourceNames?: string[];
  logMessages?: string[];
  findings?: string[];
}

const ZH_AGENT_OVERRIDES: Record<string, AgentOverride> = {
  "env-parse": {
    name: "环境解析",
    subtitle: "Environmental Parsing Agent",
    description: "将火星环境数据结构化为约束参数，并生成毒性梯度与热震荡图谱，供下游智能体决策。",
    metricLabels: ["已解析数据集", "约束参数", "毒性梯度覆盖", "热震荡周期"],
    dataSourceNames: ["NASA PDS 行星数据系统", "MSL Curiosity RAD", "Phoenix Lander TEGA", "MAVEN 大气数据库"],
    logMessages: [
      "Jezero 高氯酸盐浓度更新：0.5-1.0 wt% ClO4-",
      "UV-C 峰值通量记录：6.4 W/m2（Sol 1241）",
      "土壤 pH 梯度图谱生成完成（10m 分辨率）",
      "MAVEN 大气逃逸数据同步完成",
      "热惯量数据与 MRO/THEMIS 交叉验证通过",
    ],
    findings: [
      "Jezero 区域高氯酸盐浓度高于全星均值。",
      "昼夜温差可达约 70°C，对生物稳定性影响显著。",
      "表面 UV-C 通量较高，需强化防护策略。",
    ],
  },
  extremophile: {
    name: "极端微生物",
    subtitle: "Extremophile Screening Agent",
    description: "筛选具备耐辐射、耐干燥和耐低温特征的候选底盘菌株。",
    metricLabels: ["候选物种", "基因组覆盖", "辐射耐受阈值", "筛选置信度"],
    dataSourceNames: ["NCBI GenBank", "JGI IMG/M", "ExtremeDB", "UniProt 蛋白组"],
    logMessages: [
      "D. radiodurans R1 评估完成",
      "Chroococcidiopsis 耐干燥特征确认",
      "Halobacterium NRC-1 因耐受不足移出候选",
      "T. gammatolerans 辐射耐受确认",
      "共生候选组合生成完成",
    ],
    findings: [
      "D. radiodurans 仍是辐射耐受最优候选。",
      "Chroococcidiopsis 在受保护条件下具备稳定存活能力。",
      "双菌协同架构更适合火星极端条件。",
    ],
  },
  "gene-func": {
    name: "基因功能映射",
    subtitle: "Gene Function Mapping Agent",
    description: "映射耐受性相关功能基因与操纵子，重点覆盖高氯酸盐还原与应激响应模块。",
    metricLabels: ["映射基因簇", "功能注释率", "操纵子网络", "跨物种保守度"],
    dataSourceNames: ["UniProt / Swiss-Prot", "KEGG Pathway", "NCBI Gene", "InterPro 结构域"],
    logMessages: [
      "pcrABCD 操纵子定位完成",
      "nifHDK 兼容性评估中",
      "crt 防护通路映射完成",
      "recA 低温转录衰减预警",
      "RuBisCO 低 CO2 亲和力检查完成",
    ],
    findings: [
      "pcrABCD 是关键高氯酸盐还原核心簇。",
      "crtBIYEP 为 UV 防护提供有效支撑。",
      "建议采用四模块串联基因盒架构。",
    ],
  },
  "circuit-design": {
    name: "回路设计",
    subtitle: "Genetic Circuit Design Agent",
    description: "构建 UV 与高氯酸盐触发的环境响应逻辑回路，保障回路正交与稳定表达。",
    metricLabels: ["逻辑门设计", "仿真通过率", "iGEM 部件复用", "正交性评分"],
    dataSourceNames: ["iGEM Registry", "SynBioHub", "SBOL Visual"],
    logMessages: [
      "UV Toggle Switch v3 仿真完成",
      "PrecA 启动子低温衰减已记录",
      "高氯酸盐 AND 门逻辑验证通过",
      "类胡萝卜素正反馈环路稳定",
      "正交 riboswitch 候选更新",
    ],
    findings: [
      "UV 与高氯酸盐模块可实现正交联动控制。",
      "低温条件下需引入冷诱导增强策略。",
      "建议保留生物安全 Kill Switch 设计。",
    ],
  },
  "metab-compat": {
    name: "代谢兼容性",
    subtitle: "Metabolic Compatibility Agent",
    description: "通过 FBA 评估工程代谢路径与宿主网络兼容性，并监控毒性中间体风险。",
    metricLabels: ["代谢反应", "FBA 可行解", "毒性中间体", "生物量通量"],
    dataSourceNames: ["BiGG Models", "KEGG Reaction", "BRENDA 酶动力学", "MetaCyc 代谢路径"],
    logMessages: [
      "FBA 迭代优化进行中",
      "氯酸盐中间体阈值预警触发",
      "碳通量重分配完成",
      "ATP 平衡验证通过",
      "NAD+/NADH 比值处于可接受范围",
    ],
    findings: [
      "高氯酸盐还原路径在当前约束下具备可行性。",
      "需对 ClO3- 中间体进行强化控制。",
      "双菌共生可提升整体生存效率。",
    ],
  },
  "struct-predict": {
    name: "结构预测",
    subtitle: "Structure Prediction Agent",
    description: "结合 AlphaFold 与分子动力学评估关键蛋白在低温下的构象稳定性。",
    metricLabels: ["预测结构", "平均 pLDDT", "低温稳定突变", "MD 仿真时长"],
    dataSourceNames: ["AlphaFold DB", "PDB 蛋白数据库", "ESM Atlas", "Swiss-Model"],
    logMessages: [
      "PcrA 低温稳定构象确认",
      "RecA G267S 低温活性提升",
      "CrtI 局部展开风险预警",
      "OmpF 抗冻变体验证通过",
      "MD 仿真批次完成",
    ],
    findings: [
      "关键酶活性位点在候选结构中保持稳定。",
      "定向突变可明显提升低温功能保持率。",
      "多数稳定化变体已通过仿真筛选。",
    ],
  },
};

const EN_AGENT_OVERRIDES: Record<string, AgentOverride> = {
  "env-parse": {
    name: "Environment Parsing",
    subtitle: "Environmental Parsing Agent",
    description: "Transforms planetary datasets into structured constraints and builds toxicity/thermal maps used by downstream agents.",
    metricLabels: ["Parsed Datasets", "Constraints", "Toxicity Coverage", "Thermal Cycle"],
    dataSourceNames: ["NASA PDS", "MSL Curiosity RAD", "Phoenix Lander TEGA", "MAVEN Atmosphere DB"],
    logMessages: [
      "Jezero perchlorate concentration updated: 0.5-1.0 wt% ClO4-",
      "UV-C peak flux recorded: 6.4 W/m2 (Sol 1241)",
      "Soil pH gradient map generated (10m resolution)",
      "MAVEN atmospheric escape data synchronized",
      "Thermal inertia data cross-validated with MRO/THEMIS",
    ],
    findings: [
      "Jezero delta deposits show elevated perchlorate concentration above global baseline.",
      "Daily thermal swing reaches ~70°C, strongly impacting protein folding stability.",
      "Surface UV-C flux remains a critical stressor for exposed cells.",
    ],
  },
  extremophile: {
    name: "Extremophile Screening",
    subtitle: "Extremophile Screening Agent",
    description: "Screens extremophile candidates for combined radiation, desiccation, and low-temperature tolerance profiles.",
    metricLabels: ["Candidate Species", "Genome Coverage", "Radiation Threshold", "Selection Confidence"],
    dataSourceNames: ["NCBI GenBank", "JGI IMG/M", "ExtremeDB", "UniProt Proteome"],
    logMessages: [
      "RecA recombinase activity scored for D. radiodurans R1",
      "Chroococcidiopsis dry-survival profile confirmed",
      "Halobacterium NRC-1 removed due to low perchlorate tolerance",
      "T. gammatolerans radiation tolerance validated",
      "Symbiotic candidate combinations generated",
    ],
    findings: [
      "D. radiodurans remains the strongest radiation-tolerant chassis candidate.",
      "Chroococcidiopsis is robust under simulated UV stress with shielding.",
      "A dual-strain architecture is favored for resilience and functional complementarity.",
    ],
  },
  "gene-func": {
    name: "Gene Function Mapping",
    subtitle: "Gene Function Mapping Agent",
    description: "Maps tolerance-related functional genes and operons, with focus on perchlorate reduction and stress responses.",
    metricLabels: ["Mapped Clusters", "Annotation Rate", "Operon Networks", "Cross-Species Conservation"],
    dataSourceNames: ["UniProt / Swiss-Prot", "KEGG Pathway", "NCBI Gene", "InterPro Domains"],
    logMessages: [
      "pcrABCD operon core localization completed",
      "nifHDK compatibility assessment in progress",
      "crt pathway mapped to UV-protection function",
      "recA promoter efficiency drop detected in low-temperature condition",
      "RuBisCO Form II low-CO2 affinity check completed",
    ],
    findings: [
      "pcrABCD remains the central perchlorate reduction cluster.",
      "crtBIYEP provides practical UV shielding via carotenoid pathway.",
      "A modular 4-block cassette architecture is recommended.",
    ],
  },
  "circuit-design": {
    name: "Circuit Design",
    subtitle: "Genetic Circuit Design Agent",
    description: "Builds sensing-response genetic logic for UV and perchlorate triggers with orthogonal transcription control.",
    metricLabels: ["Logic Gates", "Simulation Pass Rate", "iGEM Parts Reuse", "Orthogonality Score"],
    dataSourceNames: ["iGEM Registry", "SynBioHub", "SBOL Visual"],
    logMessages: [
      "UV toggle switch v3 simulation completed",
      "Promoter PrecA calibration indicates low-temp attenuation",
      "Perchlorate AND gate logic validated",
      "Carotenoid pathway positive feedback stability verified",
      "Orthogonal riboswitch candidate screening updated",
    ],
    findings: [
      "UV and perchlorate modules can be combined through orthogonal logic.",
      "Cold-inducible enhancer is required for low-temperature robustness.",
      "Kill-switch safeguards should be retained for ecological containment.",
    ],
  },
  "metab-compat": {
    name: "Metabolic Compatibility",
    subtitle: "Metabolic Compatibility Agent",
    description: "Runs FBA-based compatibility checks across engineered pathways, toxic intermediates, and host metabolism coupling.",
    metricLabels: ["Metabolic Reactions", "FBA Feasible Solutions", "Toxic Intermediates", "Biomass Flux"],
    dataSourceNames: ["BiGG Models", "KEGG Reaction", "BRENDA Kinetics", "MetaCyc"],
    logMessages: [
      "FBA iterative optimization running",
      "Chlorate intermediate toxicity threshold warning triggered",
      "Carbon flux redistribution evaluated",
      "ATP balance validation passed",
      "NAD+/NADH redox balance remains in acceptable range",
    ],
    findings: [
      "Perchlorate reduction pathway is feasible under current constraints.",
      "Chlorate accumulation must be actively controlled via pathway tuning.",
      "Dual-strain stoichiometric coupling improves overall viability.",
    ],
  },
  "struct-predict": {
    name: "Structure Prediction",
    subtitle: "Structure Prediction Agent",
    description: "Evaluates low-temperature structural stability using AlphaFold/ESM predictions and molecular dynamics trajectories.",
    metricLabels: ["Predicted Structures", "Average pLDDT", "Cold-Stable Mutations", "MD Duration"],
    dataSourceNames: ["AlphaFold DB", "PDB", "ESM Atlas", "Swiss-Model"],
    logMessages: [
      "PcrA model shows stable fold in low-temperature MD",
      "RecA G267S variant shows increased cold-condition activity",
      "CrtI local unfolding risk detected at low temperature",
      "OmpF antifreeze variant stability validated",
      "MD trajectory batch completed",
    ],
    findings: [
      "Core catalytic sites remain structurally preserved in lead models.",
      "Targeted mutation set increases cold-condition functional robustness.",
      "Most proposed stabilizing variants pass simulation checks.",
    ],
  },
};

const logLevelColor = {
  info: "text-primary",
  warn: "text-[#d4a843]",
  success: "text-tertiary",
  error: "text-secondary",
} as const;

const sourceStatusColor = {
  connected: "bg-tertiary",
  syncing: "bg-primary animate-pulse",
  offline: "bg-outline",
} as const;

const trendIcon = {
  up: ArrowUp,
  down: ArrowDown,
  stable: Minus,
} as const;

const trendColor = {
  up: "text-tertiary",
  down: "text-secondary",
  stable: "text-outline",
} as const;

const accentMap = {
  primary: {
    border: "border-l-primary",
    bg: "bg-primary/10",
    text: "text-primary",
    glow: "shadow-[0_0_30px_rgba(129,207,255,0.15)]",
  },
  secondary: {
    border: "border-l-secondary",
    bg: "bg-secondary/10",
    text: "text-secondary",
    glow: "shadow-[0_0_30px_rgba(255,180,161,0.15)]",
  },
  tertiary: {
    border: "border-l-tertiary",
    bg: "bg-tertiary/10",
    text: "text-tertiary",
    glow: "shadow-[0_0_30px_rgba(100,221,153,0.15)]",
  },
} as const;

function applyOverride(agent: AgentDetail, overrides: Record<string, AgentOverride>): AgentDetail {
  const ov = overrides[agent.id];
  if (!ov) return agent;

  return {
    ...agent,
    name: ov.name,
    subtitle: ov.subtitle ?? agent.subtitle,
    description: ov.description,
    metrics: agent.metrics.map((m, i) => ({
      ...m,
      label: ov.metricLabels[i] ?? m.label,
    })),
    dataSources: agent.dataSources.map((ds, i) => ({
      ...ds,
      name: ov.dataSourceNames?.[i] ?? ds.name,
    })),
    logs: agent.logs.map((log, i) => ({
      ...log,
      message: ov.logMessages?.[i] ?? log.message,
    })),
    findings: ov.findings ?? agent.findings,
  };
}

export default function DetailPanel({ agent, agentRun, onClose }: DetailPanelProps) {
  const { locale } = useLocale();
  const isZh = locale === "zh";
  const displayAgent = useMemo(
    () => (isZh ? applyOverride(agent, ZH_AGENT_OVERRIDES) : applyOverride(agent, EN_AGENT_OVERRIDES)),
    [agent, isZh]
  );
  const accent = accentMap[displayAgent.color];
  const Icon = displayAgent.icon;
  const scrollRef = useRef<HTMLDivElement>(null);

  const statusMap = {
    active: { label: isZh ? "运行中" : "Active", color: "bg-tertiary" },
    idle: { label: isZh ? "空闲" : "Idle", color: "bg-outline" },
    processing: { label: isZh ? "处理中" : "Processing", color: "bg-primary animate-pulse" },
  } as const;
  const status = statusMap[displayAgent.status];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [displayAgent.id]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 bg-background/75 z-50"
        onClick={onClose}
      />

      <motion.aside
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        drag="x"
        dragConstraints={{ left: 0 }}
        dragElastic={{ left: 0, right: 0.3 }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 80 || info.velocity.x > 400) onClose();
        }}
        className={`fixed right-0 top-0 h-full w-full max-w-[560px] z-50 bg-surface-container border-l border-outline-variant/15 ${accent.glow} flex flex-col`}
      >
        <div className="md:hidden absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className="w-1 h-10 rounded-full bg-outline-variant/50" />
        </div>

        <div className={`p-6 border-b border-outline-variant/15 border-l-4 ${accent.border}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${accent.bg} flex items-center justify-center`}>
                <Icon size={20} className={accent.text} />
              </div>
              <div>
                <h2 className="font-headline font-bold text-lg text-on-surface tracking-tight">{displayAgent.name}</h2>
                <p className="text-[11px] text-on-surface-variant font-headline tracking-wider uppercase">{displayAgent.subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-variant/50 transition-colors"
              aria-label={isZh ? "关闭详情面板" : "Close detail panel"}
            >
              <X size={18} className="text-on-surface-variant" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] font-headline tracking-widest uppercase text-on-surface-variant">
              <span className={`w-2 h-2 rounded-full ${status.color}`} />
              {status.label}
            </span>
            <span className="text-[10px] text-outline">|</span>
            <span className="text-[10px] font-mono text-outline">{displayAgent.id.toUpperCase()}</span>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6" style={{ touchAction: "pan-y" }}>
          <p className="text-sm text-on-surface-variant leading-relaxed">{displayAgent.description}</p>

          {/* === LLM 真实结果 === */}
          {agentRun?.output_data && !agentRun.output_data.error && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className={accent.text} />
                <h3 className="text-[10px] font-headline font-bold tracking-widest uppercase text-on-surface-variant">
                  {isZh ? "LLM 分析结果" : "LLM Analysis Results"}
                </h3>
                <span className={`text-[9px] px-2 py-0.5 rounded-full ${accent.bg} ${accent.text} font-headline uppercase`}>
                  {agentRun.status === "completed" ? (isZh ? "已完成" : "Completed") : agentRun.status}
                </span>
              </div>

              {/* LLM Findings */}
              {agentRun.output_data.findings?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-headline font-bold tracking-widest uppercase text-on-surface-variant mb-2">
                    {isZh ? "AI 发现" : "AI Findings"}
                  </h4>
                  <div className="space-y-2">
                    {agentRun.output_data.findings.map((f: string, i: number) => (
                      <div
                        key={`llm-finding-${i}`}
                        className={`text-xs text-on-surface leading-relaxed pl-3 border-l-2 border-l-tertiary py-1.5 bg-tertiary/5 rounded-r-lg`}
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LLM Risk Factors (EnvParse) */}
              {agentRun.output_data.risk_factors?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-headline font-bold tracking-widest uppercase text-on-surface-variant mb-2">
                    {isZh ? "风险因素" : "Risk Factors"}
                  </h4>
                  <div className="space-y-1.5">
                    {agentRun.output_data.risk_factors.slice(0, 5).map((r: string, i: number) => (
                      <div key={`risk-${i}`} className="text-[11px] text-secondary leading-relaxed pl-3 border-l-2 border-l-secondary/40 py-1">
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LLM Candidate Organisms (Extremophile) */}
              {agentRun.output_data.candidate_organisms?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-headline font-bold tracking-widest uppercase text-on-surface-variant mb-2">
                    {isZh ? "候选微生物" : "Candidate Organisms"}
                  </h4>
                  <div className="space-y-2">
                    {agentRun.output_data.candidate_organisms.map((c: any, i: number) => (
                      <div key={`cand-${i}`} className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/10">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-headline font-bold text-on-surface">{c.name}</span>
                          {c.score && <span className={`text-xs font-bold ${accent.text}`}>{(c.score * 100).toFixed(0)}%</span>}
                        </div>
                        {c.rationale && <p className="text-[11px] text-on-surface-variant leading-relaxed">{c.rationale}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LLM Gene Clusters (GeneFunc) */}
              {agentRun.output_data.gene_clusters?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-headline font-bold tracking-widest uppercase text-on-surface-variant mb-2">
                    {isZh ? "基因模块" : "Gene Modules"}
                  </h4>
                  <div className="space-y-2">
                    {agentRun.output_data.gene_clusters.map((g: any, i: number) => (
                      <div key={`gene-${i}`} className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/10">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-headline font-bold text-on-surface">{g.name}</span>
                          <span className="text-[10px] text-on-surface-variant">{g.function}</span>
                        </div>
                        {g.genes && <p className="text-[10px] font-mono text-primary/70">{g.genes.join(" → ")}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Separator */}
              <div className="border-t border-outline-variant/20 pt-2">
                <p className="text-[10px] text-outline text-center font-headline uppercase tracking-widest">
                  {isZh ? "以下为参考数据" : "Reference data below"}
                </p>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-[10px] font-headline font-bold tracking-widest uppercase text-on-surface-variant mb-3">{isZh ? "关键指标" : "Key Metrics"}</h3>
            <div className="grid grid-cols-2 gap-3">
              {displayAgent.metrics.map((m) => {
                const TrendIcon = m.trend ? trendIcon[m.trend] : null;
                const tColor = m.trend ? trendColor[m.trend] : "";
                return (
                  <div key={`${displayAgent.id}-${m.label}`} className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-outline font-headline uppercase">{m.label}</span>
                      {TrendIcon && <TrendIcon size={10} className={tColor} />}
                    </div>
                    <span className="text-lg font-headline font-bold text-on-surface">{m.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-headline font-bold tracking-widest uppercase text-on-surface-variant mb-3">{isZh ? "数据源连接" : "Data Sources"}</h3>
            <div className="space-y-2">
              {displayAgent.dataSources.map((ds) => (
                <div key={ds.id} className="flex items-center justify-between px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${sourceStatusColor[ds.status]}`} />
                    <span className="text-xs text-on-surface">{ds.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-outline">{ds.id}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-headline font-bold tracking-widest uppercase text-on-surface-variant mb-3">{isZh ? "活动日志" : "Activity Log"}</h3>
            <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/10 p-3 space-y-2">
              {displayAgent.logs.map((log, i) => (
                <div key={`${displayAgent.id}-log-${i}`} className="flex gap-2 text-[11px]">
                  <span className="text-outline font-mono shrink-0">{log.time}</span>
                  <Circle size={6} className={`${logLevelColor[log.level]} shrink-0 mt-1`} fill="currentColor" />
                  <span className={`${logLevelColor[log.level]} leading-snug`}>{log.message}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-headline font-bold tracking-widest uppercase text-on-surface-variant mb-3">{isZh ? "核心发现" : "Key Findings"}</h3>
            <div className="space-y-2">
              {displayAgent.findings.map((f, i) => (
                <div key={`${displayAgent.id}-finding-${i}`} className={`text-xs text-on-surface-variant leading-relaxed pl-3 border-l-2 ${accent.border} py-1`}>
                  {f}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-headline font-bold tracking-widest uppercase text-on-surface-variant mb-3">{isZh ? "参考文献" : "References"}</h3>
            <div className="space-y-3">
              {displayAgent.references.map((ref, i) => (
                <div key={`${displayAgent.id}-ref-${i}`} className="flex gap-2 group">
                  <ExternalLink size={12} className="text-outline shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                  <div className="text-[11px] text-on-surface-variant leading-snug">
                    <span className="text-on-surface">{ref.authors}</span>{" "}
                    <span className="italic">"{ref.title}"</span>{" "}
                    <span className={accent.text}>{ref.journal}</span> ({ref.year})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-outline-variant/15 flex gap-3">
          <button className={`flex-1 py-2.5 ${accent.bg} ${accent.text} font-headline font-bold text-xs rounded-lg uppercase tracking-widest hover:brightness-125 transition-all border border-current/20`}>
            {isZh ? "查看完整报告" : "View Full Report"}
          </button>
          <button className="px-4 py-2.5 border border-outline-variant/30 text-on-surface-variant font-headline font-bold text-xs rounded-lg uppercase tracking-widest hover:bg-surface-container-high transition-all">
            {isZh ? "导出" : "Export"}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
