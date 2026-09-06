import { isInteractiveTarget } from './effectUtils';

export interface DragBrushHandlers {
  onStart?: (x: number, y: number) => void;
  onMove?: (x: number, y: number, dx: number, dy: number) => void;
  onEnd?: () => void;
}

export interface DragBrushOptions {
  /** Touch presses shorter than this that move are scrolls, not drags */
  holdMs?: number;
  moveTolerance?: number;
}

/**
 * A drag gesture that never steals a scroll. Mouse drags start immediately on
 * mousedown; touch drags start after a short press (moving earlier means the
 * user is scrolling). While a drag is active the page doesn't scroll and text
 * can't be selected. Presses that start on links/buttons are ignored.
 *
 * Only the press is listened for on the host: move/up/cancel are tracked on
 * `window` during the press so a release is never missed (pointer leaving the
 * window, the element under the pointer changing, clip-path holes, etc.).
 */
export function attachDragBrush(
  host: HTMLElement,
  handlers: DragBrushHandlers,
  opts: DragBrushOptions = {},
): () => void {
  const holdMs = opts.holdMs ?? 300;
  const tolerance = opts.moveTolerance ?? 8;

  let pointerId: number | null = null;
  let active = false;
  let pressing = false;
  let downX = 0;
  let downY = 0;
  let lastX = 0;
  let lastY = 0;
  let holdTimer: number | null = null;

  const lockSelection = (lock: boolean) => {
    const style = host.style as CSSStyleDeclaration & { webkitUserSelect?: string; webkitTouchCallout?: string };
    style.userSelect = lock ? 'none' : '';
    style.webkitUserSelect = lock ? 'none' : '';
    style.webkitTouchCallout = lock ? 'none' : '';
  };

  const clearHold = () => {
    if (holdTimer !== null) {
      window.clearTimeout(holdTimer);
      holdTimer = null;
    }
  };

  const start = (x: number, y: number) => {
    active = true;
    lastX = x;
    lastY = y;
    handlers.onStart?.(x, y);
  };

  const finish = () => {
    clearHold();
    const wasActive = active;
    active = false;
    pressing = false;
    pointerId = null;
    lockSelection(false);
    window.removeEventListener('pointermove', onPointerMove, true);
    window.removeEventListener('pointerup', onPointerEnd, true);
    window.removeEventListener('pointercancel', onPointerEnd, true);
    if (wasActive) handlers.onEnd?.();
  };

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    // A mouse moving with no button held means we missed the release.
    if (e.pointerType === 'mouse' && e.buttons === 0) {
      finish();
      return;
    }
    if (!active) {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > tolerance) finish();
      return;
    }
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    handlers.onMove?.(e.clientX, e.clientY, dx, dy);
  };

  const onPointerEnd = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    finish();
  };

  const onPointerDown = (e: PointerEvent) => {
    if (pointerId !== null || !e.isPrimary) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (isInteractiveTarget(e.target)) return;
    pointerId = e.pointerId;
    pressing = true;
    downX = lastX = e.clientX;
    downY = lastY = e.clientY;
    lockSelection(true);
    window.addEventListener('pointermove', onPointerMove, true);
    window.addEventListener('pointerup', onPointerEnd, true);
    window.addEventListener('pointercancel', onPointerEnd, true);
    if (e.pointerType === 'mouse') {
      start(e.clientX, e.clientY);
    } else {
      holdTimer = window.setTimeout(() => {
        holdTimer = null;
        start(downX, downY);
      }, holdMs);
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    if (active) e.preventDefault();
  };
  const onContextMenu = (e: Event) => {
    if (pressing) e.preventDefault();
  };
  const onBlur = () => finish();

  host.addEventListener('pointerdown', onPointerDown);
  host.addEventListener('touchmove', onTouchMove, { passive: false });
  host.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('blur', onBlur);

  return () => {
    finish();
    host.removeEventListener('pointerdown', onPointerDown);
    host.removeEventListener('touchmove', onTouchMove);
    host.removeEventListener('contextmenu', onContextMenu);
    window.removeEventListener('blur', onBlur);
  };
}
