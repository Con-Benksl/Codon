import { useState } from "react";
import { motion } from "motion/react";
import {
  Activity,
  Mountain,
  History,
  Thermometer,
  AlertTriangle,
  Minimize2,
  FlaskConical,
  MapPin,
  Search,
} from "lucide-react";
import { EnvironmentalCard } from "../components";
import ProceduralMarsGlobe from "../components/ProceduralMarsGlobe";
import { useLocale, type Locale } from "../i18n/context";
import { stagger, fadeSlideUp, fadeSlideLeft, fadeSlideRight, viewTransition } from "../lib/motion";

type MobileTab = "env" | "geo";
type LocationKey = "jezero" | "valles" | "gale" | "utopia";
type SystemStatus = "optimal" | "monitoring" | "analyzing" | "warning";

interface Source {
  source: string;
  id: string;
  title: string;
  loc: string;
  isSim?: boolean;
}

interface LocationData {
  label: string;
  coords: string;
  system: SystemStatus;
  temperature: { value: string; unit: string; description: string; progress: number };
  radiation: { value: string; unit: string; description: string };
  pressure: { value: string; unit: string; description: string };
  chemicals: { label: string; value: string; color: string; isHazard?: boolean }[];
  survival: number;
  survivalOrganism: string;
  geoSources: Source[];
  systemLog: string[];
}

interface UiCopy {
  monitoring: string;
  system: string;
  envTab: string;
  geoTab: string;
  title1: string;
  title2: string;
  temp: string;
  rad: string;
  pres: string;
  tempMin: string;
  tempMax: string;
  chem: string;
  survival: string;
  jezeroHint: string;
  vallesHint: string;
  geoTitle: string;
  geoSub: string;
  systemActivity: string;
  survivalProbability: string;
}

const COPY: Record<Locale, UiCopy> = {
  zh: {
    monitoring: "ARES MONITORING",
    system: "系统",
    envTab: "环境参数",
    geoTab: "地质证据",
    title1: "火星环境约束",
    title2: "监测面板",
    temp: "温度约束 (TEMPER)",
    rad: "辐射水平 (RAD)",
    pres: "大气压力 (PRES)",
    tempMin: "-120C (MIN)",
    tempMax: "30C (MAX)",
    chem: "化学成分 (CHEM)",
    survival: "生存概率",
    jezeroHint: "亚表面宜居指数：高 (0.84)",
    vallesHint: "深层地质压力：12.5 MPa",
    geoTitle: "地质证据与溯源",
    geoSub: "Geo-Evidence & Traceability",
    systemActivity: "系统活动状态",
    survivalProbability: "生存概率",
  },
  en: {
    monitoring: "ARES MONITORING",
    system: "SYSTEM",
    envTab: "ENVIRONMENT",
    geoTab: "GEO EVIDENCE",
    title1: "MARS ENVIRONMENT",
    title2: "CONSTRAINT MONITOR",
    temp: "TEMPERATURE (TEMPER)",
    rad: "RADIATION LEVEL (RAD)",
    pres: "ATMOSPHERIC PRESSURE (PRES)",
    tempMin: "-120C (MIN)",
    tempMax: "30C (MAX)",
    chem: "CHEMICAL COMPOSITION (CHEM)",
    survival: "Survival Rate",
    jezeroHint: "Subsurface habitability index: High (0.84)",
    vallesHint: "Deep geological pressure: 12.5 MPa",
    geoTitle: "Geo Evidence & Traceability",
    geoSub: "Geo-Evidence & Traceability",
    systemActivity: "System Activity",
    survivalProbability: "Survival Probability",
  },
};

const SYSTEM_LABELS: Record<Locale, Record<SystemStatus, string>> = {
  zh: { optimal: "最佳", monitoring: "监测中", analyzing: "分析中", warning: "警告" },
  en: { optimal: "OPTIMAL", monitoring: "MONITORING", analyzing: "ANALYZING", warning: "WARNING" },
};

