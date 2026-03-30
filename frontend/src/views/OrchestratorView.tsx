import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../i18n/context";
import { orchestrateAgents, getAgentRuns } from "../api/agents";
import type { AgentRun } from "../api/agents";
import { viewTransition, stagger, cardSlideIn, glassEntrance } from "../lib/motion";
import AgentCard from "../components/nexus/AgentCard";
import NexusSphere from "../components/nexus/NexusSphere";
import Icon from "../components/Icon";

const AGENTS_ZH = [
  { name: "Agent Alpha", subtitle: "环境解析智能体", status: "active" as const, uptimeLabel: "运行", uptimeValue: "47h 12m", metricLabel: "同步率", metricValue: "99.2%", iconName: "psychology" },
  { name: "Agent Beta", subtitle: "极端微生物筛选", status: "standby" as const, uptimeLabel: "运行", uptimeValue: "—", metricLabel: "就绪", metricValue: "IDLE", iconName: "biotech" },
  { name: "Agent Gamma", subtitle: "基因映射引擎", status: "processing" as const, uptimeLabel: "运行", uptimeValue: "12h 34m", metricLabel: "同步率", metricValue: "87.6%", iconName: "hub" },
];

const AGENTS_EN = [
  { name: "Agent Alpha", subtitle: "Environment Analysis", status: "active" as const, uptimeLabel: "Uptime", uptimeValue: "47h 12m", metricLabel: "Sync", metricValue: "99.2%", iconName: "psychology" },
  { name: "Agent Beta", subtitle: "Extremophile Screening", status: "standby" as const, uptimeLabel: "Uptime", uptimeValue: "—", metricLabel: "Ready", metricValue: "IDLE", iconName: "biotech" },
  { name: "Agent Gamma", subtitle: "Gene Mapping Engine", status: "processing" as const, uptimeLabel: "Uptime", uptimeValue: "12h 34m", metricLabel: "Sync", metricValue: "87.6%", iconName: "hub" },
];

