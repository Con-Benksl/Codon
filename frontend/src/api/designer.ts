import { apiClient, getApiBaseUrl } from './client';

// ============================================================================
// Types (aligned with backend designer schemas)
// ============================================================================

export interface EnvironmentVector {
  temperature: number;
  ionizing_radiation: number;
  uv_flux: number;
  pressure: number;
  ph: number;
  salinity: number;
  water_activity: number;
  oxygen: number;
  temp_diurnal_range: number;
}

export interface EnvironmentPreset {
  id: string;
  name_zh: string;
  name_en: string;
  location_type: string;
  environment_vector: EnvironmentVector;
  description: string;
  real_reference: string;
}

export interface MissionPreset {
  id: string;
  name_zh: string;
  name_en: string;
  category: string;
  goal_substance: string;
  consumed_substance: string;
  icon_key: string;
}

export type ChassisStatus =
  | 'established_chassis'
  | 'emerging_chassis'
  | 'wild_extremophile';

export type GeneticTractability = 'high' | 'medium' | 'low';

export interface ToleranceRange {
  min: number;
  max: number;
}

export interface ChassisTolerance {
  temperature: ToleranceRange;
  ionizing_radiation: ToleranceRange;
  uv_flux: ToleranceRange;
  pressure: ToleranceRange;
  ph: ToleranceRange;
  salinity: ToleranceRange;
  water_activity: ToleranceRange;
  oxygen: ToleranceRange;
  temp_diurnal_range: ToleranceRange;
}

export interface ChassisCandidate {
  id: string;
  scientific_name: string;
  common_name: string;
  ncbi_taxid: string;
  tolerance: ChassisTolerance;
  chassis_status: ChassisStatus;
  genetic_tractability: GeneticTractability;
  match_score: number;
  recommendation_reason: string;
}

export interface ProteinKinetics {
  kcat: number;
  km: number;
  optimal_temp: number;
  optimal_ph: number;
}

export interface ExpectedEffectVector {
  co2_delta: number;
  o2_delta: number;
  organics_delta: number;
  toxin_delta: number;
  ph_buffer: number;
  heavy_metal_fix: number;
}

export interface ProteinCandidate {
  id: string;
  name: string;
  ec_number: string;
  source_organism: string;
  uniprot_id: string;
  kinetics: ProteinKinetics;
  expected_effect_vector: ExpectedEffectVector;
  llm_explanation: string;
  brenda_url: string;
  uniprot_url: string;
}

export interface EditPlanCandidate {
  id: string;
  target_gene: string;
  source: string;
  strategy: string;
  delivery_vector: string;
  promoter: string;
  codon_optimization_note: string;
  metabolic_burden: string;
  has_kill_switch: boolean;
  references: string[];
}

export interface SimulationStepData {
  time: number;
  population: number;
  env_target: number;
  nutrient: number;
}

export interface DesignerSessionState {
  id: number;
  current_step: 1 | 2 | 3 | 4 | 5 | 6;
  environment?: EnvironmentVector | null;
  mission_id?: string | null;
  chassis_id?: string | null;
  protein_id?: string | null;
  edit_plan?: EditPlanCandidate | null;
  simulation_result?: SimulationStepData[] | null;
}

// ============================================================================
// API functions
// ============================================================================

export const createSession = async (
  projectId?: number,
): Promise<{ id: number }> => {
  const response = await apiClient.post('/designer/sessions', {
    project_id: projectId ?? null,
  });
  const data = response.data;
  const id = data?.id ?? data?.sid;
  if (typeof id !== 'number') {
    throw new Error('createSession: invalid response shape');
  }
  return { id };
};

export const getEnvironmentPresets = async (): Promise<EnvironmentPreset[]> => {
  const response = await apiClient.get('/designer/presets/environments');
  const data = response.data;
  return Array.isArray(data) ? data : (data?.items ?? []);
};

export const getMissionPresets = async (): Promise<MissionPreset[]> => {
  const response = await apiClient.get('/designer/presets/missions');
  const data = response.data;
  return Array.isArray(data) ? data : (data?.items ?? []);
};