const NAV_LABELS: Record<Locale, Record<LocationKey, string>> = {
  zh: { jezero: "耶泽罗", valles: "水手谷", gale: "盖尔", utopia: "乌托邦" },
  en: { jezero: "Jezero", valles: "Valles", gale: "Gale", utopia: "Utopia" },
};

const DATA: Record<Locale, Record<LocationKey, LocationData>> = {
  zh: {
    jezero: {
      label: "Jezero",
      coords: "18.4N 77.5E",
      system: "optimal",
      temperature: { value: "-60", unit: "至 +20C", description: "昼夜温差较大，持续监测中。", progress: 40 },
      radiation: { value: "100x", unit: "地球基线", description: "UV-B/C 穿透率高，DNA 风险偏高。" },
      pressure: { value: "0.6", unit: "kPa", description: "大气稀薄，需要加压环境。" },
      chemicals: [
        { label: "CO2 (二氧化碳)", value: "95.3%", color: "#d4a843" },
        { label: "N2 (氮气)", value: "2.7%", color: "#d4a84399" },
        { label: "高氯酸盐", value: "0.8%", color: "#ffb4a1", isHazard: true },
      ],
      survival: 78,
      survivalOrganism: "Chroococcidiopsis",
      geoSources: [
        { source: "NASA PDS", id: "5542-X", title: "Jezero 高氯酸盐沉积分析", loc: "18.4N 77.5E" },
        { source: "XENO-LAB", id: "LAB-77", title: "极寒环境适应模拟", loc: "SIMULATION MODE", isSim: true },
      ],
      systemLog: ["> 同步轨道遥感数据...", "> 环境稳定性评分：88.4%"],
    },
    valles: {
      label: "Valles Marineris",
      coords: "-13.9S 301.0E",
      system: "monitoring",
      temperature: { value: "-45", unit: "至 +5C", description: "峡谷形成局部热效应。", progress: 55 },
      radiation: { value: "80x", unit: "地球基线", description: "地形可降低部分辐射暴露。" },
      pressure: { value: "1.2", unit: "kPa", description: "谷底压力较高。", },
      chemicals: [
        { label: "CO2 (二氧化碳)", value: "94.1%", color: "#d4a843" },
        { label: "N2 (氮气)", value: "3.2%", color: "#d4a84399" },
        { label: "高氯酸盐", value: "0.5%", color: "#ffb4a1", isHazard: true },
      ],
      survival: 64,
      survivalOrganism: "D. radiodurans",
      geoSources: [
        { source: "MRO HiRISE", id: "MRO-VM1", title: "Valles 层状沉积分析", loc: "-13.9S 301.0E" },
        { source: "ESA MEX", id: "MEX-004", title: "深层盐水雷达证据", loc: "-13.9S 301.0E" },
      ],
      systemLog: ["> 深层雷达扫描中...", "> 地质压力估算：12.5 MPa"],
    },
    gale: {
      label: "Gale Crater",
      coords: "-4.6S 137.4E",
      system: "analyzing",
      temperature: { value: "-55", unit: "至 +15C", description: "白天暖化明显。", progress: 45 },
      radiation: { value: "95x", unit: "地球基线", description: "中等辐射暴露，需持续防护。" },
      pressure: { value: "0.85", unit: "kPa", description: "盆地气压略高于均值。" },
      chemicals: [
        { label: "CO2 (二氧化碳)", value: "95.7%", color: "#d4a843" },
        { label: "N2 (氮气)", value: "1.9%", color: "#d4a84399" },
        { label: "高氯酸盐", value: "0.6%", color: "#ffb4a1", isHazard: true },
      ],
      survival: 71,
      survivalOrganism: "Synechocystis",
      geoSources: [
        { source: "CURIOSITY", id: "MSL-001", title: "有机分子观测记录", loc: "-4.6S 137.4E" },
        { source: "MSL-REMS", id: "REMS-44", title: "气象长期记录", loc: "-4.5S 137.3E" },
      ],
      systemLog: ["> Curiosity 数据同步...", "> 宜居性评分：74.1%"],
    },
    utopia: {
      label: "Utopia Planitia",
      coords: "49.7N 117.8E",
      system: "warning",
      temperature: { value: "-80", unit: "至 -10C", description: "高纬度极寒，条件严苛。", progress: 20 },
      radiation: { value: "115x", unit: "地球基线", description: "辐射暴露明显偏高。" },
      pressure: { value: "0.5", unit: "kPa", description: "气压极低，维持困难。" },
      chemicals: [
        { label: "CO2 (二氧化碳)", value: "96.1%", color: "#d4a843" },
        { label: "N2 (氮气)", value: "2.1%", color: "#d4a84399" },
        { label: "高氯酸盐", value: "1.2%", color: "#ffb4a1", isHazard: true },
      ],
      survival: 42,
      survivalOrganism: "T. gammatolerans",
      geoSources: [
        { source: "VIKING 2", id: "VK2-UP", title: "土壤高氯酸盐检测", loc: "49.7N 117.8E" },
        { source: "ZHURONG", id: "ZHR-05", title: "地下冰层雷达图", loc: "25.1N 109.9E" },
      ],
      systemLog: ["> Zhurong 数据接入...", "> 适应难度：CRITICAL"],
    },
  },
  en: {
    jezero: {
      label: "Jezero",
      coords: "18.4N 77.5E",
      system: "optimal",
      temperature: { value: "-60", unit: "to +20C", description: "Large day-night gradient, under monitoring.", progress: 40 },
      radiation: { value: "100x", unit: "Earth baseline", description: "High UV-B/C penetration, elevated DNA risk." },
      pressure: { value: "0.6", unit: "kPa", description: "Thin atmosphere requires pressurized habitat." },
      chemicals: [
        { label: "CO2 (Carbon Dioxide)", value: "95.3%", color: "#d4a843" },
        { label: "N2 (Nitrogen)", value: "2.7%", color: "#d4a84399" },
        { label: "Perchlorates", value: "0.8%", color: "#ffb4a1", isHazard: true },
      ],
      survival: 78,
      survivalOrganism: "Chroococcidiopsis",
      geoSources: [
        { source: "NASA PDS", id: "5542-X", title: "Jezero perchlorate analysis", loc: "18.4N 77.5E" },
        { source: "XENO-LAB", id: "LAB-77", title: "Cryogenic adaptation simulation", loc: "SIMULATION MODE", isSim: true },
      ],
      systemLog: ["> Syncing orbital stream...", "> Stability score: 88.4%"],
    },
    valles: {
      label: "Valles Marineris",
      coords: "-13.9S 301.0E",
      system: "monitoring",
      temperature: { value: "-45", unit: "to +5C", description: "Canyon creates local thermal effects.", progress: 55 },
      radiation: { value: "80x", unit: "Earth baseline", description: "Terrain reduces part of surface exposure." },
      pressure: { value: "1.2", unit: "kPa", description: "Higher valley-floor pressure." },
      chemicals: [
        { label: "CO2 (Carbon Dioxide)", value: "94.1%", color: "#d4a843" },
        { label: "N2 (Nitrogen)", value: "3.2%", color: "#d4a84399" },
        { label: "Perchlorates", value: "0.5%", color: "#ffb4a1", isHazard: true },
      ],
      survival: 64,
      survivalOrganism: "D. radiodurans",
      geoSources: [
        { source: "MRO HiRISE", id: "MRO-VM1", title: "Layered deposition analysis", loc: "-13.9S 301.0E" },
        { source: "ESA MEX", id: "MEX-004", title: "Deep brine radar evidence", loc: "-13.9S 301.0E" },
      ],
      systemLog: ["> Deep radar scanning...", "> Pressure estimate: 12.5 MPa"],
    },
    gale: {
      label: "Gale Crater",
      coords: "-4.6S 137.4E",
      system: "analyzing",
      temperature: { value: "-55", unit: "to +15C", description: "Clear daytime warming effect.", progress: 45 },
      radiation: { value: "95x", unit: "Earth baseline", description: "Moderate exposure with ongoing checks." },
      pressure: { value: "0.85", unit: "kPa", description: "Basin pressure is slightly above mean." },
      chemicals: [
        { label: "CO2 (Carbon Dioxide)", value: "95.7%", color: "#d4a843" },
        { label: "N2 (Nitrogen)", value: "1.9%", color: "#d4a84399" },
        { label: "Perchlorates", value: "0.6%", color: "#ffb4a1", isHazard: true },
      ],
      survival: 71,
      survivalOrganism: "Synechocystis",
      geoSources: [
        { source: "CURIOSITY", id: "MSL-001", title: "Organic molecule record", loc: "-4.6S 137.4E" },
        { source: "MSL-REMS", id: "REMS-44", title: "Long-term weather logs", loc: "-4.5S 137.3E" },
      ],
      systemLog: ["> Curiosity stream synced...", "> Habitability score: 74.1%"],
    },
    utopia: {
      label: "Utopia Planitia",
      coords: "49.7N 117.8E",
      system: "warning",
      temperature: { value: "-80", unit: "to -10C", description: "Severe high-latitude cold conditions.", progress: 20 },
      radiation: { value: "115x", unit: "Earth baseline", description: "Radiation exposure remains high." },
      pressure: { value: "0.5", unit: "kPa", description: "Very low pressure and harsh constraints." },
      chemicals: [
        { label: "CO2 (Carbon Dioxide)", value: "96.1%", color: "#d4a843" },
        { label: "N2 (Nitrogen)", value: "2.1%", color: "#d4a84399" },
        { label: "Perchlorates", value: "1.2%", color: "#ffb4a1", isHazard: true },
      ],
      survival: 42,
      survivalOrganism: "T. gammatolerans",
      geoSources: [
        { source: "VIKING 2", id: "VK2-UP", title: "Perchlorate detection in soil", loc: "49.7N 117.8E" },
        { source: "ZHURONG", id: "ZHR-05", title: "Subsurface ice radar map", loc: "25.1N 109.9E" },
      ],
      systemLog: ["> Zhurong feed connected...", "> Adaptation difficulty: CRITICAL"],
    },
  },
};