export default function OrchestratorView() {
  const { locale } = useLocale();
  const isZh = locale === "zh";
  const navigate = useNavigate();
  const agents = isZh ? AGENTS_ZH : AGENTS_EN;

  const [stats, setStats] = useState({ nodes: 1240, confidence: 98.4, latency: 14 });
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);

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

  const getActiveProjectId = () => {
    const raw = localStorage.getItem("active_project_id");
    const parsed = raw ? Number(raw) : NaN;
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  };

  const handleOrchestrate = async () => {
    setIsOrchestrating(true);
    const activeProjectId = getActiveProjectId();
    if (!activeProjectId) {
      setIsOrchestrating(false);
      navigate("/projects");
      return;
    }
    try {
      const result = await orchestrateAgents({
        project_id: activeProjectId,
        config: { location: "Jezero Crater", constraints: [] },
      });
      const pid = result?.project_id ?? activeProjectId;
      if (result?.agent_runs?.length) {
        const runs = await getAgentRuns(pid);
        setAgentRuns(runs);
      }
    } catch {
      // silently handle
    } finally {
      setIsOrchestrating(false);
    }
  };

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 min-h-full"
    >
      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <p className="text-[10px] font-mono text-muted tracking-[0.2em] uppercase mb-2">
            {isZh ? "空间计算界面 · 枢纽总览" : "Spatial Computing Interface · Nexus Overview"}
          </p>
          <h1 className="text-4xl lg:text-5xl font-headline font-light tracking-[0.15em] uppercase text-on-surface">
            NEXUS <span className="text-primary font-bold">OVERVIEW</span>
          </h1>
        </div>

        {/* Status badges */}
        <div className="hidden lg:flex items-center gap-3">
          {[
            { label: isZh ? "火星标准时间" : "MST", value: "SOL 1847", color: "text-on-surface" },
            { label: isZh ? "目标矢量" : "Target", value: "M-77.BETA", color: "text-primary" },
          ].map((badge, i) => (
            <div
              key={i}
              className="glass-panel-sm px-4 py-2 flex items-center gap-3"
            >
              <span className="text-[9px] font-mono text-muted tracking-wider uppercase">{badge.label}</span>
              <span className={`text-sm font-mono font-bold ${badge.color}`}>{badge.value}</span>
            </div>
          ))}
        </div>
      </motion.header>

      {/* ── Main Grid: Agents | Sphere | Metrics ── */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-12 mb-10">
        {/* Left agent cards */}
        <motion.div
          variants={stagger(120)}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-5"
        >
          {agents.slice(0, 2).map((agent, i) => (
            <AgentCard key={i} {...agent} />
          ))}
        </motion.div>

        {/* Central sphere */}
        <NexusSphere
          atmPressure="1.04"
          o2Level="0.13%"
          co2Level="95.3%"
          tempValue="-63°C"
        />

        {/* Right panel: remaining agent + environment */}
        <motion.div
          variants={stagger(120)}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-5"
        >
          {agents.slice(2).map((agent, i) => (
            <AgentCard key={i} {...agent} />
          ))}

          {/* Environment quick stats */}
          <motion.div
            variants={glassEntrance}
            className="glass-panel w-[240px] p-5"
          >
            <p className="text-[9px] font-mono text-muted tracking-[0.15em] uppercase mb-3">
              {isZh ? "表面条件" : "Surface Conditions"}
            </p>
            <div className="space-y-3">
              {[
                { label: isZh ? "辐射" : "Radiation", value: "0.67 mSv/d", icon: "radiation" },
                { label: isZh ? "风速" : "Wind", value: "7.2 m/s", icon: "air" },
                { label: isZh ? "粉尘" : "Dust", value: "Fe₂O₃ 42%", icon: "grain" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name={item.icon} size={16} className="text-muted" />
                    <span className="text-xs text-muted">{item.label}</span>
                  </div>
                  <span className="text-xs font-mono text-on-surface">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── System Status Bar ── */}
      <motion.div
        variants={glassEntrance}
        initial="hidden"
        animate="show"
        className="glass-panel p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center relative">
            <Icon name="hub" size={24} className="text-primary" />
            <motion.div
              className="absolute inset-0 rounded-2xl border border-primary/30"
              animate={{ opacity: [0.5, 0.1, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </div>
          <div>
            <h4 className="font-headline font-bold text-primary text-sm tracking-[0.05em] uppercase">
              {isZh ? "协调者核心" : "Orchestrator Core"}
            </h4>
            <p className="text-[10px] text-muted font-mono tracking-wider uppercase">
              {isZh ? "多智能体任务引擎 · Alpha-01" : "Multi-Agent Engine · Alpha-01"}
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          {[
            { label: isZh ? "节点" : "Nodes", value: stats.nodes.toLocaleString() },
            { label: isZh ? "置信度" : "Confidence", value: `${stats.confidence}%` },
            { label: isZh ? "延迟" : "Latency", value: `${stats.latency}ms` },
          ].map((s, i) => (
            <div key={i} className={`text-center ${i > 0 ? "pl-6 border-l border-[rgba(255,255,255,0.06)]" : ""}`}>
              <span className="text-[9px] font-mono text-muted tracking-wider uppercase block">{s.label}</span>
              <motion.span
                key={s.value}
                initial={{ opacity: 0.4, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-base font-mono font-bold text-on-surface block mt-0.5"
              >
                {s.value}
              </motion.span>
            </div>
          ))}
        </div>

        {/* Launch button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleOrchestrate}
          disabled={isOrchestrating}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-headline tracking-[0.1em] uppercase hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name={isOrchestrating ? "sync" : "play_arrow"} size={18} className={isOrchestrating ? "spin-fast" : ""} />
          {isOrchestrating
            ? (isZh ? "运行中..." : "Running...")
            : (isZh ? "启动管线" : "Launch Pipeline")}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
