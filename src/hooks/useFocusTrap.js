import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Traps Tab navigation inside the returned ref's subtree and autofocuses
 * `autoFocusRef` (falling back to the first focusable element) whenever
 * `open` becomes true. Pass `onEscape` to also wire the Escape key — omit
 * it for modals where an accidental Escape must NOT dismiss (e.g. fullscreen
 * exam warnings, where Escape already has native fullscreen-exit semantics).
 *
 * `open` should be `true` for modals that are conditionally *mounted*
 * (`{show && <Modal />}`) since the effect then only needs to run once.
 */
export const useFocusTrap = (open, { autoFocusRef, onEscape } = {}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    (autoFocusRef?.current || containerRef.current?.querySelector(FOCUSABLE_SELECTOR))?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = containerRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onEscape, autoFocusRef]);

  return containerRef;
};
