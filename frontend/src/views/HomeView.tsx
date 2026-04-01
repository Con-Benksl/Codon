import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useLocale } from "../i18n/context";
import { viewTransition, fadeSlideUp, stagger } from "../lib/motion";

export default function HomeView() {
  const { t } = useLocale();

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen flex flex-col"
    >
      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-6 pt-14">
        <div className="text-center max-w-2xl">
          <motion.h1
            variants={fadeSlideUp}
            initial="hidden"
            animate="show"
            className="font-headline text-5xl md:text-7xl font-medium tracking-tight text-text leading-[1.1]"
          >
            {t("home.title")}
            <br />
            <span className="text-primary">{t("home.titleAccent")}</span>
          </motion.h1>

          <motion.p
            variants={fadeSlideUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.15 }}
            className="mt-6 text-text-muted text-lg leading-relaxed max-w-xl mx-auto"
          >
            {t("home.subtitle")}
          </motion.p>

          <motion.div
            variants={fadeSlideUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.3 }}
            className="mt-10 flex gap-3 justify-center"
          >
            <Link
              to="/projects"
              className="px-6 py-3 bg-primary text-bg rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              {t("home.cta")}
            </Link>
            <button className="px-6 py-3 border border-border text-text-muted rounded-lg text-sm hover:border-border-hover hover:text-text transition-colors">
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
        className="flex justify-center gap-12 md:gap-16 py-8 border-t border-border"
      >
        {[
          { value: "5", label: t("home.stats.agents") },
          { value: "1,247", label: t("home.stats.sequences") },
          { value: "94.2%", label: t("home.stats.validation") },
        ].map((stat) => (
          <motion.div key={stat.label} variants={fadeSlideUp} className="text-center">
            <div className="text-2xl md:text-3xl font-medium text-text font-headline">
              {stat.value}
            </div>
            <div className="text-xs text-text-dim mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
