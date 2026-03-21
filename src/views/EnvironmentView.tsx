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
import { EnvironmentalCard, FallbackImage, ProceduralMarsGlobe } from "../components";
import {
  stagger,
  fadeSlideUp,
  fadeSlideLeft,
  fadeSlideRight,
  fadeScale,
  viewTransition,
  inViewport,
} from "../lib/motion";

type MobileTab = "env" | "geo";

export default function EnvironmentView() {
  const [mobileTab, setMobileTab] = useState<MobileTab>("env");

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 flex flex-col lg:h-[calc(100vh-64px)] lg:overflow-hidden"
    >
      {/* Top Bar */}
      <motion.div
        variants={stagger(50)}
        initial="hidden"
        animate="show"
        className="flex justify-between items-center mb-4 md:mb-6"
      >
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <motion.span
            variants={fadeSlideUp}
            className="text-lg md:text-xl font-black tracking-tighter text-primary italic font-headline"
          >
            ARES MONITORING
          </motion.span>
          <div className="h-4 w-[1px] bg-outline-variant/30 hidden md:block" />
          <motion.span
            variants={fadeSlideUp}
            className="font-headline tracking-tight uppercase text-xs md:text-sm font-bold text-primary border-b-2 border-primary pb-1"
          >
            SOL 1242
          </motion.span>
          <motion.span
            variants={fadeSlideUp}
            className="hidden md:block font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          >
            18.4°N 77.5°E
          </motion.span>
          <motion.span
            variants={fadeSlideUp}
            className="hidden md:block font-headline tracking-tight uppercase text-sm font-bold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          >
            SYSTEM: OPTIMAL
          </motion.span>
        </div>
      </motion.div>

      {/* 移动端标签切换 — 仅 lg 以下显示 */}
      <div className="flex lg:hidden gap-2 mb-4">
        <button
          onClick={() => setMobileTab("env")}
          className={`flex-1 py-2 rounded-lg font-headline text-xs uppercase tracking-widest font-bold transition-all ${
            mobileTab === "env"
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-surface-container-low text-on-surface-variant border border-outline-variant/15"
          }`}
        >
          环境参数
        </button>
        <button
          onClick={() => setMobileTab("geo")}
          className={`flex-1 py-2 rounded-lg font-headline text-xs uppercase tracking-widest font-bold transition-all ${
            mobileTab === "geo"
              ? "bg-[#d4a843]/20 text-[#d4a843] border border-[#d4a843]/30"
              : "bg-surface-container-low text-on-surface-variant border border-outline-variant/15"
          }`}
        >
          地质证据
        </button>
      </div>

      {/* 主内容布局：移动端纵向标签 / 桌面端三列 */}
      <div className="flex flex-col lg:flex-row lg:flex-1 lg:overflow-hidden gap-4 lg:gap-0">

        {/* 左侧：环境参数面板 */}
        <motion.section
          variants={stagger(80)}
          initial="hidden"
          animate="show"
          className={`w-full lg:w-80 lg:h-full lg:pr-6 flex-col gap-4 overflow-y-auto ${
            mobileTab === "env" ? "flex" : "hidden"
          } lg:flex`}
        >
          <motion.div variants={fadeSlideLeft} className="mb-2 lg:mb-4">
            <h1 className="text-xl md:text-2xl font-black font-headline text-on-surface leading-tight tracking-tighter">
              火星环境约束<br />监测面板
            </h1>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 48 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="h-1 bg-primary mt-2"
            />
          </motion.div>

          <EnvironmentalCard
            title="温度约束 (TEMPER)"
            icon={Thermometer}
            value="-60°"
            unit="至 +20°C"
            description="平均气温监测中。极端温差对生物膜稳定性构成严峻挑战。"
            progress={{ current: 40, min: "-120°C (MIN)", max: "30°C (MAX)" }}
            index={0}
          />

          <EnvironmentalCard
            title="辐射水平 (RAD)"
            icon={AlertTriangle}
            value="100x"
            unit="地球等级"
            color="secondary"
            description="UV-B/C 穿透率过高，生物DNA极易损伤。极端危险状况 EXTREME HAZARD"
            index={1}
          />

          <EnvironmentalCard
            title="大气压力 (PRES)"
            icon={Minimize2}
            value="0.6"
            unit="kPa"
            description="平均海拔压力监测中。稀薄大气警告：需密封加压环境以维持生命。"
            index={2}
          />

          {/* 化学成分 */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.24 }}
            className="glass-panel rounded-xl p-4 border border-outline-variant/10"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-[#d4a843] tracking-widest uppercase">化学成分 (CHEM)</span>
              <FlaskConical size={16} className="text-[#d4a843]" />
            </div>
            <div className="space-y-3">
              {[
                { label: "CO2 (二氧化碳)", value: "95.3%", color: "#d4a843" },
                { label: "N2 (氮气)", value: "2.7%", color: "#d4a84399" },
                { label: "高氯酸盐 (Perchlorates)", value: "0.8%", color: "#ffb4a1", isHazard: true },
              ].map((item, i) => (
                <div key={item.label}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className={item.isHazard ? "text-secondary" : "text-on-surface"}>{item.label}</span>
                    <span className={item.isHazard ? "text-secondary font-bold" : "text-on-surface font-bold"}>{item.value}</span>
                  </div>
                  <div className={`h-1 w-full rounded-full ${item.isHazard ? "bg-secondary/20" : "bg-surface-container-lowest"}`}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                      initial={{ width: 0 }}
                      animate={{ width: item.value }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 移动端生存概率卡片 — 仅 lg 以下显示 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex items-center gap-4 glass-panel rounded-xl p-4 border border-tertiary/20 glow-tertiary lg:hidden"
          >
            <div className="text-center shrink-0">
              <span className="text-3xl font-headline font-black text-tertiary">78%</span>
              <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">生存概率</p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-on-surface uppercase tracking-widest mb-2 font-headline">
                Chroococcidiopsis
              </p>
              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-tertiary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "78%" }}
                  transition={{ duration: 1.2, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* 中央地球仪 — 仅 lg+ 显示 */}
        <motion.section
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="hidden lg:flex flex-1 relative items-center justify-center"
        >
          <div className="relative w-[500px] h-[500px]">
            {/* Outer Rings */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.25 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute inset-0 border border-primary/5 rounded-full"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="absolute inset-0 border border-primary/10 rounded-full mars-orbit border-dashed"
            />

            {/* Globe */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-[#1c2024] via-[#0a0f13] to-[#101418] shadow-[inset_0_0_100px_rgba(78,168,217,0.2)] flex items-center justify-center overflow-hidden border border-outline-variant/20"
            >
              <FallbackImage
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDzC7Bs9-IsSGTTeA6OhYGruNOnvn2CfGFYik6HZjSjtHYz92a_mwe5kmY-Mv16OSmE68mDblHv177iGU2wd5qHfy6MMIVVLCsOxkOAoy9gg0XJVYhbeuBgLuyzmb4vGXwEfesPf0bDgLnqoIHDobJZD8FXiDvN336zolAT2XMsKHCDf2TMwT6ExdouvS5aFOtn_FWtvkLhUakmnACZOw2vUnSuYDJUBwQypMjw7yxDLLqFWS4OxmACw52-KCNlpjhWZ-9mnDSqwY"
                alt="Mars Surface"
                className="w-full h-full object-cover mix-blend-overlay opacity-80"
                fallbackElement={<ProceduralMarsGlobe className="w-full h-full mix-blend-overlay opacity-80" />}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-secondary/10 via-transparent to-primary/10" />
            </motion.div>

            {/* Floating Label: Jezero */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="absolute top-[25%] left-[20%]"
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-primary flex items-center justify-center">
                  <div className="w-1 h-1 bg-primary animate-ping" />
                </div>
                <div className="glass-panel px-3 py-2 rounded-lg border border-primary/20">
                  <p className="text-[10px] font-bold text-primary font-headline">JEZERO CRATER</p>
                  <p className="text-[8px] text-on-surface-variant whitespace-nowrap">亚表面宜居指数: 高 (0.84)</p>
                </div>
              </div>
            </motion.div>

            {/* Floating Label: Valles */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.1 }}
              className="absolute bottom-[35%] right-[15%]"
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-secondary flex items-center justify-center">
                  <div className="w-1 h-1 bg-secondary animate-pulse" />
                </div>
                <div className="glass-panel px-3 py-2 rounded-lg border border-secondary/20">
                  <p className="text-[10px] font-bold text-secondary font-headline">VALLES MARINERIS</p>
                  <p className="text-[8px] text-on-surface-variant whitespace-nowrap">深层地质压力: 12.5 MPa</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Survival Gauge — 桌面端悬浮在地球仪下方 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center"
          >
            <div className="relative w-32 h-32 flex items-center justify-center glass-panel rounded-full border border-tertiary/20 glow-tertiary">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle className="text-surface-container-lowest" cx="64" cy="64" fill="transparent" r="56" stroke="currentColor" strokeWidth="4" />
                <motion.circle
                  className="text-tertiary"
                  cx="64"
                  cy="64"
                  fill="transparent"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray="351"
                  initial={{ strokeDashoffset: 351 }}
                  animate={{ strokeDashoffset: 77 }}
                  transition={{ duration: 1.5, delay: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              </svg>
              <div className="text-center">
                <span className="text-3xl font-headline font-black text-tertiary">78%</span>
                <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">生存概率</p>
              </div>
            </div>
            <h3 className="text-[10px] font-bold text-on-surface mt-4 tracking-widest bg-surface-container-high px-4 py-1 rounded-full border border-outline-variant/20 uppercase">
              Chroococcidiopsis Survival Probability
            </h3>
          </motion.div>
        </motion.section>

        {/* 右侧：地质证据面板 */}
        <motion.section
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`w-full lg:w-80 lg:h-full lg:pl-6 flex-col gap-4 overflow-hidden border-t lg:border-t-0 lg:border-l border-outline-variant/10 glass-panel pt-4 lg:pt-0 ${
            mobileTab === "geo" ? "flex" : "hidden"
          } lg:flex`}
        >
          <div className="mb-4">
            <div className="flex items-center gap-2 text-[#d4a843] mb-1">
              <History size={18} />
              <h2 className="text-sm font-bold tracking-widest uppercase font-headline">地质证据与溯源</h2>
            </div>
            <p className="text-[10px] text-on-surface-variant uppercase">Geo-Evidence &amp; Traceability</p>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="h-[1px] bg-gradient-to-r from-[#d4a843]/40 to-transparent mt-3"
            />
          </div>

          <motion.div
            variants={stagger(70)}
            initial="hidden"
            animate="show"
            className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2"
          >
            {[
              { source: "NASA PDS", id: "5542-X", title: "Jezero 火山口高氯酸盐沉积分析报告", loc: "18.4°N 77.5°E" },
              { source: "PHOENIX MISSION", id: "PHX-L0", title: "北极冰盖下层卤水化学成分实测数据", loc: "68.2°N 125.7°W" },
              { source: "CURIOSITY DATA", id: "MSL-RAD", title: "Gale Crater 紫外线通量全年度监测曲线", loc: "-4.6°S 137.4°E" },
              { source: "XENO-LAB ALPHA", id: "LAB-77", title: "合成生物细胞对极寒环境的适应性模拟", loc: "SIMULATION MODE", isSim: true },
            ].map((item) => (
              <motion.div
                key={item.id}
                variants={fadeSlideRight}
                whileHover={{ x: 4, transition: { duration: 0.15 } }}
                className="group p-3 rounded-lg hover:bg-surface-container-highest/40 transition-all border-l-2 border-transparent hover:border-[#d4a843] cursor-pointer"
              >
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

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-4 pt-4 border-t border-outline-variant/10"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">系统活动状态</span>
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            </div>
            <div className="bg-surface-container-lowest p-2 rounded border border-outline-variant/10">
              <p className="text-[9px] font-mono text-tertiary leading-tight">
                &gt; 正在同步轨道遥感数据...<br />
                &gt; 分析 Jezero 地质样本 0014...<br />
                &gt; 环境稳定性评估：88.4%
              </p>
            </div>
          </motion.div>
        </motion.section>
      </div>

      {/* 底部位置导航 */}
      <motion.nav
        variants={stagger(80)}
        initial="hidden"
        animate="show"
        className="flex justify-center gap-4 md:gap-8 items-center mt-4 md:mt-6 pb-2"
      >
        {[
          { icon: MapPin, label: "Jezero", active: true },
          { icon: Mountain, label: "Valles" },
          { icon: Activity, label: "Gale" },
          { icon: Search, label: "Utopia" },
        ].map((loc) => (
          <motion.div
            key={loc.label}
            variants={fadeSlideUp}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.95 }}
            className={`flex flex-col items-center justify-center px-4 md:px-6 py-2 rounded-xl transition-all cursor-pointer ${
              loc.active
                ? "bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-[0_0_15px_rgba(78,168,217,0.3)]"
                : "text-on-surface-variant opacity-60 hover:text-primary hover:opacity-100"
            }`}
          >
            <loc.icon size={20} />
            <span className="font-headline text-[10px] uppercase font-bold tracking-widest mt-1">{loc.label}</span>
          </motion.div>
        ))}
      </motion.nav>
    </motion.div>
  );
}
