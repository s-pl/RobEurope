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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="flex items-start gap-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
              className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40"
            >
              <MessageSquareWarning className="h-5 w-5" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription className="mt-1.5">{description}</DialogDescription>}
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
                  transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                  className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white"
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
