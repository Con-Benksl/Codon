import { useState, useEffect, useRef } from "react";
import type { ElementType } from "react";
import { motion, AnimatePresence } from "motion/react";
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
import { stagger, fadeSlideUp, viewTransition, buttonPress, inViewport } from "../lib/motion";

// ── 仿真参数 ──
interface SimParam {
  id: string;
  label: string;
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

const INITIAL_PARAMS: SimParam[] = [
  { id: "temp", label: "温度", unit: "°C", min: -120, max: 30, value: -60, step: 5, icon: Thermometer, color: "text-primary", dangerBelow: -90, dangerAbove: 20 },
  { id: "radiation", label: "辐射通量", unit: "mSv/yr", min: 0, max: 800, value: 450, step: 25, icon: Zap, color: "text-secondary", dangerAbove: 600 },
  { id: "perchlorate", label: "高氯酸盐", unit: "wt%", min: 0, max: 2, value: 0.8, step: 0.1, icon: FlaskConical, color: "text-[#d4a843]", dangerAbove: 1.4 },
  { id: "co2", label: "CO₂ 分压", unit: "kPa", min: 0.1, max: 1.2, value: 0.6, step: 0.05, icon: Wind, color: "text-tertiary", dangerBelow: 0.2 },
];

// ── 物种定义 ──
interface Species {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  traits: { label: string; score: number }[];
}

const SPECIES: Species[] = [
  { id: "drad", name: "D. radiodurans R1", shortName: "D.rad", color: "text-primary", bgColor: "bg-primary", borderColor: "border-primary", traits: [{ label: "辐射耐受", score: 98 }, { label: "低温耐受", score: 65 }, { label: "高氯酸盐", score: 72 }] },
  { id: "chro", name: "Chroococcidiopsis", shortName: "Chro.", color: "text-tertiary", bgColor: "bg-tertiary", borderColor: "border-tertiary", traits: [{ label: "辐射耐受", score: 82 }, { label: "低温耐受", score: 78 }, { label: "光合效率", score: 91 }] },
  { id: "syn", name: "Synechocystis 6803", shortName: "Syn.", color: "text-[#d4a843]", bgColor: "bg-[#d4a843]", borderColor: "border-[#d4a843]", traits: [{ label: "光合效率", score: 88 }, { label: "CO₂ 固定", score: 85 }, { label: "辐射耐受", score: 52 }] },
  { id: "tgam", name: "T. gammatolerans", shortName: "T.gam", color: "text-purple-400", bgColor: "bg-purple-400", borderColor: "border-purple-400", traits: [{ label: "辐射耐受", score: 99 }, { label: "高温耐受", score: 90 }, { label: "低温耐受", score: 44 }] },
];

// 根据参数计算物种生存率 (0-100)
function calcSurvival(params: SimParam[], species: Species): number {
  const temp = params.find((p) => p.id === "temp")!.value;
  const rad = params.find((p) => p.id === "radiation")!.value;
  const perc = params.find((p) => p.id === "perchlorate")!.value;
  const co2 = params.find((p) => p.id === "co2")!.value;

  // 各物种基础分 + 惩罚
  const tempPenalty = Math.max(0, (-60 - temp) * 0.4 + Math.max(0, temp - 10) * 3);
  const radPenalty = rad > 600 ? (rad - 600) * 0.08 : 0;
  const percPenalty = perc > 1.2 ? (perc - 1.2) * 20 : 0;
  const co2Bonus = co2 > 0.4 ? 5 : -10;

  const base: Record<string, number> = { drad: 80, chro: 72, syn: 60, tgam: 68 };
  const radBonus: Record<string, number> = { drad: 0, chro: -rad * 0.02, syn: -rad * 0.04, tgam: 0 };
  const coldBonus: Record<string, number> = { drad: 0, chro: 4, syn: -8, tgam: -15 };

  let score = base[species.id] - tempPenalty * 0.4 - radPenalty * 0.5 - percPenalty + co2Bonus + (radBonus[species.id] ?? 0) + (coldBonus[species.id] ?? 0);
  return Math.min(100, Math.max(0, Math.round(score)));
}

// 生成仿真时间序列 (50 个时间点)
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

// SVG 折线图组件
function LineChart({ data, color, width = 400, height = 120 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const pad = { top: 8, bottom: 8, left: 4, right: 4 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const pts = data.map((v, i) => `${pad.left + (i / (data.length - 1)) * w},${pad.top + h - (v / 100) * h}`).join(" ");
  const areaEnd = `${pad.left + w},${pad.top + h} ${pad.left},${pad.top + h}`;
  return (
    <svg width={width} height={height} className="w-full">
      <defs>
        <linearGradient id={`grad-${color.replace(/[^a-z]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon
        points={`${pts} ${areaEnd}`}
        fill={`url(#grad-${color.replace(/[^a-z]/gi, "")})`}
        className={color}
      />
      <polyline
        points={pts}
        fill="none"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        className={`${color} stroke-current`}
      />
      {/* 最后一个点高亮 */}
      {data.length > 0 && (
        <circle
          cx={pad.left + w}
          cy={pad.top + h - (data[data.length - 1] / 100) * h}
          r="3"
          className={`${color} fill-current`}
        />
      )}
    </svg>
  );
}

export default function SimulationView() {
  const [params, setParams] = useState<SimParam[]>(INITIAL_PARAMS);
  const [running, setRunning] = useState(false);
  const [sol, setSol] = useState(0);
  const [timeData, setTimeData] = useState<Record<string, number[]>>(() =>
    Object.fromEntries(SPECIES.map((s) => [s.id, generateTimeSeries(INITIAL_PARAMS, s)]))
  );
  const [selectedSpecies, setSelectedSpecies] = useState<string>("drad");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const survivals = Object.fromEntries(SPECIES.map((s) => [s.id, calcSurvival(params, s)]));

  // 运行仿真：每 200ms 推进一个 sol
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setSol((prev) => {
          if (prev >= 687) { setRunning(false); return prev; }
          return prev + 7;
        });
      }, 200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  // 参数变化时重新生成时间序列
  useEffect(() => {
    setTimeData(Object.fromEntries(SPECIES.map((s) => [s.id, generateTimeSeries(params, s)])));
  }, [params]);

  const updateParam = (id: string, val: number) => {
    setParams((prev) => prev.map((p) => p.id === id ? { ...p, value: val } : p));
  };

  const reset = () => {
    setRunning(false);
    setSol(0);
    setParams(INITIAL_PARAMS);
  };

  const isDanger = (p: SimParam) =>
    (p.dangerAbove !== undefined && p.value > p.dangerAbove) ||
    (p.dangerBelow !== undefined && p.value < p.dangerBelow);

  const selectedSurvival = survivals[selectedSpecies] ?? 0;
  const trendIcon = selectedSurvival >= 70 ? TrendingUp : selectedSurvival >= 40 ? Minus : TrendingDown;
  const TrendIcon = trendIcon;

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 flex flex-col pt-2"
    >
      {/* ── Header ── */}
      <motion.section
        variants={stagger(60)}
        initial="hidden"
        animate="show"
        className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
      >
        <div className="space-y-3">
          <motion.div variants={fadeSlideUp} className="flex gap-2">
            <span className="px-3 py-1 bg-secondary/10 border border-secondary/20 text-secondary text-[10px] font-headline tracking-widest uppercase rounded">蒙特卡洛仿真</span>
            <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-headline tracking-widest uppercase rounded">FBA 通量分析</span>
          </motion.div>
          <motion.h2
            variants={fadeSlideUp}
            className="text-3xl md:text-4xl font-black font-headline text-on-background tracking-tighter leading-none"
          >
            火星环境 <span className="text-secondary">生存仿真</span>
          </motion.h2>
          <motion.p variants={fadeSlideUp} className="text-sm text-on-surface-variant max-w-lg">
            调节火星环境参数，实时仿真四种候选菌在全年（687 sol）中的生物量动态与生存概率。
          </motion.p>
        </div>

        {/* Sol 计时器 */}
        <motion.div variants={fadeSlideUp} className="glass-panel p-4 rounded-xl flex items-center gap-4 border-l-4 border-l-secondary">
          <div>
            <p className="text-[10px] font-headline text-on-surface-variant uppercase tracking-widest">仿真进度</p>
            <p className="text-2xl font-headline font-black text-secondary">SOL {sol}</p>
            <p className="text-[9px] text-outline font-headline">/ 687 (火星年)</p>
          </div>
          <div className="flex flex-col gap-2">
            <motion.button
              {...buttonPress}
              onClick={() => setRunning((r) => !r)}
              className={`px-4 py-2 font-headline font-bold text-xs rounded-lg uppercase tracking-widest flex items-center gap-2 transition-all ${
                running
                  ? "bg-surface-container-high text-on-surface-variant border border-outline-variant/30"
                  : "bg-secondary text-on-secondary hover:brightness-110 shadow-[0_0_12px_rgba(255,180,161,0.3)]"
              }`}
            >
              {running ? <><Pause size={12} />暂停</> : <><Play size={12} />运行</>}
            </motion.button>
            <motion.button
              {...buttonPress}
              onClick={reset}
              className="px-4 py-2 border border-outline-variant/30 text-on-surface-variant font-headline font-bold text-xs rounded-lg uppercase tracking-widest flex items-center gap-2 hover:bg-surface-container transition-all"
            >
              <RotateCcw size={12} />重置
            </motion.button>
          </div>
        </motion.div>
      </motion.section>

      {/* ── 主布局 ── */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1">

        {/* 左侧：参数控制 */}
        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="w-full lg:w-72 shrink-0 space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-primary" />
            <h3 className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">环境参数控制</h3>
          </div>

          {params.map((param) => {
            const danger = isDanger(param);
            const Icon = param.icon;
            const pct = ((param.value - param.min) / (param.max - param.min)) * 100;
            return (
              <div key={param.id} className={`glass-panel p-4 rounded-xl border ${danger ? "border-secondary/40" : "border-outline-variant/10"} transition-colors`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon size={13} className={danger ? "text-secondary" : param.color} />
                    <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-on-surface-variant">{param.label}</span>
                  </div>
                  <span className={`text-sm font-headline font-black ${danger ? "text-secondary" : param.color}`}>
                    {param.value}{param.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={param.value}
                  onChange={(e) => updateParam(param.id, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-surface-container-highest rounded-full appearance-none cursor-pointer accent-current"
                  style={{ accentColor: danger ? "#ffb4a1" : "#81cfff" }}
                />
                <div className="flex justify-between text-[9px] text-outline mt-1 font-mono">
                  <span>{param.min}{param.unit}</span>
                  <span>{param.max}{param.unit}</span>
                </div>
                {danger && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-[9px] text-secondary mt-1.5 font-headline"
                  >
                    ⚠ 超出生物耐受临界值
                  </motion.p>
                )}
              </div>
            );
          })}
        </motion.aside>

        {/* 右侧：图表 + 热力图 */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">

          {/* 物种选择器 */}
          <div className="flex flex-wrap gap-2">
            {SPECIES.map((s) => (
              <motion.button
                key={s.id}
                {...buttonPress}
                onClick={() => setSelectedSpecies(s.id)}
                className={`px-4 py-2 rounded-xl font-headline font-bold text-xs uppercase tracking-widest transition-all border ${
                  selectedSpecies === s.id
                    ? `${s.borderColor} ${s.color} bg-current/10`
                    : "border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/50"
                }`}
                style={selectedSpecies === s.id ? { backgroundColor: "currentColor", color: "initial" } : {}}
              >
                <span className={selectedSpecies === s.id ? s.color : ""}>{s.shortName}</span>
              </motion.button>
            ))}
          </div>

          {/* 主折线图 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-panel p-5 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-headline font-bold text-sm text-on-surface">
                  {SPECIES.find((s) => s.id === selectedSpecies)?.name} — 生物量动态
                </h3>
                <p className="text-[10px] text-on-surface-variant mt-0.5">全年 687 sol 仿真轨迹（归一化生存率）</p>
              </div>
              <div className="flex items-center gap-2">
                <TrendIcon size={16} className={selectedSurvival >= 70 ? "text-tertiary" : selectedSurvival >= 40 ? "text-outline" : "text-secondary"} />
                <span className={`text-2xl font-headline font-black ${selectedSurvival >= 70 ? "text-tertiary" : selectedSurvival >= 40 ? "text-on-surface" : "text-secondary"}`}>
                  {selectedSurvival}%
                </span>
              </div>
            </div>

            {/* Y 轴标签 */}
            <div className="flex gap-3">
              <div className="flex flex-col justify-between text-[9px] text-outline font-mono py-2 shrink-0">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>
              <div className="flex-1 relative">
                {/* 网格线 */}
                {[25, 50, 75].map((v) => (
                  <div key={v} className="absolute left-0 right-0 border-t border-outline-variant/10" style={{ top: `${(1 - v / 100) * 100}%` }} />
                ))}
                <LineChart
                  data={timeData[selectedSpecies] ?? []}
                  color={SPECIES.find((s) => s.id === selectedSpecies)?.color ?? "text-primary"}
                />
              </div>
            </div>
            <div className="flex justify-between text-[9px] text-outline font-mono mt-1 ml-7">
              <span>SOL 0</span><span>SOL 172</span><span>SOL 344</span><span>SOL 516</span><span>SOL 687</span>
            </div>
          </motion.div>

          {/* 物种生存热力图 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-panel p-5 rounded-2xl"
            {...inViewport}
          >
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} className="text-primary" />
              <h3 className="font-headline font-bold text-xs uppercase tracking-widest">物种生存概率对比</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SPECIES.map((s) => {
                const pct = survivals[s.id] ?? 0;
                return (
                  <motion.div
                    key={s.id}
                    layout
                    onClick={() => setSelectedSpecies(s.id)}
                    className={`p-4 rounded-xl cursor-pointer border transition-all ${
                      selectedSpecies === s.id ? `${s.borderColor} bg-surface-container-high` : "border-outline-variant/15 hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] font-bold font-headline uppercase ${s.color}`}>{s.name}</span>
                      <span className={`text-lg font-headline font-black ${pct >= 70 ? "text-tertiary" : pct >= 40 ? "text-on-surface" : "text-secondary"}`}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${s.bgColor}`}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                      />
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {s.traits.map((t) => (
                        <span key={t.label} className="text-[9px] text-on-surface-variant font-headline">
                          {t.label}: <span className="text-on-surface">{t.score}</span>
                        </span>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* 推荐组合 */}
            {Object.values(survivals).some((v) => v > 0) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 p-3 border border-tertiary/20 bg-tertiary/5 rounded-xl"
              >
                <p className="text-[10px] font-headline font-bold text-tertiary uppercase tracking-widest mb-1">推荐共生组合</p>
                <p className="text-xs text-on-surface-variant">
                  在当前参数下，<span className="text-primary">D. radiodurans</span> × <span className="text-tertiary">Chroococcidiopsis</span> 双菌共生系统综合得分最高（
                  {Math.round((survivals.drad + survivals.chro) / 2)}%），建议优先采用。
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
