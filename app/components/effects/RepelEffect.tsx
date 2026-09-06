'use client';

import React, { useEffect } from 'react';
import { attachDragBrush } from './dragBrush';
import { collectChunks } from './disruptUtils';
import FxHint from './FxHint';
import { prefersReducedMotion } from './effectUtils';

interface RepelEffectProps {
  host: React.RefObject<HTMLDivElement | null>;
}

const RADIUS = 150;
const MAX_PUSH = 80;
const STIFFNESS = 170;
const DAMPING = 14;
const EPS = 0.15;

interface Chunk {
  el: HTMLElement;
  /** Rest center in viewport px */
  cx: number;
  cy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/**
 * Repel: pieces of the card near the drag are pushed away like magnets and
 * spring back (underdamped, so they wobble) once the finger moves on.
 */
const RepelEffect: React.FC<RepelEffectProps> = ({ host }) => {
  useEffect(() => {
    const hostEl = host.current;
    if (!hostEl || prefersReducedMotion()) return;

    const chunks = new Map<HTMLElement, Chunk>();
    let active = false;
    let px = 0;
    let py = 0;
    let raf = 0;
    let running = false;
    let lastFrame = 0;

    const release = (c: Chunk) => {
      c.el.style.transform = '';
      c.el.style.transition = '';
      c.el.style.willChange = '';
    };

    const measure = () => {
      for (const [el, c] of chunks) {
        if (!el.isConnected) {
          release(c);
          chunks.delete(el);
        }
      }
      for (const el of collectChunks(hostEl)) {
        const r = el.getBoundingClientRect();
        const existing = chunks.get(el);
        if (existing) {
          // rect includes the current displacement; subtract it to get the rest position
          existing.cx = r.left + r.width / 2 - existing.x;
          existing.cy = r.top + r.height / 2 - existing.y;
        } else {
          chunks.set(el, { el, cx: r.left + r.width / 2, cy: r.top + r.height / 2, x: 0, y: 0, vx: 0, vy: 0 });
        }
        el.style.willChange = 'transform';
        el.style.transition = 'none';
      }
    };

    const ensureLoop = () => {
      if (!running) {
        running = true;
        lastFrame = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    const frame = (now: number) => {
      const dt = lastFrame ? Math.min(Math.max((now - lastFrame) / 1000, 0), 0.05) : 0.016;
      lastFrame = now;
      let moving = false;
      for (const c of chunks.values()) {
        let tx = 0;
        let ty = 0;
        if (active) {
          const dx = c.cx - px;
          const dy = c.cy - py;
          const d = Math.max(Math.hypot(dx, dy), 8);
          if (d < RADIUS) {
            const push = 1 - d / RADIUS;
            const mag = push * push * MAX_PUSH;
            tx = (dx / d) * mag;
            ty = (dy / d) * mag;
          }
        }
        c.vx += (STIFFNESS * (tx - c.x) - DAMPING * c.vx) * dt;
        c.vy += (STIFFNESS * (ty - c.y) - DAMPING * c.vy) * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        const settled = Math.abs(c.x) < EPS && Math.abs(c.y) < EPS && Math.abs(c.vx) < 2 && Math.abs(c.vy) < 2;
        if (settled && !active) {
          c.x = c.y = c.vx = c.vy = 0;
          if (c.el.style.transform) release(c);
        } else {
          moving = true;
          c.el.style.transform = `translate3d(${c.x.toFixed(2)}px, ${c.y.toFixed(2)}px, 0) rotate(${(c.x * 0.05).toFixed(2)}deg)`;
        }
      }
      if (moving || active) raf = requestAnimationFrame(frame);
      else running = false;
    };

    const detach = attachDragBrush(hostEl, {
      onStart: (x, y) => {
        measure();
        px = x;
        py = y;
        active = true;
        ensureLoop();
      },
      onMove: (x, y) => {
        px = x;
        py = y;
      },
      onEnd: () => {
        active = false;
        ensureLoop();
      },
    });

    return () => {
      detach();
      cancelAnimationFrame(raf);
      for (const c of chunks.values()) release(c);
    };
  }, [host]);

  return (
    <FxHint
      storageKey="helix-fx-repel-hint"
      text="Click & drag near anything"
      touchText="Press & hold, then drag near anything"
    />
  );
};

export default RepelEffect;
