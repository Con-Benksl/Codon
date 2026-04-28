import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Thermometer } from "lucide-react";
import { useDesigner } from "../../views/designer/DesignerContext";
import { getEnvironmentPresets } from "../../api/designer";
import type { EnvironmentPreset, EnvironmentVector } from "../../api/designer";
import { useLocale } from "../../i18n/context";
import { viewTransition, fadeSlideUp, stagger } from "../../lib/motion";

type PresetLoadStatus = "loading" | "ready" | "fallback";

const FALLBACK_ENVIRONMENT_PRESETS: EnvironmentPreset[] = [
  {
    id: "env_mars_surface",
    name_zh: "火星表面",
    name_en: "Mars Surface",
    location_type: "planetary_surface",
    environment_vector: {
      temperature: -63,
      ionizing_radiation: 230,
      uv_flux: 110,
      pressure: 0.6,
      ph: 8.3,
      salinity: 1.5,
      water_activity: 0.05,
      oxygen: 0.0013,
      temp_diurnal_range: 100,
    },
    description: "火星表面平均温度极低，大气稀薄，表面接收强烈的电离辐射与 UV，土壤含高氯酸盐，pH 弱碱性。",
    real_reference: "Mars (NASA Curiosity REMS / RAD)",
  },
  {
    id: "env_europa_subice_ocean",
    name_zh: "木卫二冰下海洋",
    name_en: "Europa Sub-ice Ocean",
    location_type: "icy_moon_ocean",
    environment_vector: {
      temperature: -2,
      ionizing_radiation: 5400,
      uv_flux: 0,
      pressure: 130000,
      ph: 8,
      salinity: 5,
      water_activity: 0.96,
      oxygen: 0.5,
      temp_diurnal_range: 0.5,
    },
    description: "木卫二冰壳之下推测存在液态咸水海洋，承受巨大流体静压，盐度高，海洋本身被冰壳屏蔽。",
    real_reference: "Europa (NASA Galileo / Europa Clipper)",
  },
  {
    id: "env_venus_cloud_50km",
    name_zh: "金星 50km 云层",
    name_en: "Venus Cloud Layer 50km",
    location_type: "atmospheric_aerosol",
    environment_vector: {
      temperature: 60,
      ionizing_radiation: 1.5,
      uv_flux: 280,
      pressure: 100,
      ph: 0.5,
      salinity: 0,
      water_activity: 0.1,
      oxygen: 0,
      temp_diurnal_range: 5,
    },
    description: "金星大气 50 km 高度温度与气压接近地表条件，但云层主要由浓硫酸液滴组成，pH 极低，水活度低。",
    real_reference: "Venus middle cloud layer (Venera / Pioneer Venus)",
  },
  {
    id: "env_deep_sea_hydrothermal_vent",
    name_zh: "深海热泉黑烟囱",
    name_en: "Deep-sea Hydrothermal Vent",
    location_type: "ocean_floor",
    environment_vector: {
      temperature: 90,
      ionizing_radiation: 0.5,
      uv_flux: 0,
      pressure: 25000,
      ph: 4.5,
      salinity: 3.5,
      water_activity: 0.97,
      oxygen: 0,
      temp_diurnal_range: 5,
    },
    description: "大洋中脊黑烟囱热液喷口周围梯度区高温高压，富含 H2S/Fe/Mn，近无氧厌氧环境。",
    real_reference: "East Pacific Rise / TAG Hydrothermal Field",
  },
  {
    id: "env_mcmurdo_dry_valleys",
    name_zh: "南极麦克默多干谷",
    name_en: "McMurdo Dry Valleys",
    location_type: "polar_desert",
    environment_vector: {
      temperature: -20,
      ionizing_radiation: 0.8,
      uv_flux: 35,
      pressure: 100,
      ph: 7.5,
      salinity: 0.5,
      water_activity: 0.6,
      oxygen: 21,
      temp_diurnal_range: 25,
    },
    description: "地球上最像火星的地方之一：长期低温干燥、低降水、强 UV，岩内微生物群落是主要生命形式。",
    real_reference: "McMurdo Dry Valleys, Antarctica",
  },
  {
    id: "env_atacama_desert",
    name_zh: "阿塔卡马沙漠核心区",
    name_en: "Atacama Desert Core",
    location_type: "hyperarid_desert",
    environment_vector: {
      temperature: 18,
      ionizing_radiation: 0.6,
      uv_flux: 90,
      pressure: 80,
      ph: 8,
      salinity: 4,
      water_activity: 0.15,
      oxygen: 18,
      temp_diurnal_range: 30,
    },
    description: "全球最干旱的非极地沙漠，土壤含高氯酸盐，UV 辐射极强，常被用作火星类比实验场。",
    real_reference: "Yungay region, Atacama Desert, Chile",
  },
  {
    id: "env_chernobyl_reactor4",
    name_zh: "切尔诺贝利 4 号反应堆石棺",
    name_en: "Chernobyl Reactor 4 Sarcophagus",
    location_type: "radioactive_zone",
    environment_vector: {
      temperature: 15,
      ionizing_radiation: 80000,
      uv_flux: 5,
      pressure: 101.3,
      ph: 6.5,
      salinity: 0.1,
      water_activity: 0.85,
      oxygen: 21,
      temp_diurnal_range: 10,
    },
    description: "切尔诺贝利核事故 4 号机组反应堆石棺内部辐射剂量极高，已发现真菌进行辐射趋向性生长。",
    real_reference: "Chernobyl Nuclear Power Plant Unit 4",
  },
  {
    id: "env_great_barrier_reef_acidified",
    name_zh: "大堡礁酸化区",
    name_en: "Great Barrier Reef Acidified Zone",
    location_type: "coastal_ocean",
    environment_vector: {
      temperature: 28,
      ionizing_radiation: 0.3,
      uv_flux: 50,
      pressure: 200,
      ph: 7.7,
      salinity: 3.6,
      water_activity: 0.98,
      oxygen: 6.5,
      temp_diurnal_range: 4,
    },
    description: "海洋酸化与热应激双重压力下的珊瑚礁带，珊瑚共生藻白化频发。",
    real_reference: "Great Barrier Reef, Australia",
  },
  {
    id: "env_dead_sea",
    name_zh: "死海",
    name_en: "Dead Sea",
    location_type: "hypersaline_lake",
    environment_vector: {
      temperature: 25,
      ionizing_radiation: 0.5,
      uv_flux: 60,
      pressure: 106,
      ph: 6,
      salinity: 34,
      water_activity: 0.67,
      oxygen: 8,
      temp_diurnal_range: 15,
    },
    description: "全球盐度最高的水体之一，富含 MgCl2 与 CaCl2，水活度低，仅极端嗜盐古菌可生长。",
    real_reference: "Dead Sea, Israel/Jordan",
  },
  {
    id: "env_yellowstone_hotspring",
    name_zh: "黄石公园酸性温泉",
    name_en: "Yellowstone Acidic Hot Spring",
    location_type: "geothermal_spring",
    environment_vector: {
      temperature: 80,
      ionizing_radiation: 0.3,
      uv_flux: 40,
      pressure: 90,
      ph: 2.5,
      salinity: 0.3,
      water_activity: 0.99,
      oxygen: 6,
      temp_diurnal_range: 5,
    },
    description: "黄石公园酸性温泉群，温度高、pH 低，是嗜热嗜酸微生物的典型生境。",
    real_reference: "Norris Geyser Basin, Yellowstone NP, USA",
  },
  {
    id: "env_lake_vostok",
    name_zh: "东方湖（南极冰下湖）",
    name_en: "Lake Vostok Subglacial",
    location_type: "subglacial_lake",
    environment_vector: {
      temperature: -3,
      ionizing_radiation: 0.2,
      uv_flux: 0,
      pressure: 35000,
      ph: 6.5,
      salinity: 0.05,
      water_activity: 0.95,
      oxygen: 50,
      temp_diurnal_range: 0,
    },
    description: "封存于南极冰盖之下的淡水湖，全黑无光、高压、富氧，被视为木卫二类比环境。",
    real_reference: "Lake Vostok, Antarctica",
  },
];

