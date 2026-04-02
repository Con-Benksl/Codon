import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useLocale } from "../i18n/context";
import { viewTransition, fadeSlideUp, stagger } from "../lib/motion";
import { Cpu, GitBranch, ShieldCheck, Target, Users, Zap } from "lucide-react";

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
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-8 pt-14">
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

      {/* Features Section */}
      <section className="py-24 px-8 border-t border-white/[0.04]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-text tracking-tight">
            {t("home.features.title")}
          </h2>
          <p className="mt-4 text-text-muted text-sm md:text-base max-w-md mx-auto">
            {t("home.features.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {([
            { icon: Users, ...(() => ({ title: t("home.features.agents.title"), desc: t("home.features.agents.desc") }))() },
            { icon: GitBranch, ...(() => ({ title: t("home.features.circuits.title"), desc: t("home.features.circuits.desc") }))() },
            { icon: ShieldCheck, ...(() => ({ title: t("home.features.validation.title"), desc: t("home.features.validation.desc") }))() },
          ] as const).map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="group p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-primary/20 hover:bg-primary/[0.03] transition-all duration-300"
            >
              <feature.icon className="w-8 h-8 text-primary mb-4 opacity-80 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-lg font-semibold text-text mb-2">{feature.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-24 px-8 border-t border-white/[0.04]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-text tracking-tight">
            {t("home.workflow.title")}
          </h2>
          <p className="mt-4 text-text-muted text-sm md:text-base max-w-md mx-auto">
            {t("home.workflow.subtitle")}
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-12">
          {([
            { icon: Target, num: "01", ...(() => ({ title: t("home.workflow.step1.title"), desc: t("home.workflow.step1.desc") }))() },
            { icon: Cpu, num: "02", ...(() => ({ title: t("home.workflow.step2.title"), desc: t("home.workflow.step2.desc") }))() },
            { icon: Zap, num: "03", ...(() => ({ title: t("home.workflow.step3.title"), desc: t("home.workflow.step3.desc") }))() },
          ] as const).map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-start gap-6"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <step.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-mono text-primary/60 tracking-widest">{step.num}</span>
                  <h3 className="text-lg font-semibold text-text">{step.title}</h3>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
