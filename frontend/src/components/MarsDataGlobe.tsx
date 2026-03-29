import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import ProceduralMarsGlobe from "./ProceduralMarsGlobe";

interface HudData {
  temperature: string;
  radiation: string;
  pressure: string;
  survival: number;
  locationName: string;
  systemStatus: "optimal" | "monitoring" | "analyzing" | "warning";
}

interface MarsDataGlobeProps {
  data: HudData;
  className?: string;
}

const STATUS_COLORS = {
  optimal: "#64dd99",
  monitoring: "#81cfff",
  analyzing: "#d4a843",
  warning: "#ff6b6b",
};

const DATA_RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

export default function MarsDataGlobe({ data, className = "" }: MarsDataGlobeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const statusColor = STATUS_COLORS[data.systemStatus];
  const survivalPct = data.survival;

  // Circumference for survival arc (r=52 → C = 2π*52 ≈ 326.7)
  const arcCircumference = 2 * Math.PI * 52;
  const arcOffset = arcCircumference * (1 - survivalPct / 100);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${statusColor}08 0%, transparent 70%)`,
          transition: "background 0.6s ease",
        }}
      />

      <svg
        ref={svgRef}
        viewBox="0 0 300 300"
        className="absolute inset-0 w-full h-full"
        style={{ overflow: "visible" }}
      >
        <g className="orbit-slow" style={{ transformOrigin: "150px 150px" }}>
          <circle
            cx="150"
            cy="150"
            r="135"
            fill="none"
            stroke="rgba(129,207,255,0.12)"
            strokeWidth="0.5"
            strokeDasharray="4 8"
          />
          <circle cx="150" cy="15" r="3" fill="rgba(129,207,255,0.5)" />
        </g>

        <g className="orbit-ccw" style={{ transformOrigin: "150px 150px" }}>
          <circle
            cx="150"
            cy="150"
            r="112"
            fill="none"
            stroke="rgba(129,207,255,0.18)"
            strokeWidth="0.8"
            strokeDasharray="6 12"
          />
          <AnimatePresence mode="wait">
            <motion.g
              key={data.locationName}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <circle cx="150" cy="38" r="3.5" fill={statusColor} />
              <rect x="108" y="26" width="84" height="16" rx="3" fill="rgba(16,20,24,0.85)" />
              <text
                x="150"
                y="37"
                textAnchor="middle"
                fontSize="8"
                fontFamily="Orbitron, sans-serif"
                fill={statusColor}
                letterSpacing="1"
              >
                {data.locationName.toUpperCase()}
              </text>
            </motion.g>
          </AnimatePresence>
        </g>

        <g className="orbit-cw" style={{ transformOrigin: "150px 150px" }}>
          <circle
            cx="150"
            cy="150"
            r="88"
            fill="none"
            stroke={`${statusColor}30`}
            strokeWidth="1"
          />
          {[0, 90, 180, 270].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 150 + 88 * Math.sin(rad);
            const y1 = 150 - 88 * Math.cos(rad);
            const x2 = 150 + 92 * Math.sin(rad);
            const y2 = 150 - 92 * Math.cos(rad);
            return (
              <line
                key={angle}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={statusColor}
                strokeWidth="1.5"
                opacity="0.6"
              />
            );
          })}
        </g>

        {DATA_RAYS.map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const innerR = 66;
          const outerR = 78 + (i % 3) * 6;
          const x1 = 150 + innerR * Math.sin(rad);
          const y1 = 150 - innerR * Math.cos(rad);
          const x2 = 150 + outerR * Math.sin(rad);
          const y2 = 150 - outerR * Math.cos(rad);
          return (
            <motion.line
              key={angle}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={statusColor}
              strokeWidth="0.8"
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{
                duration: 2 + (i % 3) * 0.7,
                delay: i * 0.25,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          );
        })}

        <g transform="translate(150,150)">
          <circle
            cx="0"
            cy="0"
            r="52"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="3"
            strokeDasharray="200 126.7"
            strokeDashoffset="-63"
            transform="rotate(-90)"
          />
          <motion.circle
            cx="0"
            cy="0"
            r="52"
            fill="none"
            stroke={statusColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${arcCircumference * 0.667} ${arcCircumference * 0.333}`}
            initial={{ strokeDashoffset: arcCircumference * 0.667 }}
            animate={{
              strokeDashoffset: arcOffset * 0.667,
              stroke: statusColor,
            }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
            transform="rotate(-210)"
          />
          <AnimatePresence mode="wait">
            <motion.text
              key={`${survivalPct}-${data.locationName}`}
              x="0"
              y="-4"
              textAnchor="middle"
              fontSize="18"
              fontFamily="Orbitron, sans-serif"
              fontWeight="700"
              fill={statusColor}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {survivalPct}%
            </motion.text>
          </AnimatePresence>
          <text
            x="0"
            y="10"
            textAnchor="middle"
            fontSize="5.5"
            fontFamily="Orbitron, sans-serif"
            fill="rgba(191,200,208,0.7)"
            letterSpacing="1.5"
          >
            SURVIVAL
          </text>
        </g>

        <AnimatePresence mode="wait">
          <motion.g
            key={`temp-${data.temperature}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
          >
            <rect x="26" y="68" width="72" height="28" rx="4" fill="rgba(16,20,24,0.85)" stroke="rgba(129,207,255,0.25)" strokeWidth="0.5" />
            <text x="62" y="79" textAnchor="middle" fontSize="5.5" fontFamily="Orbitron, sans-serif" fill="rgba(129,207,255,0.6)" letterSpacing="1">TEMP</text>
            <text x="62" y="91" textAnchor="middle" fontSize="9" fontFamily="IBM Plex Mono, monospace" fontWeight="600" fill="#81cfff">{data.temperature}°C</text>
          </motion.g>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.g
            key={`rad-${data.radiation}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <rect x="202" y="68" width="72" height="28" rx="4" fill="rgba(16,20,24,0.85)" stroke="rgba(255,107,107,0.25)" strokeWidth="0.5" />
            <text x="238" y="79" textAnchor="middle" fontSize="5.5" fontFamily="Orbitron, sans-serif" fill="rgba(255,107,107,0.6)" letterSpacing="1">RAD</text>
            <text x="238" y="91" textAnchor="middle" fontSize="9" fontFamily="IBM Plex Mono, monospace" fontWeight="600" fill="#ff9f9f">{data.radiation}</text>
          </motion.g>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.g
            key={`pres-${data.pressure}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <rect x="114" y="218" width="72" height="28" rx="4" fill="rgba(16,20,24,0.85)" stroke="rgba(100,221,153,0.25)" strokeWidth="0.5" />
            <text x="150" y="229" textAnchor="middle" fontSize="5.5" fontFamily="Orbitron, sans-serif" fill="rgba(100,221,153,0.6)" letterSpacing="1">PRES</text>
            <text x="150" y="241" textAnchor="middle" fontSize="9" fontFamily="IBM Plex Mono, monospace" fontWeight="600" fill="#64dd99">{data.pressure} kPa</text>
          </motion.g>
        </AnimatePresence>

        <path d="M 26 46 L 26 36 L 36 36" stroke="rgba(129,207,255,0.35)" strokeWidth="1" fill="none" />
        <path d="M 264 46 L 264 36 L 254 36" stroke="rgba(129,207,255,0.35)" strokeWidth="1" fill="none" />
        <path d="M 26 254 L 26 264 L 36 264" stroke="rgba(129,207,255,0.2)" strokeWidth="1" fill="none" />
        <path d="M 264 254 L 264 264 L 254 264" stroke="rgba(129,207,255,0.2)" strokeWidth="1" fill="none" />
      </svg>
      <div
        style={{
          width: "62%",
          aspectRatio: "1",
          filter: `drop-shadow(0 0 24px ${statusColor}22)`,
          transition: "filter 0.6s ease",
        }}
      >
        <ProceduralMarsGlobe className="w-full h-full" />
      </div>
    </div>
  );
}