interface SliderDef {
  key: keyof EnvironmentVector;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

const SLIDERS: SliderDef[] = [
  { key: "temperature", label: "温度", unit: "°C", min: -100, max: 150, step: 1, defaultValue: 20 },
  { key: "ionizing_radiation", label: "电离辐射", unit: "mSv/y", min: 0, max: 80000, step: 1, defaultValue: 3 },
  { key: "uv_flux", label: "UV 通量", unit: "W/m²", min: 0, max: 300, step: 1, defaultValue: 30 },
  { key: "pressure", label: "压力", unit: "kPa", min: 0, max: 130000, step: 0.1, defaultValue: 101.3 },
  { key: "ph", label: "pH", unit: "", min: 0, max: 14, step: 0.1, defaultValue: 7 },
  { key: "salinity", label: "盐度", unit: "%", min: 0, max: 40, step: 0.1, defaultValue: 0.5 },
  { key: "water_activity", label: "水活度", unit: "aw", min: 0, max: 1, step: 0.01, defaultValue: 0.8 },
  { key: "oxygen", label: "氧含量", unit: "kPa", min: 0, max: 60, step: 0.1, defaultValue: 21 },
  { key: "temp_diurnal_range", label: "温度日变化", unit: "°C", min: 0, max: 100, step: 1, defaultValue: 10 },
];

function getEnvironmentName(preset: EnvironmentPreset, locale: string) {
  return locale === "zh"
    ? preset.name_zh || preset.name_en
    : preset.name_en || preset.name_zh;
}

export default function EnvironmentStep() {
  const { locale } = useLocale();
  const { state, handleEnvironmentSubmit } = useDesigner();
  const initial = Object.fromEntries(
    SLIDERS.map((s) => [s.key, s.defaultValue]),
  ) as unknown as EnvironmentVector;
  const [env, setEnv] = useState<EnvironmentVector>(initial);
  const [touched, setTouched] = useState<Set<keyof EnvironmentVector>>(new Set());
  const [presetPicked, setPresetPicked] = useState(false);
  const [presets, setPresets] = useState<EnvironmentPreset[]>(FALLBACK_ENVIRONMENT_PRESETS);
  const [presetStatus, setPresetStatus] = useState<PresetLoadStatus>("loading");
  const [presetError, setPresetError] = useState<string | null>(null);

  const canSubmit = presetPicked || touched.size >= 9;
  const isSessionBlocked =
    state.isSessionLoading || state.isThinking || Boolean(state.sessionError) || !state.sessionId;

  useEffect(() => {
    let cancelled = false;

    getEnvironmentPresets()
      .then((items) => {
        if (cancelled) return;
        if (items.length > 0) {
          setPresets(items);
          setPresetStatus("ready");
          setPresetError(null);
          return;
        }
        setPresets(FALLBACK_ENVIRONMENT_PRESETS);
        setPresetStatus("fallback");
        setPresetError("后端返回为空，已使用本地预设。");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setPresets(FALLBACK_ENVIRONMENT_PRESETS);
        setPresetStatus("fallback");
        setPresetError(error instanceof Error ? error.message : "后端预设加载失败");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const onSlide = (key: keyof EnvironmentVector, value: number) => {
    setEnv((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const onPreset = (preset: EnvironmentPreset) => {
    setEnv(preset.environment_vector);
    setPresetPicked(true);
    void handleEnvironmentSubmit(preset.environment_vector);
  };

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-10"
    >
      <div>
        <h2 className="text-3xl font-headline text-text tracking-tight">Step 1 · 环境定义</h2>
        <p className="text-lg text-text-muted mt-2">
          选择预设场景，或手动调节 9 维环境参数
        </p>
      </div>

      {/* 预设卡片横向滚动 */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="text-sm uppercase tracking-[0.2em] text-text-dim">
            预设场景
          </div>
          {presetStatus === "loading" ? (
            <div className="text-xs text-text-dim">正在同步后端预设...</div>
          ) : null}
          {presetStatus === "fallback" ? (
            <div className="text-xs text-amber-300/80">
              后端预设暂不可用，已使用本地预设{presetError ? `：${presetError}` : ""}
            </div>
          ) : null}
        </div>
        <motion.div
          variants={stagger(40)}
          initial="hidden"
          animate="show"
          className="flex gap-5 overflow-x-auto pb-3 -mx-2 px-2"
        >
          {presets.map((p) => (
            <motion.button
              key={p.id}
              variants={fadeSlideUp}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPreset(p)}
              disabled={isSessionBlocked}
              className="flex-shrink-0 w-60 text-left p-6 rounded-2xl border border-white/20 bg-card-translucent hover:border-primary/40 hover:bg-primary/[0.04] transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Thermometer size={20} className="text-primary" />
                </div>
                <div className="text-lg font-semibold text-text">{getEnvironmentName(p, locale)}</div>
              </div>
              <div className="text-sm text-text-muted leading-relaxed">
                {p.description}
              </div>
              {p.real_reference ? (
                <div className="text-xs text-text-dim leading-relaxed mt-3">
                  参考：{p.real_reference}
                </div>
              ) : null}
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* 9 滑块 */}
      <div>
        <div className="text-sm uppercase tracking-[0.2em] text-text-dim mb-4">
          精细调节（{touched.size}/9）
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SLIDERS.map((s) => {
            const value = env[s.key];
            const pct = Math.max(0, Math.min(100, ((value - s.min) / (s.max - s.min)) * 100));
            return (
              <div
                key={s.key}
                className="p-6 rounded-2xl border border-white/20 bg-card-translucent"
              >
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-base text-text-muted font-medium">{s.label}</span>
                  <span className="text-lg font-mono text-primary tabular-nums">
                    {typeof value === "number" ? value.toFixed(s.step < 1 ? 2 : 0) : value}
                    <span className="text-text-dim ml-1.5 text-xs">{s.unit}</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={value}
                  onChange={(e) => onSlide(s.key, parseFloat(e.target.value))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                  style={{
                    background: `linear-gradient(to right, rgb(56 189 248) 0%, rgb(56 189 248) ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-text-dim mt-2 font-mono tabular-nums">
                  <span>{s.min}</span>
                  <span>{s.max}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 下一步 */}
      <div className="flex justify-end pt-3">
        <motion.button
          whileHover={canSubmit ? { x: 2 } : undefined}
          whileTap={canSubmit ? { scale: 0.97 } : undefined}
          disabled={!canSubmit || isSessionBlocked}
          onClick={() => {
            if (canSubmit && !isSessionBlocked) void handleEnvironmentSubmit(env);
          }}
          className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl text-lg font-semibold transition-colors ${
            canSubmit && !isSessionBlocked
              ? "bg-primary text-bg hover:bg-primary/90"
              : "bg-card text-text-dim border border-border cursor-not-allowed"
          }`}
        >
          下一步 · 选择任务
          <ArrowRight size={20} />
        </motion.button>
      </div>
    </motion.div>
  );
}
