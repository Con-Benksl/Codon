import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Badge, DetailPanel } from "../components";
import { agentDetails } from "../data/agentDetails";
import { useLocale } from "../i18n/context";
import { orchestrateAgents, getAgentRuns } from "../api/agents";
import type { AgentRun } from "../api/agents";
import { viewTransition } from "../lib/motion";

import ConstraintBar from "../components/orchestrator/ConstraintBar";
import VerificationSection from "../components/orchestrator/VerificationSection";
import DesignSpecBar from "../components/orchestrator/DesignSpecBar";
import AgentPipeline from "../components/orchestrator/AgentPipeline";
import RequirementsChat from "../components/orchestrator/RequirementsChat";
import {
  Play, Cpu, AlertCircle, CheckCircle2, Loader2,
  ChevronDown, MessageSquare,
} from "lucide-react";

const DEFAULT_CONSTRAINTS = {
  zh: ["UV-B/C 辐射暴露", "高氯酸盐 (ClO4-)", "95% CO2 饱和度", "Fe2O3 粉尘浓度"],
  en: ["UV-B/C exposure", "Perchlorate (ClO4-)", "95% CO2 saturation", "Fe2O3 dust density"],
} as const;

export default function OrchestratorView() {
  const { locale } = useLocale();
  const isZh = locale === "zh";
  const navigate = useNavigate();

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const activeAgent = selectedAgent ? agentDetails[selectedAgent] : null;

  const [constraints, setConstraints] = useState<string[]>(() => [...DEFAULT_CONSTRAINTS[locale]]);
  const [inputValue, setInputValue] = useState("");

  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [orchestrationError, setOrchestrationError] = useState<string | null>(null);
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);

  const [stats, setStats] = useState({ nodes: 1240, confidence: 98.4, latency: 14 });
  const [chatCollapsed, setChatCollapsed] = useState(false);

  const getActiveProjectId = () => {
    const raw = localStorage.getItem("active_project_id");
    const parsed = raw ? Number(raw) : NaN;
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  };

  const getAgentRunResult = (agentId: string) => agentRuns.find((r) => r.agent_id === agentId);

  // 语言切换时重置默认约束
  useEffect(() => {
    const allDefaults = [...DEFAULT_CONSTRAINTS.zh, ...DEFAULT_CONSTRAINTS.en];
    setConstraints((prev) => {
      if (prev.length === 0 || prev.every((item) => allDefaults.includes(item))) {
        return [...DEFAULT_CONSTRAINTS[locale]];
      }
      return prev;
    });
  }, [locale]);

  // 系统状态跳动
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

  const handleOrchestrate = async () => {
    setIsOrchestrating(true);
    setOrchestrationError(null);
    setAgentRuns([]);

    const activeProjectId = getActiveProjectId();
    if (!activeProjectId) {
      setIsOrchestrating(false);
      setOrchestrationError(
        isZh
          ? '请先在"我的项目"中选择一个项目，再启动编排。'
          : "Please select a project in Projects before running orchestration.",
      );
      navigate("/projects");
      return;
    }

    try {
      const result = await orchestrateAgents({
        project_id: activeProjectId,
        config: { location: "Jezero Crater", constraints },
      });
      const pid = result?.project_id ?? activeProjectId;
      if (result?.agent_runs?.length) {
        const runs = await getAgentRuns(pid);
        const runIds = new Set(result.agent_runs.map((r) => r.id));
        setAgentRuns(runs.filter((r) => runIds.has(r.id)));
      }
    } catch (err: any) {
      setOrchestrationError(err?.response?.data?.detail || err?.message || "编排失败");
    } finally {
      setIsOrchestrating(false);
    }
  };

  const addConstraint = () => {
    const val = inputValue.trim();
    if (val && !constraints.includes(val)) setConstraints((prev) => [...prev, val]);
    setInputValue("");
  };

  const handleConstraintsExtracted = (extracted: string[]) => {
    setConstraints((prev) => {
      const merged = [...new Set([...prev, ...extracted])];
      return merged;
    });
  };

  const completedCount = agentRuns.filter((r) => r.status === "completed").length;
  const allDone = agentRuns.length === 6 && completedCount === 6;

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 min-h-full"
    >
      {/* ───── 页面头部 ───── */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            <Badge color="primary">{isZh ? "合成生物学" : "Synthetic Biology"}</Badge>
            <Badge color="secondary">{isZh ? "行星地质" : "Planetary Geology"}</Badge>
            <Badge color="tertiary">{isZh ? "多智能体 AI" : "Multi-Agent AI"}</Badge>
          </div>
          <h2 className="text-3xl md:text-4xl font-black font-headline text-on-background tracking-tighter leading-none">
            {isZh ? "生物群落合成" : "Biota Synthesis"}{" "}
            <span className="text-primary">{isZh ? "协调者" : "Orchestrator"}</span>
          </h2>
        </div>

        {/* 系统状态 */}
        <div className="flex items-center gap-4 glass-panel px-4 py-3 rounded-xl border-l-4 border-l-tertiary shrink-0">
          {[
            { labelZh: "大气压力", labelEn: "Atm Pressure", val: "0.61 kPa", color: "text-tertiary" },
            { labelZh: "辐射通量", labelEn: "Radiation Flux", val: "450 mSv/yr", color: "text-secondary" },
            { labelZh: "置信度", labelEn: "Confidence", val: `${stats.confidence}%`, color: "text-primary" },
          ].map((s, i) => (
            <div key={i} className={i > 0 ? "pl-4 border-l border-outline-variant/15" : ""}>
              <p className="text-[9px] font-headline text-on-surface-variant uppercase tracking-widest">
                {isZh ? s.labelZh : s.labelEn}
              </p>
              <motion.p
                key={s.val}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                className={`text-base font-headline font-bold ${s.color}`}
              >
                {s.val}
              </motion.p>
            </div>
          ))}
        </div>
      </motion.header>

      {/* ───── 主体：左右分栏 ───── */}
      <div className="flex flex-col lg:flex-row gap-5 mb-6">
        {/* ── 左栏：需求对话 ── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className={`relative glass-panel rounded-2xl border border-outline-variant/20 flex flex-col transition-all duration-300 h-80 lg:h-[520px] ${
            chatCollapsed ? "lg:w-12" : "lg:w-80 xl:w-96"
          } shrink-0`}
        >
          {chatCollapsed ? (
            <button
              onClick={() => setChatCollapsed(false)}
              className="flex flex-col items-center gap-2 py-4 px-2 w-full h-full hover:bg-primary/5 transition-colors"
              title={isZh ? "展开对话" : "Expand chat"}
            >
              <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <MessageSquare size={10} className="text-primary" />
              </div>
            </button>
          ) : (
            <>
              <RequirementsChat
                isZh={isZh}
                onRequirementsUpdate={() => {}}
                onConstraintsExtracted={handleConstraintsExtracted}
              />
              {/* 折叠按钮（在 RequirementsChat 头部右侧，通过 header 内 button 触发） */}
              <button
                onClick={() => setChatCollapsed(true)}
                className="hidden lg:flex absolute top-3 right-2 w-5 h-5 rounded-md items-center justify-center text-on-surface-variant/30 hover:text-on-surface hover:bg-surface-container transition-colors z-10"
                title={isZh ? "折叠对话" : "Collapse chat"}
              >
                <ChevronDown size={10} className="rotate-90" />
              </button>
            </>
          )}
        </motion.div>

        {/* ── 右栏：约束 + Pipeline + 启动控制 ── */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex-1 flex flex-col gap-4 min-w-0"
        >
          {/* 约束标签条 */}
          <div className="glass-panel rounded-2xl p-4 border border-outline-variant/15">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-4 rounded-full bg-secondary/60" />
              <p className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant/70">
                {isZh ? "环境约束" : "Environment Constraints"}
              </p>
            </div>
            <ConstraintBar
              isZh={isZh}
              constraints={constraints}
              inputValue={inputValue}
              isOrchestrating={isOrchestrating}
              hasRuns={agentRuns.length > 0}
              onInputChange={setInputValue}
              onAddConstraint={addConstraint}
              onRemoveConstraint={(tag) => setConstraints((prev) => prev.filter((c) => c !== tag))}
              onOrchestrate={handleOrchestrate}
            />
          </div>

          {/* Agent Pipeline 可视化 */}
          <div className="glass-panel rounded-2xl p-4 border border-outline-variant/15">
            <AgentPipeline
              isZh={isZh}
              agentRuns={agentRuns}
              isOrchestrating={isOrchestrating}
              onSelectAgent={setSelectedAgent}
            />
          </div>

          {/* 启动按钮 + 状态 */}
          <div className="flex flex-col gap-3">
            {/* 错误 */}
            <AnimatePresence>
              {orchestrationError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-3 rounded-xl border border-secondary/30 bg-secondary/8 px-4 py-3"
                >
                  <AlertCircle size={15} className="text-secondary mt-0.5 shrink-0" />
                  <p className="text-sm text-secondary font-headline">{orchestrationError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 完成状态 */}
            <AnimatePresence>
              {allDone && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3"
                >
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <p className="text-sm text-emerald-400 font-headline flex-1">
                    {isZh ? `全部 6 个 Agent 完成 · 设计方案已生成` : `All 6 agents completed · Design ready`}
                  </p>
                  <button
                    onClick={() => navigate("/output")}
                    className="text-[11px] font-headline text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors uppercase tracking-wider"
                  >
                    {isZh ? "查看输出" : "View Output"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 主启动按钮 */}
            <motion.button
              whileHover={{ scale: isOrchestrating ? 1 : 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleOrchestrate}
              disabled={isOrchestrating}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-headline font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: isOrchestrating
                  ? "rgba(78,159,217,0.08)"
                  : "linear-gradient(135deg, rgba(78,159,217,0.15), rgba(78,159,217,0.05))",
                border: "1px solid rgba(78,159,217,0.35)",
                color: "var(--color-primary)",
                boxShadow: isOrchestrating ? "none" : "0 0 24px rgba(78,159,217,0.12)",
              }}
            >
              {isOrchestrating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isZh ? "Agent 管线运行中...（预计 2-5 分钟）" : "Pipeline running... (~2-5 min)"}
                </>
              ) : (
                <>
                  <Cpu size={16} />
                  <Play size={14} />
                  {isZh ? "启动全部 Agent 管线" : "Launch All Agents Pipeline"}
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* ───── 系统概览：协调者核心（精简版） ───── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-panel rounded-2xl p-5 mb-6 border border-primary/15 border-t-2 border-t-primary/40"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 relative">
              <Cpu size={22} className="text-primary" />
              <motion.div
                className="absolute inset-0 rounded-2xl border border-primary/30"
                animate={{ opacity: [0.5, 0.1, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            </div>
            <div>
              <h4 className="font-headline font-bold text-primary text-base tracking-tight">
                {isZh ? "协调者智能体" : "Orchestrator Agent"}
              </h4>
              <p className="text-[10px] text-on-surface-variant font-headline tracking-[0.15em] uppercase mt-0.5">
                {isZh ? "多智能体任务分解引擎 · Alpha-01" : "Multi-agent task decomposition · Alpha-01"}
              </p>
              <p className="text-xs text-on-surface-variant/70 font-body mt-1.5 italic max-w-lg">
                {isZh
                  ? "正在初始化火星岩石自养生物设计的深度任务分解。主要目标：高氯酸盐还原代谢途径 + 太阳辐射防护机制。"
                  : "Initializing deep task decomposition for martian lithoautotrophic design. Target: perchlorate reduction + radiation shielding."}
              </p>
            </div>
          </div>

          <div className="flex gap-4 shrink-0">
            {([
              { keyZh: "逻辑节点", keyEn: "Nodes", val: stats.nodes.toLocaleString() },
              { keyZh: "置信度", keyEn: "Confidence", val: `${stats.confidence}%` },
              { keyZh: "延迟", keyEn: "Latency", val: `${stats.latency}ms` },
            ] as const).map((s, i) => (
              <div key={i} className={i > 0 ? "pl-4 border-l border-outline-variant/20 text-center" : "text-center"}>
                <span className="block text-[9px] text-on-surface-variant/50 font-headline uppercase tracking-wider">
                  {isZh ? s.keyZh : s.keyEn}
                </span>
                <motion.span
                  key={s.val}
                  initial={{ opacity: 0.4, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-base font-headline font-bold text-on-surface block mt-0.5"
                >
                  {s.val}
                </motion.span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ───── 验证层 + 输出按钮 ───── */}
      <VerificationSection isZh={isZh} />
      <DesignSpecBar isZh={isZh} onNavigateOutput={() => navigate("/output")} />

      {/* ───── Agent 详情面板 ───── */}
      <AnimatePresence>
        {activeAgent && (
          <DetailPanel
            agent={activeAgent}
            agentRun={selectedAgent ? getAgentRunResult(selectedAgent) : undefined}
            onClose={() => setSelectedAgent(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
