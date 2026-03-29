/**
 * AdaptiveModal — Dialog on desktop, bottom sheet on mobile.
 * Same animation pattern as dialog.jsx but for full-page form modals.
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const AdaptiveModal = DialogPrimitive.Root;
const AdaptiveModalTrigger = DialogPrimitive.Trigger;

const AdaptiveModalContent = React.forwardRef(({ className, children, title, description, ...props }, ref) => (
  <DialogPrimitive.Portal>
    {/* Overlay */}
    <DialogPrimitive.Overlay
      className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />

    {/* Content */}
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // ── Mobile: bottom sheet ──
        'fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto border-t-2 border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        'data-[state=closed]:duration-200 data-[state=open]:duration-300',
        // ── Desktop: centered dialog ──
        'sm:inset-auto sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-h-[90vh] sm:w-full sm:max-w-2xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:border-2 sm:border-stone-200 sm:dark:border-stone-800',
        'sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0',
        'sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0',
        'sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95',
        'sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%]',
        'sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]',
        'sm:data-[state=closed]:duration-200 sm:data-[state=open]:duration-200',
        className
      )}
      {...props}
    >
      {/* Mobile drag handle */}
      <div className="sticky top-0 z-10 flex justify-center bg-white pt-3 pb-1 dark:bg-stone-950 sm:hidden">
        <div className="h-1 w-10 bg-stone-300 dark:bg-stone-700" />
      </div>

      <div className="px-5 pb-8 pt-2 sm:p-7">
        {/* Header */}
        {(title || description) && (
          <div className="mb-5 pr-8">
            {title && (
              <DialogPrimitive.Title className="text-lg font-display font-bold text-stone-900 dark:text-stone-50">
                {title}
              </DialogPrimitive.Title>
            )}
            {description && (
              <DialogPrimitive.Description className="mt-1.5 text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
        )}

        {children}
      </div>

      {/* Close button */}
      <DialogPrimitive.Close className="absolute right-4 top-4 p-1.5 text-stone-400 transition-all hover:text-stone-900 hover:bg-stone-100 dark:hover:text-stone-50 dark:hover:bg-stone-800 sm:right-5 sm:top-5">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
AdaptiveModalContent.displayName = 'AdaptiveModalContent';

const AdaptiveModalFooter = ({ className, ...props }) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-5', className)} {...props} />
);

export { AdaptiveModal, AdaptiveModalTrigger, AdaptiveModalContent, AdaptiveModalFooter };
