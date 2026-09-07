import { useEffect, useState } from 'react';
import { collectChunks } from './disruptUtils';
import { isInteractiveTarget } from './effectUtils';

export type EffectHost = React.RefObject<HTMLDivElement | null>;
export const cardContent = (host: HTMLElement) => host.querySelector<HTMLElement>('[data-fx-content]') || host;

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

/** A visual brush: prevents accidental text selection, but keeps links and native scrolling. */
export function observeSurface(host: HTMLElement, handlers: {
  start: (x: number, y: number) => void;
  move: (x: number, y: number) => void;
  end?: () => void;
}, ignoreControls = false) {
  let pointer: number | null = null;
  let touch: number | null = null;
  let active = false;
  const userSelect = host.style.userSelect;
  const webkitUserSelect = host.style.webkitUserSelect;
  const restoreSelection = () => {
    host.style.userSelect = userSelect;
    host.style.webkitUserSelect = webkitUserSelect;
  };
  const excluded = (target: EventTarget | null) => target instanceof Element &&
    (target.closest('[data-fx-ignore], [role="dialog"]') || (ignoreControls && isInteractiveTarget(target)));
  const down = (e: PointerEvent) => {
    if (!e.isPrimary || e.button !== 0 || excluded(e.target)) return;
    pointer = e.pointerId;
    active = true;
    host.style.userSelect = 'none';
    host.style.webkitUserSelect = 'none';
    handlers.start(e.clientX, e.clientY);
  };
  const move = (e: PointerEvent) => {
    if (active && pointer === e.pointerId) handlers.move(e.clientX, e.clientY);
  };
  const end = () => {
    pointer = touch = null;
    if (active) handlers.end?.();
    active = false;
    restoreSelection();
  };
  const cancel = () => {
    pointer = null;
    // Touch events continue after the browser starts scrolling.
    if (touch === null) end();
  };
  const touchStart = (e: TouchEvent) => {
    if (!excluded(e.target) && e.touches.length === 1) touch = e.touches[0].identifier;
    else end();
  };
  const touchMove = (e: TouchEvent) => {
    if (pointer !== null || !active) return;
    const finger = Array.from(e.touches).find(t => t.identifier === touch);
    if (finger) handlers.move(finger.clientX, finger.clientY);
  };
  const preventDrag = (e: Event) => { if (active) e.preventDefault(); };
  host.addEventListener('dragstart', preventDrag);
  host.addEventListener('selectstart', preventDrag);
  host.addEventListener('pointerdown', down);
  host.addEventListener('touchstart', touchStart, { passive: true });
  host.addEventListener('touchmove', touchMove, { passive: true });
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', cancel);
  window.addEventListener('touchend', end);
  window.addEventListener('touchcancel', end);
  window.addEventListener('blur', end);
  return () => {
    restoreSelection();
    host.removeEventListener('dragstart', preventDrag);
    host.removeEventListener('selectstart', preventDrag);
    host.removeEventListener('pointerdown', down);
    host.removeEventListener('touchstart', touchStart);
    host.removeEventListener('touchmove', touchMove);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', end);
    window.removeEventListener('pointercancel', cancel);
    window.removeEventListener('touchend', end);
    window.removeEventListener('touchcancel', end);
    window.removeEventListener('blur', end);
  };
}

/** Preserve author styles and measure rest positions in document coordinates. */
export function movingPieces(host: HTMLElement) {
  return collectChunks(cardContent(host)).map(el => {
    const rect = el.getBoundingClientRect();
    const saved = { transform: el.style.transform, transformOrigin: el.style.transformOrigin, transition: el.style.transition, willChange: el.style.willChange };
    el.style.transition = 'none';
    el.style.willChange = 'transform';
    el.style.transformOrigin = 'center';
    return {
      el, x: rect.left + rect.width / 2 + window.scrollX, y: rect.top + rect.height / 2 + window.scrollY,
      restore: () => Object.assign(el.style, saved),
    };
  });
}

/** Prevent concealed links from receiving focus. Restore exactly what was there. */
export function concealContent(host: HTMLElement) {
  const content = cardContent(host);
  const inert = content.inert;
  content.inert = true;
  return () => { content.inert = inert; };
}
