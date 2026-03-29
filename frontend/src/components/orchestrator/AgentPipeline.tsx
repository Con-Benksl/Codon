import { motion, AnimatePresence } from "motion/react";
import { Satellite, Cpu, ShieldCheck, CheckCircle2, Loader2, AlertCircle, Clock } from "lucide-react";
import type { AgentRun } from "../../api/agents";

interface PipelineStep {
  id: string;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  dataOutZh: string;
  dataOutEn: string;
  icon: typeof Satellite;
  color: string;
  glowColor: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "env-agent",
    nameZh: "环境智能体",
    nameEn: "Environment Agent",
    descZh: "分析火星条件 · 筛选物种",
    descEn: "Analyze Mars · Screen Species",
    dataOutZh: "约束 JSON",
    dataOutEn: "Constraint JSON",
    icon: Satellite,
    color: "#ffb4a1",
    glowColor: "rgba(255,180,161,0.3)",
  },
  {
    id: "design-agent",
    nameZh: "设计智能体",
    nameEn: "Design Agent",
    descZh: "生成基因回路 · 代谢分析",
    descEn: "Generate Circuits · Metabolic FBA",
    dataOutZh: "设计方案",
    dataOutEn: "Design Schema",
    icon: Cpu,
    color: "#81cfff",
    glowColor: "rgba(129,207,255,0.3)",
  },
  {
    id: "verify-agent",
    nameZh: "验证智能体",
    nameEn: "Verification Agent",
    descZh: "结构预测 · 评分输出",
    descEn: "Struct Predict · Score Output",
    dataOutZh: "验证报告",
    dataOutEn: "Verification Report",
    icon: ShieldCheck,
    color: "#64dd99",
    glowColor: "rgba(100,221,153,0.3)",
  },
];

function getStatus(id: string, agentRuns: AgentRun[], isOrchestrating: boolean) {
  if (!isOrchestrating && agentRuns.length === 0) return "idle";
  const run = agentRuns.find((r) => r.agent_id === id);
  if (run) return run.status;
  if (isOrchestrating) return "running";
  return "idle";
}

interface Props {
  isZh: boolean;
  agentRuns: AgentRun[];
  isOrchestrating: boolean;
  onSelectAgent: (id: string) => void;
}

export default function AgentPipeline({ isZh, agentRuns, isOrchestrating, onSelectAgent }: Props) {
  const completedCount = agentRuns.filter((r) => r.status === "completed").length;
  const pipelineProgress = Math.round((completedCount / 3) * 100);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/40" />
          <p className="text-[10px] font-headline uppercase tracking-[0.2em] text-on-surface-variant/60">
            {isZh ? "三段式执行管道" : "3-Stage Pipeline"}
          </p>
        </div>
        {agentRuns.length > 0 && (
          <span className="text-[10px] font-data text-primary">{pipelineProgress}%</span>
        )}
      </div>

      {/* Pipeline steps */}
      <div className="flex flex-col gap-0">
        {PIPELINE_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const status = getStatus(step.id, agentRuns, isOrchestrating);
          const isRunning = status === "running";
          const isCompleted = status === "completed";
          const isFailed = status === "failed";
          const isIdle = status === "idle";

          return (
            <div key={step.id}>
              <motion.button
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.12, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ x: 4, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelectAgent(step.id)}
                className={`w-full text-left glass-panel rounded-xl p-4 cursor-pointer transition-all group relative overflow-hidden`}
                style={{
                  borderLeft: `3px solid ${isIdle ? "rgba(63,72,78,0.4)" : step.color}`,
                  boxShadow: (isRunning || isCompleted) ? `0 0 20px ${step.glowColor}` : "none",
                }}
              >
                {/* Running pulse overlay */}
                {isRunning && (
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{ background: `${step.color}08` }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}

                <div className="relative z-10 flex items-center gap-4">
                  <div
                    className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-data text-xs font-bold"
                    style={{
                      background: `${step.color}15`,
                      color: isIdle ? "rgba(191,200,208,0.3)" : step.color,
                      border: `1px solid ${isIdle ? "rgba(63,72,78,0.3)" : `${step.color}40`}`,
                    }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </div>

                  <div
                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: `${step.color}12`,
                      border: `1px solid ${step.color}25`,
                    }}
                  >
                    <Icon size={16} style={{ color: isIdle ? "rgba(191,200,208,0.3)" : step.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-headline font-bold uppercase tracking-[0.06em] mb-0.5"
                      style={{ color: isIdle ? "rgba(224,227,232,0.5)" : "rgb(224,227,232)" }}
                    >
                      {isZh ? step.nameZh : step.nameEn}
                    </p>
                    <p className="text-[9px] text-on-surface-variant/50 font-body">
                      {isZh ? step.descZh : step.descEn}
                    </p>
                  </div>

                  <div
                    className="shrink-0 hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-headline uppercase tracking-widest"
                    style={{
                      background: `${step.color}10`,
                      border: `1px solid ${step.color}25`,
                      color: isIdle ? "rgba(191,200,208,0.3)" : step.color,
                    }}
                  >
                    → {isZh ? step.dataOutZh : step.dataOutEn}
                  </div>

                  <div className="shrink-0">
                    {isRunning && <Loader2 size={14} className="animate-spin" style={{ color: step.color }} />}
                    {isCompleted && <CheckCircle2 size={14} className="text-tertiary" />}
                    {isFailed && <AlertCircle size={14} className="text-secondary" />}
                    {isIdle && <div className="w-3 h-3 rounded-full border border-outline-variant/30" />}
                  </div>
                </div>
              </motion.button>

              {/* Connector arrow between steps */}
              {idx < PIPELINE_STEPS.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.12 + 0.3 }}
                  className="flex items-center gap-2 pl-8 py-1"
                >
                  <svg width="120" height="20" className="overflow-visible">
                    <line x1="0" y1="10" x2="110" y2="10" stroke="rgba(63,72,78,0.4)" strokeWidth="1" />
                    <line
                      x1="0"
                      y1="10"
                      x2="110"
                      y2="10"
                      stroke={PIPELINE_STEPS[idx].color}
                      strokeWidth="1.5"
                      strokeDasharray="8 12"
                      opacity="0.6"
                      className="pipeline-flow"
                    />
                    <polygon
                      points="110,6 118,10 110,14"
                      fill={PIPELINE_STEPS[idx + 1].color}
                      opacity="0.6"
                    />
                  </svg>
                  <span
                    className="text-[8px] font-headline tracking-widest uppercase opacity-40"
                    style={{ color: PIPELINE_STEPS[idx].color }}
                  >
                    {isZh ? "传递" : "PASS"}
                  </span>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall progress bar */}
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
                {isZh ? "整体进度" : "Pipeline Progress"}
              </span>
              <span className="text-[10px] font-data text-primary">{pipelineProgress}%</span>
            </div>
            <div className="h-1 rounded-full bg-surface-container-high overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-secondary via-primary to-tertiary"
                initial={{ width: "0%" }}
                animate={{ width: `${pipelineProgress}%` }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Idle state */}
      {!isOrchestrating && agentRuns.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
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
