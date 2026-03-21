import type { Variants, Transition } from "motion/react";

// ── Stagger Container ──
export const stagger = (staggerMs = 60): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: staggerMs / 1000 },
  },
});

// ── Fade + Slide Up (child item) ──
export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ── Fade + Scale In ──
export const fadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ── Fade + Slide from Left ──
export const fadeSlideLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ── Fade + Slide from Right ──
export const fadeSlideRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ── View transition (page level) ──
export const viewTransition: Variants = {
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(4px)",
    transition: { duration: 0.25, ease: [0.55, 0.06, 0.68, 0.19] },
  },
};

// ── Card hover preset ──
export const cardHover = {
  whileHover: { y: -4, transition: { duration: 0.2 } },
  whileTap: { scale: 0.98, transition: { duration: 0.1 } },
};

// ── Button press preset ──
export const buttonPress = {
  whileTap: { scale: 0.96, transition: { duration: 0.1 } },
};

// ── Progress bar animation ──
export const progressBar = (width: number): { style: { width: string }; transition: Transition } => ({
  style: { width: `${width}%` },
  transition: { duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 },
});

// ── whileInView defaults ──
export const inViewport = {
  viewport: { once: true, amount: 0.3 as const },
};
