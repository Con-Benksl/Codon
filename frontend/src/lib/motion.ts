import type { Variants } from "motion/react";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export const viewTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease },
  },
};

export const stagger = (staggerMs = 50): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: staggerMs / 1000 },
  },
});

export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.4, ease },
  },
};

export const cardHover = {
  whileHover: {
    y: -2,
    transition: { duration: 0.2, ease },
  },
};

export const buttonPress = {
  whileTap: { scale: 0.97, transition: { duration: 0.1 } },
};

export const inViewport = {
  viewport: { once: true, amount: 0.3 as const },
};
