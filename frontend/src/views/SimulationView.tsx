import { useState, useEffect, useRef } from "react";
import type { ElementType } from "react";
import { motion } from "motion/react";
import {
  Play,
  Pause,
  RotateCcw,
  Activity,
  Thermometer,
  Zap,
  FlaskConical,
  Wind,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { useLocale } from "../i18n/context";
import { viewTransition, buttonPress } from "../lib/motion";

interface SimParam {
  id: string;
  labelZh: string;
  labelEn: string;
  unit: string;
  min: number;
  max: number;
  value: number;
  step: number;
  icon: ElementType;
  color: string;
  dangerAbove?: number;
  dangerBelow?: number;
}

interface Species {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  traitsZh: { label: string; score: number }[];
  traitsEn: { label: string; score: number }[];
}

const INITIAL_PARAMS: SimParam[] = [
  { id: "temp", labelZh: "温度", labelEn: "Temperature", unit: "°C", min: -120, max: 30, value: -60, step: 5, icon: Thermometer, color: "text-primary", dangerBelow: -90, dangerAbove: 20 },
  { id: "radiation", labelZh: "辐射通量", labelEn: "Radiation", unit: "mSv/yr", min: 0, max: 800, value: 450, step: 25, icon: Zap, color: "text-secondary", dangerAbove: 600 },
  { id: "perchlorate", labelZh: "高氯酸盐", labelEn: "Perchlorate", unit: "wt%", min: 0, max: 2, value: 0.8, step: 0.1, icon: FlaskConical, color: "text-[#d4a843]", dangerAbove: 1.4 },
  { id: "co2", labelZh: "CO2 分压", labelEn: "CO2 Partial Pressure", unit: "kPa", min: 0.1, max: 1.2, value: 0.6, step: 0.05, icon: Wind, color: "text-tertiary", dangerBelow: 0.2 },
];

const SPECIES: Species[] = [
  {
    id: "drad",
    name: "D. radiodurans R1",
    shortName: "D.rad",
    color: "text-primary",
    bgColor: "bg-primary",
    borderColor: "border-primary",
    traitsZh: [{ label: "辐射耐受", score: 98 }, { label: "低温耐受", score: 65 }, { label: "高氯酸盐", score: 72 }],
    traitsEn: [{ label: "Radiation", score: 98 }, { label: "Cold", score: 65 }, { label: "Perchlorate", score: 72 }],
  },
  {
    id: "chro",
    name: "Chroococcidiopsis",
    shortName: "Chro.",
    color: "text-tertiary",
    bgColor: "bg-tertiary",
    borderColor: "border-tertiary",
    traitsZh: [{ label: "辐射耐受", score: 82 }, { label: "低温耐受", score: 78 }, { label: "光合效率", score: 91 }],
    traitsEn: [{ label: "Radiation", score: 82 }, { label: "Cold", score: 78 }, { label: "Photosynthesis", score: 91 }],
  },
  {
    id: "syn",
    name: "Synechocystis 6803",
    shortName: "Syn.",
    color: "text-[#d4a843]",
    bgColor: "bg-[#d4a843]",
    borderColor: "border-[#d4a843]",
    traitsZh: [{ label: "光合效率", score: 88 }, { label: "CO2 固定", score: 85 }, { label: "辐射耐受", score: 52 }],
    traitsEn: [{ label: "Photosynthesis", score: 88 }, { label: "CO2 Fixation", score: 85 }, { label: "Radiation", score: 52 }],
  },
  {
    id: "tgam",
    name: "T. gammatolerans",
    shortName: "T.gam",
    color: "text-purple-400",
    bgColor: "bg-purple-400",
    borderColor: "border-purple-400",
    traitsZh: [{ label: "辐射耐受", score: 99 }, { label: "高温耐受", score: 90 }, { label: "低温耐受", score: 44 }],
    traitsEn: [{ label: "Radiation", score: 99 }, { label: "Heat", score: 90 }, { label: "Cold", score: 44 }],
  },
];

function calcSurvival(params: SimParam[], species: Species): number {
  const temp = params.find((p) => p.id === "temp")!.value;
  const rad = params.find((p) => p.id === "radiation")!.value;
  const perc = params.find((p) => p.id === "perchlorate")!.value;
  const co2 = params.find((p) => p.id === "co2")!.value;

  const tempPenalty = Math.max(0, (-60 - temp) * 0.4 + Math.max(0, temp - 10) * 3);
  const radPenalty = rad > 600 ? (rad - 600) * 0.08 : 0;
  const percPenalty = perc > 1.2 ? (perc - 1.2) * 20 : 0;
  const co2Bonus = co2 > 0.4 ? 5 : -10;
  const base: Record<string, number> = { drad: 80, chro: 72, syn: 60, tgam: 68 };
  const radBonus: Record<string, number> = { drad: 0, chro: -rad * 0.02, syn: -rad * 0.04, tgam: 0 };
  const coldBonus: Record<string, number> = { drad: 0, chro: 4, syn: -8, tgam: -15 };
  const score = base[species.id] - tempPenalty * 0.4 - radPenalty * 0.5 - percPenalty + co2Bonus + (radBonus[species.id] ?? 0) + (coldBonus[species.id] ?? 0);
  return Math.min(100, Math.max(0, Math.round(score)));
}

function generateTimeSeries(params: SimParam[], species: Species): number[] {
  const target = calcSurvival(params, species);
  const points: number[] = [];
  let current = 20;
  for (let i = 0; i < 50; i++) {
    const noise = (Math.random() - 0.5) * 4;
    current += (target - current) * 0.12 + noise;
    current = Math.min(100, Math.max(0, current));
    points.push(Math.round(current));
  }
  return points;
}

function LineChart({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - v}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" className="w-full h-40">
      <polyline points={pts} fill="none" strokeWidth="1.8" className={`${color} stroke-current`} />
    </svg>
  );
}

