import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useLocale } from "../i18n/context";
import { viewTransition, fadeSlideUp, stagger } from "../lib/motion";
import { AgentShowcase } from "../components";
import { Cpu, GitBranch, ShieldCheck, Target, Users, Zap, Globe, Bug, Dna, Activity, Atom, FileText, ArrowRight, Check } from "lucide-react";

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
            className="mt-8 text-text-muted text-lg md:text-xl leading-relaxed max-w-xl mx-auto tracking-wide text-glow"
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
            <button className="px-8 py-3.5 border border-white/20 text-white/70 rounded-lg text-sm tracking-wider hover:border-white/40 hover:text-text transition-all duration-300 backdrop-blur-sm text-glow">
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
        className="flex justify-center gap-14 md:gap-20 py-10 border-t border-white/25"
      >
        {[
          { value: "6", label: t("home.stats.agents") },
          { value: "1,247", label: t("home.stats.sequences") },
          { value: "94.2%", label: t("home.stats.validation") },
        ].map((stat) => (
          <motion.div key={stat.label} variants={fadeSlideUp} className="text-center">
            <div className="text-3xl md:text-4xl font-semibold text-text font-mono tabular-nums tracking-tight">
              {stat.value}
            </div>
            <div className="text-sm text-text-dim mt-2 uppercase tracking-[0.2em]">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Features Section */}
      <section className="py-24 px-8 border-t border-white/25">
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
          <p className="mt-4 text-text-muted text-base md:text-lg max-w-lg mx-auto text-glow">
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
              className="group p-6 rounded-xl border border-white/20 bg-[rgba(30,41,66,0.7)] hover:border-primary/20 hover:bg-primary/[0.03] transition-all duration-300"
            >
              <feature.icon className="w-8 h-8 text-primary mb-4 opacity-80 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-lg font-semibold text-text mb-2">{feature.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-24 px-8 border-t border-white/25">
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
          <p className="mt-4 text-text-muted text-base md:text-lg max-w-lg mx-auto text-glow">
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
                  <span className="text-sm font-mono text-primary/90 tracking-widest text-glow">{step.num}</span>
                  <h3 className="text-lg font-semibold text-text">{step.title}</h3>
                </div>
                <p className="text-base text-text-muted leading-relaxed text-glow">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Agent Collaboration Showcase */}
      <AgentShowcase />

      {/* Agent Pipeline */}
      <section className="py-32 px-8 border-t border-white/25">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-sm font-mono text-primary/90 tracking-[0.3em] uppercase text-glow">
            {t("home.pipeline.label")}
          </span>
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-text tracking-tight mt-3">
            {t("home.pipeline.title")}
          </h2>
          <p className="mt-4 text-text-muted text-base md:text-lg max-w-lg mx-auto text-glow">
            {t("home.pipeline.subtitle")}
          </p>
        </motion.div>

        <motion.div
          variants={stagger(120)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
        >
          {([
            { icon: Globe, key: "env" },
            { icon: Bug, key: "extremo" },
            { icon: Dna, key: "gene" },
            { icon: GitBranch, key: "circuit" },
            { icon: Activity, key: "metab" },
            { icon: Atom, key: "struct" },
          ] as const).map((agent, i) => (
            <motion.div
              key={agent.key}
              variants={fadeSlideUp}
              className="text-center group relative"
            >
              <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <agent.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="mt-3 text-sm font-semibold text-text">
                {t(`home.pipeline.agents.${agent.key}.name`)}
              </p>
              <p className="mt-1 text-sm text-text-dim leading-relaxed">
                {t(`home.pipeline.agents.${agent.key}.desc`)}
              </p>
              {i < 5 && (
                <div className="hidden lg:block absolute -right-3 top-6 text-primary/30">
                  <ArrowRight className="w-3 h-3" />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Tech Advantages */}
      <section className="py-32 px-8 border-t border-white/25">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-sm font-mono text-primary/90 tracking-[0.3em] uppercase text-glow">
            {t("home.tech.label")}
          </span>
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-text tracking-tight mt-3">
            {t("home.tech.title")}
          </h2>
          <p className="mt-4 text-text-muted text-base md:text-lg max-w-lg mx-auto text-glow">
            {t("home.tech.subtitle")}
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto space-y-20">
          {([
            { key: "physics", num: "01", panel: (
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-text-dim">Temperature</span><span className="text-primary">-73°C ~ -3°C</span></div>
                <div className="flex justify-between"><span className="text-text-dim">Perchlorate</span><span className="text-primary">0.5 wt%</span></div>
                <div className="flex justify-between"><span className="text-text-dim">UV Flux</span><span className="text-primary">50 W/m²</span></div>
                <div className="mt-4 h-1.5 rounded-full bg-white/15 overflow-hidden">
                  <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-primary to-[#34d399]" />
                </div>
                <div className="flex justify-between text-sm"><span className="text-text-dim">Fitness Score</span><span className="text-primary">0.87</span></div>
              </div>
            )},
            { key: "dag", num: "02", panel: (
              <div className="space-y-3">
                {["EnvParse", "Extremophile", "GeneFunc", "CircuitDesign"].map((name, i) => (
                  <div key={name} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-text-dim">{name}</span>
                    {i < 3 && <span className="text-text-dim/70 ml-auto">&rarr;</span>}
                  </div>
                ))}
                <div className="mt-2 text-sm text-primary/80">context auto-propagated</div>
              </div>
            )},
            { key: "data", num: "03", panel: (
              <div className="space-y-1 text-text-dim">
                <div><span className="text-primary/90">from</span> Bio.Entrez <span className="text-primary/90">import</span> efetch</div>
                <div><span className="text-primary/90">from</span> cobra <span className="text-primary/90">import</span> Model</div>
                <div className="mt-2 text-sm text-primary/80"># NCBI Gene · UniProt · COBRApy</div>
              </div>
            )},
            { key: "safety", num: "04", panel: (
              <div className="space-y-2">
                <div className="flex items-center gap-2"><div className="w-6 h-6 rounded border border-danger/30 flex items-center justify-center text-[10px] text-danger">KS</div><span className="text-text-dim">Kill Switch</span><span className="ml-auto text-success text-sm">0.94</span></div>
                <div className="flex items-center gap-2"><div className="w-6 h-6 rounded border border-primary/30 flex items-center justify-center text-[10px] text-primary">OG</div><span className="text-text-dim">Orthogonality</span><span className="ml-auto text-success text-sm">0.91</span></div>
              </div>
            )},
            { key: "realtime", num: "05", panel: (
              <div className="space-y-1 text-text-dim">
                <div><span className="text-success">&check;</span> Parsing environment...</div>
                <div><span className="text-success">&check;</span> Screening organisms...</div>
                <div><span className="text-warning">&#x27F3;</span> Running FBA simulation...</div>
                <div className="text-sm text-primary/80 mt-2">SSE stream · real-time</div>
              </div>
            )},
          ] as const).map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
              className={`flex flex-col md:flex-row items-center gap-10 ${i % 2 !== 0 ? "md:flex-row-reverse" : ""}`}
            >
              <div className="flex-1">
                <span className="text-sm font-mono text-primary/80 tracking-widest text-glow">{item.num}</span>
                <h3 className="text-lg font-semibold text-text mt-1">{t(`home.tech.${item.key}.title`)}</h3>
                <p className="text-base text-text-muted leading-relaxed mt-2 text-glow">{t(`home.tech.${item.key}.desc`)}</p>
              </div>
              <div className="flex-1 w-full">
                <div className="rounded-xl border border-white/20 bg-[rgba(30,41,66,0.7)] p-6 font-mono text-sm leading-relaxed">
                  {item.panel}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Scenario Case */}
      <section className="py-32 px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-text tracking-tight">
            {t("home.scenario.title")}
          </h2>
          <p className="mt-4 text-text-muted text-base md:text-lg max-w-lg mx-auto text-glow">
            {t("home.scenario.subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="max-w-5xl mx-auto rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-sm overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* Input */}
            <div className="p-8 md:border-r border-white/25">
              <span className="text-sm font-mono text-primary/90 tracking-[0.3em]">
                {t("home.scenario.input.label")}
              </span>
              <div className="mt-4">
                <p className="text-base font-semibold text-text">{t("home.scenario.input.site")}</p>
                <p className="text-sm text-text-dim font-mono mt-1">{t("home.scenario.input.coords")}</p>
              </div>
              <div className="mt-6 space-y-2 font-mono text-sm text-text-muted">
                {(["temp", "perchlorate", "uv", "co2", "ph"] as const).map((p) => (
                  <div key={p}>{t(`home.scenario.input.params.${p}`)}</div>
                ))}
              </div>
            </div>

            {/* Processing */}
            <div className="p-8 md:border-r border-white/25 border-t md:border-t-0">
              <span className="text-sm font-mono text-primary/90 tracking-[0.3em]">
                {t("home.scenario.processing.label")}
              </span>
              <div className="mt-4 space-y-3">
                {(["env", "extremo", "gene", "circuit", "metab", "struct"] as const).map((a) => (
                  <div key={a} className="flex items-center gap-2 text-sm">
                    <Check className="w-3 h-3 text-success flex-shrink-0" />
                    <span className="text-text-muted">{t(`home.scenario.processing.agents.${a}.name`)}</span>
                    <span className="ml-auto text-text-dim font-mono text-sm">{t(`home.scenario.processing.agents.${a}.time`)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Output */}
            <div className="p-8 border-t md:border-t-0">
              <span className="text-sm font-mono text-primary/90 tracking-[0.3em]">
                {t("home.scenario.output.label")}
              </span>
              <div className="mt-4">
                <p className="text-4xl font-bold text-text font-mono tabular-nums">{t("home.scenario.output.score")}</p>
                <p className="text-sm text-text-dim mt-1">{t("home.scenario.output.scoreLabel")}</p>
              </div>
              <div className="mt-4">
                <p className="text-sm text-text-muted">Chassis: <span className="text-text italic">{t("home.scenario.output.chassis")}</span></p>
              </div>
              <div className="mt-4 flex gap-2">
                {t("home.scenario.output.formats").split(" · ").map((f: string) => (
                  <span key={f} className="text-sm px-2 py-0.5 rounded border border-white/25 text-text-dim">{f}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Safety & Standards */}
      <section className="py-32 px-8 border-t border-white/25">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-text tracking-tight">
            {t("home.trust.title")}
          </h2>
          <p className="mt-4 text-text-muted text-base md:text-lg max-w-lg mx-auto text-glow">
            {t("home.trust.subtitle")}
          </p>
        </motion.div>

        <motion.div
          variants={stagger(150)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10"
        >
          <motion.div variants={fadeSlideUp} className="rounded-xl border border-white/20 bg-[rgba(30,41,66,0.7)] p-8">
            <ShieldCheck className="w-8 h-8 text-danger mb-5 opacity-80" />
            <h3 className="text-lg font-semibold text-text mb-4">{t("home.trust.safety.title")}</h3>
            <div className="space-y-3">
              {([0, 1, 2] as const).map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-danger mt-2 flex-shrink-0" />
                  <p className="text-sm text-text-muted leading-relaxed">{t(`home.trust.safety.items.${i}`)}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeSlideUp} className="rounded-xl border border-white/20 bg-[rgba(30,41,66,0.7)] p-8">
            <FileText className="w-8 h-8 text-success mb-5 opacity-80" />
            <h3 className="text-lg font-semibold text-text mb-4">{t("home.trust.standards.title")}</h3>
            <div className="space-y-3">
              {([0, 1, 2] as const).map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-success mt-2 flex-shrink-0" />
                  <p className="text-sm text-text-muted leading-relaxed">{t(`home.trust.standards.items.${i}`)}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="min-h-[70vh] flex items-center justify-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center relative z-10"
        >
          <h2 className="font-headline text-4xl md:text-6xl font-black text-text tracking-tight">
            {t("home.finalCta.title")}
          </h2>
          <p className="mt-6 text-text-muted text-lg md:text-xl max-w-lg mx-auto text-glow">
            {t("home.finalCta.subtitle")}
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              to="/projects"
              className="px-10 py-4 bg-primary text-bg rounded-lg font-semibold text-sm tracking-wider hover:shadow-[0_0_32px_rgba(56,189,248,0.4)] transition-all duration-300"
            >
              {t("home.finalCta.start")}
            </Link>
            <Link
              to="/login"
              className="px-10 py-4 border border-white/20 text-white/70 rounded-lg text-sm tracking-wider hover:border-white/40 hover:text-text transition-all duration-300 text-glow"
            >
              {t("home.finalCta.login")}
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-white/25">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-primary text-lg">&loz;</span>
            <span className="font-headline font-bold text-sm tracking-[0.25em] text-text">CODON</span>
          </div>
          <p className="text-sm text-text-dim">{t("home.footer.copyright")}</p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-text-dim hover:text-text-muted transition-colors">{t("home.footer.github")}</a>
            <a href="#" className="text-sm text-text-dim hover:text-text-muted transition-colors">{t("home.footer.docs")}</a>
            <a href="#" className="text-sm text-text-dim hover:text-text-muted transition-colors">{t("home.footer.contact")}</a>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
