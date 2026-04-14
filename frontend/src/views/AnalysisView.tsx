import { motion } from "motion/react";
import { BarChart3 } from "lucide-react";
import { useLocale } from "../i18n/context";
import { viewTransition } from "../lib/motion";

export default function AnalysisView() {
  const { t } = useLocale();

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-8 md:p-12"
    >
      <h1 className="text-4xl font-headline font-semibold text-text tracking-tight">
        {t("analysis.title")}
      </h1>
      <p className="text-lg text-text-muted mt-2">{t("analysis.subtitle")}</p>

      <div className="flex flex-col items-center justify-center py-40">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-8">
          <BarChart3 size={42} className="text-primary" />
        </div>
        <p className="text-text-muted text-xl">{t("analysis.placeholder")}</p>
        <p className="text-text-dim text-base mt-3">{t("analysis.comingSoon")}</p>
      </div>
    </motion.div>
  );
}