const ORDER: LocationKey[] = ["jezero", "valles", "gale", "utopia"];
const ICONS: Record<LocationKey, typeof MapPin> = { jezero: MapPin, valles: Mountain, gale: Activity, utopia: Search };

export default function EnvironmentView() {
  const { locale } = useLocale();
  const copy = COPY[locale];
  const [mobileTab, setMobileTab] = useState<MobileTab>("env");
  const [activeLocation, setActiveLocation] = useState<LocationKey>("jezero");
  const loc = DATA[locale][activeLocation];

  return (
    <motion.div variants={viewTransition} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col pt-2 lg:h-[calc(100vh-64px)] lg:overflow-hidden">
      <motion.div variants={stagger(50)} initial="hidden" animate="show" className="flex justify-between items-center mb-4 md:mb-6">
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <motion.span variants={fadeSlideUp} className="text-lg md:text-xl font-black tracking-tighter text-primary italic font-headline">{copy.monitoring}</motion.span>
          <div className="h-4 w-[1px] bg-outline-variant/30 hidden md:block" />
          <motion.span variants={fadeSlideUp} className="font-headline tracking-tight uppercase text-xs md:text-sm font-bold text-primary border-b-2 border-primary pb-1">SOL 1242</motion.span>
          <motion.span key={`coords-${locale}-${activeLocation}`} variants={fadeSlideUp} className="hidden md:block font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant">{loc.coords}</motion.span>
          <motion.span key={`system-${locale}-${activeLocation}`} variants={fadeSlideUp} className={`hidden md:block font-headline tracking-tight uppercase text-sm font-bold ${loc.system === "optimal" ? "text-tertiary" : loc.system === "warning" ? "text-secondary" : "text-primary"}`}>
            {copy.system}: {SYSTEM_LABELS[locale][loc.system]}
          </motion.span>
        </div>
      </motion.div>

      <div className="flex lg:hidden gap-2 mb-4">
        <button onClick={() => setMobileTab("env")} className={`relative flex-1 py-3 min-h-[44px] rounded-lg font-headline text-xs uppercase tracking-widest font-bold transition-colors ${mobileTab === "env" ? "text-primary" : "bg-surface-container-low text-on-surface-variant border border-outline-variant/15"}`}>
          {mobileTab === "env" && <motion.div layoutId="tab-indicator" className="absolute inset-0 rounded-lg bg-primary/15 border border-primary/30" transition={{ type: "spring", damping: 30, stiffness: 300 }} />}
          <span className="relative z-10">{copy.envTab}</span>
        </button>
        <button onClick={() => setMobileTab("geo")} className={`relative flex-1 py-3 min-h-[44px] rounded-lg font-headline text-xs uppercase tracking-widest font-bold transition-colors ${mobileTab === "geo" ? "text-[#d4a843]" : "bg-surface-container-low text-on-surface-variant border border-outline-variant/15"}`}>
          {mobileTab === "geo" && <motion.div layoutId="tab-indicator" className="absolute inset-0 rounded-lg bg-[#d4a843]/15 border border-[#d4a843]/30" transition={{ type: "spring", damping: 30, stiffness: 300 }} />}
          <span className="relative z-10">{copy.geoTab}</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:flex-1 lg:overflow-hidden gap-4 lg:gap-0">
        <motion.section variants={stagger(80)} initial="hidden" animate="show" className={`w-full lg:w-80 lg:h-full lg:pr-6 flex-col gap-4 overflow-y-auto ${mobileTab === "env" ? "flex" : "hidden"} lg:flex`}>
          <motion.div variants={fadeSlideLeft} className="mb-2 lg:mb-4">
            <h1 className="text-xl md:text-2xl font-black font-headline text-on-surface leading-tight tracking-tighter">{copy.title1}<br />{copy.title2}</h1>
            <motion.div initial={{ width: 0 }} animate={{ width: 48 }} transition={{ duration: 0.6, delay: 0.4 }} className="h-1 bg-primary mt-2" />
          </motion.div>
          <EnvironmentalCard title={copy.temp} icon={Thermometer} value={loc.temperature.value} unit={loc.temperature.unit} description={loc.temperature.description} progress={{ current: loc.temperature.progress, min: copy.tempMin, max: copy.tempMax }} index={0} />
          <EnvironmentalCard title={copy.rad} icon={AlertTriangle} value={loc.radiation.value} unit={loc.radiation.unit} color="secondary" description={loc.radiation.description} index={1} />
          <EnvironmentalCard title={copy.pres} icon={Minimize2} value={loc.pressure.value} unit={loc.pressure.unit} description={loc.pressure.description} index={2} />
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.24 }} className="glass-panel rounded-xl p-4 border border-outline-variant/10">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-[#d4a843] tracking-widest uppercase">{copy.chem}</span>
              <FlaskConical size={16} className="text-[#d4a843]" />
            </div>
            <div className="space-y-3">
              {loc.chemicals.map((item, i) => (
                <div key={item.label}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className={item.isHazard ? "text-secondary" : "text-on-surface"}>{item.label}</span>
                    <span className={item.isHazard ? "text-secondary font-bold" : "text-on-surface font-bold"}>{item.value}</span>
                  </div>
                  <div className={`h-1 w-full rounded-full ${item.isHazard ? "bg-secondary/20" : "bg-surface-container-lowest"}`}>
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: item.color }} initial={{ width: 0 }} animate={{ width: item.value }} transition={{ duration: 1, delay: 0.5 + i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div key={`survival-mobile-${locale}-${activeLocation}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="flex items-center gap-4 glass-panel rounded-xl p-4 border border-tertiary/20 glow-tertiary lg:hidden">
            <div className="text-center shrink-0">
              <span className="text-3xl font-headline font-black text-tertiary">{loc.survival}%</span>
              <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">{copy.survival}</p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-on-surface uppercase tracking-widest mb-2 font-headline">{loc.survivalOrganism}</p>
              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <motion.div className="h-full bg-tertiary rounded-full" initial={{ width: 0 }} animate={{ width: `${loc.survival}%` }} transition={{ duration: 1.2, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }} />
              </div>
            </div>
          </motion.div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="hidden md:flex flex-1 relative items-center justify-center min-h-[520px] lg:min-h-[640px]"
        >
          <ProceduralMarsGlobe className="w-[360px] h-[360px] md:w-[460px] md:h-[460px] lg:w-[540px] lg:h-[540px] xl:w-[620px] xl:h-[620px]" />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
            <p className="text-[9px] font-headline tracking-widest uppercase bg-surface-container-high/80 px-4 py-1 rounded-full border border-outline-variant/20 text-on-surface-variant/70">
              {loc.survivalOrganism} · {copy.survivalProbability}
            </p>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className={`w-full lg:w-80 lg:h-full lg:pl-6 flex-col gap-4 overflow-hidden border-t lg:border-t-0 lg:border-l border-outline-variant/10 glass-panel pt-4 lg:pt-0 ${mobileTab === "geo" ? "flex" : "hidden"} lg:flex`}>
          <div className="mb-4">
            <div className="flex items-center gap-2 text-[#d4a843] mb-1">
              <History size={18} />
              <h2 className="text-sm font-bold tracking-widest uppercase font-headline">{copy.geoTitle}</h2>
            </div>
            <p className="text-[10px] text-on-surface-variant uppercase">{copy.geoSub}</p>
            <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.8, delay: 0.6 }} className="h-[1px] bg-gradient-to-r from-[#d4a843]/40 to-transparent mt-3" />
          </div>
          <motion.div variants={stagger(70)} initial="hidden" animate="show" className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
            {loc.geoSources.map((item) => (
              <motion.div
                key={item.id}
                variants={fadeSlideRight}
                whileHover={{ x: 4, transition: { duration: 0.15 } }}
                className="group relative overflow-hidden rounded-xl border border-outline-variant/12 bg-surface-container-low/35 p-3 transition-all hover:border-[#d4a843]/35 hover:bg-surface-container-highest/35 cursor-pointer"
              >
                <span className="absolute inset-y-2 left-0 w-px rounded-full bg-[#d4a843]/0 transition-colors duration-150 group-hover:bg-[#d4a843]" />
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-[#d4a843]">{item.source}</span>
                  <span className="text-[9px] text-on-surface-variant font-mono">ID: {item.id}</span>
                </div>
                <p className="text-xs text-on-surface font-medium mb-2 leading-snug">{item.title}</p>
                <div className="flex items-center gap-2 text-[9px] text-primary">
                  {item.isSim ? <FlaskConical size={10} /> : <MapPin size={10} />}
                  <span>{item.loc}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-4 pt-4 border-t border-outline-variant/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">{copy.systemActivity}</span>
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            </div>
            <div className="bg-surface-container-lowest p-2 rounded border border-outline-variant/10">
              <p className="text-[9px] font-mono text-tertiary leading-tight">
                {loc.systemLog.map((line, i) => (
                  <span key={`${line}-${i}`}>{line}{i < loc.systemLog.length - 1 && <br />}</span>
                ))}
              </p>
            </div>
          </motion.div>
        </motion.section>
      </div>

      <motion.nav variants={stagger(80)} initial="hidden" animate="show" className="flex justify-center gap-4 md:gap-8 items-center mt-4 md:mt-6 pb-2">
        {ORDER.map((key) => {
          const Icon = ICONS[key];
          return (
            <motion.button key={key} variants={fadeSlideUp} whileHover={{ y: -2, transition: { duration: 0.15 } }} whileTap={{ scale: 0.95 }} onClick={() => setActiveLocation(key)} className={`flex flex-col items-center justify-center px-4 md:px-6 py-2 rounded-xl transition-all cursor-pointer ${activeLocation === key ? "bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-[0_0_15px_rgba(78,168,217,0.3)]" : "text-on-surface-variant opacity-60 hover:text-primary hover:opacity-100"}`}>
              <Icon size={20} />
              <span className="font-headline text-[10px] uppercase font-bold tracking-widest mt-1">{NAV_LABELS[locale][key]}</span>
            </motion.button>
          );
        })}
      </motion.nav>
    </motion.div>
  );
}
