/**
 * Procedural Mars globe rendered with CSS gradients + SVG noise.
 * No external image dependency — works offline.
 */
export default function ProceduralMarsGlobe({ className = "" }: { className?: string }) {
  return (
    <div className={`relative rounded-full overflow-hidden ${className}`}>
      {/* Base Mars surface color */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 35% 40%, rgba(180,100,60,0.5) 0%, transparent 60%),
            radial-gradient(ellipse 80% 100% at 70% 60%, rgba(140,80,45,0.4) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 50% 30%, rgba(200,130,80,0.3) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(160,90,50,0.6) 0%, rgba(100,55,30,0.4) 60%, rgba(40,20,10,0.8) 100%)
          `,
        }}
      />

      {/* Surface texture via SVG noise */}
      <svg className="absolute inset-0 w-full h-full opacity-30 mix-blend-overlay">
        <filter id="marsNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" seed="42" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0.3" />
        </filter>
        <rect width="100%" height="100%" filter="url(#marsNoise)" />
      </svg>

      {/* Polar ice cap highlight */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 50% 20% at 50% 8%, rgba(220,230,240,0.25) 0%, transparent 70%)",
        }}
      />

      {/* Atmospheric edge glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 50% 50%, transparent 55%, rgba(78,168,217,0.15) 75%, rgba(78,168,217,0.05) 100%)",
        }}
      />

      {/* 3D lighting — highlight and shadow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `
            radial-gradient(ellipse 60% 60% at 35% 35%, rgba(255,255,255,0.08) 0%, transparent 50%),
            radial-gradient(ellipse 80% 80% at 65% 65%, rgba(0,0,0,0.4) 0%, transparent 60%)
          `,
        }}
      />
    </div>
  );
}
