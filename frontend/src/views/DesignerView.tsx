import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ChevronUp, Dna } from 'lucide-react';
import { useLocale } from '../i18n/context';
import { viewTransition } from '../lib/motion';
import {
  createSession,
  requestDesignerCopilot,
  rollback as apiRollback,
  submitChassis,
  submitEditPlan,
  submitEnvironment,
  submitMission,
  submitProtein,
  subscribeSimulation,
} from '../api/designer';
import type {
  ChassisCandidate,
  CopilotAction,
  DesignerCopilotWarning,
  EditPlanCandidate,
  EnvironmentVector,
  ProteinCandidate,
  SimulationStepData,
} from '../api/designer';
import {
  DesignerContext,
  type DesignerContextValue,
  type DesignerState,
  type DesignerStep,
} from './designer/DesignerContext';
import EnvironmentStep from '../components/designer/EnvironmentStep';
import MissionStep from '../components/designer/MissionStep';
import ChassisStep from '../components/designer/ChassisStep';
import ProteinStep from '../components/designer/ProteinStep';
import GeneEditStep from '../components/designer/GeneEditStep';
import SimulationStep from '../components/designer/SimulationStep';
import CopilotPanel from '../components/designer/CopilotPanel';
import type { CopilotMessage } from '../components/designer/CopilotPanel';
import DesignStateRail from '../components/designer/DesignStateRail';
import type { DesignStateRailPanelMode } from '../components/designer/DesignStateRail';

// ============================================================================
// Reducer
// ============================================================================

type Action =
  | { type: 'SESSION_CREATE_STARTED'; projectId: number | null }
  | { type: 'SESSION_CREATED'; sessionId: number }
  | { type: 'SESSION_CREATE_FAILED'; error: string }
  | { type: 'SET_ENVIRONMENT'; environment: EnvironmentVector }
  | { type: 'SET_MISSION'; missionId: string }
  | { type: 'SET_CHASSIS_CANDIDATES'; candidates: ChassisCandidate[] }
  | { type: 'SET_CHASSIS'; chassisId: string }
  | { type: 'SET_PROTEIN_CANDIDATES'; candidates: ProteinCandidate[] }
  | { type: 'SET_PROTEIN'; proteinId: string }
  | { type: 'SET_EDIT_PLAN_CANDIDATES'; candidates: EditPlanCandidate[] }
  | { type: 'SET_EDIT_PLAN'; planId: string }
  | { type: 'APPEND_SIM_STEP'; step: SimulationStepData }
  | { type: 'RESET_SIMULATION_STEPS' }
  | { type: 'START_THINKING'; message: string }
  | { type: 'STOP_THINKING' }
  | { type: 'GOTO_STEP'; step: DesignerStep }
  | { type: 'ROLLBACK_TO'; step: DesignerStep }
  | { type: 'SET_ERROR'; error: string | null };

const initialState: DesignerState = {
  sessionId: null,
  activeProjectId: null,
  isSessionLoading: false,
  sessionError: null,
  currentStep: 1,
  environment: null,
  selectedMissionId: null,
  selectedChassisId: null,
  selectedProteinId: null,
  selectedEditPlanId: null,
  chassisCandidates: [],
  proteinCandidates: [],
  editPlanCandidates: [],
  simulationSteps: [],
  isThinking: false,
  thinkingMessage: '',
  error: null,
};

