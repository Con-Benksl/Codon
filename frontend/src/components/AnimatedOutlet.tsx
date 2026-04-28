import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

/**
 * Wraps React Router's Outlet with AnimatePresence.
 * Each child route gets enter/exit animations on navigation.
 */
export default function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.35, ease },
        }}
        exit={{
          opacity: 0,
          y: -10,
          scale: 0.99,
          transition: { duration: 0.2, ease },
        }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
