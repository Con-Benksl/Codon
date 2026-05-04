import { createContext, useContext } from 'react';
import type {
  ChassisCandidate,
  EditPlanCandidate,
  EnvironmentVector,
  ProteinCandidate,
  SimulationStepData,
} from '../../api/designer';

export type DesignerStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface DesignerState {
  sessionId: number | null;
  activeProjectId: number | null;
  activeDesignId: number | null;
  activeProjectName: string | null;
  activeDesignName: string | null;
  isSessionLoading: boolean;
  sessionError: string | null;
  currentStep: DesignerStep;
  environment: EnvironmentVector | null;
  selectedMissionId: string | null;
  selectedChassisId: string | null;
  selectedProteinId: string | null;
  selectedEditPlanId: string | null;
  chassisCandidates: ChassisCandidate[];
  proteinCandidates: ProteinCandidate[];
  editPlanCandidates: EditPlanCandidate[];
  simulationSteps: SimulationStepData[];
  isThinking: boolean;
  thinkingMessage: string;
  error: string | null;
}

export interface DesignerContextValue {
  state: DesignerState;
  handleEnvironmentSubmit: (env: EnvironmentVector) => Promise<boolean>;
  handleMissionSelect: (missionId: string) => Promise<boolean>;
  handleChassisSelect: (chassisId: string) => Promise<boolean>;
  handleProteinSelect: (proteinId: string) => Promise<boolean>;
  handleEditPlanSelect: (planId: string) => Promise<boolean>;
  handleSimulate: () => Promise<boolean>;
  rollbackTo: (step: number) => Promise<boolean>;
}

export const DesignerContext = createContext<DesignerContextValue | null>(null);

export const useDesigner = (): DesignerContextValue => {
  const ctx = useContext(DesignerContext);
  if (!ctx) {
    throw new Error('useDesigner must be used inside DesignerProvider');
  }
  return ctx;
};
