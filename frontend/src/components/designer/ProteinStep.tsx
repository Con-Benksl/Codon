import { motion } from "motion/react";
import { Check, ExternalLink } from "lucide-react";
import { useDesigner } from "../../views/designer/DesignerContext";
import type { ExpectedEffectVector } from "../../api/designer";
import { viewTransition, fadeSlideUp, stagger } from "../../lib/motion";
import RollbackButton from "./RollbackButton";

const EFFECT_KEYS: {
  key: keyof ExpectedEffectVector;
  label: string;
}[] = [
  { key: "co2_delta", label: "CO₂↓" },
  { key: "o2_delta", label: "O₂↑" },
  { key: "organics_delta", label: "有机" },
  { key: "toxin_delta", label: "毒物↓" },
  { key: "ph_buffer", label: "pH" },
  { key: "heavy_metal_fix", label: "金属" },
];

function EffectRadar({ effect }: { effect: ExpectedEffectVector }) {
  const size = 170;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 64;
  const n = EFFECT_KEYS.length;

  // 归一化到 [0,1]
  const norm = (v: number) => Math.max(0, Math.min(1, (v + 1) / 2));
  const values = EFFECT_KEYS.map((k) => norm(effect[k.key] ?? 0));

  const point = (v: number, i: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = radius * v;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
  };

  const polygonPoints = values
    .map((v, i) => {
      const [x, y] = point(v, i);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={size} height={size} className="overflow-visible">
      {[0.33, 0.66, 1].map((r) => (
        <polygon
          key={r}
          points={EFFECT_KEYS.map((_, i) => {
            const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
            const rr = radius * r;
            return `${cx + Math.cos(angle) * rr},${cy + Math.sin(angle) * rr}`;
          }).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}
      {EFFECT_KEYS.map((_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(angle) * radius}
            y2={cy + Math.sin(angle) * radius}
            stroke="rgba(255,255,255,0.05)"
          />
        );
      })}
      <polygon
        points={polygonPoints}
        fill="rgba(168,85,247,0.18)"
        stroke="rgb(168,85,247)"
        strokeWidth={1.5}
      />
      {values.map((v, i) => {
        const [x, y] = point(v, i);
        return <circle key={i} cx={x} cy={y} r={3} fill="rgb(168,85,247)" />;
      })}
      {EFFECT_KEYS.map((k, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const lx = cx + Math.cos(angle) * (radius + 16);
        const ly = cy + Math.sin(angle) * (radius + 16);
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

function KineticBar({ label, value, max, unit }: { label: string; value: number; max: number; unit: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-sm text-text-dim mb-1.5">
        <span className="uppercase tracking-wider font-medium">{label}</span>
        <span className="font-mono text-primary text-base font-semibold tabular-nums">
          {value.toFixed(2)} <span className="text-text-dim text-xs">{unit}</span>
        </span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-primary"
        />
      </div>
    </div>
  );
}

export default function ProteinStep() {
  const { state, handleProteinSelect } = useDesigner();
  const candidates = state.proteinCandidates;
  const emptyTitle = state.isThinking ? "正在检索候选蛋白..." : "暂无可用蛋白候选";
  const emptyDescription = state.isThinking
    ? "候选列表生成后会显示动力学参数、数据库链接与预期效应。"
    : "请返回上一步重选底盘，或调整任务后重新生成。";

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
          <h2 className="text-3xl font-headline text-text tracking-tight">Step 4 · 选择关键蛋白</h2>
          <p className="text-lg text-text-muted mt-2">
            候选酶与功能蛋白，展示动力学与预期效应
          </p>
        </div>
        <RollbackButton label="重选底盘" targetStep={3} />
      </div>

      {candidates.length === 0 ? (
        <div className="text-center py-20 px-6 border border-dashed border-white/15 rounded-2xl">
          <div className="text-lg font-semibold text-text">{emptyTitle}</div>
          <div className="text-base text-text-muted mt-2">{emptyDescription}</div>
        </div>
      ) : (
        <motion.div
          variants={stagger(60)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 xl:grid-cols-2 gap-6"
        >
          {candidates.map((p) => (
            <motion.article
              key={p.id}
              variants={fadeSlideUp}
              whileHover={{ y: -3 }}
              className="text-left p-7 rounded-2xl border border-white/20 bg-card-translucent hover:border-primary/40 hover:bg-primary/[0.04] transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <div className="text-xl font-semibold text-text truncate">{p.name}</div>
                  <div className="text-sm text-text-muted mt-1">
                    EC {p.ec_number} · <span className="italic">{p.source_organism}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end flex-shrink-0">
                  <a
                    href={p.uniprot_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-md border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                  >
                    UniProt <ExternalLink size={12} />
                  </a>
                  <a
                    href={p.brenda_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-md border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
                  >
                    BRENDA <ExternalLink size={12} />
                  </a>
                  <button
                    type="button"
                    disabled={state.isThinking}
                    onClick={() => {
                      if (!state.isThinking) void handleProteinSelect(p.id);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider hover:bg-primary/15 hover:border-primary/50 transition-colors"
                  >
                    <Check size={14} />
                    选择蛋白
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-shrink-0 self-center sm:self-start">
                  <EffectRadar effect={p.expected_effect_vector} />
                </div>
                <div className="flex-1 min-w-0 space-y-4">
                  <KineticBar label="kcat" value={p.kinetics.kcat} max={1000} unit="s⁻¹" />
                  <KineticBar label="Km" value={p.kinetics.km} max={10} unit="mM" />
                  <div className="text-base text-text-muted leading-relaxed line-clamp-3 pt-1">
                    {p.llm_explanation}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