function reducer(state: DesignerState, action: Action): DesignerState {
  switch (action.type) {
    case 'SESSION_CREATE_STARTED':
      return {
        ...state,
        activeProjectId: action.projectId,
        isSessionLoading: true,
        sessionError: null,
        error: null,
      };
    case 'SESSION_CREATED':
      return {
        ...state,
        sessionId: action.sessionId,
        isSessionLoading: false,
        sessionError: null,
        error: null,
      };
    case 'SESSION_CREATE_FAILED':
      return {
        ...state,
        isSessionLoading: false,
        sessionError: action.error,
        error: action.error,
      };
    case 'SET_ENVIRONMENT':
      return { ...state, environment: action.environment, error: null };
    case 'SET_MISSION':
      return { ...state, selectedMissionId: action.missionId, error: null };
    case 'SET_CHASSIS_CANDIDATES':
      return { ...state, chassisCandidates: action.candidates };
    case 'SET_CHASSIS':
      return { ...state, selectedChassisId: action.chassisId, error: null };
    case 'SET_PROTEIN_CANDIDATES':
      return { ...state, proteinCandidates: action.candidates };
    case 'SET_PROTEIN':
      return { ...state, selectedProteinId: action.proteinId, error: null };
    case 'SET_EDIT_PLAN_CANDIDATES':
      return { ...state, editPlanCandidates: action.candidates };
    case 'SET_EDIT_PLAN':
      return {
        ...state,
        selectedEditPlanId: action.planId,
        simulationSteps: [],
        error: null,
      };
    case 'APPEND_SIM_STEP':
      return {
        ...state,
        simulationSteps: [...state.simulationSteps, action.step],
      };
    case 'RESET_SIMULATION_STEPS':
      return { ...state, simulationSteps: [] };
    case 'START_THINKING':
      return {
        ...state,
        isThinking: true,
        thinkingMessage: action.message,
        error: null,
      };
    case 'STOP_THINKING':
      return { ...state, isThinking: false, thinkingMessage: '' };
    case 'GOTO_STEP':
      return { ...state, currentStep: action.step };
    case 'ROLLBACK_TO':
      return {
        ...state,
        currentStep: action.step,
        environment: action.step <= 1 ? null : state.environment,
        selectedMissionId: action.step <= 2 ? null : state.selectedMissionId,
        selectedChassisId: action.step <= 3 ? null : state.selectedChassisId,
        selectedProteinId: action.step <= 4 ? null : state.selectedProteinId,
        selectedEditPlanId: action.step <= 5 ? null : state.selectedEditPlanId,
        chassisCandidates: action.step <= 2 ? [] : state.chassisCandidates,
        proteinCandidates: action.step <= 3 ? [] : state.proteinCandidates,
        editPlanCandidates: action.step <= 4 ? [] : state.editPlanCandidates,
        simulationSteps: action.step <= 5 ? [] : state.simulationSteps,
        error: null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    default:
      return state;
  }
}

// ============================================================================
// Helpers
// ============================================================================

const ACTIVE_PROJECT_ID_STORAGE_KEY = 'active_project_id';

function readActiveProjectId(): number | undefined {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(ACTIVE_PROJECT_ID_STORAGE_KEY);
  } catch {
    return undefined;
  }

  if (!raw) return undefined;

  const projectId = Number(raw);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return undefined;
  }

  return projectId;
}

const MARS_SURFACE_ENVIRONMENT: EnvironmentVector = {
  temperature: -63,
  ionizing_radiation: 230,
  uv_flux: 110,
  pressure: 0.6,
  ph: 8.3,
  salinity: 1.5,
  water_activity: 0.05,
  oxygen: 0.0013,
  temp_diurnal_range: 100,
};

const STEP_TITLES: Record<DesignerStep, string> = {
  1: '环境设定',
  2: '任务选择',
  3: '底盘筛选',
  4: '蛋白选择',
  5: '编辑方案',
  6: '模拟验证',
};

const INITIAL_COPILOT_MESSAGES: CopilotMessage[] = [
  {
    id: 'copilot-welcome',
    role: 'assistant',
    content:
      '告诉我你想让生物系统完成什么任务，我会把自然语言目标拆成可确认的设计动作。每个会改变设计状态的动作都需要你点击应用。',
  },
];

function nextCopilotId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function includesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword.toLowerCase()));
}

function chooseMissionId(prompt: string): string {
  if (includesAny(prompt, ['oxygen', 'o2', '产氧', '固碳', 'carbon'])) {
    return 'mission_oxygen_carbon_fixation';
  }
  if (includesAny(prompt, ['metal', '重金属', '铅', '镉', '汞'])) {
    return 'mission_heavy_metal_uptake';
  }
  if (includesAny(prompt, ['plastic', '塑料', 'pet'])) {
    return 'mission_plastic_degradation';
  }
  if (includesAny(prompt, ['acid', 'ph', '酸', '中和'])) {
    return 'mission_acid_neutralization';
  }
  return 'mission_nitrogen_fixation_soil';
}

