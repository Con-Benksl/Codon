import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Thermometer } from "lucide-react";
import { useDesigner } from "../../views/designer/DesignerContext";
import type { EnvironmentVector } from "../../api/designer";
import { viewTransition, fadeSlideUp, stagger } from "../../lib/motion";

interface EnvPreset {
  id: string;
  name: string;
  description: string;
  env: EnvironmentVector;
}

// Mock 预设：9 字段齐全，数值为教学级近似
const PRESETS: EnvPreset[] = [
  {
    id: "mars_surface",
    name: "火星表面",
    description: "极寒、强辐射、稀薄大气",
    env: {
      temperature: -60,
      ionizing_radiation: 250,
      uv_flux: 95,
      pressure: 0.006,
      ph: 7.5,
      salinity: 8,
      water_activity: 0.15,
      oxygen: 0.1,
      temp_diurnal_range: 80,
    },
  },
  {
    id: "europa_subsurface",
    name: "木卫二冰下",
    description: "高压、低温、咸水海洋",
    env: {
      temperature: -2,
      ionizing_radiation: 540,
      uv_flux: 0,
      pressure: 200,
      ph: 8.2,
      salinity: 35,
      water_activity: 0.95,
      oxygen: 1,
      temp_diurnal_range: 1,
    },
  },
  {
    id: "venus_clouds",
    name: "金星云层",
    description: "高温、强酸、硫酸气溶胶",
    env: {
      temperature: 60,
      ionizing_radiation: 40,
      uv_flux: 180,
      pressure: 0.5,
      ph: 0.5,
      salinity: 2,
      water_activity: 0.3,
      oxygen: 0,
      temp_diurnal_range: 20,
    },
  },
  {
    id: "deep_sea_vent",
    name: "深海热泉",
    description: "极高温、高压、硫化物",
    env: {
      temperature: 110,
      ionizing_radiation: 2,
      uv_flux: 0,
      pressure: 250,
      ph: 4,
      salinity: 40,
      water_activity: 0.98,
      oxygen: 0.5,
      temp_diurnal_range: 2,
    },
  },
  {
    id: "mcmurdo",
    name: "南极麦克默多",
    description: "极寒、干燥、强紫外",
    env: {
      temperature: -30,
      ionizing_radiation: 5,
      uv_flux: 60,
      pressure: 1,
      ph: 7,
      salinity: 10,
      water_activity: 0.6,
      oxygen: 21,
      temp_diurnal_range: 15,
    },
  },
  {
    id: "atacama",
    name: "阿塔卡马",
    description: "超干旱、高紫外",
    env: {
      temperature: 20,
      ionizing_radiation: 3,
      uv_flux: 80,
      pressure: 0.7,
      ph: 8,
      salinity: 15,
      water_activity: 0.1,
      oxygen: 20,
      temp_diurnal_range: 25,
    },
  },
  {
    id: "chernobyl",
    name: "切尔诺贝利",
    description: "高辐射、温带森林",
    env: {
      temperature: 10,
      ionizing_radiation: 120,
      uv_flux: 30,
      pressure: 1,
      ph: 6.5,
      salinity: 2,
      water_activity: 0.8,
      oxygen: 21,
      temp_diurnal_range: 12,
    },
  },
  {
    id: "reef_acidified",
    name: "大堡礁酸化区",
    description: "升温、海水酸化",
    env: {
      temperature: 29,
      ionizing_radiation: 2,
      uv_flux: 55,
      pressure: 1.2,
      ph: 7.8,
      salinity: 36,
      water_activity: 0.98,
      oxygen: 18,
      temp_diurnal_range: 4,
    },
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
  { key: "ionizing_radiation", label: "电离辐射", unit: "mSv/y", min: 0, max: 600, step: 1, defaultValue: 3 },
  { key: "uv_flux", label: "UV 通量", unit: "W/m²", min: 0, max: 200, step: 1, defaultValue: 30 },
  { key: "pressure", label: "压力", unit: "atm", min: 0, max: 300, step: 0.1, defaultValue: 1 },
  { key: "ph", label: "pH", unit: "", min: 0, max: 14, step: 0.1, defaultValue: 7 },
  { key: "salinity", label: "盐度", unit: "ppt", min: 0, max: 50, step: 0.5, defaultValue: 5 },
  { key: "water_activity", label: "水活度", unit: "aw", min: 0, max: 1, step: 0.01, defaultValue: 0.8 },
  { key: "oxygen", label: "氧含量", unit: "%", min: 0, max: 100, step: 0.1, defaultValue: 21 },
  { key: "temp_diurnal_range", label: "温度日变化", unit: "°C", min: 0, max: 100, step: 1, defaultValue: 10 },
];

export default function EnvironmentStep() {
  const { handleEnvironmentSubmit } = useDesigner();
  const initial = Object.fromEntries(
    SLIDERS.map((s) => [s.key, s.defaultValue]),
  ) as unknown as EnvironmentVector;
  const [env, setEnv] = useState<EnvironmentVector>(initial);
  const [touched, setTouched] = useState<Set<keyof EnvironmentVector>>(new Set());
  const [presetPicked, setPresetPicked] = useState(false);

  const canSubmit = presetPicked || touched.size >= 9;

  const onSlide = (key: keyof EnvironmentVector, value: number) => {
    setEnv((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const onPreset = (preset: EnvPreset) => {
    setEnv(preset.env);
    setPresetPicked(true);
    void handleEnvironmentSubmit(preset.env);
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
        <div className="text-sm uppercase tracking-[0.2em] text-text-dim mb-4">
          预设场景
        </div>
        <motion.div
          variants={stagger(40)}
          initial="hidden"
          animate="show"
          className="flex gap-5 overflow-x-auto pb-3 -mx-2 px-2"
        >
          {PRESETS.map((p) => (
            <motion.button
              key={p.id}
              variants={fadeSlideUp}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPreset(p)}
              className="flex-shrink-0 w-60 text-left p-6 rounded-2xl border border-white/20 bg-card-translucent hover:border-primary/40 hover:bg-primary/[0.04] transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Thermometer size={20} className="text-primary" />
                </div>
                <div className="text-lg font-semibold text-text">{p.name}</div>
              </div>
              <div className="text-sm text-text-muted leading-relaxed">
                {p.description}
              </div>
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
            const pct = ((value - s.min) / (s.max - s.min)) * 100;
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
          disabled={!canSubmit}
          onClick={() => {
            if (canSubmit) void handleEnvironmentSubmit(env);
          }}
          className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl text-lg font-semibold transition-colors ${
            canSubmit
              ? "bg-primary text-background hover:bg-primary/90"
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
