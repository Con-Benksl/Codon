import { useCallback, useEffect, useReducer } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Dna } from 'lucide-react';
import { useLocale } from '../i18n/context';
import { viewTransition } from '../lib/motion';
import {
  createSession,
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
import AgentThinking from '../components/designer/AgentThinking';

// ============================================================================
// Reducer
// ============================================================================

type Action =
  | { type: 'SESSION_CREATED'; sessionId: number }
  | { type: 'SET_ENVIRONMENT'; environment: EnvironmentVector }
  | { type: 'SET_MISSION'; missionId: string }
  | { type: 'SET_CHASSIS_CANDIDATES'; candidates: ChassisCandidate[] }
  | { type: 'SET_CHASSIS'; chassisId: string }
  | { type: 'SET_PROTEIN_CANDIDATES'; candidates: ProteinCandidate[] }
  | { type: 'SET_PROTEIN'; proteinId: string }
  | { type: 'SET_EDIT_PLAN_CANDIDATES'; candidates: EditPlanCandidate[] }
  | { type: 'SET_EDIT_PLAN'; planId: string }
  | { type: 'APPEND_SIM_STEP'; step: SimulationStepData }
  | { type: 'START_THINKING'; message: string }
  | { type: 'STOP_THINKING' }
  | { type: 'GOTO_STEP'; step: DesignerStep }
  | { type: 'ROLLBACK_TO'; step: DesignerStep }
  | { type: 'SET_ERROR'; error: string | null };

const initialState: DesignerState = {
  sessionId: null,
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
    case 'SESSION_CREATED':
      return { ...state, sessionId: action.sessionId };
    case 'SET_ENVIRONMENT':
      return { ...state, environment: action.environment };
    case 'SET_MISSION':
      return { ...state, selectedMissionId: action.missionId };
    case 'SET_CHASSIS_CANDIDATES':
      return { ...state, chassisCandidates: action.candidates };
    case 'SET_CHASSIS':
      return { ...state, selectedChassisId: action.chassisId };
    case 'SET_PROTEIN_CANDIDATES':
      return { ...state, proteinCandidates: action.candidates };
    case 'SET_PROTEIN':
      return { ...state, selectedProteinId: action.proteinId };
    case 'SET_EDIT_PLAN_CANDIDATES':
      return { ...state, editPlanCandidates: action.candidates };
    case 'SET_EDIT_PLAN':
      return { ...state, selectedEditPlanId: action.planId };
    case 'APPEND_SIM_STEP':
      return {
        ...state,
        simulationSteps: [...state.simulationSteps, action.step],
      };
    case 'START_THINKING':
      return { ...state, isThinking: true, thinkingMessage: action.message };
    case 'STOP_THINKING':
      return { ...state, isThinking: false, thinkingMessage: '' };
    case 'GOTO_STEP':
      return { ...state, currentStep: action.step };
    case 'ROLLBACK_TO':
      return { ...state, currentStep: action.step };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    default:
      return state;
  }
}

// ============================================================================
// Helpers
// ============================================================================

const STEPS: readonly DesignerStep[] = [1, 2, 3, 4, 5, 6] as const;

const STEP_LABELS_ZH: Record<DesignerStep, string> = {
  1: '环境',
  2: '任务',
  3: '底盘',
  4: '蛋白',
  5: '编辑',
  6: '模拟',
};

const STEP_LABELS_EN: Record<DesignerStep, string> = {
  1: 'Environment',
  2: 'Mission',
  3: 'Chassis',
  4: 'Protein',
  5: 'Edit',
  6: 'Simulate',
};

// ============================================================================
// View
// ============================================================================

export default function DesignerView() {
  const { t, locale } = useLocale();
  const [state, dispatch] = useReducer(reducer, initialState);

  // Mount: create session
  useEffect(() => {
    let cancelled = false;
    createSession()
      .then((res) => {
        if (!cancelled) {
          dispatch({ type: 'SESSION_CREATED', sessionId: res.id });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to create session';
        dispatch({ type: 'SET_ERROR', error: msg });
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

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col h-full p-8 md:p-12"
    >
      {/* Header */}
      <div className="flex items-center gap-5 mb-10">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Dna size={28} className="text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-headline font-semibold text-text tracking-tight">
            {t('designer.title')}
          </h1>
          <p className="text-lg text-text-muted mt-1">
            {t('designer.subtitle')}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center justify-between mb-12 px-2">
        {STEPS.map((s, idx) => {
          const isActive = state.currentStep === s;
          const isDone = state.currentStep > s;
          const label =
            locale === 'zh' ? STEP_LABELS_ZH[s] : STEP_LABELS_EN[s];
          return (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <motion.button
                  type="button"
                  onClick={() => {
                    if (isDone) void rollbackTo(s);
                  }}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isActive
                      ? 'rgba(56,189,248,0.2)'
                      : isDone
                        ? 'rgba(56,189,248,0.1)'
                        : 'rgba(255,255,255,0.03)',
                  }}
                  className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-lg font-mono font-semibold ${
                    isActive
                      ? 'border-primary text-primary'
                      : isDone
                        ? 'border-primary/40 text-primary/80 cursor-pointer'
                        : 'border-white/10 text-text-dim'
                  }`}
                >
                  {s}
                </motion.button>
                <span
                  className={`text-sm mt-2.5 font-medium ${
                    isActive ? 'text-primary' : 'text-text-dim'
                  }`}
                >
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-3 bg-white/10 relative">
                  <motion.div
                    className="absolute inset-0 bg-primary/60 origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: state.currentStep > s ? 1 : 0 }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error banner */}
      {state.error && (
        <div className="mb-4 px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs">
          {state.error}
        </div>
      )}

      {/* Step content */}
      <DesignerContext.Provider value={contextValue}>
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentStep}
              variants={viewTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full"
            >
              {renderStep(state.currentStep)}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Agent thinking (global floating) */}
        <AgentThinking
          message={state.thinkingMessage || 'Agent thinking...'}
          visible={state.isThinking}
        />
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
