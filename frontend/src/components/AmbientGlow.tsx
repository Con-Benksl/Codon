export default function AmbientGlow() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Cyan orb — top-left */}
      <div
        className="absolute -top-[10%] left-[10%] w-[600px] h-[600px] rounded-full opacity-[0.35] animate-orb-float"
        style={{
          background: "radial-gradient(circle, rgba(0,229,255,0.35) 0%, transparent 70%)",
          filter: "blur(140px)",
        }}
      />
      {/* Violet orb — bottom-right */}
      <div
        className="absolute -bottom-[15%] right-[5%] w-[500px] h-[500px] rounded-full opacity-[0.35] animate-orb-float-slow"
        style={{
          background: "radial-gradient(circle, rgba(112,0,255,0.2) 0%, transparent 70%)",
          filter: "blur(120px)",
        }}
      />
      {/* Magenta orb — center */}
      <div
        className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[400px] h-[400px] rounded-full opacity-[0.25] animate-orb-float-alt"
        style={{
          background: "radial-gradient(circle, rgba(255,0,85,0.1) 0%, transparent 70%)",
          filter: "blur(120px)",
        }}
      />
      {/* Subtle noise overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.02]">
        <filter id="ambientNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#ambientNoise)" />
      </svg>
    </div>
  );
}
