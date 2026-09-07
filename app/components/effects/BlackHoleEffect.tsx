'use client';

import { useEffect } from 'react';
import { isInteractiveTarget } from './effectUtils';
import { EffectHost, movingPieces, useReducedMotion } from './surfaceUtils';

export default function BlackHoleEffect({ host }: { host: EffectHost }) {
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = host.current;
    if (!el || reduced) return;
    let pieces: ReturnType<typeof movingPieces> = [];
    let pointer: number | null = null;
    let timer = 0, raf = 0, last = 0, progress = 0;
    let holding = false, downX = 0, downY = 0, cx = 0, cy = 0;
    const userSelect = el.style.userSelect, webkitUserSelect = el.style.webkitUserSelect;
    const restore = () => { pieces.forEach(p => p.restore()); pieces = []; };
    const frame = (now: number) => {
      const dt = Math.min((now - (last || now)) / 1000, 0.05); last = now;
      progress = holding ? Math.min(1, progress + dt / 3.7) : progress * Math.exp(-dt * 7);
      for (const [i, p] of pieces.entries()) {
        // Perspective projection: each original element recedes along its own depth plane.
        const depth = Math.pow(progress, 2.5) * (2800 + (i % 5) * 450) / (1.06 - progress);
        const scale = 900 / (900 + depth);
        const pull = 1 - scale;
        const twist = Math.sin(progress * Math.PI) * ((i % 2 ? 1 : -1) * 5);
        p.el.style.transform = `translate3d(${(cx - p.x) * pull}px,${(cy - p.y) * pull}px,0) scale(${scale}) rotate(${twist}deg)`;
      }
      if (holding || progress > 0.001) raf = requestAnimationFrame(frame);
      else { raf = 0; progress = 0; restore(); }
    };
    const release = () => {
      window.clearTimeout(timer); pointer = null; holding = false;
      el.style.userSelect = userSelect; el.style.webkitUserSelect = webkitUserSelect;
    };
    const down = (e: PointerEvent) => {
      if (!e.isPrimary || e.button !== 0 || pointer !== null || isInteractiveTarget(e.target)) return;
      pointer = e.pointerId; downX = e.clientX; downY = e.clientY;
      el.style.userSelect = el.style.webkitUserSelect = 'none';
      timer = window.setTimeout(() => {
        restore(); pieces = movingPieces(el);
        const rect = el.getBoundingClientRect();
        cx = rect.left + rect.width / 2 + window.scrollX;
        cy = (Math.max(0, rect.top) + Math.min(window.innerHeight, rect.bottom)) / 2 + window.scrollY;
        holding = true;
        if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
      }, 200);
    };
    const move = (e: PointerEvent) => {
      if (pointer === e.pointerId && Math.hypot(e.clientX - downX, e.clientY - downY) > 14) release();
    };
    const end = (e: PointerEvent) => { if (e.pointerId === pointer) release(); };
    const context = (e: Event) => { if (pointer !== null) e.preventDefault(); };
    const reset = () => { release(); cancelAnimationFrame(raf); raf = progress = 0; restore(); };
    el.addEventListener('pointerdown', down);
    el.addEventListener('contextmenu', context);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    window.addEventListener('blur', release);
    window.addEventListener('resize', reset);
    window.addEventListener('scroll', release, { passive: true });
    return () => {
      reset(); el.removeEventListener('pointerdown', down); el.removeEventListener('contextmenu', context);
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end); window.removeEventListener('blur', release);
      window.removeEventListener('resize', reset); window.removeEventListener('scroll', release);
    };
  }, [host, reduced]);
  return null;
}
