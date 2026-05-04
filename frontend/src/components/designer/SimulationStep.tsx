import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, Play, Pause } from "lucide-react";
import { useDesigner } from "../../views/designer/DesignerContext";
import type { SimulationStepData } from "../../api/designer";
import { viewTransition } from "../../lib/motion";
import RollbackButton from "./RollbackButton";

const ENV_LABELS: { label: string; key: string; unit: string }[] = [
  { label: "温度", key: "temperature", unit: "°C" },
  { label: "电离辐射", key: "ionizing_radiation", unit: "mSv/y" },
  { label: "UV 通量", key: "uv_flux", unit: "W/m²" },
  { label: "压力", key: "pressure", unit: "kPa" },
  { label: "pH", key: "ph", unit: "" },
  { label: "盐度", key: "salinity", unit: "%" },
  { label: "水活度", key: "water_activity", unit: "aw" },
  { label: "氧含量", key: "oxygen", unit: "kPa" },
  { label: "温度日变化", key: "temp_diurnal_range", unit: "°C" },
];

interface LineChartProps {
  data: SimulationStepData[];
  yKey: "population" | "env_target" | "nutrient";
  color: string;
  label: string;
  currentIndex: number;
}

function LineChart({ data, yKey, color, label, currentIndex }: LineChartProps) {
  const w = 420;
  const h = 150;
  const padL = 32;
  const padR = 12;
  const padT = 14;
  const padB = 22;

  const visible = data.slice(0, Math.max(1, currentIndex + 1));

  const { points, maxV, minV, maxT } = useMemo(() => {
    if (visible.length === 0) {
      return { points: "", maxV: 1, minV: 0, maxT: 1 };
    }
    const vals = visible.map((d) => d[yKey]);
    const maxV = Math.max(...vals, 0.0001);
    const minV = Math.min(...vals, 0);
    const maxT = Math.max(...visible.map((d) => d.time), 1);
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const pts = visible
      .map((d) => {
        const x = padL + (d.time / maxT) * plotW;
        const y =
          padT +
          plotH -
          ((d[yKey] - minV) / Math.max(0.0001, maxV - minV)) * plotH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    return { points: pts, maxV, minV, maxT };
  }, [visible, yKey]);

  return (
    <div className="p-6 rounded-2xl border border-white/20 bg-card-translucent">
      <div className="flex items-center justify-between mb-3">
        <span className="text-lg text-text font-semibold">{label}</span>
        <span className="text-sm font-mono text-primary tabular-nums">
          t = {visible[visible.length - 1]?.time.toFixed(1) ?? "0"} / {maxT.toFixed(0)}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        {[0, 0.25, 0.5, 0.75, 1].map((r) => {
          const y = padT + (h - padT - padB) * (1 - r);
          return (
            <line
              key={r}
              x1={padL}
              y1={y}
              x2={w - padR}
              y2={y}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
            />
          );
        })}
        <text x={padL - 4} y={padT + 4} fontSize={12} fontWeight={500} fill="rgba(255,255,255,0.6)" textAnchor="end">
          {maxV.toFixed(1)}
        </text>
        <text x={padL - 4} y={h - padB} fontSize={12} fontWeight={500} fill="rgba(255,255,255,0.6)" textAnchor="end">
          {minV.toFixed(1)}
        </text>
        {points && (
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
}

export default function SimulationStep() {
  const { state, handleSimulate } = useDesigner();
  const data = state.simulationSteps;
  const startedRef = useRef(false);
  const [playing, setPlaying] = useState(true);
  const [index, setIndex] = useState(0);

  // 挂载时仅在没有历史结果时启动，避免恢复已完成设计时重跑模拟。
  useEffect(() => {
    if (!startedRef.current && data.length === 0) {
      startedRef.current = true;
      void handleSimulate();
    }
  }, [data.length, handleSimulate]);

  // 自动跟随最新帧
  useEffect(() => {
    if (playing && data.length > 0) {
      setIndex(data.length - 1);
    }
  }, [playing, data.length]);

  // 确保 index 不越界
  useEffect(() => {
    if (index >= data.length && data.length > 0) {
      setIndex(data.length - 1);
    }
  }, [index, data.length]);

  const env = state.environment;
  const simulationTitle = state.isThinking ? "正在运行模拟..." : "暂无模拟数据";
  const simulationDescription = state.isThinking
    ? "首个时间点生成后，曲线会自动开始更新。"
    : "请返回上一步确认编辑方案后重新运行模拟。";

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-headline text-text tracking-tight">Step 6 · 生态模拟</h2>
          <p className="text-lg text-text-muted mt-2">
            实时观察种群动力学与环境改造效果
          </p>
        </div>
        <RollbackButton label="调整方案" targetStep={5} />
      </div>

      {/* 警示条 */}
      <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-base">
        <AlertTriangle size={20} />
        <span className="font-medium">教学级简化模型，非真实预测 —— 仅用于概念演示</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* 左：环境参数表 */}
        <div className="p-6 rounded-2xl border border-white/20 bg-card-translucent h-fit">
          <div className="text-sm uppercase tracking-[0.2em] text-text-dim mb-4 font-semibold">
            环境参数
          </div>
          <div className="space-y-3">
            {ENV_LABELS.map((row) => {
              const v = env
                ? (env as unknown as Record<string, number>)[row.key]
                : null;
              return (
                <div
                  key={row.key}
                  className="flex items-baseline justify-between text-base border-b border-white/10 pb-2 last:border-b-0"
                >
                  <span className="text-text-muted">{row.label}</span>
                  <span className="font-mono text-primary tabular-nums font-semibold">
                    {v != null ? v.toFixed(2) : "—"}
                    <span className="text-text-dim ml-1.5 text-xs">{row.unit}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右：两条曲线 */}
        <div className="space-y-6">
          {data.length === 0 ? (
            <div className="text-center py-20 px-6 border border-dashed border-white/15 rounded-2xl">
              <div className="text-lg font-semibold text-text">{simulationTitle}</div>
              <div className="text-base text-text-muted mt-2">{simulationDescription}</div>
            </div>
          ) : (
            <>
              <LineChart
                data={data}
                yKey="population"
                color="rgb(56,189,248)"
                label="种群增长"
                currentIndex={index}
              />
              <LineChart
                data={data}
                yKey="env_target"
                color="rgb(168,85,247)"
                label="环境改造效果"
                currentIndex={index}
              />
            </>
          )}
        </div>
      </div>

      {/* 时间轴 */}
      <div className="p-6 rounded-2xl border border-white/20 bg-card-translucent">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 flex items-center justify-center text-primary transition-colors"
          >
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <input
            type="range"
            min={0}
            max={Math.max(0, data.length - 1)}
            value={index}
            onChange={(e) => {
              setPlaying(false);
              setIndex(parseInt(e.target.value, 10));
            }}
            className="flex-1 h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <span className="text-lg font-mono text-text-muted tabular-nums w-24 text-right font-semibold">
            {data.length > 0 ? `${index + 1}/${data.length}` : "0/0"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
