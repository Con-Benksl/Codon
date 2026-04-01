import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useLocale } from "../i18n/context";
import { viewTransition, fadeSlideUp, stagger } from "../lib/motion";

export default function HomeView() {
  const { t, locale } = useLocale();
  const isZh = locale === "zh";

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen flex flex-col"
    >
      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-8 pt-14">
        <div className="text-center relative z-10">
          <motion.h1
            variants={fadeSlideUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.08 }}
            className="leading-[1.08]"
          >
            <span className="block font-headline text-5xl md:text-7xl font-black tracking-tight text-text">
              {t("home.title")}
            </span>
            <span
              className="block font-headline text-5xl md:text-7xl font-black tracking-tight mt-2 bg-gradient-to-r from-[#38bdf8] via-[#818cf8] to-[#34d399] bg-clip-text text-transparent"
              style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              {t("home.titleAccent")}
            </span>
          </motion.h1>

          <motion.p
            variants={fadeSlideUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.2 }}
            className="mt-8 text-text-muted text-base md:text-lg leading-relaxed max-w-lg mx-auto font-light tracking-wide"
          >
            {t("home.subtitle")}
          </motion.p>

          <motion.div
            variants={fadeSlideUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.35 }}
            className="mt-10 flex justify-center gap-4"
          >
            <Link
              to="/projects"
              className="group relative px-8 py-3.5 bg-primary text-bg rounded-lg font-semibold text-sm tracking-wider hover:shadow-[0_0_24px_rgba(56,189,248,0.3)] transition-all duration-300"
            >
              {t("home.cta")}
            </Link>
            <button className="px-8 py-3.5 border border-white/10 text-text-muted rounded-lg text-sm tracking-wider hover:border-white/25 hover:text-text transition-all duration-300 backdrop-blur-sm">
              {t("home.demo")}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Stats bar */}
      <motion.div
        variants={stagger(100)}
        initial="hidden"
        animate="show"
        className="flex justify-center gap-14 md:gap-20 py-10 border-t border-white/[0.04]"
      >
        {[
          { value: "5", label: t("home.stats.agents") },
          { value: "1,247", label: t("home.stats.sequences") },
          { value: "94.2%", label: t("home.stats.validation") },
        ].map((stat) => (
          <motion.div key={stat.label} variants={fadeSlideUp} className="text-center">
            <div className="text-3xl md:text-4xl font-semibold text-text font-mono tabular-nums tracking-tight">
              {stat.value}
            </div>
            <div className="text-[10px] text-text-dim mt-2 uppercase tracking-[0.2em]">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
