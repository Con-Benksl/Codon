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
      className="p-6 md:p-8"
    >
      <h1 className="text-xl font-headline font-medium text-text tracking-tight">
        {t("analysis.title")}
      </h1>
      <p className="text-sm text-text-muted mt-1">{t("analysis.subtitle")}</p>

      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
          <BarChart3 size={28} className="text-primary" />
        </div>
        <p className="text-text-muted text-sm">{t("analysis.placeholder")}</p>
        <p className="text-text-dim text-xs mt-2">{t("analysis.comingSoon")}</p>
      </div>
    </motion.div>
  );
}
