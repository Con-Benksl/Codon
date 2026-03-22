export default function AmbientGlow() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      {/* Primary glow — top-left */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full opacity-[0.07]"
        style={{
          background: "radial-gradient(circle, rgba(78,168,217,0.6) 0%, transparent 70%)",
        }}
      />
      {/* Secondary glow — bottom-right */}
      <div
        className="absolute -bottom-[15%] -right-[10%] w-[50%] h-[50%] rounded-full opacity-[0.05]"
        style={{
          background: "radial-gradient(circle, rgba(255,180,161,0.5) 0%, transparent 70%)",
        }}
      />
      {/* Tertiary glow — center-bottom */}
      <div
        className="absolute bottom-[5%] left-[30%] w-[40%] h-[40%] rounded-full opacity-[0.04]"
        style={{
          background: "radial-gradient(circle, rgba(100,221,153,0.5) 0%, transparent 70%)",
        }}
      />
      {/* Noise texture overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
        <filter id="ambientNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#ambientNoise)" />
      </svg>
    </div>
  );
}
