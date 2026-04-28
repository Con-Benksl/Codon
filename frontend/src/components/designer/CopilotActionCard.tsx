import {
  ArrowLeft,
  Beaker,
  Check,
  Dna,
  FlaskConical,
  Leaf,
  Play,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CopilotAction } from "../../api/designer";

export type { CopilotAction };

export interface CopilotActionCardProps {
  action: CopilotAction;
  applyAction: (action: CopilotAction) => void;
  disabled?: boolean;
}

const ACTION_META: Record<
  CopilotAction["type"],
  {
    Icon: LucideIcon;
    title: string;
    accent: string;
  }
> = {
  apply_environment: {
    Icon: SlidersHorizontal,
    title: "环境参数",
    accent: "text-cyan-300 bg-cyan-500/10 border-cyan-400/25",
  },
  select_mission: {
    Icon: Leaf,
    title: "任务选择",
    accent: "text-emerald-300 bg-emerald-500/10 border-emerald-400/25",
  },
  select_chassis: {
    Icon: FlaskConical,
    title: "底盘生物",
    accent: "text-sky-300 bg-sky-500/10 border-sky-400/25",
  },
  select_protein: {
    Icon: Beaker,
    title: "功能蛋白",
    accent: "text-violet-300 bg-violet-500/10 border-violet-400/25",
  },
  select_edit_plan: {
    Icon: Dna,
    title: "编辑方案",
    accent: "text-amber-300 bg-amber-500/10 border-amber-400/25",
  },
  run_simulation: {
    Icon: Play,
    title: "运行模拟",
    accent: "text-primary bg-primary/10 border-primary/25",
  },
  rollback_to_step: {
    Icon: ArrowLeft,
    title: "回退步骤",
    accent: "text-rose-300 bg-rose-500/10 border-rose-400/25",
  },
  explain: {
    Icon: Sparkles,
    title: "解释说明",
    accent: "text-indigo-300 bg-indigo-500/10 border-indigo-400/25",
  },
  compare: {
    Icon: SlidersHorizontal,
    title: "候选比较",
    accent: "text-teal-300 bg-teal-500/10 border-teal-400/25",
  },
};

function getActionDetail(action: CopilotAction): string | null {
  switch (action.type) {
    case "apply_environment":
      return Object.entries(action.payload.environment)
        .slice(0, 3)
        .map(([key, value]) => `${key}: ${String(value)}`)
        .join(" · ");
    case "select_mission":
      return action.payload.mission_id;
    case "select_chassis":
      return action.payload.chassis_id;
    case "select_protein":
      return action.payload.protein_id;
    case "select_edit_plan":
      return action.payload.edit_plan_id;
    case "rollback_to_step":
      return `Step ${action.payload.step}`;
    case "run_simulation":
      return null;
    case "explain":
      return action.payload.subject_type ?? null;
    case "compare":
      return `${action.payload.entity_type} · ${action.payload.ids.length}`;
  }
}

export default function CopilotActionCard({
  action,
  applyAction,
  disabled = false,
}: CopilotActionCardProps) {
  const meta = ACTION_META[action.type];
  const detail = getActionDetail(action);
  const isDisabled = disabled || Boolean(action.disabledReason);

  return (
    <article className="rounded-xl border border-white/15 bg-card-translucent p-4 shadow-lg shadow-black/10">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border ${meta.accent}`}
        >
          <meta.Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-dim">
              {meta.title}
            </span>
            {detail ? (
              <span className="max-w-full truncate rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-xs text-text-dim">
                {detail}
              </span>
            ) : null}
          </div>
          <h3 className="mt-1 text-base font-semibold leading-snug text-text">{action.label}</h3>
          {action.description ? (
            <p className="mt-1 text-sm leading-relaxed text-text-muted">{action.description}</p>
          ) : null}
          {action.preview && action.preview.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {action.preview.map((item) => (
                <li key={item} className="flex gap-2 text-xs leading-relaxed text-text-dim">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={() => applyAction(action)}
        disabled={isDisabled}
        className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 text-sm font-semibold text-primary transition-colors hover:border-primary/50 hover:bg-primary/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-text-dim"
      >
        <Check size={16} />
        {action.requiresConfirmation ? "应用建议" : "查看结果"}
      </button>
      {action.disabledReason ? (
        <div className="mt-2 text-xs text-amber-300/85">{action.disabledReason}</div>
      ) : null}
    </article>
  );
}
