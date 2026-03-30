export default function VoiceWaveform() {
  return (
    <div className="flex items-end justify-center gap-1 h-8">
      {[0, 0.2, 0.4, 0.1, 0.3].map((delay, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-primary animate-wave"
          style={{
            height: "100%",
            animationDelay: `${delay}s`,
            animationDuration: `${1.1 + i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}
