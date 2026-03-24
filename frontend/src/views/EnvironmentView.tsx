import { useState } from "react";
import { motion } from "motion/react";
import { Activity, Mountain, Thermometer, AlertTriangle, Minimize2, FlaskConical, MapPin, Search } from "lucide-react";
import { EnvironmentalCard, FallbackImage, ProceduralMarsGlobe } from "../components";
import { useLocale } from "../i18n/context";
import { viewTransition } from "../lib/motion";

type LocationKey = "jezero" | "valles" | "gale" | "utopia";

interface LocationData {
  label: string;
  coords: string;
  system: string;
  temperature: { value: string; unit: string; description: string; progress: number };
  radiation: { value: string; unit: string; description: string };
  pressure: { value: string; unit: string; description: string };
  chemicals: { label: string; value: string; color: string; isHazard?: boolean }[];
  survival: number;
  survivalOrganism: string;
  sources: { id: string; source: string; title: string; loc: string }[];
}

const DATA: Record<"zh" | "en", Record<LocationKey, LocationData>> = {
  zh: {
    jezero: {
      label: "Jezero", coords: "18.4°N 77.5°E", system: "OPTIMAL",
      temperature: { value: "-60°", unit: "至 +20°C", description: "平均气温监测中，昼夜温差极大。", progress: 40 },
      radiation: { value: "100x", unit: "地球等级", description: "UV-B/C 穿透率过高，存在 DNA 损伤风险。" },
      pressure: { value: "0.6", unit: "kPa", description: "稀薄大气，需密封加压环境。", },
      chemicals: [
        { label: "CO2 (二氧化碳)", value: "95.3%", color: "#d4a843" },
        { label: "N2 (氮气)", value: "2.7%", color: "#d4a84399" },
        { label: "高氯酸盐", value: "0.8%", color: "#ffb4a1", isHazard: true },
      ],
      survival: 78,
      survivalOrganism: "Chroococcidiopsis",
      sources: [
        { id: "5542-X", source: "NASA PDS", title: "Jezero 火山口高氯酸盐沉积分析", loc: "18.4°N 77.5°E" },
        { id: "MSL-RAD", source: "CURIOSITY DATA", title: "Gale 紫外线通量年度监测", loc: "-4.6°S 137.4°E" },
      ],
    },
    valles: {
      label: "Valles", coords: "-13.9°S 301.0°E", system: "MONITORING",
      temperature: { value: "-45°", unit: "至 +5°C", description: "峡谷地形形成局部热效应。", progress: 55 },
      radiation: { value: "80x", unit: "地球等级", description: "地形遮蔽可降低部分辐射暴露。" },
      pressure: { value: "1.2", unit: "kPa", description: "谷底压力较高，生命维持潜力较强。" },
      chemicals: [
        { label: "CO2 (二氧化碳)", value: "94.1%", color: "#d4a843" },
        { label: "N2 (氮气)", value: "3.2%", color: "#d4a84399" },
        { label: "高氯酸盐", value: "0.5%", color: "#ffb4a1", isHazard: true },
      ],
      survival: 64,
      survivalOrganism: "D. radiodurans",
      sources: [
        { id: "MRO-VM1", source: "MRO HiRISE", title: "Valles 层状沉积分析", loc: "-13.9°S 301.0°E" },
        { id: "MEX-004", source: "ESA MARS EXPRESS", title: "地下盐水雷达证据", loc: "-13.9°S 301.0°E" },
      ],
    },
    gale: {
      label: "Gale", coords: "-4.6°S 137.4°E", system: "ANALYZING",
      temperature: { value: "-55°", unit: "至 +15°C", description: "白天暖化效应明显，梯度较平缓。", progress: 45 },
      radiation: { value: "95x", unit: "地球等级", description: "中等辐射暴露，仍需防护。", },
      pressure: { value: "0.85", unit: "kPa", description: "盆地压力略高于全球均值。", },
      chemicals: [
        { label: "CO2 (二氧化碳)", value: "95.7%", color: "#d4a843" },
        { label: "N2 (氮气)", value: "1.9%", color: "#d4a84399" },
        { label: "高氯酸盐", value: "0.6%", color: "#ffb4a1", isHazard: true },
      ],
      survival: 71,
      survivalOrganism: "Synechocystis",
      sources: [
        { id: "MSL-001", source: "CURIOSITY DATA", title: "Sharp 山有机分子探测记录", loc: "-4.6°S 137.4°E" },
        { id: "REMS-44", source: "MSL-REMS", title: "地面气象站长期记录", loc: "-4.5°S 137.3°E" },
      ],
    },
    utopia: {
      label: "Utopia", coords: "49.7°N 117.8°E", system: "WARNING",
      temperature: { value: "-80°", unit: "至 -10°C", description: "高纬度极寒，条件严苛。", progress: 20 },
      radiation: { value: "115x", unit: "地球等级", description: "地形遮蔽不足，辐射暴露偏高。" },
      pressure: { value: "0.5", unit: "kPa", description: "大气极薄，季节变化剧烈。", },
      chemicals: [
        { label: "CO2 (二氧化碳)", value: "96.1%", color: "#d4a843" },
        { label: "N2 (氮气)", value: "2.1%", color: "#d4a84399" },
        { label: "高氯酸盐", value: "1.2%", color: "#ffb4a1", isHazard: true },
      ],
      survival: 42,
      survivalOrganism: "T. gammatolerans",
      sources: [
        { id: "VK2-UP", source: "VIKING 2", title: "Utopia 土壤高氯酸盐检测", loc: "49.7°N 117.8°E" },
        { id: "ZHR-05", source: "ZHURONG ROVER", title: "地下冰层分布雷达图", loc: "25.1°N 109.9°E" },
      ],
    },
  },
  en: {
    jezero: {
      label: "Jezero", coords: "18.4°N 77.5°E", system: "OPTIMAL",
      temperature: { value: "-60°", unit: "to +20°C", description: "Average temperature under monitoring with wide day-night variation.", progress: 40 },
      radiation: { value: "100x", unit: "Earth baseline", description: "High UV-B/C penetration introduces severe DNA damage risk." },
      pressure: { value: "0.6", unit: "kPa", description: "Thin atmosphere requires sealed and pressurized habitats." },
      chemicals: [
        { label: "CO2 (Carbon Dioxide)", value: "95.3%", color: "#d4a843" },
        { label: "N2 (Nitrogen)", value: "2.7%", color: "#d4a84399" },
        { label: "Perchlorates", value: "0.8%", color: "#ffb4a1", isHazard: true },
      ],
      survival: 78,
      survivalOrganism: "Chroococcidiopsis",
      sources: [
        { id: "5542-X", source: "NASA PDS", title: "Jezero perchlorate deposition analysis", loc: "18.4°N 77.5°E" },
        { id: "MSL-RAD", source: "CURIOSITY DATA", title: "Annual UV flux monitoring in Gale", loc: "-4.6°S 137.4°E" },
      ],
    },
    valles: {
      label: "Valles", coords: "-13.9°S 301.0°E", system: "MONITORING",
      temperature: { value: "-45°", unit: "to +5°C", description: "Canyon terrain forms local thermal effects.", progress: 55 },
      radiation: { value: "80x", unit: "Earth baseline", description: "Terrain shielding can reduce partial radiation exposure." },
      pressure: { value: "1.2", unit: "kPa", description: "Valley-floor pressure is relatively high for Mars." },
      chemicals: [
        { label: "CO2 (Carbon Dioxide)", value: "94.1%", color: "#d4a843" },
        { label: "N2 (Nitrogen)", value: "3.2%", color: "#d4a84399" },
        { label: "Perchlorates", value: "0.5%", color: "#ffb4a1", isHazard: true },
      ],
      survival: 64,
      survivalOrganism: "D. radiodurans",
      sources: [
        { id: "MRO-VM1", source: "MRO HiRISE", title: "Layered deposition analysis in Valles", loc: "-13.9°S 301.0°E" },
        { id: "MEX-004", source: "ESA MARS EXPRESS", title: "Radar evidence of subsurface brine", loc: "-13.9°S 301.0°E" },
      ],
    },
    gale: {
      label: "Gale", coords: "-4.6°S 137.4°E", system: "ANALYZING",
      temperature: { value: "-55°", unit: "to +15°C", description: "Strong daytime warming, with smoother thermal gradients.", progress: 45 },
      radiation: { value: "95x", unit: "Earth baseline", description: "Moderate radiation exposure; protection still required." },
      pressure: { value: "0.85", unit: "kPa", description: "Basin pressure is slightly above the global average.", },
      chemicals: [
        { label: "CO2 (Carbon Dioxide)", value: "95.7%", color: "#d4a843" },
        { label: "N2 (Nitrogen)", value: "1.9%", color: "#d4a84399" },
        { label: "Perchlorates", value: "0.6%", color: "#ffb4a1", isHazard: true },
      ],
      survival: 71,
      survivalOrganism: "Synechocystis",
      sources: [
        { id: "MSL-001", source: "CURIOSITY DATA", title: "Organic molecule detections near Mt. Sharp", loc: "-4.6°S 137.4°E" },
        { id: "REMS-44", source: "MSL-REMS", title: "Long-term weather station records", loc: "-4.5°S 137.3°E" },
      ],
    },
    utopia: {
      label: "Utopia", coords: "49.7°N 117.8°E", system: "WARNING",
      temperature: { value: "-80°", unit: "to -10°C", description: "Severe high-latitude cold with harsh conditions.", progress: 20 },
      radiation: { value: "115x", unit: "Earth baseline", description: "Limited shielding causes elevated radiation exposure." },
      pressure: { value: "0.5", unit: "kPa", description: "Extremely thin atmosphere with strong seasonal variability.", },
      chemicals: [
        { label: "CO2 (Carbon Dioxide)", value: "96.1%", color: "#d4a843" },
        { label: "N2 (Nitrogen)", value: "2.1%", color: "#d4a84399" },
        { label: "Perchlorates", value: "1.2%", color: "#ffb4a1", isHazard: true },
      ],
      survival: 42,
      survivalOrganism: "T. gammatolerans",
      sources: [
        { id: "VK2-UP", source: "VIKING 2", title: "Perchlorate detection in Utopia soil", loc: "49.7°N 117.8°E" },
        { id: "ZHR-05", source: "ZHURONG ROVER", title: "Subsurface ice radar map", loc: "25.1°N 109.9°E" },
      ],
    },
  },
};

