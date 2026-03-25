import { motion } from "motion/react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { AgentRun } from "../../api/agents";

interface Props {
  isZh: boolean;
  isOrchestrating: boolean;
  orchestrationError: string | null;
  agentRuns: AgentRun[];
}

export default function AgentStatusBar({ isZh, isOrchestrating, orchestrationError, agentRuns }: Props) {
  if (!isOrchestrating && agentRuns.length === 0 && !orchestrationError) return null;

  return (
    <motion.section
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mb-8"
    >
      <div className="glass-panel p-4 rounded-xl">
        {orchestrationError ? (
          <div className="flex items-center gap-3 text-secondary">
            <AlertCircle size={18} />
            <span className="text-sm font-headline">{orchestrationError}</span>
          </div>
        ) : isOrchestrating ? (
          <div className="flex items-center gap-3">
            <Loader2 size={18} className="animate-spin text-primary" />
            <span className="text-sm font-headline text-on-surface-variant">
              {isZh
                ? "正在运行 6 个 Agent 管线（LLM 推理中，预计 2-5 分钟）..."
                : "Running 6-agent pipeline (LLM reasoning, ~2-5 min)..."}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-tertiary" />
            <span className="text-sm font-headline text-on-surface-variant">
              {isZh
                ? `编排完成 — ${agentRuns.filter((r) => r.status === "completed").length}/${agentRuns.length} 个 Agent 成功`
                : `Orchestration complete — ${agentRuns.filter((r) => r.status === "completed").length}/${agentRuns.length} agents succeeded`}
            </span>
            <div className="flex gap-1.5 ml-auto">
              {agentRuns.map((r) => (
                <div
                  key={r.id}
                  title={`${r.agent_name}: ${r.status}`}
                  className={`w-3 h-3 rounded-full ${r.status === "completed" ? "bg-tertiary" : "bg-secondary"}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
