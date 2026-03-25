import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Badge, DetailPanel } from "../components";
import { agentDetails } from "../data/agentDetails";
import { useLocale } from "../i18n/context";
import { orchestrateAgents, getAgentRuns } from "../api/agents";
import type { AgentRun } from "../api/agents";
import { stagger, fadeSlideUp, viewTransition } from "../lib/motion";

import ConstraintBar from "../components/orchestrator/ConstraintBar";
import AgentStatusBar from "../components/orchestrator/AgentStatusBar";
import OrchestratorCore from "../components/orchestrator/OrchestratorCore";
import AgentGrid from "../components/orchestrator/AgentGrid";
import VerificationSection from "../components/orchestrator/VerificationSection";
import DesignSpecBar from "../components/orchestrator/DesignSpecBar";

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

  // 实时跳动的系统数据
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

  return (
    <motion.div variants={viewTransition} initial="initial" animate="animate" exit="exit" className="flex-1">
      {/* 页面头部 */}
      <motion.section
        variants={stagger(70)}
        initial="hidden"
        animate="show"
        className="mb-8 md:mb-12 pt-2 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6"
      >
        <div className="space-y-4">
          <motion.div variants={fadeSlideUp} className="flex gap-2">
            <Badge color="primary">{isZh ? "合成生物学" : "Synthetic Biology"}</Badge>
            <Badge color="secondary">{isZh ? "行星地质" : "Planetary Geology"}</Badge>
            <Badge color="tertiary">{isZh ? "多智能体 AI" : "Multi-Agent AI"}</Badge>
          </motion.div>
          <motion.h2
            variants={fadeSlideUp}
            className="text-3xl md:text-5xl font-black font-headline text-on-background tracking-tighter max-w-2xl leading-none"
          >
            {isZh ? "生物群落合成" : "Biota Synthesis"}{" "}
            <span className="text-primary">{isZh ? "协调者" : "Orchestrator"}</span>
          </motion.h2>
        </div>

        <motion.div
          variants={fadeSlideUp}
          className="glass-panel p-4 rounded-xl flex items-center justify-around md:justify-start w-full md:w-auto gap-0 md:gap-6 border-l-4 border-l-tertiary"
        >
          <div className="text-center md:text-right">
            <p className="text-[10px] font-headline text-on-surface-variant uppercase tracking-widest">
              {isZh ? "大气压力" : "Atmospheric Pressure"}
            </p>
            <p className="text-xl font-headline font-bold text-tertiary">0.61 kPa</p>
          </div>
          <div className="h-10 w-px bg-outline-variant/20" />
          <div className="text-center md:text-right">
            <p className="text-[10px] font-headline text-on-surface-variant uppercase tracking-widest">
              {isZh ? "辐射通量" : "Radiation Flux"}
            </p>
            <p className="text-xl font-headline font-bold text-secondary">450 mSv/yr</p>
          </div>
        </motion.div>
      </motion.section>

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

      <AgentStatusBar
        isZh={isZh}
        isOrchestrating={isOrchestrating}
        orchestrationError={orchestrationError}
        agentRuns={agentRuns}
      />

      <OrchestratorCore isZh={isZh} stats={stats} />

      <AgentGrid isZh={isZh} onSelectAgent={setSelectedAgent} />

      <VerificationSection isZh={isZh} />

      <DesignSpecBar isZh={isZh} onNavigateOutput={() => navigate("/output")} />

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
