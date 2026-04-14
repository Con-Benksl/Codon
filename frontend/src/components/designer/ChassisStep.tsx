import { motion } from "motion/react";
import { useDesigner } from "../../views/designer/DesignerContext";
import type { ChassisCandidate, ChassisTolerance } from "../../api/designer";
import { viewTransition, fadeSlideUp, stagger } from "../../lib/motion";
import RollbackButton from "./RollbackButton";

const TOL_KEYS: {
  key: keyof ChassisTolerance;
  label: string;
  norm: (range: { min: number; max: number }) => number;
}[] = [
  { key: "temperature", label: "温", norm: (r) => Math.min(1, (r.max - r.min) / 180) },
  { key: "ionizing_radiation", label: "辐", norm: (r) => Math.min(1, r.max / 600) },
  { key: "uv_flux", label: "UV", norm: (r) => Math.min(1, r.max / 200) },
  { key: "pressure", label: "压", norm: (r) => Math.min(1, r.max / 300) },
  { key: "ph", label: "pH", norm: (r) => Math.min(1, (r.max - r.min) / 14) },
  { key: "salinity", label: "盐", norm: (r) => Math.min(1, r.max / 50) },
  { key: "water_activity", label: "水", norm: (r) => Math.min(1, r.max) },
  { key: "oxygen", label: "O₂", norm: (r) => Math.min(1, r.max / 100) },
  { key: "temp_diurnal_range", label: "ΔT", norm: (r) => Math.min(1, r.max / 100) },
];

function ToleranceRadar({ tolerance }: { tolerance: ChassisTolerance }) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 68;
  const values = TOL_KEYS.map((k) => {
    const range = tolerance[k.key];
    return k.norm(range);
  });

  const pointFor = (v: number, i: number) => {
    const angle = (Math.PI * 2 * i) / TOL_KEYS.length - Math.PI / 2;
    const r = radius * v;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
  };

  const axisFor = (i: number) => {
    const angle = (Math.PI * 2 * i) / TOL_KEYS.length - Math.PI / 2;
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius] as const;
  };

  const polygonPoints = values
    .map((v, i) => {
      const [x, y] = pointFor(v, i);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={size} height={size} className="overflow-visible">
      {/* 网格环 */}
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon
          key={r}
          points={TOL_KEYS.map((_, i) => {
            const angle = (Math.PI * 2 * i) / TOL_KEYS.length - Math.PI / 2;
            const rr = radius * r;
            return `${cx + Math.cos(angle) * rr},${cy + Math.sin(angle) * rr}`;
          }).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}
      {/* 轴线 */}
      {TOL_KEYS.map((_, i) => {
        const [ax, ay] = axisFor(i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={ax}
            y2={ay}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={1}
          />
        );
      })}
      {/* 数据多边形 */}
      <polygon
        points={polygonPoints}
        fill="rgba(56,189,248,0.18)"
        stroke="rgb(56,189,248)"
        strokeWidth={1.5}
      />
      {/* 数据点 */}
      {values.map((v, i) => {
        const [x, y] = pointFor(v, i);
        return <circle key={i} cx={x} cy={y} r={3} fill="rgb(56,189,248)" />;
      })}
      {/* 标签 */}
      {TOL_KEYS.map((k, i) => {
        const angle = (Math.PI * 2 * i) / TOL_KEYS.length - Math.PI / 2;
        const lx = cx + Math.cos(angle) * (radius + 14);
        const ly = cy + Math.sin(angle) * (radius + 14);
        return (
          <text
            key={k.key}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={13}
            fontWeight={500}
            fill="rgba(255,255,255,0.7)"
          >
            {k.label}
          </text>
        );
      })}
    </svg>
  );
}

const STATUS_STYLES: Record<ChassisCandidate["chassis_status"], string> = {
  established_chassis: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  emerging_chassis: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  wild_extremophile: "bg-orange-500/10 text-orange-400 border-orange-500/30",
};

const STATUS_LABEL: Record<ChassisCandidate["chassis_status"], string> = {
  established_chassis: "成熟底盘",
  emerging_chassis: "新兴底盘",
  wild_extremophile: "野生嗜极菌",
};

export default function ChassisStep() {
  const { state, handleChassisSelect } = useDesigner();
  const candidates = state.chassisCandidates;

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
          <h2 className="text-3xl font-headline text-text tracking-tight">Step 3 · 选择底盘生物</h2>
          <p className="text-lg text-text-muted mt-2">
            基于环境耐受性与遗传可操作性推荐的候选生物
          </p>
        </div>
        <RollbackButton label="重选任务" targetStep={2} />
      </div>

      {candidates.length === 0 ? (
        <div className="text-center py-20 text-text-muted text-lg border border-dashed border-white/15 rounded-2xl">
          等待候选生物加载...
        </div>
      ) : (
        <motion.div
          variants={stagger(60)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 xl:grid-cols-2 gap-6"
        >
          {candidates.map((c) => (
            <motion.button
              key={c.id}
              variants={fadeSlideUp}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                void handleChassisSelect(c.id);
              }}
              className="text-left p-7 rounded-2xl border border-white/20 bg-card-translucent hover:border-primary/40 hover:bg-primary/[0.04] transition-all duration-300"
            >
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <ToleranceRadar tolerance={c.tolerance} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="text-xl font-semibold text-text italic">
                        {c.scientific_name}
                      </div>
                      <div className="text-base text-text-muted mt-1">{c.common_name}</div>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-md border ${STATUS_STYLES[c.chassis_status]}`}
                    >
                      {STATUS_LABEL[c.chassis_status]}
                    </span>
                  </div>
                  <p className="text-base text-text-muted leading-relaxed mt-3 line-clamp-3">
                    {c.recommendation_reason}
                  </p>
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-sm text-text-dim mb-2">
                      <span className="uppercase tracking-wider">匹配度</span>
                      <span className="text-primary font-mono text-lg tabular-nums font-semibold">
                        {(c.match_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${c.match_score * 100}%` }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