export default function EnvironmentView() {
  const { locale } = useLocale();
  const isZh = locale === "zh";
  const [activeLocation, setActiveLocation] = useState<LocationKey>("jezero");
  const loc = DATA[locale][activeLocation];

  return (
    <motion.div variants={viewTransition} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col pt-2">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <span className="text-xl font-black tracking-tighter text-primary italic font-headline">ARES MONITORING</span>
          <span className="font-headline text-sm font-bold text-on-surface-variant">{loc.coords}</span>
          <span className={`font-headline text-sm font-bold ${loc.system === "WARNING" ? "text-secondary" : loc.system === "OPTIMAL" ? "text-tertiary" : "text-primary"}`}>{isZh ? "系统" : "SYSTEM"}: {loc.system}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-black font-headline">{isZh ? "环境约束面板" : "Environment Panel"}</h2>
          <EnvironmentalCard title={isZh ? "温度约束 (TEMPER)" : "Temperature (TEMPER)"} icon={Thermometer} value={loc.temperature.value} unit={loc.temperature.unit} description={loc.temperature.description} progress={{ current: loc.temperature.progress, min: "-120°C", max: "30°C" }} index={0} />
          <EnvironmentalCard title={isZh ? "辐射水平 (RAD)" : "Radiation (RAD)"} icon={AlertTriangle} value={loc.radiation.value} unit={loc.radiation.unit} color="secondary" description={loc.radiation.description} index={1} />
          <EnvironmentalCard title={isZh ? "大气压力 (PRES)" : "Pressure (PRES)"} icon={Minimize2} value={loc.pressure.value} unit={loc.pressure.unit} description={loc.pressure.description} index={2} />
          <div className="glass-panel rounded-xl p-4 border border-outline-variant/10">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-[#d4a843] tracking-widest uppercase">{isZh ? "化学成分 (CHEM)" : "Chemistry (CHEM)"}</span>
              <FlaskConical size={16} className="text-[#d4a843]" />
            </div>
            <div className="space-y-3">
              {loc.chemicals.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className={item.isHazard ? "text-secondary" : "text-on-surface"}>{item.label}</span>
                    <span className={item.isHazard ? "text-secondary font-bold" : "text-on-surface font-bold"}>{item.value}</span>
                  </div>
                  <div className={`h-1 w-full rounded-full ${item.isHazard ? "bg-secondary/20" : "bg-surface-container-lowest"}`}>
                    <div className="h-full rounded-full" style={{ width: item.value, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-2xl border border-outline-variant/20 p-6 flex flex-col items-center justify-center">
          <div className="relative w-72 h-72 rounded-full overflow-hidden border border-outline-variant/30">
            <FallbackImage
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDzC7Bs9-IsSGTTeA6OhYGruNOnvn2CfGFYik6HZjSjtHYz92a_mwe5kmY-Mv16OSmE68mDblHv177iGU2wd5qHfy6MMIVVLCsOxkOAoy9gg0XJVYhbeuBgLuyzmb4vGXwEfesPf0bDgLnqoIHDobJZD8FXiDvN336zolAT2XMsKHCDf2TMwT6ExdouvS5aFOtn_FWtvkLhUakmnACZOw2vUnSuYDJUBwQypMjw7yxDLLqFWS4OxmACw52-KCNlpjhWZ-9mnDSqwY"
              alt="Mars Surface"
              className="w-full h-full object-cover mix-blend-overlay opacity-80"
              fallbackElement={<ProceduralMarsGlobe className="w-full h-full mix-blend-overlay opacity-80" />}
            />
          </div>
          <p className="mt-4 text-3xl font-black text-tertiary font-headline">{loc.survival}%</p>
          <p className="text-xs text-on-surface-variant uppercase tracking-widest">{isZh ? "生存概率" : "Survival Probability"}</p>
          <p className="text-sm text-on-surface mt-1">{loc.survivalOrganism}</p>
        </section>

        <section className="glass-panel rounded-2xl border border-outline-variant/20 p-4">
          <h3 className="text-sm font-bold tracking-widest uppercase font-headline text-[#d4a843] mb-3">{isZh ? "地质证据与溯源" : "Geo Evidence"}</h3>
          <div className="space-y-3 mb-4">
            {loc.sources.map((item) => (
              <div key={item.id} className="p-3 rounded-lg hover:bg-surface-container-highest/40 transition-all border-l-2 border-transparent hover:border-[#d4a843]">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-bold text-[#d4a843]">{item.source}</span>
                  <span className="text-[9px] text-on-surface-variant font-mono">{item.id}</span>
                </div>
                <p className="text-xs text-on-surface mb-1">{item.title}</p>
                <p className="text-[10px] text-primary flex items-center gap-1"><MapPin size={10} />{item.loc}</p>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-outline-variant/10">
            <p className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">{isZh ? "位置导航" : "Location Nav"}</p>
            <div className="flex gap-2 mt-2">
              {[
                { key: "jezero" as LocationKey, icon: MapPin, label: "Jezero" },
                { key: "valles" as LocationKey, icon: Mountain, label: "Valles" },
                { key: "gale" as LocationKey, icon: Activity, label: "Gale" },
                { key: "utopia" as LocationKey, icon: Search, label: "Utopia" },
              ].map((item) => (
                <button key={item.key} onClick={() => setActiveLocation(item.key)} className={`px-3 py-2 rounded-lg text-[10px] font-headline uppercase tracking-widest border ${activeLocation === item.key ? "border-primary/50 text-primary bg-primary/10" : "border-outline-variant/20 text-on-surface-variant"}`}>
                  <span className="inline-flex items-center gap-1"><item.icon size={12} />{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
