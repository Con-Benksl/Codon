import { motion } from "motion/react";
import { fadeSlideUp, viewTransition } from "../lib/motion";
import DiagnosticsContent from "../components/diagnostics/DiagnosticsContent";
import { useLocale } from "../i18n/context";

export default function DiagnosticsView() {
  const { t } = useLocale();

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col gap-6 p-4 md:p-8 min-h-full"
    >
      <motion.div variants={fadeSlideUp} initial="hidden" animate="show" className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-background">{t("diagnostics.title")}</h1>
        <p className="text-sm text-on-surface-variant font-body">{t("diagnostics.subtitle")}</p>
      </motion.div>

      <DiagnosticsContent />
    </motion.div>
  );
}
