import { motion } from "motion/react";

interface ScoreRingProps {
  score: number;
  label: string;
  size?: number;
}

export default function ScoreRing({ score, label, size = 200 }: ScoreRingProps) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-[0_0_12px_rgba(0,229,255,0.6)]">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="6"
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#00E5FF"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2 - 8}
          textAnchor="middle"
          className="fill-on-surface font-headline"
          style={{ fontSize: "36px", fontWeight: 700 }}
        >
          {score.toFixed(1)}%
        </text>
        <text
          x={size / 2}
          y={size / 2 + 20}
          textAnchor="middle"
          className="fill-primary font-mono"
          style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" }}
        >
          {label}
        </text>
      </svg>
    </div>
  );
}
