import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FlaskConical, Bug, Dna, Terminal, Network, Layers,
  CheckCircle2, Loader2, Clock, AlertCircle, ArrowRight,
  ChevronRight,
} from "lucide-react";
import type { AgentRun } from "../../api/agents";

interface PipelineNode {
  id: string;
  nameZh: string;
  nameEn: string;
  icon: React.ElementType;
  color: string;
  glowColor: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  layer: "analysis" | "design";
  position: number; // 0-based within layer
  descZh: string;
  descEn: string;
}

const PIPELINE_NODES: PipelineNode[] = [
  {
    id: "env-parse",
    nameZh: "环境解析",
    nameEn: "Env Parser",
    icon: FlaskConical,
    color: "#f59e0b",
    glowColor: "rgba(245,158,11,0.3)",
    borderColor: "border-amber-500/40",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-400",
    layer: "analysis",
    position: 0,
    descZh: "解析火星环境约束",
    descEn: "Parse Mars constraints",
  },
  {
    id: "extremophile",
    nameZh: "极端微生物",
    nameEn: "Extremophile",
    icon: Bug,
    color: "#10b981",
    glowColor: "rgba(16,185,129,0.3)",
    borderColor: "border-emerald-500/40",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-400",
    layer: "analysis",
    position: 1,
    descZh: "筛选耐受候选物种",
    descEn: "Screen tolerant species",
  },
  {
    id: "gene-func",
    nameZh: "基因映射",
    nameEn: "Gene Mapper",
    icon: Dna,
    color: "#06b6d4",
    glowColor: "rgba(6,182,212,0.3)",
    borderColor: "border-cyan-500/40",
    bgColor: "bg-cyan-500/10",
    textColor: "text-cyan-400",
    layer: "analysis",
    position: 2,
    descZh: "映射功能基因簇",
    descEn: "Map gene clusters",
  },
  {
    id: "circuit-design",
    nameZh: "回路设计",
    nameEn: "Circuit Design",
    icon: Terminal,
    color: "#4e9fd9",
    glowColor: "rgba(78,159,217,0.3)",
    borderColor: "border-primary/40",
    bgColor: "bg-primary/10",
    textColor: "text-primary",
    layer: "design",
    position: 0,
    descZh: "构建基因逻辑回路",
    descEn: "Build genetic circuits",
  },
  {
    id: "metab-compat",
    nameZh: "代谢兼容",
    nameEn: "Metab Compat",
    icon: Network,
    color: "#8b5cf6",
    glowColor: "rgba(139,92,246,0.3)",
    borderColor: "border-violet-500/40",
    bgColor: "bg-violet-500/10",
    textColor: "text-violet-400",
    layer: "design",
    position: 1,
    descZh: "验证代谢通量平衡",
    descEn: "Validate flux balance",
  },
  {
    id: "struct-predict",
    nameZh: "结构预测",
    nameEn: "Struct Predict",
    icon: Layers,
    color: "#f97316",
    glowColor: "rgba(249,115,22,0.3)",
    borderColor: "border-orange-500/40",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-400",
    layer: "design",
    position: 2,
    descZh: "预测蛋白质折叠结构",
    descEn: "Predict protein folding",
  },
];

function getNodeStatus(nodeId: string, agentRuns: AgentRun[], isOrchestrating: boolean) {
  if (!isOrchestrating && agentRuns.length === 0) return "idle";
  const run = agentRuns.find((r) => r.agent_id === nodeId);
  if (run) return run.status;
  if (isOrchestrating) return "running";
  return "idle";
}

interface NodeCardProps {
  node: PipelineNode;
  status: string;
  isZh: boolean;
  onSelect: (id: string) => void;
  delay: number;
}

function NodeCard({ node, status, isZh, onSelect, delay }: NodeCardProps) {
  const Icon = node.icon;
  const isRunning = status === "running";
  const isCompleted = status === "completed";
  const isFailed = status === "failed";

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(node.id)}
      className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border ${node.borderColor} ${node.bgColor} cursor-pointer transition-all duration-200 group min-w-[88px]`}
      style={{
        boxShadow: isRunning || isCompleted ? `0 0 20px ${node.glowColor}` : "none",
      }}
    >
      {/* 运行时脉冲圈 */}
      {isRunning && (
        <motion.div
          className="absolute inset-0 rounded-2xl border"
          style={{ borderColor: node.color }}
          animate={{ opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* 状态指示 */}
      <div className="absolute -top-1.5 -right-1.5">
        {isRunning && (
          <div className="w-4 h-4 rounded-full bg-background flex items-center justify-center">
            <Loader2 size={10} className="animate-spin" style={{ color: node.color }} />
          </div>
        )}
        {isCompleted && (
          <div className="w-4 h-4 rounded-full bg-background flex items-center justify-center">
            <CheckCircle2 size={10} className="text-emerald-400" />
          </div>
        )}
        {isFailed && (
          <div className="w-4 h-4 rounded-full bg-background flex items-center justify-center">
            <AlertCircle size={10} className="text-red-400" />
          </div>
        )}
        {status === "idle" && (
          <div className="w-3 h-3 rounded-full border border-outline-variant/30 bg-surface-container" />
        )}
      </div>

      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center ${node.bgColor} border ${node.borderColor}`}
      >
        <Icon size={16} style={{ color: node.color }} />
      </div>

      <div className="text-center">
        <p className={`text-[10px] font-headline font-bold uppercase tracking-tight leading-tight ${node.textColor}`}>
          {isZh ? node.nameZh : node.nameEn}
        </p>
        <p className="text-[9px] text-on-surface-variant/50 font-body mt-0.5 leading-tight hidden group-hover:block">
          {isZh ? node.descZh : node.descEn}
        </p>
      </div>
    </motion.button>
  );
}