function buildCopilotResponse(prompt: string, state: DesignerState): CopilotMessage {
  const actions: CopilotAction[] = [];
  const normalized = prompt.trim();
  const wantsMars = includesAny(normalized, ['mars', '火星', 'martian']);
  const wantsCompare = includesAny(normalized, ['compare', '比较', '权衡', '差异']);
  const wantsExplain = includesAny(normalized, ['why', 'explain', '解释', '为什么', '风险']);

  if (!state.environment || wantsMars) {
    actions.push({
      id: nextCopilotId('action-env'),
      type: 'apply_environment',
      label: '应用火星表面环境',
      description: '低温、低压、高 UV、低水活度，适合作为火星土壤或表面任务的起点。',
      preview: ['temperature -63°C', 'pressure 0.6 kPa', 'water activity 0.05'],
      requiresConfirmation: true,
      payload: {
        environment: MARS_SURFACE_ENVIRONMENT,
        preset_id: 'env_mars_surface',
        source: 'preset',
      },
    });
  }

  if (!state.selectedMissionId) {
    const missionId = chooseMissionId(normalized);
    actions.push({
      id: nextCopilotId('action-mission'),
      type: 'select_mission',
      label:
        missionId === 'mission_nitrogen_fixation_soil'
          ? '选择固氮造土任务'
          : '选择匹配目标的任务',
      description: '先确定任务目标，再由现有 Designer 流程生成底盘候选。',
      preview: [missionId],
      requiresConfirmation: true,
      payload: { mission_id: missionId },
    });
  } else if (!state.selectedChassisId && state.chassisCandidates.length > 0) {
    const [top, second, third] = state.chassisCandidates;
    actions.push({
      id: nextCopilotId('action-chassis'),
      type: 'select_chassis',
      label: `选择 ${top.scientific_name}`,
      description: top.recommendation_reason,
      preview: [`match ${(top.match_score * 100).toFixed(0)}%`, top.genetic_tractability],
      requiresConfirmation: true,
      payload: { chassis_id: top.id },
    });
    if (wantsCompare && second) {
      const compared = [top, second, third].filter(
        (candidate): candidate is ChassisCandidate => Boolean(candidate),
      );
      actions.push({
        id: nextCopilotId('action-compare-chassis'),
        type: 'compare',
        label: '比较前三个底盘候选',
        description: '不改变设计状态，只把候选差异写入对话。',
        requiresConfirmation: false,
        payload: {
          assistant_message: compared
            .map(
              (candidate) =>
                `${candidate.scientific_name}: match ${(candidate.match_score * 100).toFixed(0)}%, tractability ${candidate.genetic_tractability}.`,
            )
            .join('\n'),
          entity_type: 'chassis',
          ids: compared.map((candidate) => candidate.id),
          criteria: ['match_score', 'genetic_tractability'],
        },
      });
    }
  } else if (!state.selectedProteinId && state.proteinCandidates.length > 0) {
    const [top] = state.proteinCandidates;
    actions.push({
      id: nextCopilotId('action-protein'),
      type: 'select_protein',
      label: `选择 ${top.name}`,
      description: top.llm_explanation,
      preview: [`EC ${top.ec_number}`, top.source_organism],
      requiresConfirmation: true,
      payload: { protein_id: top.id },
    });
  } else if (!state.selectedEditPlanId && state.editPlanCandidates.length > 0) {
    const preferred =
      state.editPlanCandidates.find((plan) => plan.has_kill_switch) ??
      state.editPlanCandidates[0];
    actions.push({
      id: nextCopilotId('action-edit-plan'),
      type: 'select_edit_plan',
      label: `选择 ${preferred.target_gene} 编辑方案`,
      description: `${preferred.strategy} · ${preferred.delivery_vector}`,
      preview: [
        preferred.has_kill_switch ? '包含 kill-switch' : '缺少 kill-switch',
        `burden ${preferred.metabolic_burden}`,
      ],
      requiresConfirmation: true,
      payload: { edit_plan_id: preferred.id },
    });
  } else if (state.selectedEditPlanId && state.simulationSteps.length === 0) {
    actions.push({
      id: nextCopilotId('action-simulate'),
      type: 'run_simulation',
      label: '运行模拟验证',
      description: '使用当前环境、底盘、蛋白和编辑方案启动现有模拟流程。',
      preview: ['population', 'env target', 'nutrient'],
      requiresConfirmation: true,
      payload: {},
    });
  }

  if (wantsExplain) {
    actions.push({
      id: nextCopilotId('action-explain'),
      type: 'explain',
      label: '解释当前设计状态',
      description: '不改变设计状态，只补充一段可读解释。',
      requiresConfirmation: false,
      payload: {
        assistant_message:
          '当前设计应优先关注三个问题：环境胁迫是否过强、底盘候选是否有足够匹配度、编辑方案是否包含生物安全约束。',
        subject_type: 'simulation',
      },
    });
  }

  const content =
    actions.length > 0
      ? '我把你的目标整理成下面这些可确认动作。建议按顺序应用，每一步仍会走现有 Designer 的 API 和状态机。'
      : '当前结构化状态已经比较完整。你可以要求我比较候选、解释风险，或者运行模拟后的结果解读。';

  return {
    id: nextCopilotId('assistant'),
    role: 'assistant',
    content,
    actions,
  };
}

