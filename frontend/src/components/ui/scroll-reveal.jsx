import { motion, useReducedMotion } from 'framer-motion';

/**
 * Lightweight in-view reveal animation.
 * Uses transform + opacity only for performance.
 */
export const ScrollReveal = ({
  children,
  delay = 0,
  y = 18,
  duration = 0.45,
  once = true,
  amount = 0.2,
  className,
}) => {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};
