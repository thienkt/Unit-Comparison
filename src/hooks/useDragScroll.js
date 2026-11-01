import { useRef, useEffect } from 'react';

/**
 * Custom hook to enable mouse drag-to-scroll horizontally on desktop devices.
 * Explicitly ignores touch devices / touch screens to preserve native gesture scrolling.
 */
export function useDragScroll() {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasDragged = false;

    // Prevent HTML5 native dragging (e.g. dragging images/links out)
    const onDragStart = (e) => {
      e.preventDefault();
      return false;
    };

    // Only handle mouse events; ignore touch screens
    const onPointerDown = (e) => {
      // Ignore touch and stylus; only allow standard mouse left-click
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (e.button !== 0) return; // Only primary (left) button

      isDown = true;
      hasDragged = false;
      startX = e.clientX;
      scrollLeft = el.scrollLeft;
      el.classList.add('is-dragging-scroll');
    };

    const onPointerMove = (e) => {
      if (!isDown) return;
      if (e.pointerType && e.pointerType !== 'mouse') return;

      const deltaX = e.clientX - startX;
      if (Math.abs(deltaX) > 3) {
        hasDragged = true;
        e.preventDefault(); // Stop native text selection or gesture hijacking
      }

      el.scrollLeft = scrollLeft - deltaX;
    };

    const onPointerUp = (e) => {
      if (!isDown) return;
      isDown = false;
      el.classList.remove('is-dragging-scroll');
    };

    const onPointerCancel = () => {
      if (!isDown) return;
      isDown = false;
      el.classList.remove('is-dragging-scroll');
    };

    // Prevent accidental click triggers on child items if the user was dragging
    const onClickCapture = (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    };

    el.addEventListener('dragstart', onDragStart);
    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    el.addEventListener('click', onClickCapture, true);

    return () => {
      el.removeEventListener('dragstart', onDragStart);
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      el.removeEventListener('click', onClickCapture, true);
    };
  }, []);

  return scrollRef;
}
