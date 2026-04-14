import { motion, AnimatePresence } from "motion/react";
import { Sparkles } from "lucide-react";

interface AgentThinkingProps {
  message: string;
  visible: boolean;
}

export default function AgentThinking({ message, visible }: AgentThinkingProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40"
        >
          <div className="flex items-center gap-4 px-7 py-4 bg-card/90 backdrop-blur-md border border-primary/30 rounded-full shadow-2xl shadow-primary/10">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.05, 0.9] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="w-10 h-10 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center"
            >
              <Sparkles size={20} className="text-primary" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-sm uppercase tracking-[0.18em] text-primary font-semibold">
                Agent 思考中
              </span>
              <span className="text-base text-text-muted">{message}</span>
            </div>
            <div className="flex gap-1.5 ml-2">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
