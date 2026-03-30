import { motion } from "motion/react";
import { orbEntrance } from "../../lib/motion";

interface NexusSphereProps {
  atmPressure: string;
  o2Level: string;
  co2Level: string;
  tempValue: string;
}

export default function NexusSphere({ atmPressure, o2Level, co2Level, tempValue }: NexusSphereProps) {
  return (
    <motion.div
      variants={orbEntrance}
      initial="hidden"
      animate="show"
      className="relative w-[400px] h-[400px] flex items-center justify-center shrink-0"
    >
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Orbital ring 1 — large, slow */}
      <div className="absolute inset-[-20px] orbit-slow">
        <svg viewBox="0 0 440 440" className="w-full h-full">
          <ellipse
            cx="220" cy="220" rx="210" ry="100"
            fill="none"
            stroke="rgba(0,229,255,0.15)"
            strokeWidth="1"
            strokeDasharray="8 12"
            transform="rotate(-15 220 220)"
          />
        </svg>
      </div>

      {/* Orbital ring 2 — medium, counter */}
      <div className="absolute inset-[10px] orbit-ccw">
        <svg viewBox="0 0 380 380" className="w-full h-full">
          <ellipse
            cx="190" cy="190" rx="180" ry="120"
            fill="none"
            stroke="rgba(112,0,255,0.12)"
            strokeWidth="1"
            strokeDasharray="6 10"
            transform="rotate(30 190 190)"
          />
        </svg>
      </div>

      {/* Orbital ring 3 — inner, fast */}
      <div className="absolute inset-[40px] orbit-cw">
        <svg viewBox="0 0 320 320" className="w-full h-full">
          <circle
            cx="160" cy="160" r="150"
            fill="none"
            stroke="rgba(0,229,255,0.08)"
            strokeWidth="0.5"
            strokeDasharray="4 8"
          />
        </svg>
      </div>

      {/* Core sphere */}
      <div className="relative w-[220px] h-[220px] rounded-full overflow-hidden">
        {/* Gradient sphere background */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle at 35% 35%, rgba(0,229,255,0.25) 0%, rgba(5,5,10,0.9) 60%, #05050A 100%)",
          }}
        />
        {/* Surface texture simulation */}
        <div
          className="absolute inset-0 rounded-full animate-breathing"
          style={{
            background: "radial-gradient(circle at 60% 40%, rgba(112,0,255,0.1) 0%, transparent 50%)",
          }}
        />
        {/* Inner border highlight */}
        <div className="absolute inset-0 rounded-full border border-[rgba(0,229,255,0.2)]" />

        {/* Data overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
          <span className="text-[10px] font-mono text-muted tracking-widest uppercase">ATM</span>
          <span className="text-3xl font-headline font-bold text-primary leading-none mt-1">{atmPressure}</span>
          <span className="text-[10px] font-mono text-muted mt-0.5">kPa</span>

          <div className="flex gap-4 mt-4">
            <div className="text-center">
              <span className="text-[8px] font-mono text-muted tracking-wider">O₂</span>
              <span className="block text-xs font-mono text-on-surface">{o2Level}</span>
            </div>
            <div className="text-center">
              <span className="text-[8px] font-mono text-muted tracking-wider">CO₂</span>
              <span className="block text-xs font-mono text-on-surface">{co2Level}</span>
            </div>
            <div className="text-center">
              <span className="text-[8px] font-mono text-muted tracking-wider">TEMP</span>
              <span className="block text-xs font-mono text-on-surface">{tempValue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/40 animate-breathing"
          style={{
            top: `${20 + Math.random() * 60}%`,
            left: `${15 + Math.random() * 70}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${3 + Math.random() * 3}s`,
          }}
        />
      ))}
    </motion.div>
  );
}
