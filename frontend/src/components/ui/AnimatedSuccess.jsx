import { motion, AnimatePresence } from 'framer-motion';

/**
 * Animated green checkmark that pops in with a draw effect.
 * Usage: <AnimatedSuccess show={submitted} message="¡Solicitud enviada!" />
 */
export const AnimatedSuccess = ({ show, message, onDone }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        onAnimationComplete={() => {
          if (onDone) setTimeout(onDone, 1200);
        }}
        className="flex flex-col items-center gap-2"
      >
        {/* Circle + checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28, delay: 0.05 }}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 stroke-emerald-500"
            strokeWidth={2.5}
          >
            <motion.path
              d="M5 13l4 4L19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
            />
          </svg>
        </motion.div>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.2 }}
            className="text-sm font-medium text-emerald-700 dark:text-emerald-400 text-center"
          >
            {message}
          </motion.p>
        )}
      </motion.div>
    )}
  </AnimatePresence>
);

/**
 * Inline success state for a button — shows tick + label inline.
 */
export const SuccessButton = ({ success, successLabel, children, className = '', ...props }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    whileHover={{ scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    className={className}
    {...props}
  >
    <AnimatePresence mode="wait" initial={false}>
      {success ? (
        <motion.span
          key="success"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-current">
            <motion.path d="M5 13l4 4L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35 }} />
          </svg>
          {successLabel}
        </motion.span>
      ) : (
        <motion.span key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  </motion.button>
);