export default function SimulationView() {
  const { locale } = useLocale();
  const isZh = locale === "zh";
  const [params, setParams] = useState<SimParam[]>(INITIAL_PARAMS);
  const [running, setRunning] = useState(false);
  const [sol, setSol] = useState(0);
  const [selectedSpecies, setSelectedSpecies] = useState("drad");
  const [timeData, setTimeData] = useState<Record<string, number[]>>(() =>
    Object.fromEntries(SPECIES.map((s) => [s.id, generateTimeSeries(INITIAL_PARAMS, s)]))
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const survivals = Object.fromEntries(SPECIES.map((s) => [s.id, calcSurvival(params, s)]));
  const selectedSurvival = survivals[selectedSpecies] ?? 0;
  const TrendIcon = selectedSurvival >= 70 ? TrendingUp : selectedSurvival >= 40 ? Minus : TrendingDown;

  useEffect(() => {
    if (!running) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setSol((prev) => {
        if (prev >= 687) {
          setRunning(false);
          return prev;
        }
        return prev + 7;
      });
    }, 200);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running]);

  useEffect(() => {
    setTimeData(Object.fromEntries(SPECIES.map((s) => [s.id, generateTimeSeries(params, s)])));
  }, [params]);

  const updateParam = (id: string, value: number) => {
    setParams((prev) => prev.map((p) => (p.id === id ? { ...p, value } : p)));
  };

  const reset = () => {
    setRunning(false);
    setSol(0);
    setParams(INITIAL_PARAMS);
  };

  return (
    <motion.div variants={viewTransition} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col pt-2">
      <section className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-3">
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-secondary/10 border border-secondary/20 text-secondary text-[10px] font-headline tracking-widest uppercase rounded">{isZh ? "蒙特卡洛仿真" : "MONTE CARLO"}</span>
            <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-headline tracking-widest uppercase rounded">{isZh ? "FBA 通量分析" : "FBA ANALYSIS"}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black font-headline text-on-background tracking-tighter leading-none">
            {isZh ? "火星环境 " : "Martian "} <span className="text-secondary">{isZh ? "生存仿真" : "Survival Simulation"}</span>
          </h2>
          <p className="text-sm text-on-surface-variant max-w-lg">
            {isZh ? "调节环境参数，实时仿真候选菌在 687 sol 中的生物量与生存率。" : "Tune environment parameters and simulate biomass and survival over a full 687-sol year."}
          </p>
        </div>
        <div className="glass-panel p-4 rounded-xl flex items-center gap-4 border-l-4 border-l-secondary">
          <div>
            <p className="text-[10px] font-headline text-on-surface-variant uppercase tracking-widest">{isZh ? "仿真进度" : "Progress"}</p>
            <p className="text-2xl font-headline font-black text-secondary">SOL {sol}</p>
            <p className="text-[9px] text-outline font-headline">/ 687</p>
          </div>
          <div className="flex flex-col gap-2">
            <motion.button {...buttonPress} onClick={() => setRunning((r) => !r)} className={`px-4 py-2 font-headline font-bold text-xs rounded-lg uppercase tracking-widest flex items-center gap-2 ${running ? "bg-surface-container-high text-on-surface-variant border border-outline-variant/30" : "bg-secondary text-on-secondary"}`}>
              {running ? <><Pause size={12} />{isZh ? "暂停" : "Pause"}</> : <><Play size={12} />{isZh ? "运行" : "Run"}</>}
            </motion.button>
            <motion.button {...buttonPress} onClick={reset} className="px-4 py-2 border border-outline-variant/30 text-on-surface-variant font-headline font-bold text-xs rounded-lg uppercase tracking-widest flex items-center gap-2 hover:bg-surface-container">
              <RotateCcw size={12} />{isZh ? "重置" : "Reset"}
            </motion.button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 flex-1">
        <aside className="space-y-4">
          <div className="flex items-center gap-2"><Activity size={14} className="text-primary" /><h3 className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">{isZh ? "环境参数控制" : "Environment Controls"}</h3></div>
          {params.map((param) => {
            const danger = (param.dangerAbove !== undefined && param.value > param.dangerAbove) || (param.dangerBelow !== undefined && param.value < param.dangerBelow);
            const Icon = param.icon;
            return (
              <div key={param.id} className={`glass-panel p-4 rounded-xl border ${danger ? "border-secondary/40" : "border-outline-variant/10"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon size={13} className={danger ? "text-secondary" : param.color} />
                    <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-on-surface-variant">{isZh ? param.labelZh : param.labelEn}</span>
                  </div>
                  <span className={`text-sm font-headline font-black ${danger ? "text-secondary" : param.color}`}>{param.value}{param.unit}</span>
                </div>
                <input type="range" min={param.min} max={param.max} step={param.step} value={param.value} onChange={(e) => updateParam(param.id, parseFloat(e.target.value))} className="w-full" />
                {danger && <p className="text-[9px] text-secondary mt-1.5 font-headline"><AlertTriangle size={10} className="inline mr-1" />{isZh ? "超出生物耐受临界值" : "Outside tolerance threshold"}</p>}
              </div>
            );
          })}
        </aside>

        <section className="space-y-6 min-w-0">
          <div className="flex flex-wrap gap-2">
            {SPECIES.map((s) => (
              <button key={s.id} onClick={() => setSelectedSpecies(s.id)} className={`px-4 py-2 rounded-xl font-headline font-bold text-xs uppercase tracking-widest border ${selectedSpecies === s.id ? `${s.borderColor} ${s.color} bg-current/10` : "border-outline-variant/20 text-on-surface-variant"}`}>
                {s.shortName}
              </button>
            ))}
          </div>

          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-headline font-bold text-sm text-on-surface">{SPECIES.find((s) => s.id === selectedSpecies)?.name}</h3>
                <p className="text-[10px] text-on-surface-variant">{isZh ? "全年轨迹（归一化生存率）" : "Full-year trajectory (normalized survival)"}</p>
              </div>
              <div className="flex items-center gap-2">
                <TrendIcon size={16} className={selectedSurvival >= 70 ? "text-tertiary" : selectedSurvival >= 40 ? "text-outline" : "text-secondary"} />
                <span className={`text-2xl font-headline font-black ${selectedSurvival >= 70 ? "text-tertiary" : selectedSurvival >= 40 ? "text-on-surface" : "text-secondary"}`}>{selectedSurvival}%</span>
              </div>
            </div>
            <LineChart data={timeData[selectedSpecies] ?? []} color={SPECIES.find((s) => s.id === selectedSpecies)?.color ?? "text-primary"} />
          </div>

          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4"><Activity size={14} className="text-primary" /><h3 className="font-headline font-bold text-xs uppercase tracking-widest">{isZh ? "物种生存概率对比" : "Species Survival Comparison"}</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SPECIES.map((s) => {
                const pct = survivals[s.id] ?? 0;
                const traits = isZh ? s.traitsZh : s.traitsEn;
                return (
                  <div key={s.id} className={`p-4 rounded-xl border ${selectedSpecies === s.id ? `${s.borderColor} bg-surface-container-high` : "border-outline-variant/15"}`}>
                    <div className="flex justify-between mb-2">
                      <span className={`text-[10px] font-bold font-headline uppercase ${s.color}`}>{s.name}</span>
                      <span className="text-lg font-headline font-black">{pct}%</span>
                    </div>
                    <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden mb-2">
                      <div className={`h-full rounded-full ${s.bgColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {traits.map((trait) => (
                        <span key={trait.label} className="text-[9px] text-on-surface-variant">{trait.label}: <span className="text-on-surface">{trait.score}</span></span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 border border-tertiary/20 bg-tertiary/5 rounded-xl text-xs text-on-surface-variant">
              <p className="text-[10px] font-headline font-bold text-tertiary uppercase tracking-widest mb-1">{isZh ? "推荐共生组合" : "Recommended Pairing"}</p>
              {isZh
                ? <>在当前参数下，<span className="text-primary">D. radiodurans</span> × <span className="text-tertiary">Chroococcidiopsis</span> 综合得分最高（{Math.round((survivals.drad + survivals.chro) / 2)}%）。</>
                : <>Under current parameters, <span className="text-primary">D. radiodurans</span> × <span className="text-tertiary">Chroococcidiopsis</span> achieves the highest composite score ({Math.round((survivals.drad + survivals.chro) / 2)}%).</>}
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
