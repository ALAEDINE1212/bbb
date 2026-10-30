import { type ReactNode, useEffect, useRef } from "react";
import { AnimatePresence, motion, type PanInfo, useDragControls } from "framer-motion";
import { createPortal } from "react-dom";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Pinned below the scrolling content (e.g. the Done button). */
  footer?: ReactNode;
}

/**
 * iOS-style bottom sheet: dimmed backdrop, grabber, drag the grabber/header down (or tap outside,
 * or press Escape) to dismiss. Content scrolls inside; the footer stays pinned above the home bar.
 */
export function Sheet({ open, onClose, title, subtitle, children, footer }: SheetProps) {
  const drag = useDragControls();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="relative flex max-h-[92dvh] w-full max-w-[560px] flex-col rounded-t-[30px] bg-card shadow-float outline-none"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            drag="y"
            dragListener={false}
            dragControls={drag}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            <div className="cursor-grab touch-none px-6 pb-2 pt-2.5" onPointerDown={event => drag.start(event)}>
              <div className="mx-auto h-[5px] w-10 rounded-full bg-track" />
              {title && <h2 className="mt-5 text-center font-display text-[22px] font-semibold tracking-tight text-ink">{title}</h2>}
              {subtitle && <p className="mx-auto mt-1.5 max-w-[340px] text-center text-[14px] leading-snug text-ink-2">{subtitle}</p>}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">{children}</div>
            {footer && <div className="px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
