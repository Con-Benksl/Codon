import type { Variants, Transition } from "motion/react";

// ── Standard easing ──
const ease = [0.25, 0.46, 0.45, 0.94] as const;

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
    transition: { duration: 0.5, ease },
  },
};

// ── Fade + Scale In ──
export const fadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease },
  },
};

// ── Fade + Slide from Left ──
export const fadeSlideLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease },
  },
};

// ── Fade + Slide from Right ──
export const fadeSlideRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease },
  },
};

// ── View transition (page level) ──
export const viewTransition: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.2, ease: [0.55, 0.06, 0.68, 0.19] },
  },
};

// ── Card hover preset (Stitch: 10px lift + glow expand) ──
export const cardHover = {
  whileHover: {
    y: -10,
    transition: { duration: 0.3, ease },
  },
  whileTap: { scale: 0.96, opacity: 0.88, transition: { duration: 0.08 } },
};

// ── Button press preset ──
export const buttonPress = {
  whileTap: { scale: 0.96, transition: { duration: 0.1 } },
};

// ── Progress bar animation ──
export const progressBar = (width: number): { style: { width: string }; transition: Transition } => ({
  style: { width: `${width}%` },
  transition: { duration: 1.2, ease, delay: 0.3 },
});

// ── whileInView defaults ──
export const inViewport = {
  viewport: { once: true, amount: 0.3 as const },
};

// ── Orb entrance (scale from 0 with spring) ──
export const orbEntrance: Variants = {
  hidden: { opacity: 0, scale: 0 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 80, damping: 20, duration: 1 },
  },
};

// ── Card slide in with stagger support ──
export const cardSlideIn: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease },
  },
};

// ── Pulse ring entrance (SVG orbital ring) ──
export const pulseRing: Variants = {
  hidden: { opacity: 0, scale: 0.8, rotate: -30 },
  show: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { duration: 0.8, ease },
  },
};

// ── Glass panel entrance (fade + subtle rise) ──
export const glassEntrance: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease },
  },
};
