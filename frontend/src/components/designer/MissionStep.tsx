import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Atom,
  Leaf,
  Wind,
  Droplets,
  Biohazard,
  FlaskConical,
  Flame,
  Layers,
  Magnet,
  Radiation,
  Sprout,
  Recycle,
  Skull,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getMissionPresets } from "../../api/designer";
import type { MissionPreset } from "../../api/designer";
import { useDesigner } from "../../views/designer/DesignerContext";
import { useLocale } from "../../i18n/context";
import { viewTransition, fadeSlideUp, stagger } from "../../lib/motion";
import RollbackButton from "./RollbackButton";

type PresetLoadStatus = "loading" | "ready" | "fallback";

const FALLBACK_MISSION_PRESETS: MissionPreset[] = [
  {
    id: "mission_oxygen_carbon_fixation",
    name_zh: "产氧固碳",
    name_en: "Oxygen Production & Carbon Fixation",
    category: "atmosphere",
    goal_substance: "O2",
    consumed_substance: "CO2",
    icon_key: "leaf",
  },
  {
    id: "mission_nitrogen_fixation_soil",
    name_zh: "固氮造土",
    name_en: "Nitrogen Fixation & Soil Building",
    category: "soil",
    goal_substance: "NH3 / 有机氮",
    consumed_substance: "N2",
    icon_key: "sprout",
  },
  {
    id: "mission_heavy_metal_uptake",
    name_zh: "重金属富集回收",
    name_en: "Heavy Metal Bioaccumulation",
    category: "decontamination",
    goal_substance: "金属-蛋白复合物",
    consumed_substance: "Cd2+ / Pb2+ / Hg2+",
    icon_key: "magnet",
  },
  {
    id: "mission_radionuclide_immobilization",
    name_zh: "放射性核素固定",
    name_en: "Radionuclide Immobilization",
    category: "decontamination",
    goal_substance: "U(IV) 矿物沉淀",
    consumed_substance: "U(VI) / Tc(VII)",
    icon_key: "radiation",
  },
  {
    id: "mission_acid_neutralization",
    name_zh: "酸碱中和",
    name_en: "Acid-Base Neutralization",
    category: "water",
    goal_substance: "中性 pH 水体",
    consumed_substance: "H+ / 硫酸盐",
    icon_key: "droplet",
  },
  {
    id: "mission_plastic_degradation",
    name_zh: "塑料降解",
    name_en: "Plastic Degradation",
    category: "decontamination",
    goal_substance: "对苯二甲酸 / 乙二醇",
    consumed_substance: "PET 微塑料",
    icon_key: "recycle",
  },
  {
    id: "mission_oil_spill_remediation",
    name_zh: "油污降解",
    name_en: "Oil Spill Bioremediation",
    category: "decontamination",
    goal_substance: "CO2 + H2O",
    consumed_substance: "正构烷烃 / 多环芳烃",
    icon_key: "flame",
  },
  {
    id: "mission_organochlorine_degradation",
    name_zh: "有机氯农药降解",
    name_en: "Organochlorine Degradation",
    category: "soil",
    goal_substance: "Cl- + 有机酸",
    consumed_substance: "DDT / 林丹",
    icon_key: "skull",
  },
  {
    id: "mission_phosphate_release",
    name_zh: "磷酸盐释放",
    name_en: "Phosphate Solubilization",
    category: "soil",
    goal_substance: "可溶磷酸盐",
    consumed_substance: "矿物结合磷",
    icon_key: "atom",
  },
  {
    id: "mission_biofilm_soil_stabilization",
    name_zh: "生物膜固土",
    name_en: "Biofilm Soil Stabilization",
    category: "soil",
    goal_substance: "EPS 生物膜结壳",
    consumed_substance: "沙尘 / 有机碳",
    icon_key: "layers",
  },
];

const ICON_BY_KEY: Record<string, LucideIcon> = {
  atom: Atom,
  droplet: Droplets,
  flame: Flame,
  layers: Layers,
  leaf: Leaf,
  magnet: Magnet,
  radiation: Radiation,
  recycle: Recycle,
  skull: Skull,
  sprout: Sprout,
};

const ICON_BY_CATEGORY: Record<string, LucideIcon> = {
  atmosphere: Wind,
  decontamination: Biohazard,
  soil: Sprout,
  water: Droplets,
};

function getMissionName(preset: MissionPreset, locale: string) {
  return locale === "zh"
    ? preset.name_zh || preset.name_en
    : preset.name_en || preset.name_zh;
}

function getMissionIcon(preset: MissionPreset) {
  return (
    ICON_BY_KEY[preset.icon_key?.toLowerCase()] ??
    ICON_BY_CATEGORY[preset.category?.toLowerCase()] ??
    FlaskConical
  );
}

export default function MissionStep() {
  const { locale } = useLocale();
  const { state, handleMissionSelect } = useDesigner();
  const [missions, setMissions] = useState<MissionPreset[]>(FALLBACK_MISSION_PRESETS);
  const [presetStatus, setPresetStatus] = useState<PresetLoadStatus>("loading");
  const [presetError, setPresetError] = useState<string | null>(null);
  const isSessionBlocked =
    state.isSessionLoading || state.isThinking || Boolean(state.sessionError) || !state.sessionId;

  useEffect(() => {
    let cancelled = false;

    getMissionPresets()
      .then((items) => {
        if (cancelled) return;
        if (items.length > 0) {
          setMissions(items);
          setPresetStatus("ready");
          setPresetError(null);
          return;
        }
        setMissions(FALLBACK_MISSION_PRESETS);
        setPresetStatus("fallback");
        setPresetError("后端返回为空，已使用本地预设。");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setMissions(FALLBACK_MISSION_PRESETS);
        setPresetStatus("fallback");
        setPresetError(error instanceof Error ? error.message : "后端预设加载失败");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-10"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-headline text-text tracking-tight">Step 2 · 选择任务</h2>
          <p className="text-lg text-text-muted mt-2">
            根据环境特点，选择一个改造目标
          </p>
        </div>
        <RollbackButton label="重选环境" targetStep={1} />
      </div>

      {presetStatus === "loading" ? (
        <div className="text-sm text-text-dim -mt-5">正在同步后端任务预设...</div>
      ) : null}
      {presetStatus === "fallback" ? (
        <div className="text-sm text-amber-300/80 -mt-5">
          后端任务预设暂不可用，已使用本地预设{presetError ? `：${presetError}` : ""}
        </div>
      ) : null}

      <motion.div
        variants={stagger(50)}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {missions.map((m) => {
          const Icon = getMissionIcon(m);
          return (
            <motion.button
              key={m.id}
              variants={fadeSlideUp}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSessionBlocked}
              onClick={() => {
                if (!isSessionBlocked) void handleMissionSelect(m.id);
              }}
              className="text-left p-7 rounded-2xl border border-white/20 bg-card-translucent hover:border-primary/40 hover:bg-primary/[0.04] transition-all duration-300 group"
            >
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                  <Icon size={26} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xl font-semibold text-text mb-2">{getMissionName(m, locale)}</div>
                  <div className="text-base text-text-muted">
                    目标：<span className="text-success font-medium">{m.goal_substance}</span>
                  </div>
                  <div className="text-base text-text-muted mt-0.5">
                    消耗：<span className="text-text font-medium">{m.consumed_substance}</span>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
