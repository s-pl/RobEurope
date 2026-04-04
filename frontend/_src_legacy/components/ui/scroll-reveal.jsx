import { motion, useReducedMotion } from 'framer-motion';

export const ScrollReveal = ({
  children,
  delay = 0,
  y = 12,
  duration = 0.3,
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
      transition={{ duration, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};
