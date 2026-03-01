import { motion } from 'framer-motion';

// Staggered list item — wrap each child in this
export const FadeItem = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, delay, ease: [0.4, 0, 0.2, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

// Staggered container — triggers when scrolled into view
export const StaggerContainer = ({ children, className = '', staggerDelay = 0.07 }) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: '-40px' }}
    variants={{
      hidden: {},
      show: { transition: { staggerChildren: staggerDelay } },
    }}
  >
    {children}
  </motion.div>
);

// Each child of StaggerContainer
export const StaggerItem = ({ children, className = '' }) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 18, scale: 0.97 },
      show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
      },
    }}
  >
    {children}
  </motion.div>
);
