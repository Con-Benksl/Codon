import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useLocale } from "../i18n/context";
import { viewTransition, glassEntrance } from "../lib/motion";
import PipelineNode from "../components/synthesis/PipelineNode";
import EnergyConduit from "../components/synthesis/EnergyConduit";
import Icon from "../components/Icon";

type NodeStatus = "pending" | "active" | "completed";

interface PipelineStage {
  id: string;
  labelZh: string;
  labelEn: string;
  iconName: string;
  status: NodeStatus;
}

const INITIAL_STAGES: PipelineStage[] = [
  { id: "init", labelZh: "初始化", labelEn: "Initiation", iconName: "database", status: "completed" },
  { id: "compile", labelZh: "编译", labelEn: "Compilation", iconName: "science", status: "active" },
  { id: "optimize", labelZh: "优化", labelEn: "Optimization", iconName: "tune", status: "pending" },
  { id: "validate", labelZh: "验证", labelEn: "Validation", iconName: "verified", status: "pending" },
];

const LOG_ENTRIES_ZH = [
  "[00:00:12] 环境参数载入完成",
  "[00:00:14] 高氯酸盐还原酶基因簇已索引",
  "[00:00:18] 编译阶段启动 — 目标: M-77.BETA",
  "[00:00:22] 类胡萝卜素合成模块已加载",
  "[00:00:25] UV 防护屏障验证中...",
  "[00:00:31] 冷休克蛋白 A 序列优化进行中",
  "[00:00:35] DNA 修复增强模块编译中",
  "[00:00:40] 中间体兼容性检查: PASS",
  "[00:00:44] 预计剩余时间: 00:03:28",
];

const LOG_ENTRIES_EN = [
  "[00:00:12] Environment parameters loaded",
  "[00:00:14] Perchlorate reductase cluster indexed",
  "[00:00:18] Compilation stage initiated — Target: M-77.BETA",
  "[00:00:22] Carotenoid synthesis module loaded",
  "[00:00:25] UV shielding verification in progress...",
  "[00:00:31] Cold shock protein A sequence optimizing",
  "[00:00:35] DNA repair enhancement module compiling",
  "[00:00:40] Intermediate compatibility check: PASS",
  "[00:00:44] Estimated remaining: 00:03:28",
];

export default function SynthesisView() {
  const { locale } = useLocale();
  const isZh = locale === "zh";
  const [stages] = useState<PipelineStage[]>(INITIAL_STAGES);
  const [visibleLogs, setVisibleLogs] = useState(3);
  const logRef = useRef<HTMLDivElement>(null);

  const logs = isZh ? LOG_ENTRIES_ZH : LOG_ENTRIES_EN;

  useEffect(() => {
    if (visibleLogs >= logs.length) return;
    const timer = setTimeout(() => {
      setVisibleLogs((v) => Math.min(v + 1, logs.length));
    }, 2000);
    return () => clearTimeout(timer);
  }, [visibleLogs, logs.length]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleLogs]);

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 min-h-full"
    >
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <p className="text-[10px] font-mono text-muted tracking-[0.2em] uppercase mb-2">
            {isZh ? "生物设计执行流" : "Bio-Design Execution Flow"}
          </p>
          <h1 className="text-4xl lg:text-5xl font-headline font-light tracking-[0.15em] uppercase text-on-surface">
            SYNTHESIS <span className="text-primary font-bold">PIPELINE</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="glass-panel-sm px-4 py-2 flex items-center gap-3">
            <span className="text-[9px] font-mono text-muted tracking-wider uppercase">
              {isZh ? "目标矢量" : "Target Vector"}
            </span>
            <span className="text-sm font-mono font-bold text-primary">M-77.BETA</span>
          </div>
          <div className="glass-panel-sm px-4 py-2 flex items-center gap-3">
            <Icon name="timer" size={16} className="text-muted" />
            <span className="text-sm font-mono font-bold text-on-surface">00:04:12</span>
          </div>
        </div>
      </motion.header>

      {/* Pipeline visualization */}
      <motion.div
        variants={glassEntrance}
        initial="hidden"
        animate="show"
        className="glass-panel p-8 mb-8 overflow-x-auto"
      >
        <div className="flex items-start justify-center gap-0 min-w-[600px]">
          {stages.map((stage, i) => (
            <div key={stage.id} className="flex items-start">
              <PipelineNode
                label={isZh ? stage.labelZh : stage.labelEn}
                iconName={stage.iconName}
                status={stage.status}
                index={i}
              />
              {i < stages.length - 1 && (
                <EnergyConduit active={stage.status === "completed" || stage.status === "active"} />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Terminal log panel */}
      <motion.div
        variants={glassEntrance}
        initial="hidden"
        animate="show"
        className="glass-panel-sm p-5 max-w-[600px] hover:max-w-[800px] transition-all duration-500"
      >
        <div className="flex items-center gap-2 mb-3">
          <Icon name="terminal" size={16} className="text-primary" />
          <span className="text-[10px] font-mono text-muted tracking-[0.15em] uppercase">
            {isZh ? "执行日志" : "Execution Log"}
          </span>
          <span className="ml-auto text-[9px] font-mono text-primary animate-pulse">LIVE</span>
        </div>

        <div
          ref={logRef}
          className="h-48 overflow-y-auto space-y-1.5"
          style={{ scrollbarWidth: "none" }}
        >
          {logs.slice(0, visibleLogs).map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="text-xs font-mono text-[rgba(0,229,255,0.8)] leading-relaxed"
            >
              {line}
            </motion.p>
          ))}
          {visibleLogs < logs.length && (
            <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
