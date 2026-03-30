import { useLocale } from "../i18n/context";

const TICKER_DATA_ZH = [
  "SYS: 在线",
  "ATM: 1.04 kPa",
  "O\u2082: 0.13%",
  "CO\u2082: 95.3%",
  "TEMP: -63\u00b0C",
  "RAD: 0.67 mSv/d",
  "DUST: Fe\u2082O\u2083 42%",
  "WIND: 7.2 m/s",
  "SOL: 1847",
  "UPLINK: 14ms",
  "AGENTS: 3/3 ACTIVE",
  "MEM: 78.4%",
  "COMPUTE: NOMINAL",
];

const TICKER_DATA_EN = [
  "SYS: ONLINE",
  "ATM: 1.04 kPa",
  "O\u2082: 0.13%",
  "CO\u2082: 95.3%",
  "TEMP: -63\u00b0C",
  "RAD: 0.67 mSv/d",
  "DUST: Fe\u2082O\u2083 42%",
  "WIND: 7.2 m/s",
  "SOL: 1847",
  "UPLINK: 14ms",
  "AGENTS: 3/3 ACTIVE",
  "MEM: 78.4%",
  "COMPUTE: NOMINAL",
];

export default function TelemetryTicker() {
  const { locale } = useLocale();
  const data = locale === "zh" ? TICKER_DATA_ZH : TICKER_DATA_EN;
  const text = data.join("  \u2502  ");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-10 overflow-hidden border-t border-[rgba(255,255,255,0.06)] bg-[rgba(5,5,10,0.8)] backdrop-blur-sm">
      <div className="h-full flex items-center animate-marquee whitespace-nowrap">
        <span className="font-mono text-xs tracking-wider text-muted">
          {text}
          {"  \u2502  "}
          {text}
        </span>
      </div>
    </div>
  );
}
