interface EnergyConduitProps {
  active: boolean;
}

export default function EnergyConduit({ active }: EnergyConduitProps) {
  return (
    <svg width="80" height="4" viewBox="0 0 80 4" className="shrink-0 mt-14">
      <defs>
        <linearGradient id="conduitActive" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(0,229,255,0.6)" />
          <stop offset="100%" stopColor="rgba(0,229,255,0.1)" />
        </linearGradient>
        <linearGradient id="conduitIdle" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(138,138,147,0.2)" />
          <stop offset="100%" stopColor="rgba(138,138,147,0.05)" />
        </linearGradient>
      </defs>
      <line
        x1="0" y1="2" x2="80" y2="2"
        stroke={active ? "url(#conduitActive)" : "url(#conduitIdle)"}
        strokeWidth={active ? "3" : "2"}
        strokeDasharray={active ? "12 6" : "4 8"}
        className={active ? "pipeline-flow" : ""}
      />
    </svg>
  );
}
