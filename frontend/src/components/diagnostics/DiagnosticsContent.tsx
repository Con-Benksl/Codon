import { motion } from "motion/react";
import { Download, RefreshCw, Terminal } from "lucide-react";
import {
  buttonPress,
  cardHover,
  fadeScale,
  fadeSlideUp,
  progressBar,
  stagger,
} from "../../lib/motion";
import {
  agentTone,
  clampPercent,
  loadDots,
  logs,
  LOG_TYPE_STYLE,
  performanceMetrics,
  pipeline,
  sensors,
  statusCards,
  STATUS_STYLE,
} from "./diagnosticsData";
import { useLocale } from "../../i18n/context";

export default function DiagnosticsContent() {
  const { t } = useLocale();

  const localizedStatusCards = statusCards.map((card) => ({
    ...card,
    label: t(`diagnostics.cards.${card.id}.label`),
    badge: t(`diagnostics.cards.${card.id}.badge`),
  }));

  const localizedSensors = sensors.map((sensor) => ({
    ...sensor,
    name: t(`diagnostics.sensors.${sensor.id}.name`),
    status: t(`diagnostics.sensors.${sensor.id}.status`),
  }));

  const localizedPipeline = pipeline.map((agent) => ({
    ...agent,
    name: t(`diagnostics.pipeline.${agent.id}.name`),
    subsystem: t(`diagnostics.pipeline.${agent.id}.subsystem`),
    statusLabel: t(`diagnostics.pipelineStatus.${agent.status}`),
  }));

  const localizedPerformance = performanceMetrics.map((metric) => ({
    ...metric,
    label: t(`diagnostics.performance.${metric.id}.label`),
    note: t(`diagnostics.performance.${metric.id}.note`),
  }));

  const localizedLogs = logs.map((log) => ({
    ...log,
    message: t(`diagnostics.logs.${log.id}`),
    typeLabel: t(`diagnostics.logType.${log.type}`),
  }));

  return (
    <motion.div variants={stagger(70)} initial="hidden" animate="show" className="flex flex-col gap-6">
      <motion.section variants={stagger(70)} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {localizedStatusCards.map((card) => {
          const Icon = card.icon;
          const tone = STATUS_STYLE[card.tone];
          return (
            <motion.div
              key={card.id}
              variants={fadeScale}
              {...cardHover}
              className="glass-panel rounded-xl p-4 border border-outline-variant/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center border border-outline-variant/20">
                    <Icon size={15} className={tone.text} />
                  </div>
                  <p className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">{card.label}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-headline uppercase tracking-wide border ${tone.badge}`}>
                  {card.badge}
                </span>
              </div>
              <p className={`mt-4 text-xl font-headline font-bold ${tone.text}`}>{card.value}</p>
            </motion.div>
          );
        })}
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <motion.section variants={fadeSlideUp} className="glass-panel rounded-xl p-5 border border-outline-variant/20">
            <h2 className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-widest mb-4">{t("diagnostics.sections.sensorArray")}</h2>

            <motion.div variants={stagger(50)} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {localizedSensors.map((sensor) => {
                const Icon = sensor.icon;
                const tone = STATUS_STYLE[sensor.tone];
                const percent = clampPercent(sensor.value, sensor.min, sensor.max);
                const bar = progressBar(percent);
                return (
                  <motion.div
                    key={sensor.id}
                    variants={fadeSlideUp}
                    className={`rounded-xl p-4 bg-surface-container-low border border-outline-variant/20 ${
                      sensor.tone === "warning" ? "border-l-2 border-l-secondary" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon size={14} className={tone.text} />
                        <p className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant truncate">{sensor.name}</p>
                      </div>
                      <span className={`text-[10px] font-headline uppercase tracking-wide ${tone.text}`}>{sensor.status}</span>
                    </div>

                    <div className="flex items-end justify-between gap-3">
                      <p className="text-xl font-headline font-bold text-on-surface">{sensor.valueLabel}</p>
                      <p className="text-[10px] font-body text-on-surface-variant">
                        {t("diagnostics.labels.status")}: <span className={tone.text}>{sensor.status}</span>
                      </p>
                    </div>

                    <div className="mt-3 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${sensor.tone === "warning" ? "bg-secondary" : "bg-tertiary"}`}
                        initial={{ width: 0 }}
                        animate={bar.style}
                        transition={bar.transition}
                      />
                    </div>

                    <p className="mt-2 text-[10px] font-body text-on-surface-variant">{t("diagnostics.labels.range")}: {sensor.rangeLabel}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.section>

          <motion.section variants={fadeSlideUp} className="glass-panel rounded-xl p-5 border border-outline-variant/20">
            <h2 className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-widest mb-4">{t("diagnostics.sections.agentPipeline")}</h2>

            <motion.div variants={stagger(40)} initial="hidden" animate="show" className="flex flex-col gap-2">
              {localizedPipeline.map((agent) => {
                const tone = STATUS_STYLE[agentTone(agent.status)];
                return (
                  <motion.div
                    key={agent.id}
                    variants={fadeSlideUp}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/15"
                  >
                    <span className={`w-2 h-2 rounded-full ${tone.dot}`} />
                    <div className="min-w-0 flex flex-col md:flex-row md:items-center md:gap-3">
                      <p className="text-[11px] font-headline uppercase tracking-wider text-on-surface truncate">{agent.name}</p>
                      <p className="text-[10px] text-on-surface-variant font-body truncate">{agent.subsystem}</p>
                    </div>
                    <div className="text-[10px] font-mono text-on-surface-variant">{loadDots(agent.load)}</div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-headline uppercase tracking-wide ${tone.text}`}>{agent.statusLabel}</span>
                      <span className="text-[10px] font-mono text-on-surface-variant">{agent.latency}</span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.section>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <motion.section variants={fadeSlideUp} className="glass-panel rounded-xl p-5 border border-outline-variant/20">
            <h2 className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-widest mb-4">{t("diagnostics.sections.systemPerformance")}</h2>

            <div className="flex flex-col gap-4">
              {localizedPerformance.map((metric) => {
                const bar = progressBar(metric.value);
                return (
                  <div key={metric.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-headline uppercase tracking-wider text-on-surface">{metric.label}</p>
                      <p className="text-sm font-headline font-bold text-on-surface">{metric.value}%</p>
                    </div>
                    <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${metric.tone === "secondary" ? "bg-secondary" : "bg-primary"}`}
                        initial={{ width: 0 }}
                        animate={bar.style}
                        transition={bar.transition}
                      />
                    </div>
                    <p className="text-[10px] font-body text-on-surface-variant">{metric.note}</p>
                  </div>
                );
              })}
            </div>
          </motion.section>

          <motion.section variants={fadeSlideUp} className="glass-panel rounded-xl p-5 border border-outline-variant/20">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-widest">{t("diagnostics.sections.eventLog")}</h2>
              <span className="inline-flex items-center gap-2 text-[10px] font-headline uppercase tracking-widest text-error">
                <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                {t("diagnostics.labels.live")}
              </span>
            </div>

            <div className="h-[240px] overflow-y-auto pr-1 flex flex-col gap-2">
              {localizedLogs.map((log) => (
                <div key={log.id} className="rounded-lg bg-surface-container-low border border-outline-variant/15 p-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono text-on-surface-variant">{log.time}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-headline uppercase tracking-wide ${LOG_TYPE_STYLE[log.type]}`}>
                      {log.typeLabel}
                    </span>
                  </div>
                  <p className="text-xs font-body text-on-surface-variant leading-relaxed">{log.message}</p>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>

      <motion.section variants={fadeSlideUp} className="glass-panel rounded-xl p-4 border border-outline-variant/20">
        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            {...buttonPress}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/30 text-primary text-[11px] font-headline tracking-widest uppercase rounded-lg hover:bg-primary/20 transition-colors"
          >
            <Terminal size={14} />
            {t("diagnostics.actions.runFull")}
          </motion.button>

          <motion.button
            {...buttonPress}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary/10 border border-secondary/30 text-secondary text-[11px] font-headline tracking-widest uppercase rounded-lg hover:bg-secondary/20 transition-colors"
          >
            <RefreshCw size={14} />
            {t("diagnostics.actions.restartAgents")}
          </motion.button>

          <motion.button
            {...buttonPress}
            className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant/30 text-on-surface-variant text-[11px] font-headline tracking-widest uppercase rounded-lg hover:bg-surface-container transition-colors"
          >
            <Download size={14} />
            {t("diagnostics.actions.exportReport")}
          </motion.button>
        </div>
      </motion.section>
    </motion.div>
  );
}
