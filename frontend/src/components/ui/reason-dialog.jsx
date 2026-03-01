import { motion } from 'framer-motion';
import { MessageSquareWarning } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';

export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  value,
  onValueChange,
  confirmLabel,
  cancelLabel,
  onConfirm,
  loading = false,
}) {
  const canSubmit = value?.trim()?.length > 0 && !loading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="flex items-start gap-3"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: [1, 1.06, 1], opacity: 1 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
            >
              <MessageSquareWarning className="h-4 w-4" />
            </motion.div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              {description ? <DialogDescription className="mt-1">{description}</DialogDescription> : null}
            </div>
          </motion.div>
        </DialogHeader>

        <Input
          autoFocus
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canSubmit) onConfirm();
          }}
        />

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={!canSubmit}>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  className="h-3.5 w-3.5 rounded-full border-2 border-white/35 border-t-white"
                />
                ...
              </span>
            ) : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
