'use client';

import React, { useEffect, useRef } from 'react';
import { attachDragBrush } from './dragBrush';
import { collectChunks, rectDistance } from './disruptUtils';
import FxHint from './FxHint';
import { clamp, fitCanvasToViewport, parseColor, prefersReducedMotion, readThemeColors, rgba, RGB } from './effectUtils';

interface ShatterEffectProps {
  host: React.RefObject<HTMLDivElement | null>;
}

const HIT_PX = 10;
const DUST_MS = 950;
const REFORM_MS = 520;
const MAX_PARTICLES = 900;

interface Chunk {
  el: HTMLElement;
  rect: DOMRect;
  state: 'idle' | 'dust' | 'reforming';
  /** ms of animation time since the chunk was shattered (accumulated from frame deltas) */
  age: number;
}

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: RGB;
}

const isTransparent = (css: string) => /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)/.test(css) || css === 'transparent';

/**
 * Shatter: pieces of the card under the drag crumble into dust that blows
 * away from the finger, then fade back into place a moment later.
 */
const ShatterEffect: React.FC<ShatterEffectProps> = ({ host }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const hostEl = host.current;
    const canvas = canvasRef.current;
    if (!hostEl || !canvas || prefersReducedMotion()) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = readThemeColors(hostEl);
    const chunks = new Map<HTMLElement, Chunk>();
    let motes: Mote[] = [];
    let W = 0;
    let H = 0;
    let raf = 0;
    let running = false;
    let lastFrame = 0;

    const resize = () => {
      ({ w: W, h: H } = fitCanvasToViewport(canvas, ctx));
    };

    const restore = (c: Chunk) => {
      c.el.style.transition = '';
      c.el.style.opacity = '';
      c.el.style.filter = '';
      c.el.style.pointerEvents = '';
      c.state = 'idle';
    };

    const measure = () => {
      for (const [el, c] of chunks) {
        if (!el.isConnected) {
          restore(c);
          chunks.delete(el);
        }
      }
      for (const el of collectChunks(hostEl)) {
        const rect = el.getBoundingClientRect();
        const existing = chunks.get(el);
        if (existing) existing.rect = rect;
        else chunks.set(el, { el, rect, state: 'idle', age: 0 });
      }
    };

    const ensureLoop = () => {
      if (!running) {
        running = true;
        lastFrame = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    const chunkColor = (el: HTMLElement): RGB => {
      if (el.matches('[data-fx="avatar"]')) return colors.accent;
      const cs = getComputedStyle(el);
      if (!isTransparent(cs.backgroundColor)) return parseColor(cs.backgroundColor, colors.accent);
      return parseColor(cs.color, colors.isDark ? [255, 255, 255] : [30, 30, 30]);
    };

    const shatter = (c: Chunk, x: number, y: number, dx: number, dy: number) => {
      const { rect, el } = c;
      const color = chunkColor(el);
      const count = clamp(Math.round((rect.width * rect.height) / 240), 36, 150);
      for (let i = 0; i < count; i++) {
        if (motes.length >= MAX_PARTICLES) motes.shift();
        const mx = rect.left + Math.random() * rect.width;
        const my = rect.top + Math.random() * rect.height;
        let ax = mx - x;
        let ay = my - y;
        const len = Math.max(Math.hypot(ax, ay), 1);
        ax /= len;
        ay /= len;
        const speed = 40 + Math.random() * 100;
        motes.push({
          x: mx,
          y: my,
          vx: ax * speed + dx * 4 + (Math.random() - 0.5) * 50,
          vy: ay * speed + dy * 4 + (Math.random() - 0.5) * 50 - 40,
          life: 0.7 + Math.random() * 0.6,
          maxLife: 1,
          size: 2.5 + Math.random() * 3,
          color,
        });
      }
      motes.forEach((m) => {
        if (m.maxLife === 1) m.maxLife = m.life;
      });

      c.state = 'dust';
      c.age = 0;
      el.style.transition = 'opacity .15s ease, filter .15s ease';
      el.style.opacity = '0';
      el.style.filter = 'blur(6px)';
      el.style.pointerEvents = 'none';
      ensureLoop();
    };

    /** Reform/restore are driven by the frame clock so they can't drift from the dust. */
    const stepChunks = (dtMs: number) => {
      let pending = false;
      for (const c of chunks.values()) {
        if (c.state === 'idle') continue;
        c.age += dtMs;
        const age = c.age;
        if (c.state === 'dust' && age >= DUST_MS) {
          c.state = 'reforming';
          c.el.style.transition = 'opacity .5s ease, filter .5s ease';
          c.el.style.opacity = '1';
          c.el.style.filter = 'blur(0px)';
        } else if (c.state === 'reforming' && age >= DUST_MS + REFORM_MS) {
          restore(c);
          continue;
        }
        pending = true;
      }
      return pending;
    };

    const frame = (now: number) => {
      const dt = lastFrame ? clamp((now - lastFrame) / 1000, 0, 0.05) : 0.016;
      lastFrame = now;
      const drag = Math.exp(-dt * 1.6);
      motes = motes.filter((m) => {
        m.life -= dt;
        if (m.life <= 0) return false;
        m.vy += 90 * dt;
        m.vx *= drag;
        m.vy *= drag;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        return true;
      });

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = colors.isDark ? 'lighter' : 'source-over';
      for (const m of motes) {
        const t = m.life / m.maxLife;
        const s = m.size * (0.5 + 0.5 * t);
        ctx.fillStyle = rgba(m.color, t * 0.95);
        ctx.fillRect(m.x - s / 2, m.y - s / 2, s, s);
      }
      ctx.globalCompositeOperation = 'source-over';

      const pending = stepChunks(dt * 1000);
      if (motes.length > 0 || pending) raf = requestAnimationFrame(frame);
      else {
        running = false;
        ctx.clearRect(0, 0, W, H);
      }
    };

    const brush = (x: number, y: number, dx: number, dy: number) => {
      for (const c of chunks.values()) {
        if (c.state !== 'idle') continue;
        if (rectDistance(c.rect, x, y) <= HIT_PX) shatter(c, x, y, dx, dy);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    const detach = attachDragBrush(hostEl, {
      onStart: (x, y) => {
        measure();
        brush(x, y, 0, 0);
      },
      onMove: brush,
    });

    return () => {
      detach();
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      for (const c of chunks.values()) restore(c);
    };
  }, [host]);

  return (
    <>
      <canvas ref={canvasRef} aria-hidden="true" data-fx-ignore="" className="fixed inset-0 z-30 pointer-events-none" />
      <FxHint
        storageKey="helix-fx-shatter-hint"
        text="Click & drag across anything"
        touchText="Press & hold, then drag across anything"
      />
    </>
  );
};

export default ShatterEffect;