function disableAction(
  messages: CopilotMessage[],
  actionId: string,
  disabledReason: string,
): CopilotMessage[] {
  return messages.map((message) => ({
    ...message,
    actions: message.actions?.map((action) =>
      action.id === actionId ? ({ ...action, disabledReason } as CopilotAction) : action,
    ),
  }));
}

function buildDesignerStatePayload(state: DesignerState): Record<string, unknown> {
  return {
    current_step: state.currentStep,
    environment: state.environment,
    mission_id: state.selectedMissionId,
    chassis_id: state.selectedChassisId,
    protein_id: state.selectedProteinId,
    edit_plan_id: state.selectedEditPlanId,
    simulation_steps: state.simulationSteps,
  };
}

function buildAvailableContextPayload(state: DesignerState): Record<string, unknown> {
  return {
    chassis_candidates: state.chassisCandidates,
    protein_candidates: state.proteinCandidates,
    edit_plan_candidates: state.editPlanCandidates,
    simulation_steps: state.simulationSteps.slice(-8),
  };
}

function appendWarningsToContent(
  content: string,
  warnings: DesignerCopilotWarning[],
): string {
  if (warnings.length === 0) return content;
  const visible = warnings
    .filter((warning) => warning.message)
    .slice(0, 2)
    .map((warning) => `[${warning.level}] ${warning.message}`);
  if (visible.length === 0) return content;
  return `${content}\n\n${visible.join('\n')}`;
}

// ============================================================================
// View
// ============================================================================

