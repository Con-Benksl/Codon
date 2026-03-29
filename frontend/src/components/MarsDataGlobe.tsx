import { useRef } from "react";
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

const STATUS_LABELS = {
  optimal: "NOMINAL",
  monitoring: "MONITOR",
  analyzing: "ANALYZE",
  warning: "WARNING",
};

const DATA_RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

// Latitude lines projected as ellipses onto globe face
// lat in degrees → ellipse rx=globeR, ry=globeR*cos(lat°), cy offset=globeR*sin(lat°)
const GLOBE_R = 94; // matches the 68% * 150 ≈ 102 in viewBox coords, using inner-fit radius
const LAT_LINES = [-60, -30, 30, 60];
const LON_COUNT = 6;

export default function MarsDataGlobe({ data, className = "" }: MarsDataGlobeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const statusColor = STATUS_COLORS[data.systemStatus];
  const statusLabel = STATUS_LABELS[data.systemStatus];
  const survivalPct = data.survival;

  // Circumference for survival arc (r=52 → C = 2π*52 ≈ 326.7)
  const arcCircumference = 2 * Math.PI * 52;
  const arcOffset = arcCircumference * (1 - survivalPct / 100);

  // Generate lat grid ellipses
  const latEllipses = LAT_LINES.map((deg) => {
    const rad = (deg * Math.PI) / 180;
    const ry = GLOBE_R * Math.cos(rad);
    const dy = GLOBE_R * Math.sin(rad);
    return { ry, dy, deg };
  });

  // Generate lon grid lines (projected as vertical-ish ellipse arcs)
  const lonLines = Array.from({ length: LON_COUNT }, (_, i) => {
    const angle = (i * Math.PI) / LON_COUNT;
    return angle;
  });

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Ambient status glow */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${statusColor}0a 0%, transparent 65%)`,
          transition: "background 0.7s ease",
        }}
      />

      <svg
        ref={svgRef}
        viewBox="0 0 300 300"
        className="absolute inset-0 w-full h-full"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Scan arc gradient */}
          <linearGradient id="scanArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={statusColor} stopOpacity="0" />
            <stop offset="60%" stopColor={statusColor} stopOpacity="0.65" />
            <stop offset="100%" stopColor={statusColor} stopOpacity="0.15" />
          </linearGradient>
          {/* Data card glass */}
          <filter id="cardBlur">
            <feGaussianBlur stdDeviation="0.8" />
          </filter>
        </defs>

        {/* ── Outermost orbit ring (slow) ── */}
        <g className="orbit-slow" style={{ transformOrigin: "150px 150px" }}>
          <circle
            cx="150" cy="150" r="138"
            fill="none"
            stroke="rgba(129,207,255,0.10)"
            strokeWidth="0.5"
            strokeDasharray="3 9"
          />
          <circle cx="150" cy="12" r="2.5" fill="rgba(129,207,255,0.45)" />
          <circle cx="150" cy="12" r="5" fill="none" stroke="rgba(129,207,255,0.2)" strokeWidth="0.5" />
        </g>

        {/* ── Mid orbit ring + location label (CCW) ── */}
        <g className="orbit-ccw" style={{ transformOrigin: "150px 150px" }}>
          <circle
            cx="150" cy="150" r="114"
            fill="none"
            stroke="rgba(129,207,255,0.16)"
            strokeWidth="0.7"
            strokeDasharray="5 11"
          />
          <AnimatePresence mode="wait">
            <motion.g
              key={data.locationName}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <circle cx="150" cy="36" r="3.5" fill={statusColor} />
              <rect x="106" y="24" width="88" height="17" rx="3" fill="rgba(12,16,20,0.90)" />
              <rect x="106" y="24" width="88" height="17" rx="3" fill="none" stroke={`${statusColor}40`} strokeWidth="0.5" />
              <text
                x="150" y="35.5"
                textAnchor="middle"
                fontSize="8"
                fontFamily="Orbitron, sans-serif"
                fill={statusColor}
                letterSpacing="1.2"
              >
                {data.locationName.toUpperCase()}
              </text>
            </motion.g>
          </AnimatePresence>
        </g>

        {/* ── Inner orbit + tick marks (CW) ── */}
        <g className="orbit-cw" style={{ transformOrigin: "150px 150px" }}>
          <circle
            cx="150" cy="150" r="88"
            fill="none"
            stroke={`${statusColor}28`}
            strokeWidth="1"
          />
          {[0, 90, 180, 270].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 150 + 88 * Math.sin(rad);
            const y1 = 150 - 88 * Math.cos(rad);
            const x2 = 150 + 94 * Math.sin(rad);
            const y2 = 150 - 94 * Math.cos(rad);
            return (
              <line
                key={angle}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={statusColor}
                strokeWidth="1.5"
                opacity="0.55"
              />
            );
          })}
          {/* Secondary tick marks at 45° */}
          {[45, 135, 225, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 150 + 88 * Math.sin(rad);
            const y1 = 150 - 88 * Math.cos(rad);
            const x2 = 150 + 91 * Math.sin(rad);
            const y2 = 150 - 91 * Math.cos(rad);
            return (
              <line
                key={`s${angle}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={statusColor}
                strokeWidth="0.7"
                opacity="0.3"
              />
            );
          })}
        </g>

        {/* ── Scan arc (fast CW sweep) ── */}
        <g className="orbit-cw-fast">
          <path
            d={`M 150 56 A 94 94 0 0 1 ${150 + 94 * Math.sin(Math.PI / 3)} ${150 - 94 * Math.cos(Math.PI / 3)}`}
            fill="none"
            stroke={`url(#scanArcGrad)`}
            strokeWidth="1.5"
          />
        </g>

        {/* ── Coordinate crosshair ── */}
        <line x1="150" y1="56" x2="150" y2="244" stroke="rgba(129,207,255,0.06)" strokeWidth="0.4" />
        <line x1="56" y1="150" x2="244" y2="150" stroke="rgba(129,207,255,0.06)" strokeWidth="0.4" />

        {/* ── Latitude grid (projected ellipses on globe face) ── */}
        <g opacity="1">
          {latEllipses.map(({ ry, dy, deg }) => (
            <ellipse
              key={deg}
              cx="150"
              cy={150 + dy}
              rx={GLOBE_R - 2}
              ry={Math.abs(ry)}
              fill="none"
              stroke="rgba(129,207,255,0.055)"
              strokeWidth="0.4"
              strokeDasharray="2 4"
            />
          ))}
          {/* Equator — slightly more visible */}
          <ellipse
            cx="150" cy="150"
            rx={GLOBE_R - 2} ry={GLOBE_R - 2}
            fill="none"
            stroke="rgba(129,207,255,0.10)"
            strokeWidth="0.5"
            strokeDasharray="3 5"
          />
          {/* Equator label */}
          <text x="246" y="152" fontSize="3.5" fontFamily="IBM Plex Mono, monospace" fill="rgba(129,207,255,0.35)" letterSpacing="0.5">0°</text>
          <text x="246" y="122" fontSize="3.5" fontFamily="IBM Plex Mono, monospace" fill="rgba(129,207,255,0.25)" letterSpacing="0.5">+30°</text>
          <text x="246" y="182" fontSize="3.5" fontFamily="IBM Plex Mono, monospace" fill="rgba(129,207,255,0.25)" letterSpacing="0.5">-30°</text>
        </g>

        {/* ── Longitude grid (vertical great-circle arcs) ── */}
        <g opacity="1">
          {lonLines.map((angle, i) => {
            const cosA = Math.cos(angle);
            // Project as narrow ellipse: rx = GLOBE_R*|sinA|, ry = GLOBE_R
            const rx = (GLOBE_R - 2) * Math.abs(Math.sin(angle) === 0 ? 0.01 : Math.sin(angle));
            return (
              <ellipse
                key={i}
                cx="150" cy="150"
                rx={rx}
                ry={GLOBE_R - 2}
                fill="none"
                stroke="rgba(129,207,255,0.05)"
                strokeWidth="0.4"
                strokeDasharray="2 4"
                transform={`rotate(${(angle * 180) / Math.PI}, 150, 150)`}
              />
            );
          })}
        </g>

        {/* ── Data rays (pulsing) ── */}
        {DATA_RAYS.map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const innerR = 66;
          const outerR = 80 + (i % 3) * 5;
          const x1 = 150 + innerR * Math.sin(rad);
          const y1 = 150 - innerR * Math.cos(rad);
          const x2 = 150 + outerR * Math.sin(rad);
          const y2 = 150 - outerR * Math.cos(rad);
          return (
            <motion.line
              key={angle}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={statusColor}
              strokeWidth="0.7"
              animate={{ opacity: [0.15, 0.75, 0.15] }}
              transition={{
                duration: 2 + (i % 3) * 0.8,
                delay: i * 0.22,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          );
        })}

        {/* ── Measurement rulers (4 directions) ── */}
        {[0, 90, 180, 270].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 150 + 91 * Math.sin(rad);
          const y1 = 150 - 91 * Math.cos(rad);
          const x2 = 150 + 103 * Math.sin(rad);
          const y2 = 150 - 103 * Math.cos(rad);
          // Perpendicular tick at outer end
          const tx = 3 * Math.cos(rad);
          const ty = 3 * Math.sin(rad);
          return (
            <g key={`ruler-${angle}`} opacity="0.45">
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={statusColor} strokeWidth="0.6" />
              <line x1={x2 - tx} y1={y2 - ty} x2={x2 + tx} y2={y2 + ty} stroke={statusColor} strokeWidth="1" />
            </g>
          );
        })}
        {/* Diameter label */}
        <text x="257" y="150" fontSize="3.8" fontFamily="IBM Plex Mono, monospace" fill={`${statusColor}60`} letterSpacing="0.3">∅ 6792km</text>

        {/* ── Inner tick ring (r=56) ── */}
        <g transform="translate(150,150)">
          {Array.from({ length: 24 }, (_, i) => {
            const ang = (i * Math.PI * 2) / 24;
            const r1 = 54;
            const r2 = i % 3 === 0 ? 50 : 52;
            return (
              <line
                key={i}
                x1={r2 * Math.sin(ang)} y1={-r2 * Math.cos(ang)}
                x2={r1 * Math.sin(ang)} y2={-r1 * Math.cos(ang)}
                stroke={`${statusColor}`}
                strokeWidth={i % 3 === 0 ? "0.8" : "0.4"}
                opacity={i % 3 === 0 ? "0.35" : "0.18"}
              />
            );
          })}
        </g>

        {/* ── Survival arc + center readout ── */}
        <g transform="translate(150,150)">
          {/* Background arc track */}
          <circle
            cx="0" cy="0" r="52"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="2.5"
            strokeDasharray="200 126.7"
            strokeDashoffset="-63"
            transform="rotate(-90)"
          />
          {/* Active survival arc */}
          <motion.circle
            cx="0" cy="0" r="52"
            fill="none"
            stroke={statusColor}
            strokeWidth="2.5"
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
          {/* Survival percentage */}
          <AnimatePresence mode="wait">
            <motion.text
              key={`${survivalPct}-${data.locationName}`}
              x="0" y="-5"
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
          <text x="0" y="9" textAnchor="middle" fontSize="5" fontFamily="Orbitron, sans-serif" fill="rgba(191,200,208,0.65)" letterSpacing="1.5">
            SURVIVAL
          </text>
        </g>

        {/* ── Scan pulse ring ── */}
        <motion.circle
          cx="150" cy="150"
          r={88}
          fill="none"
          stroke={statusColor}
          strokeWidth="1"
          animate={{ r: [88, 112], opacity: [0.45, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
        />

        {/* ── Data cards ── */}
        {/* TEMP */}
        <AnimatePresence mode="wait">
          <motion.g
            key={`temp-${data.temperature}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
          >
            <rect x="18" y="62" width="76" height="34" rx="4" fill="rgba(10,15,20,0.90)" stroke="rgba(129,207,255,0.22)" strokeWidth="0.5" />
            <line x1="18" y1="72" x2="94" y2="72" stroke="rgba(129,207,255,0.10)" strokeWidth="0.4" />
            <text x="56" y="70" textAnchor="middle" fontSize="5" fontFamily="Orbitron, sans-serif" fill="rgba(129,207,255,0.55)" letterSpacing="1.2">TEMP</text>
            <text x="56" y="88" textAnchor="middle" fontSize="10" fontFamily="IBM Plex Mono, monospace" fontWeight="600" fill="#81cfff">{data.temperature}°C</text>
          </motion.g>
        </AnimatePresence>

        {/* RAD */}
        <AnimatePresence mode="wait">
          <motion.g
            key={`rad-${data.radiation}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <rect x="206" y="62" width="76" height="34" rx="4" fill="rgba(10,15,20,0.90)" stroke="rgba(255,107,107,0.22)" strokeWidth="0.5" />
            <line x1="206" y1="72" x2="282" y2="72" stroke="rgba(255,107,107,0.10)" strokeWidth="0.4" />
            <text x="244" y="70" textAnchor="middle" fontSize="5" fontFamily="Orbitron, sans-serif" fill="rgba(255,107,107,0.55)" letterSpacing="1.2">RAD</text>
            <text x="244" y="88" textAnchor="middle" fontSize="10" fontFamily="IBM Plex Mono, monospace" fontWeight="600" fill="#ff9f9f">{data.radiation}</text>
          </motion.g>
        </AnimatePresence>

        {/* PRES */}
        <AnimatePresence mode="wait">
          <motion.g
            key={`pres-${data.pressure}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <rect x="112" y="218" width="76" height="34" rx="4" fill="rgba(10,15,20,0.90)" stroke="rgba(100,221,153,0.22)" strokeWidth="0.5" />
            <line x1="112" y1="228" x2="188" y2="228" stroke="rgba(100,221,153,0.10)" strokeWidth="0.4" />
            <text x="150" y="226" textAnchor="middle" fontSize="5" fontFamily="Orbitron, sans-serif" fill="rgba(100,221,153,0.55)" letterSpacing="1.2">PRES</text>
            <text x="150" y="244" textAnchor="middle" fontSize="10" fontFamily="IBM Plex Mono, monospace" fontWeight="600" fill="#64dd99">{data.pressure} kPa</text>
          </motion.g>
        </AnimatePresence>

        {/* ── Corner brackets + labels ── */}
        {/* Top-left */}
        <path d="M 22 50 L 22 38 L 34 38" stroke="rgba(129,207,255,0.38)" strokeWidth="1" fill="none" />
        <text x="36" y="36" fontSize="4" fontFamily="IBM Plex Mono, monospace" fill="rgba(129,207,255,0.40)" letterSpacing="0.8">ARES-III</text>

        {/* Top-right */}
        <path d="M 278 50 L 278 38 L 266 38" stroke="rgba(129,207,255,0.38)" strokeWidth="1" fill="none" />
        <text x="220" y="36" fontSize="4" fontFamily="IBM Plex Mono, monospace" fill="rgba(129,207,255,0.40)" letterSpacing="0.8">SOL-1242</text>

        {/* Bottom-left */}
        <path d="M 22 250 L 22 262 L 34 262" stroke="rgba(129,207,255,0.22)" strokeWidth="1" fill="none" />
        <text x="36" y="268" fontSize="4" fontFamily="IBM Plex Mono, monospace" fill="rgba(129,207,255,0.28)" letterSpacing="0.8">4.5°N 77.4°E</text>

        {/* Bottom-right */}
        <path d="M 278 250 L 278 262 L 266 262" stroke="rgba(129,207,255,0.22)" strokeWidth="1" fill="none" />
        <AnimatePresence mode="wait">
          <motion.text
            key={statusLabel}
            x="214" y="268"
            fontSize="4"
            fontFamily="IBM Plex Mono, monospace"
            fill={`${statusColor}80`}
            letterSpacing="0.8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {statusLabel}
          </motion.text>
        </AnimatePresence>
      </svg>

      {/* ── Globe ── */}
      <div
        style={{
          width: "68%",
          aspectRatio: "1",
          filter: `drop-shadow(0 0 28px ${statusColor}28) drop-shadow(0 0 8px ${statusColor}15)`,
          transition: "filter 0.7s ease",
          flexShrink: 0,
        }}
      >
        <ProceduralMarsGlobe className="w-full h-full" />
      </div>
    </div>
  );
}