export const submitEnvironment = async (
  sid: number,
  env: EnvironmentVector,
): Promise<{ ok: true }> => {
  const response = await apiClient.post(
    `/designer/sessions/${sid}/environment`,
    { environment: env },
  );
  return response.data;
};

export const submitMission = async (
  sid: number,
  missionId: string,
): Promise<ChassisCandidate[]> => {
  const response = await apiClient.post(`/designer/sessions/${sid}/mission`, {
    mission_id: missionId,
  });
  const data = response.data;
  return Array.isArray(data) ? data : (data?.candidates ?? data?.items ?? []);
};

export const submitChassis = async (
  sid: number,
  chassisId: string,
): Promise<ProteinCandidate[]> => {
  const response = await apiClient.post(`/designer/sessions/${sid}/chassis`, {
    chassis_id: chassisId,
  });
  const data = response.data;
  return Array.isArray(data) ? data : (data?.candidates ?? data?.items ?? []);
};

export const submitProtein = async (
  sid: number,
  proteinId: string,
): Promise<EditPlanCandidate[]> => {
  const response = await apiClient.post(`/designer/sessions/${sid}/protein`, {
    protein_id: proteinId,
  });
  const data = response.data;
  return Array.isArray(data) ? data : (data?.candidates ?? data?.items ?? []);
};

export const submitEditPlan = async (
  sid: number,
  planId: string,
): Promise<{ ok: true }> => {
  const response = await apiClient.post(
    `/designer/sessions/${sid}/edit-plan`,
    { edit_plan_id: planId },
  );
  return response.data;
};

export const getSession = async (
  sid: number,
): Promise<DesignerSessionState> => {
  const response = await apiClient.get(`/designer/sessions/${sid}`);
  return response.data;
};

export const rollback = async (
  sid: number,
  toStep: number,
): Promise<DesignerSessionState> => {
  const response = await apiClient.post(
    `/designer/sessions/${sid}/rollback`,
    { step: toStep },
  );
  return response.data;
};

// ============================================================================
// SSE subscription for simulation (fetch + ReadableStream to support JWT)
// ============================================================================

export function subscribeSimulation(
  sid: number,
  onStep: (step: SimulationStepData) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): () => void {
  const controller = new AbortController();
  const token = localStorage.getItem('access_token');
  fetch(`${getApiBaseUrl()}/designer/sessions/${sid}/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: controller.signal,
    credentials: 'include',
  })
    .then(async (resp) => {
      if (!resp.ok || !resp.body) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() ?? '';
        for (const block of blocks) {
          if (!block.trim()) continue;
          const lines = block.split('\n');
          const eventLine = lines.find((l) => l.startsWith('event:'));
          const dataLine = lines.find((l) => l.startsWith('data:'));
          if (!dataLine) continue;
          let parsed: unknown;
          try {
            parsed = JSON.parse(dataLine.slice(5).trim());
          } catch {
            continue;
          }
          const eventType = eventLine?.slice(6).trim() ?? 'message';
          if (eventType === 'done') {
            onDone();
            return;
          }
          if (eventType === 'error') {
            const msg =
              typeof parsed === 'object' && parsed && 'message' in parsed
                ? String((parsed as { message: unknown }).message)
                : 'Simulation error';
            onError(new Error(msg));
            return;
          }
          // Backend may wrap the step in {index, total, step: {...}} or send the
          // step fields directly. Unwrap if needed.
          const payload = parsed as Record<string, unknown>;
          const stepData =
            payload && typeof payload === 'object' && 'step' in payload
              ? (payload.step as SimulationStepData)
              : (parsed as SimulationStepData);
          onStep(stepData);
        }
      }
      onDone();
    })
    .catch((err: unknown) => {
      if (err instanceof Error) {
        if (err.name === 'AbortError') return;
        onError(err);
      } else {
        onError(new Error('Unknown simulation error'));
      }
    });
  return () => controller.abort();
}
