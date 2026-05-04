import { useMemo } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  Dna,
  FlaskConical,
  History,
  Lock,
  PanelRightClose,
  PanelRightOpen,
  PencilLine,
  Pin,
  PinOff,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useDesigner } from "../../views/designer/DesignerContext";
import type {
  DesignerState,
  DesignerStep,
} from "../../views/designer/DesignerContext";
import type { EditPlanCandidate } from "../../api/designer";

export type DesignStateRailPanelMode = "expanded" | "rail" | "popover";

export interface DesignStateRailProps {
  panelMode?: DesignStateRailPanelMode;
  pinnedOpen?: boolean;
  onPanelModeChange?: (mode: DesignStateRailPanelMode) => void;
  onPinnedOpenChange?: (open: boolean) => void;
  className?: string;
}

type RiskLevel = "none" | "warning" | "danger";
type StepStatus = "done" | "active" | "pending";

interface RiskItem {
  id: string;
  step: DesignerStep;
  level: RiskLevel;
  label: string;
}

interface StepMeta {
  step: DesignerStep;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

const STEPS: readonly StepMeta[] = [
  { step: 1, label: "环境", shortLabel: "Env", icon: FlaskConical },
  { step: 2, label: "任务", shortLabel: "Mis", icon: Sparkles },
  { step: 3, label: "底盘", shortLabel: "Chs", icon: Dna },
  { step: 4, label: "蛋白", shortLabel: "Prt", icon: FlaskConical },
  { step: 5, label: "编辑", shortLabel: "Edt", icon: ShieldAlert },
  { step: 6, label: "模拟", shortLabel: "Sim", icon: History },
];

const RISK_WEIGHT: Record<RiskLevel, number> = {
  none: 1,
  warning: 2,
  danger: 3,
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function hasCompletedStep(state: DesignerState, step: DesignerStep): boolean {
  switch (step) {
    case 1:
      return Boolean(state.environment);
    case 2:
      return Boolean(state.selectedMissionId);
    case 3:
      return Boolean(state.selectedChassisId);
    case 4:
      return Boolean(state.selectedProteinId);
    case 5:
      return Boolean(state.selectedEditPlanId);
    case 6:
      return state.simulationSteps.length > 0;
    default:
      return false;
  }
}

function getStepStatus(state: DesignerState, step: DesignerStep): StepStatus {
  if (state.currentStep === step) return "active";
  if (hasCompletedStep(state, step)) return "done";
  return "pending";
}

function getStepTitle(
  state: DesignerState,
  meta: StepMeta,
  canRollback: boolean,
): string {
  if (canRollback) {
    return `${meta.step}. ${meta.label} 已完成，点击回退修改`;
  }
  if (meta.step === state.currentStep) {
    return `${meta.step}. ${meta.label} 当前步骤`;
  }
  if (meta.step > state.currentStep) {
    return `${meta.step}. ${meta.label} 尚未解锁，请先完成前序步骤`;
  }
  return `${meta.step}. ${meta.label}`;
}

function getSelectedEditPlan(state: DesignerState): EditPlanCandidate | null {
  return (
    state.editPlanCandidates.find((plan) => plan.id === state.selectedEditPlanId) ??
    null
  );
}

function readableId(id: string | null): string {
  if (!id) return "未选择";
  return id
    .replace(/^mission_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatNumber(value: number, digits = 1): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "n/a";
}

function deriveRiskItems(state: DesignerState): RiskItem[] {
  const items: RiskItem[] = [];
  const selectedChassis =
    state.chassisCandidates.find((c) => c.id === state.selectedChassisId) ??
    null;
  const editPlan = getSelectedEditPlan(state);

  if (state.sessionError || state.error) {
    items.push({
      id: "session-error",
      step: state.currentStep,
      level: "danger",
      label: state.sessionError || state.error || "会话错误",
    });
  }

  if (
    state.selectedMissionId &&
    state.currentStep >= 3 &&
    !state.isThinking &&
    state.chassisCandidates.length === 0
  ) {
    items.push({
      id: "chassis-empty",
      step: 3,
      level: "warning",
      label: "任务已选择，但尚无底盘候选",
    });
  }

  if (
    state.selectedChassisId &&
    state.currentStep >= 4 &&
    !state.isThinking &&
    state.proteinCandidates.length === 0
  ) {
    items.push({
      id: "protein-empty",
      step: 4,
      level: "warning",
      label: "底盘已选择，但尚无蛋白候选",
    });
  }

  if (
    state.selectedProteinId &&
    state.currentStep >= 5 &&
    !state.isThinking &&
    state.editPlanCandidates.length === 0
  ) {
    items.push({
      id: "edit-plan-empty",
      step: 5,
      level: "warning",
      label: "蛋白已选择，但尚无编辑方案",
    });
  }

  if (selectedChassis) {
    if (selectedChassis.match_score < 0.55) {
      items.push({
        id: "chassis-match-low",
        step: 3,
        level: "warning",
        label: "底盘匹配度不足 55%",
      });
    } else if (selectedChassis.match_score < 0.72) {
      items.push({
        id: "chassis-match-medium",
        step: 3,
        level: "warning",
        label: "底盘匹配度需要复核",
      });
    }
    if (selectedChassis.genetic_tractability === "low") {
      items.push({
        id: "tractability-low",
        step: 3,
        level: "warning",
        label: "遗传可操作性低",
      });
    } else if (selectedChassis.genetic_tractability === "medium") {
      items.push({
        id: "tractability-medium",
        step: 3,
        level: "warning",
        label: "遗传可操作性中等",
      });
    }
  }

  if (editPlan) {
    const burden = editPlan.metabolic_burden.toLowerCase();
    if (burden.includes("高") || burden.includes("high")) {
      items.push({
        id: "burden-high",
        step: 5,
        level: "warning",
        label: "代谢负担较高",
      });
    } else if (burden.includes("中") || burden.includes("medium")) {
      items.push({
        id: "burden-medium",
        step: 5,
        level: "warning",
        label: "代谢负担中等",
      });
    }
    if (!editPlan.has_kill_switch) {
      items.push({
        id: "kill-switch-missing",
        step: 5,
        level: "danger",
        label: "缺少 kill-switch",
      });
    }
  }

  if (
    state.currentStep === 6 &&
    state.selectedEditPlanId &&
    !state.isThinking &&
    !state.error &&
    state.simulationSteps.length === 0
  ) {
    items.push({
      id: "simulation-missing",
      step: 6,
      level: "warning",
      label: "尚未完成模拟验证",
    });
  }

  return items;
}

function deriveRiskLevel(items: RiskItem[]): RiskLevel {
  if (items.some((item) => item.level === "danger")) return "danger";
  if (items.some((item) => item.level === "warning")) return "warning";
  return "none";
}

function riskStyle(level: RiskLevel): string {
  switch (level) {
    case "danger":
      return "border-rose-500/40 bg-rose-500/10 text-rose-300";
    case "warning":
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
    case "none":
      return "border-emerald-500/35 bg-emerald-500/10 text-emerald-300";
    default:
      return "border-border bg-card text-text-muted";
  }
}

function riskLabel(level: RiskLevel): string {
  switch (level) {
    case "danger":
      return "危险";
    case "warning":
      return "警告";
    case "none":
      return "无明显风险";
    default:
      return "未知";
  }
}

export default function DesignStateRail({
  panelMode = "expanded",
  pinnedOpen = false,
  onPanelModeChange,
  onPinnedOpenChange,
  className,
}: DesignStateRailProps) {
  const { state, rollbackTo } = useDesigner();

  const completedStepCount = useMemo(
    () =>
      STEPS.reduce(
        (count, meta) => count + (hasCompletedStep(state, meta.step) ? 1 : 0),
        0,
      ),
    [state],
  );
  const riskItems = useMemo(() => deriveRiskItems(state), [state]);
  const riskLevel = useMemo(() => deriveRiskLevel(riskItems), [riskItems]);
  const selectedChassis = useMemo(
    () =>
      state.chassisCandidates.find((c) => c.id === state.selectedChassisId) ??
      null,
    [state.chassisCandidates, state.selectedChassisId],
  );
  const selectedProtein = useMemo(
    () =>
      state.proteinCandidates.find((p) => p.id === state.selectedProteinId) ??
      null,
    [state.proteinCandidates, state.selectedProteinId],
  );
  const selectedEditPlan = useMemo(() => getSelectedEditPlan(state), [state]);

  const progressPct = Math.round((completedStepCount / STEPS.length) * 100);
  const expanded = panelMode === "expanded" || pinnedOpen;

  const setMode = (mode: DesignStateRailPanelMode) => {
    onPanelModeChange?.(mode);
  };

  const togglePinned = () => {
    onPinnedOpenChange?.(!pinnedOpen);
  };

  if (panelMode === "popover") {
    return (
      <div className={cx("relative inline-block", className)}>
        <button
          type="button"
          onClick={togglePinned}
          className={cx(
            "inline-flex h-11 items-center gap-3 rounded-lg border px-3 text-sm font-semibold transition-colors",
            riskStyle(riskLevel),
          )}
        >
          <Dna size={17} />
          <span>{completedStepCount}/6</span>
          <RiskDot level={riskLevel} />
        </button>
        {pinnedOpen && (
          <div className="absolute right-0 top-12 z-40 w-[360px] max-w-[calc(100vw-2rem)]">
            <PanelBody
              state={state}
              completedStepCount={completedStepCount}
              progressPct={progressPct}
              riskItems={riskItems}
              riskLevel={riskLevel}
              selectedChassisName={selectedChassis?.scientific_name ?? null}
              selectedProteinName={selectedProtein?.name ?? null}
              selectedEditPlan={selectedEditPlan}
              expanded
              onRollback={rollbackTo}
              onModeChange={setMode}
              onPinnedToggle={togglePinned}
              panelMode={panelMode}
              pinnedOpen={pinnedOpen}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <aside
      className={cx(
        "shrink-0",
        panelMode === "rail" && !pinnedOpen ? "w-[76px]" : "w-full max-w-[380px]",
        className,
      )}
    >
      <PanelBody
        state={state}
        completedStepCount={completedStepCount}
        progressPct={progressPct}
        riskItems={riskItems}
        riskLevel={riskLevel}
        selectedChassisName={selectedChassis?.scientific_name ?? null}
        selectedProteinName={selectedProtein?.name ?? null}
        selectedEditPlan={selectedEditPlan}
        expanded={expanded}
        onRollback={rollbackTo}
        onModeChange={setMode}
        onPinnedToggle={togglePinned}
        panelMode={panelMode}
        pinnedOpen={pinnedOpen}
      />
    </aside>
  );
}

interface PanelBodyProps {
  state: DesignerState;
  completedStepCount: number;
  progressPct: number;
  riskItems: RiskItem[];
  riskLevel: RiskLevel;
  selectedChassisName: string | null;
  selectedProteinName: string | null;
  selectedEditPlan: EditPlanCandidate | null;
  expanded: boolean;
  onRollback: (step: number) => Promise<boolean>;
  onModeChange: (mode: DesignStateRailPanelMode) => void;
  onPinnedToggle: () => void;
  panelMode: DesignStateRailPanelMode;
  pinnedOpen: boolean;
}

function PanelBody({
  state,
  completedStepCount,
  progressPct,
  riskItems,
  riskLevel,
  selectedChassisName,
  selectedProteinName,
  selectedEditPlan,
  expanded,
  onRollback,
  onModeChange,
  onPinnedToggle,
  panelMode,
  pinnedOpen,
}: PanelBodyProps) {
  const rollbackTargets = STEPS.filter(
    (meta) => meta.step < state.currentStep && hasCompletedStep(state, meta.step),
  );

  return (
    <motion.div
      layout
      className={cx(
        "overflow-hidden rounded-xl border border-white/15 bg-card-translucent backdrop-blur-md shadow-2xl shadow-black/20",
        expanded ? "p-4" : "px-2 py-3",
      )}
    >
      <div
        className={cx(
          "flex items-center",
          expanded ? "justify-between gap-3" : "flex-col gap-2",
        )}
      >
        <div className={cx("flex items-center gap-3", !expanded && "flex-col")}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
            <Dna size={20} />
          </div>
          {expanded && (
            <div>
              <div className="text-sm font-semibold text-text">设计状态</div>
              <div className="text-xs text-text-dim">
                {completedStepCount}/6 completed · {progressPct}%
              </div>
            </div>
          )}
        </div>

        <div className={cx("flex items-center gap-1.5", !expanded && "flex-col")}>
          <button
            type="button"
            title={panelMode === "rail" ? "展开状态栏" : "收起为窄栏"}
            onClick={() => {
              onModeChange(panelMode === "rail" ? "expanded" : "rail");
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-text-muted transition-colors hover:border-primary/40 hover:text-primary"
          >
            {panelMode === "rail" ? (
              <PanelRightOpen size={16} />
            ) : (
              <PanelRightClose size={16} />
            )}
          </button>
          <button
            type="button"
            title={pinnedOpen ? "取消固定" : "固定展开"}
            onClick={onPinnedToggle}
            className={cx(
              "flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
              pinnedOpen
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-white/10 text-text-muted hover:border-primary/40 hover:text-primary",
            )}
          >
            {pinnedOpen ? <PinOff size={15} /> : <Pin size={15} />}
          </button>
        </div>
      </div>

      <div className={cx("mt-4", expanded ? "space-y-5" : "space-y-3")}>
        <ProgressSteps
          state={state}
          riskItems={riskItems}
          expanded={expanded}
          onRollback={onRollback}
        />

        {expanded ? (
          <>
            <ProgressMeter
              completedStepCount={completedStepCount}
              progressPct={progressPct}
            />
            <SelectionSummary
              state={state}
              selectedChassisName={selectedChassisName}
              selectedProteinName={selectedProteinName}
              selectedEditPlan={selectedEditPlan}
            />
            <RollbackShortcuts
              rollbackTargets={rollbackTargets}
              onRollback={onRollback}
            />
            <RiskPanel riskItems={riskItems} riskLevel={riskLevel} />
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              title={riskLabel(riskLevel)}
              className={cx(
                "flex h-9 w-9 items-center justify-center rounded-lg border",
                riskStyle(riskLevel),
              )}
            >
              <RiskDot level={riskLevel} />
            </div>
            <div className="text-[11px] font-mono text-text-dim tabular-nums">
              {completedStepCount}/6
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ProgressSteps({
  state,
  riskItems,
  expanded,
  onRollback,
}: {
  state: DesignerState;
  riskItems: RiskItem[];
  expanded: boolean;
  onRollback: (step: number) => Promise<boolean>;
}) {
  return (
    <div className={cx("grid", expanded ? "grid-cols-6 gap-2" : "gap-2")}>
      {STEPS.map((meta) => {
        const status = getStepStatus(state, meta.step);
        const stepRisks = riskItems.filter((item) => item.step === meta.step);
        const maxRisk = stepRisks.reduce<RiskLevel | null>((max, item) => {
          if (!max) return item.level;
          return RISK_WEIGHT[item.level] > RISK_WEIGHT[max] ? item.level : max;
        }, null);
        const canRollback =
          meta.step < state.currentStep && hasCompletedStep(state, meta.step);
        const isCurrent = meta.step === state.currentStep;
        const isLocked = meta.step > state.currentStep;
        const Icon = meta.icon;

        return (
          <button
            key={meta.step}
            type="button"
            title={getStepTitle(state, meta, canRollback)}
            disabled={!canRollback}
            onClick={() => {
              if (canRollback) void onRollback(meta.step);
            }}
            className={cx(
              "relative flex min-h-12 items-center justify-center rounded-lg border transition-colors",
              expanded ? "flex-col gap-1 px-1 py-2" : "h-12 w-12",
              status === "done" &&
                "border-primary/45 bg-primary/10 text-primary hover:border-primary/70 hover:bg-primary/15",
              status === "active" &&
                "border-primary/70 bg-primary/[0.16] text-text shadow-[0_0_0_2px_rgba(56,189,248,0.18)]",
              status === "pending" && "border-white/10 bg-white/[0.02] text-text-dim",
              canRollback ? "cursor-pointer" : "cursor-not-allowed",
              isCurrent && "ring-1 ring-primary/35",
              isLocked && "opacity-70",
            )}
          >
            {canRollback ? (
              <PencilLine size={16} />
            ) : status === "done" ? (
              <Check size={16} />
            ) : isLocked ? (
              <Lock size={16} />
            ) : (
              <Icon size={16} />
            )}
            {expanded && (
              <>
                <span className="text-[10px] font-semibold leading-none">
                  {meta.label}
                </span>
                <span
                  className={cx(
                    "text-[9px] font-semibold leading-none",
                    canRollback && "text-primary",
                    isCurrent && "text-primary",
                    isLocked && "text-text-dim",
                  )}
                >
                  {canRollback ? "修改" : isCurrent ? "当前" : isLocked ? "锁定" : "完成"}
                </span>
              </>
            )}
            {!expanded && (
              <span className="sr-only">
                {getStepTitle(state, meta, canRollback)}
              </span>
            )}
            {maxRisk && (
              <span
                className={cx(
                  "absolute -right-1 -top-1 h-3 w-3 rounded-full border border-bg",
                  maxRisk === "danger"
                    ? "bg-rose-400"
                    : maxRisk === "warning"
                      ? "bg-amber-300"
                      : "bg-emerald-300",
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function ProgressMeter({
  completedStepCount,
  progressPct,
}: {
  completedStepCount: number;
  progressPct: number;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-text-dim">
        <span className="font-semibold uppercase tracking-wider">进度</span>
        <span className="font-mono tabular-nums">
          {completedStepCount}/6 · {progressPct}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.35 }}
          className="h-full bg-primary"
        />
      </div>
    </div>
  );
}

function SelectionSummary({
  state,
  selectedChassisName,
  selectedProteinName,
  selectedEditPlan,
}: {
  state: DesignerState;
  selectedChassisName: string | null;
  selectedProteinName: string | null;
  selectedEditPlan: EditPlanCandidate | null;
}) {
  const env = state.environment;
  const rows = [
    {
      label: "环境",
      value: env
        ? `${formatNumber(env.temperature)}°C · pH ${formatNumber(env.ph)}`
        : "未设置",
    },
    { label: "任务", value: readableId(state.selectedMissionId) },
    { label: "底盘", value: selectedChassisName ?? state.selectedChassisId ?? "未选择" },
    { label: "蛋白", value: selectedProteinName ?? state.selectedProteinId ?? "未选择" },
    {
      label: "编辑",
      value:
        selectedEditPlan?.target_gene ??
        state.selectedEditPlanId ??
        "未选择",
    },
    {
      label: "模拟",
      value:
        state.simulationSteps.length > 0
          ? `${state.simulationSteps.length} ticks`
          : "未运行",
    },
  ];

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wider text-text-dim">
        当前选择
      </div>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[52px_1fr] gap-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
          >
            <span className="text-text-dim">{row.label}</span>
            <span className="truncate font-medium text-text">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RollbackShortcuts({
  rollbackTargets,
  onRollback,
}: {
  rollbackTargets: StepMeta[];
  onRollback: (step: number) => Promise<boolean>;
}) {
  if (rollbackTargets.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-text-dim">
        <Lock size={14} />
        暂无可回退节点
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wider text-text-dim">
        回退快捷
      </div>
      <div className="flex flex-wrap gap-2">
        {rollbackTargets.map((meta) => (
          <button
            key={meta.step}
            type="button"
            onClick={() => {
              void onRollback(meta.step);
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:border-primary/40 hover:text-primary"
          >
            <ChevronLeft size={13} />
            {meta.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RiskPanel({
  riskItems,
  riskLevel,
}: {
  riskItems: RiskItem[];
  riskLevel: RiskLevel;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-text-dim">
          风险标记
        </div>
        <span
          className={cx(
            "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold",
            riskStyle(riskLevel),
          )}
        >
          <RiskDot level={riskLevel} />
          {riskLabel(riskLevel)}
        </span>
      </div>
      {riskItems.length === 0 ? (
        <div className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          暂无明显风险
        </div>
      ) : (
        <div className="space-y-1.5">
          {riskItems.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className={cx(
                "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
                riskStyle(item.level),
              )}
            >
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span className="min-w-0 flex-1">{item.label}</span>
              <span className="shrink-0 text-xs opacity-75">S{item.step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RiskDot({ level }: { level: RiskLevel }) {
  return (
    <span
      className={cx(
        "inline-block h-2.5 w-2.5 rounded-full",
        level === "danger" && "bg-rose-400",
        level === "warning" && "bg-amber-300",
        level === "none" && "bg-emerald-300",
      )}
    />
  );
}
