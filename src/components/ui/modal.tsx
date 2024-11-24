import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function Modal({ children, onClose, title, description }: ModalProps) {
  return (
    <DialogPrimitive.Root open={true} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/80',
            'animate-in fade-in-0',
            'backdrop-blur-sm'
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            // Positioning
            'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
            // Size and shape
            'w-full max-w-2xl rounded-lg',
            // Colors and background
            'bg-black/90 border border-gold-400/30',
            // Animation
            'animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%]',
            // Scrolling
            'max-h-[85vh] overflow-y-auto'
          )}
        >
          {/* Close Button */}
          <DialogPrimitive.Close
            className={cn(
              'absolute right-4 top-4 rounded-sm opacity-70 transition-opacity',
              'hover:opacity-100 focus:outline-none focus:ring-2',
              'focus:ring-gold-400 focus:ring-offset-2 disabled:pointer-events-none',
              'text-gold-400'
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Modal Header */}
          {(title || description) && (
            <div className="p-6 pb-2">
              {title && (
                <DialogPrimitive.Title className="text-lg font-semibold text-gold-400 mb-1">
                  {title}
                </DialogPrimitive.Title>
              )}
              {description && (
                <DialogPrimitive.Description className="text-sm text-light-grey">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
          )}

          {/* Modal Content */}
          <div className="p-6">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

Modal.displayName = 'Modal';