export default function DesignerView() {
  const { t } = useLocale();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>(
    INITIAL_COPILOT_MESSAGES,
  );
  const [copilotInput, setCopilotInput] = useState('');
  const [panelMode, setPanelMode] = useState<DesignStateRailPanelMode>('expanded');
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [structuredDetailOpen, setStructuredDetailOpen] = useState(false);
  const [isCopilotResponding, setIsCopilotResponding] = useState(false);
  const [backendSuggestedPrompts, setBackendSuggestedPrompts] = useState<string[]>([]);

  // Mount: create session
  useEffect(() => {
    let cancelled = false;
    const projectId = readActiveProjectId();
    dispatch({
      type: 'SESSION_CREATE_STARTED',
      projectId: projectId ?? null,
    });
    createSession(projectId)
      .then((res) => {
        if (!cancelled) {
          dispatch({ type: 'SESSION_CREATED', sessionId: res.id });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to create session';
        dispatch({ type: 'SESSION_CREATE_FAILED', error: msg });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEnvironmentSubmit = useCallback(
    async (env: EnvironmentVector): Promise<void> => {
      if (!state.sessionId) return;
      dispatch({ type: 'START_THINKING', message: 'Parsing environment...' });
      try {
        await submitEnvironment(state.sessionId, env);
        dispatch({ type: 'SET_ENVIRONMENT', environment: env });
        dispatch({ type: 'GOTO_STEP', step: 2 });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Submit failed';
        dispatch({ type: 'SET_ERROR', error: msg });
      } finally {
        dispatch({ type: 'STOP_THINKING' });
      }
    },
    [state.sessionId],
  );

  const handleMissionSelect = useCallback(
    async (missionId: string): Promise<void> => {
      if (!state.sessionId) return;
      dispatch({ type: 'START_THINKING', message: 'Matching chassis...' });
      try {
        const candidates = await submitMission(state.sessionId, missionId);
        dispatch({ type: 'SET_MISSION', missionId });
        dispatch({ type: 'SET_CHASSIS_CANDIDATES', candidates });
        dispatch({ type: 'GOTO_STEP', step: 3 });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Submit failed';
        dispatch({ type: 'SET_ERROR', error: msg });
      } finally {
        dispatch({ type: 'STOP_THINKING' });
      }
    },
    [state.sessionId],
  );

  const handleChassisSelect = useCallback(
    async (chassisId: string): Promise<void> => {
      if (!state.sessionId) return;
      dispatch({ type: 'START_THINKING', message: 'Searching proteins...' });
      try {
        const candidates = await submitChassis(state.sessionId, chassisId);
        dispatch({ type: 'SET_CHASSIS', chassisId });
        dispatch({ type: 'SET_PROTEIN_CANDIDATES', candidates });
        dispatch({ type: 'GOTO_STEP', step: 4 });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Submit failed';
        dispatch({ type: 'SET_ERROR', error: msg });
      } finally {
        dispatch({ type: 'STOP_THINKING' });
      }
    },
    [state.sessionId],
  );

  const handleProteinSelect = useCallback(
    async (proteinId: string): Promise<void> => {
      if (!state.sessionId) return;
      dispatch({ type: 'START_THINKING', message: 'Planning edits...' });
      try {
        const candidates = await submitProtein(state.sessionId, proteinId);
        dispatch({ type: 'SET_PROTEIN', proteinId });
        dispatch({ type: 'SET_EDIT_PLAN_CANDIDATES', candidates });
        dispatch({ type: 'GOTO_STEP', step: 5 });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Submit failed';
        dispatch({ type: 'SET_ERROR', error: msg });
      } finally {
        dispatch({ type: 'STOP_THINKING' });
      }
    },
    [state.sessionId],
  );

  const handleEditPlanSelect = useCallback(
    async (planId: string): Promise<void> => {
      if (!state.sessionId) return;
      dispatch({ type: 'START_THINKING', message: 'Confirming plan...' });
      try {
        await submitEditPlan(state.sessionId, planId);
        dispatch({ type: 'SET_EDIT_PLAN', planId });
        dispatch({ type: 'GOTO_STEP', step: 6 });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Submit failed';
        dispatch({ type: 'SET_ERROR', error: msg });
      } finally {
        dispatch({ type: 'STOP_THINKING' });
      }
    },
    [state.sessionId],
  );

  const handleSimulate = useCallback(async (): Promise<void> => {
    if (!state.sessionId) return;
    dispatch({ type: 'RESET_SIMULATION_STEPS' });
    dispatch({ type: 'START_THINKING', message: 'Simulating...' });
    await new Promise<void>((resolve) => {
      const unsubscribe = subscribeSimulation(
        state.sessionId!,
        (step) => dispatch({ type: 'APPEND_SIM_STEP', step }),
        () => {
          dispatch({ type: 'STOP_THINKING' });
          resolve();
        },
        (err) => {
          dispatch({ type: 'SET_ERROR', error: err.message });
          dispatch({ type: 'STOP_THINKING' });
          resolve();
        },
      );
      // Keep reference to satisfy no-unused-vars via void
      void unsubscribe;
    });
  }, [state.sessionId]);

  const rollbackTo = useCallback(
    async (step: number): Promise<void> => {
      if (!state.sessionId) return;
      if (step < 1 || step > 6) return;
      try {
        await apiRollback(state.sessionId, step);
        dispatch({ type: 'ROLLBACK_TO', step: step as DesignerStep });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Rollback failed';
        dispatch({ type: 'SET_ERROR', error: msg });
      }
    },
    [state.sessionId],
  );

  const contextValue: DesignerContextValue = {
    state,
    handleEnvironmentSubmit,
    handleMissionSelect,
    handleChassisSelect,
    handleProteinSelect,
    handleEditPlanSelect,
    handleSimulate,
    rollbackTo,
  };

  const suggestedPrompts = useMemo(() => {
    if (backendSuggestedPrompts.length > 0) {
      return backendSuggestedPrompts;
    }
    if (!state.environment) {
      return [
        '我想在火星土壤中构建固氮造土微生物',
        '先帮我设定火星表面环境',
        '我想做高辐射低水活度环境下的生物修复',
      ];
    }
    if (!state.selectedMissionId) {
      return [
        '推荐最适合当前环境的任务',
        '我想比较固氮造土和产氧固碳',
        '解释当前环境下最主要的生物风险',
      ];
    }
    if (!state.selectedChassisId) {
      return [
        '比较当前底盘候选',
        '选择最稳妥的底盘',
        '哪个底盘遗传可操作性更好',
      ];
    }
    if (!state.selectedProteinId) {
      return ['推荐功能蛋白', '解释蛋白候选风险', '选择最匹配任务的蛋白'];
    }
    if (!state.selectedEditPlanId) {
      return ['选择包含安全约束的编辑方案', '比较编辑方案', '解释代谢负担'];
    }
    return ['运行模拟验证', '解释当前设计状态', '我想回退一步重新选择'];
  }, [
    backendSuggestedPrompts,
    state.environment,
    state.selectedMissionId,
    state.selectedChassisId,
    state.selectedProteinId,
    state.selectedEditPlanId,
  ]);

  const handleCopilotPrompt = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || isCopilotResponding) return;
      const userMessage: CopilotMessage = {
        id: nextCopilotId('user'),
        role: 'user',
        content: trimmed,
      };
      setCopilotMessages((prev) => [...prev, userMessage]);
      setCopilotInput('');

      if (!state.sessionId) {
        const assistantMessage = buildCopilotResponse(trimmed, state);
        setCopilotMessages((prev) => [...prev, assistantMessage]);
        return;
      }

      setIsCopilotResponding(true);
      try {
        const response = await requestDesignerCopilot(state.sessionId, {
          message: trimmed,
          designer_state: buildDesignerStatePayload(state),
          current_step: state.currentStep,
          available_context: buildAvailableContextPayload(state),
        });
        const assistantMessage: CopilotMessage = {
          id: nextCopilotId('assistant'),
          role: 'assistant',
          content: appendWarningsToContent(response.message, response.warnings),
          actions: response.actions,
        };
        setCopilotMessages((prev) => [...prev, assistantMessage]);
        setBackendSuggestedPrompts(response.suggested_prompts);
      } catch (error: unknown) {
        const fallback = buildCopilotResponse(trimmed, state);
        const reason =
          error instanceof Error ? error.message : 'Designer Copilot backend unavailable';
        setCopilotMessages((prev) => [
          ...prev,
          {
            ...fallback,
            content: `后端 Copilot 暂不可用，已使用本地规则兜底。\n\n${reason}\n\n${fallback.content}`,
          },
        ]);
        setBackendSuggestedPrompts([]);
      } finally {
        setIsCopilotResponding(false);
      }
    },
    [isCopilotResponding, state],
  );

  const collapseAfterMutation = useCallback(() => {
    if (!pinnedOpen) {
      setPanelMode('rail');
    }
  }, [pinnedOpen]);

  const appendCopilotMessage = useCallback((content: string) => {
    setCopilotMessages((prev) => [
      ...prev,
      {
        id: nextCopilotId('assistant'),
        role: 'assistant',
        content,
      },
    ]);
  }, []);

  const handleCopilotAction = useCallback(
    async (action: CopilotAction) => {
      if (action.disabledReason) return;
      setBackendSuggestedPrompts([]);

      switch (action.type) {
        case 'apply_environment':
          await handleEnvironmentSubmit(action.payload.environment);
          setCopilotMessages((prev) => disableAction(prev, action.id, '已应用'));
          appendCopilotMessage('环境已应用。下一步可以选择任务目标。');
          collapseAfterMutation();
          return;
        case 'select_mission':
          await handleMissionSelect(action.payload.mission_id);
          setCopilotMessages((prev) => disableAction(prev, action.id, '已应用'));
          appendCopilotMessage('任务已选择，Designer 已开始生成底盘候选。');
          collapseAfterMutation();
          return;
        case 'select_chassis':
          if (!state.chassisCandidates.some((item) => item.id === action.payload.chassis_id)) {
            setCopilotMessages((prev) =>
              disableAction(prev, action.id, '候选已过期，请重新询问'),
            );
            return;
          }
          await handleChassisSelect(action.payload.chassis_id);
          setCopilotMessages((prev) => disableAction(prev, action.id, '已应用'));
          appendCopilotMessage('底盘已选择。下一步可以挑选功能蛋白。');
          collapseAfterMutation();
          return;
        case 'select_protein':
          if (!state.proteinCandidates.some((item) => item.id === action.payload.protein_id)) {
            setCopilotMessages((prev) =>
              disableAction(prev, action.id, '候选已过期，请重新询问'),
            );
            return;
          }
          await handleProteinSelect(action.payload.protein_id);
          setCopilotMessages((prev) => disableAction(prev, action.id, '已应用'));
          appendCopilotMessage('蛋白已选择。下一步可以确认编辑方案。');
          collapseAfterMutation();
          return;
        case 'select_edit_plan':
          if (
            !state.editPlanCandidates.some(
              (item) => item.id === action.payload.edit_plan_id,
            )
          ) {
            setCopilotMessages((prev) =>
              disableAction(prev, action.id, '候选已过期，请重新询问'),
            );
            return;
          }
          await handleEditPlanSelect(action.payload.edit_plan_id);
          setCopilotMessages((prev) => disableAction(prev, action.id, '已应用'));
          appendCopilotMessage('编辑方案已确认。可以运行模拟验证整体设计。');
          collapseAfterMutation();
          return;
        case 'run_simulation':
          await handleSimulate();
          setCopilotMessages((prev) => disableAction(prev, action.id, '已应用'));
          appendCopilotMessage('模拟已完成或已返回状态。结果会同步到设计状态栏。');
          collapseAfterMutation();
          return;
        case 'rollback_to_step':
          await rollbackTo(action.payload.step);
          setCopilotMessages((prev) => disableAction(prev, action.id, '已应用'));
          appendCopilotMessage(`已回退到 Step ${action.payload.step}。`);
          setPanelMode('expanded');
          return;
        case 'explain':
        case 'compare':
          setCopilotMessages((prev) => disableAction(prev, action.id, '已查看'));
          appendCopilotMessage(action.payload.assistant_message);
          return;
      }
    },
    [
      appendCopilotMessage,
      collapseAfterMutation,
      handleChassisSelect,
      handleEditPlanSelect,
      handleEnvironmentSubmit,
      handleMissionSelect,
      handleProteinSelect,
      handleSimulate,
      rollbackTo,
      state.chassisCandidates,
      state.editPlanCandidates,
      state.proteinCandidates,
    ],
  );

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex h-full min-h-0 flex-col p-5 md:p-8"
    >
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <Dna size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-headline font-semibold tracking-tight text-text">
              {t('designer.title')}
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              对话是主工作台，结构化状态随时可折叠查看。
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-text-dim">
          当前步骤：Step {state.currentStep} · {STEP_TITLES[state.currentStep]}
        </div>
      </div>

      {state.isSessionLoading && (
        <div className="mb-4 px-4 py-2 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs">
          Creating designer session...
        </div>
      )}

      {(state.sessionError || state.error) && (
        <div className="mb-4 px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs">
          {state.sessionError || state.error}
        </div>
      )}

      <DesignerContext.Provider value={contextValue}>
        <div className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row">
          <main className="flex min-w-0 flex-1 flex-col gap-4">
            <CopilotPanel
              messages={copilotMessages}
              inputValue={copilotInput}
              onInputChange={setCopilotInput}
              onSubmitPrompt={handleCopilotPrompt}
              applyAction={handleCopilotAction}
              suggestedPrompts={suggestedPrompts}
              isThinking={state.isThinking || isCopilotResponding}
              disabled={state.isSessionLoading || Boolean(state.sessionError)}
              className="min-h-[520px] flex-1"
            />

            <section className="rounded-xl border border-white/15 bg-card-translucent">
              <button
                type="button"
                onClick={() => setStructuredDetailOpen((open) => !open)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
              >
                <span>
                  <span className="block text-sm font-semibold text-text">
                    结构化详情 · Step {state.currentStep}
                  </span>
                  <span className="mt-0.5 block text-xs text-text-dim">
                    保留原六步 Designer 控件，按需展开手动调整。
                  </span>
                </span>
                {structuredDetailOpen ? (
                  <ChevronUp size={18} className="shrink-0 text-text-muted" />
                ) : (
                  <ChevronDown size={18} className="shrink-0 text-text-muted" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {structuredDetailOpen && (
                  <motion.div
                    key={state.currentStep}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-white/10"
                  >
                    <div className="p-4 md:p-6">
                      {renderStep(state.currentStep)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </main>

          <DesignStateRail
            panelMode={panelMode}
            pinnedOpen={pinnedOpen}
            onPanelModeChange={setPanelMode}
            onPinnedOpenChange={setPinnedOpen}
            className="xl:sticky xl:top-6 xl:self-start"
          />
        </div>
      </DesignerContext.Provider>
    </motion.div>
  );
}

// ============================================================================
// Step renderer
// ============================================================================

function renderStep(step: DesignerStep) {
  switch (step) {
    case 1:
      return <EnvironmentStep />;
    case 2:
      return <MissionStep />;
    case 3:
      return <ChassisStep />;
    case 4:
      return <ProteinStep />;
    case 5:
      return <GeneEditStep />;
    case 6:
      return <SimulationStep />;
    default:
      return null;
  }
}
