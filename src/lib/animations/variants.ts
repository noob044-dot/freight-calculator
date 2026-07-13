import type { Variants, Transition } from 'framer-motion';

// ── User Requested Presets ──────────────────────────────────
export const spring = { stiffness: 280, damping: 24 };
export const springMagnetic = { stiffness: 450, damping: 30 };
export const stagger = { delay: 60, staggerChildren: 80 };
export const pageTransition = { duration: 0.4, ease: [0.4, 0, 0.2, 1] };

// ── Spring Presets ──────────────────────────────────────────
export const springStandard: Transition = { type: 'spring', ...spring };
export const springGentle: Transition = { type: 'spring', stiffness: 120, damping: 20 };
export const springSnappy: Transition = { type: 'spring', stiffness: 400, damping: 15 };

// ── Stagger Container ───────────────────────────────────────
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

export const staggerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

// ── Fade Up ─────────────────────────────────────────────────
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springGentle,
  },
};

export const fadeUpMagnetic: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springMagnetic,
  },
};

// ── Fade In ─────────────────────────────────────────────────
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6 },
  },
};

// ── Scale In ────────────────────────────────────────────────
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springStandard,
  },
};

// ── Slide In (from left/right) ──────────────────────────────
export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springStandard,
  },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springStandard,
  },
};

// ── Card Hover ──────────────────────────────────────────────
export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.02, y: -4, transition: springMagnetic },
};

// ── Button Magnetic Hover ───────────────────────────────────
export const buttonMagnetic = (x: number, y: number) => ({
  scale: 1.02,
  x: x * 0.08,
  y: y * 0.08 - 2,
  transition: springMagnetic,
});

// ── Error Shake ─────────────────────────────────────────────
export const errorShake = {
  x: [0, -8, 8, -8, 4, -4, 0],
  transition: { duration: 0.4, ease: 'easeInOut' },
};

// ── Page Transition Variants ────────────────────────────────
export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.3 } },
};

// ── Counter ─────────────────────────────────────────────────
export const counterItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: springSnappy },
};

// ── Success Morph ───────────────────────────────────────────
export const successMorph = {
  initial: { rotate: -90, scale: 0 },
  animate: { rotate: 0, scale: 1, transition: { type: 'spring', stiffness: 500, damping: 20 } },
};

export const counterVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 200, damping: 15 }
    }
  }
};
