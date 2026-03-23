import { motion } from "motion/react";
import { fadeSlideUp, viewTransition } from "../lib/motion";
import DiagnosticsContent from "../components/diagnostics/DiagnosticsContent";

export default function DiagnosticsView() {
  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col gap-6 p-4 md:p-8 min-h-full"
    >
      <motion.div variants={fadeSlideUp} initial="hidden" animate="show" className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-background">DIAGNOSTICS</h1>
        <p className="text-sm text-on-surface-variant font-body">实时监控 Mars Biolab 系统健康状态与代理运行表现</p>
      </motion.div>

      <DiagnosticsContent />
    </motion.div>
  );
}
