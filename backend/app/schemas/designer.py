"""Designer 6-step 流程的 Pydantic schemas（骨架 / mock 阶段）。"""
from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


# ---------- 环境向量 ----------

class EnvironmentVector(BaseModel):
    temperature: float = Field(..., description="平均温度 (°C)")
    ionizing_radiation: float = Field(..., description="电离辐射 (mSv/year)")
    uv_flux: float = Field(..., description="UV 通量 (W/m^2)")
    pressure: float = Field(..., description="气压 (kPa)")
    ph: float = Field(..., description="pH 值")
    salinity: float = Field(..., description="盐度 (%)")
    water_activity: float = Field(..., description="水活度 aw (0-1)")
    oxygen: float = Field(..., description="氧气分压 (kPa)")
    temp_diurnal_range: float = Field(..., description="昼夜温差 (°C)")


class EnvironmentPreset(BaseModel):
    id: str
    name_zh: str
    name_en: str
    location_type: str
    environment_vector: EnvironmentVector
    description: str
    real_reference: str


# ---------- 任务 ----------

class MissionPreset(BaseModel):
    id: str
    name_zh: str
    name_en: str
    category: str
    goal_substance: str
    consumed_substance: str
    icon_key: str


# ---------- 底盘 ----------

class ToleranceRange(BaseModel):
    min: float
    max: float


class ChassisTolerance(BaseModel):
    temperature: ToleranceRange
    ionizing_radiation: ToleranceRange
    uv_flux: ToleranceRange
    pressure: ToleranceRange
    ph: ToleranceRange
    salinity: ToleranceRange
    water_activity: ToleranceRange
    oxygen: ToleranceRange
    temp_diurnal_range: ToleranceRange


class ChassisCandidate(BaseModel):
    id: str
    scientific_name: str
    common_name: str
    ncbi_taxid: str
    tolerance: ChassisTolerance
    chassis_status: str
    genetic_tractability: str
    match_score: float
    recommendation_reason: str


# ---------- 蛋白 ----------

class ProteinKinetics(BaseModel):
    kcat: float
    km: float
    optimal_temp: float
    optimal_ph: float


class ProteinEffectVector(BaseModel):
    co2_delta: float
    o2_delta: float
    organics_delta: float
    toxin_delta: float
    ph_buffer: float
    heavy_metal_fix: float


class ProteinCandidate(BaseModel):
    id: str
    name: str
    ec_number: str
    source_organism: str
    uniprot_id: str
    kinetics: ProteinKinetics
    expected_effect_vector: ProteinEffectVector
    llm_explanation: str
    brenda_url: str
    uniprot_url: str


# ---------- 编辑方案 ----------

class EditPlanCandidate(BaseModel):
    id: str
    target_gene: str
    source: str
    strategy: str
    delivery_vector: str
    promoter: str
    codon_optimization_note: str
    metabolic_burden: str
    has_kill_switch: bool
    references: List[str] = Field(default_factory=list)


# ---------- 模拟 ----------

class SimulationStep(BaseModel):
    time: float
    population: float
    env_target: float
    nutrient: float


class SimulationResult(BaseModel):
    steps: List[SimulationStep]
    notes: str


# ---------- 会话状态 ----------

class DesignerSessionState(BaseModel):
    id: int
    current_step: int
    environment: Optional[EnvironmentVector] = None
    mission_id: Optional[str] = None
    chassis_id: Optional[str] = None
    protein_id: Optional[str] = None
    edit_plan: Optional[EditPlanCandidate] = None
    simulation_result: Optional[SimulationResult] = None


# ---------- 请求体 ----------

class CreateSessionRequest(BaseModel):
    project_id: Optional[int] = None


class CreateSessionResponse(BaseModel):
    sid: int


class SubmitEnvironmentRequest(BaseModel):
    environment: EnvironmentVector


class SubmitMissionRequest(BaseModel):
    mission_id: str


class SubmitChassisRequest(BaseModel):
    chassis_id: str


class SubmitProteinRequest(BaseModel):
    protein_id: str


class SubmitEditPlanRequest(BaseModel):
    edit_plan_id: str
    edit_plan: Optional[EditPlanCandidate] = None


class RollbackRequest(BaseModel):
    step: int = Field(..., ge=1, le=6)


class AckResponse(BaseModel):
    ok: bool = True
    current_step: int


# ---------- Designer Copilot ----------

CopilotActionType = Literal[
    "apply_environment",
    "select_mission",
    "select_chassis",
    "select_protein",
    "select_edit_plan",
    "run_simulation",
    "rollback_to_step",
    "explain",
    "compare",
]


class CopilotAction(BaseModel):
    id: str
    type: CopilotActionType
    label: str
    description: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    preview: List[str] = Field(default_factory=list)
    requiresConfirmation: bool = True
    disabledReason: Optional[str] = None


class CopilotWarning(BaseModel):
    level: Literal["info", "warning", "danger"]
    message: str
    code: Optional[str] = None


class CopilotRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    designer_state: Optional[Dict[str, Any]] = None
    current_step: Optional[int] = Field(default=None, ge=1, le=6)
    available_context: Dict[str, Any] = Field(default_factory=dict)


class CopilotResponse(BaseModel):
    message: str
    actions: List[CopilotAction] = Field(default_factory=list)
    suggested_prompts: List[str] = Field(default_factory=list)
    warnings: List[CopilotWarning] = Field(default_factory=list)