interface Props {
  isZh: boolean;
  agentRuns: AgentRun[];
  isOrchestrating: boolean;
  onSelectAgent: (id: string) => void;
}

export default function AgentPipeline({ isZh, agentRuns, isOrchestrating, onSelectAgent }: Props) {
  const analysisNodes = PIPELINE_NODES.filter((n) => n.layer === "analysis");
  const designNodes = PIPELINE_NODES.filter((n) => n.layer === "design");

  const completedCount = agentRuns.filter((r) => r.status === "completed").length;
  const failedCount = agentRuns.filter((r) => r.status === "failed").length;

  return (
    <div className="flex flex-col gap-4">
      {/* 管道标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 w-8 bg-gradient-to-r from-transparent to-secondary/40" />
          <p className="text-[10px] font-headline uppercase tracking-[0.2em] text-on-surface-variant/60">
            {isZh ? "Agent 执行管道" : "Agent Pipeline"}
          </p>
        </div>
        {agentRuns.length > 0 && (
          <div className="flex items-center gap-2 text-[10px] font-headline">
            {completedCount > 0 && (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 size={10} /> {completedCount}
              </span>
            )}
            {failedCount > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <AlertCircle size={10} /> {failedCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 分析层 */}
      <div className="glass-panel rounded-2xl p-4 border border-outline-variant/15">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-4 rounded-full bg-secondary/60" />
          <p className="text-[10px] font-headline uppercase tracking-widest text-secondary/70">
            {isZh ? "分析层" : "Analysis Layer"}
          </p>
          <div className="flex-1 h-px bg-secondary/10" />
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          {analysisNodes.map((node, idx) => (
            <React.Fragment key={node.id}>
              <NodeCard
                node={node}
                status={getNodeStatus(node.id, agentRuns, isOrchestrating)}
                isZh={isZh}
                onSelect={onSelectAgent}
                delay={idx * 0.08}
              />
              {idx < analysisNodes.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.08 + 0.3 }}
                  className="flex items-center gap-0.5 shrink-0"
                >
                  <div className="h-px w-6 bg-gradient-to-r from-secondary/30 to-secondary/60" />
                  <ChevronRight size={10} className="text-secondary/50" />
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 层间连接 */}
      <div className="flex justify-center relative">
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 32, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-px h-6 bg-gradient-to-b from-secondary/50 to-primary/50" />
          <ArrowRight size={12} className="text-primary/50 rotate-90" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-lg border border-primary/15 bg-primary/5"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[9px] font-headline text-primary/60 uppercase tracking-wider">
            {isZh ? "数据流转" : "Data Flow"}
          </span>
        </motion.div>
      </div>

      {/* 设计层 */}
      <div className="glass-panel rounded-2xl p-4 border border-outline-variant/15">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-4 rounded-full bg-primary/60" />
          <p className="text-[10px] font-headline uppercase tracking-widest text-primary/70">
            {isZh ? "设计层" : "Design Layer"}
          </p>
          <div className="flex-1 h-px bg-primary/10" />
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          {designNodes.map((node, idx) => (
            <React.Fragment key={node.id}>
              <NodeCard
                node={node}
                status={getNodeStatus(node.id, agentRuns, isOrchestrating)}
                isZh={isZh}
                onSelect={onSelectAgent}
                delay={0.4 + idx * 0.08}
              />
              {idx < designNodes.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + idx * 0.08 + 0.3 }}
                  className="flex items-center gap-0.5 shrink-0"
                >
                  <div className="h-px w-6 bg-gradient-to-r from-primary/30 to-primary/60" />
                  <ChevronRight size={10} className="text-primary/50" />
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 进度条 */}
      <AnimatePresence>
        {(isOrchestrating || agentRuns.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-1.5"
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-headline text-on-surface-variant/60 uppercase tracking-wider">
                {isZh ? "整体进度" : "Overall Progress"}
              </span>
              <span className="text-[10px] font-headline text-primary">
                {Math.round((completedCount / 6) * 100)}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-surface-container-high overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-secondary via-primary to-violet-400"
                initial={{ width: "0%" }}
                animate={{ width: `${(completedCount / 6) * 100}%` }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 空状态提示 */}
      {!isOrchestrating && agentRuns.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-outline-variant/20 justify-center"
        >
          <Clock size={12} className="text-on-surface-variant/30" />
          <p className="text-[10px] text-on-surface-variant/40 font-headline uppercase tracking-wider">
            {isZh ? "等待启动 · 点击 Agent 查看详情" : "Awaiting launch · Click agent for details"}
          </p>
        </motion.div>
      )}
    </div>
  );
}
