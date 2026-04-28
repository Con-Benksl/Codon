import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { useDesigner } from "../../views/designer/DesignerContext";

interface RollbackButtonProps {
  label: string;
  targetStep: number;
}

export default function RollbackButton({
  label,
  targetStep,
}: RollbackButtonProps) {
  const { state, rollbackTo } = useDesigner();
  const disabled = state.isSessionLoading || state.isThinking || Boolean(state.sessionError);

  return (
    <motion.button
      type="button"
      whileHover={{ x: -2 }}
      whileTap={{ scale: 0.97 }}
      disabled={disabled}
      onClick={() => {
        if (!disabled) void rollbackTo(targetStep);
      }}
      className="inline-flex items-center gap-2 px-5 py-2.5 text-base font-medium text-text-muted hover:text-primary border border-white/15 hover:border-primary/40 rounded-xl bg-white/[0.04] backdrop-blur-sm transition-colors"
    >
      <ArrowLeft size={18} />
      <span>{label}</span>
    </motion.button>
  );
}
