'use client';

import React, { useEffect, useRef } from 'react';
import {
  clamp,
  fitCanvasToViewport,
  isInteractiveTarget,
  mix,
  prefersReducedMotion,
  readThemeColors,
  rgba,
  RGB,
} from './effectUtils';

interface StardustEffectProps {
  host: React.RefObject<HTMLDivElement | null>;
}

const MAX_PARTICLES = 700;
const SPRITE_SIZE = 48;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  sprite: HTMLCanvasElement;
}

/** Pre-renders a soft glowing dot so each particle is a single drawImage. */
const makeSprite = (color: RGB, coreWhite: boolean) => {
  const c = document.createElement('canvas');
  c.width = c.height = SPRITE_SIZE;
  const g = c.getContext('2d');
  if (!g) return c;
  const half = SPRITE_SIZE / 2;
  const grad = g.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, coreWhite ? 'rgba(255,255,255,1)' : rgba(color, 1));
  grad.addColorStop(0.25, rgba(color, 0.95));
  grad.addColorStop(0.6, rgba(color, 0.35));
  grad.addColorStop(1, rgba(color, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  return c;
};

const StardustEffect: React.FC<StardustEffectProps> = ({ host }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const hostEl = host.current;
    const canvas = canvasRef.current;
    if (!hostEl || !canvas || prefersReducedMotion()) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = readThemeColors(hostEl);
    // On dark designs sparks add light; on light designs they need ink.
    const palette: RGB[] = colors.isDark
      ? [colors.accent, colors.accent2, [255, 255, 255]]
      : [colors.accent, colors.accent2, mix(colors.accent, [0, 0, 0], 0.35)];
    const sprites = palette.map((c, i) => makeSprite(c, colors.isDark && i === 2));

    let W = 0;
    let H = 0;
    let particles: Particle[] = [];
    let raf = 0;
    let running = false;
    let lastFrame = 0;
    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastT = 0;

    const resize = () => {
      ({ w: W, h: H } = fitCanvasToViewport(canvas, ctx));
    };

    const ensureLoop = () => {
      if (!running) {
        running = true;
        lastFrame = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    const spawn = (x: number, y: number, vx: number, vy: number, size: number, life: number) => {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      particles.push({
        x,
        y,
        vx,
        vy,
        life,
        maxLife: life,
        size,
        sprite: sprites[Math.floor(Math.random() * sprites.length)],
      });
    };

    const trail = (x: number, y: number) => {
      const now = performance.now();
      if (lastX === null || lastY === null) {
        lastX = x;
        lastY = y;
        lastT = now;
        return;
      }
      const dx = x - lastX;
      const dy = y - lastY;
      const dist = Math.hypot(dx, dy);
      const dt = Math.max((now - lastT) / 1000, 0.008);
      const count = clamp(Math.round(dist / 5), 1, 8);
      for (let i = 0; i < count; i++) {
        const t = i / count;
        const spread = 70;
        spawn(
          lastX + dx * t,
          lastY + dy * t,
          (-dx / dt) * 0.12 + (Math.random() - 0.5) * spread,
          (-dy / dt) * 0.12 + (Math.random() - 0.5) * spread,
          6 + Math.random() * 10,
          0.55 + Math.random() * 0.55,
        );
      }
      lastX = x;
      lastY = y;
      lastT = now;
      ensureLoop();
    };

    const burst = (x: number, y: number) => {
      for (let i = 0; i < 28; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 120 + Math.random() * 220;
        spawn(x, y, Math.cos(a) * sp, Math.sin(a) * sp, 8 + Math.random() * 10, 0.7 + Math.random() * 0.5);
      }
      ensureLoop();
    };

    const resetTrail = () => {
      lastX = null;
      lastY = null;
    };

    // A burst needs a real tap: pressed and released in place, quickly. A press
    // that moves is a scroll (or a drag trail) and a lingering press is a
    // long-press, so neither should burst.
    const TAP_TOLERANCE = 8;
    const TAP_MAX_MS = 500;
    let tapId: number | null = null;
    let tapX = 0;
    let tapY = 0;
    let tapT = 0;

    const onPointerDown = (e: PointerEvent) => {
      resetTrail();
      if (!e.isPrimary || isInteractiveTarget(e.target)) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      tapId = e.pointerId;
      tapX = e.clientX;
      tapY = e.clientY;
      tapT = performance.now();
    };
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== tapId) return;
      tapId = null;
      const moved = Math.hypot(e.clientX - tapX, e.clientY - tapY) > TAP_TOLERANCE;
      const lingered = performance.now() - tapT > TAP_MAX_MS;
      if (!moved && !lingered) burst(e.clientX, e.clientY);
    };
    // The browser cancels the pointer when it takes over for a scroll.
    const onPointerCancel = (e: PointerEvent) => {
      if (e.pointerId === tapId) tapId = null;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') trail(e.clientX, e.clientY);
    };
    // touchmove keeps firing while the page scrolls, so the trail follows a scroll too
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) trail(e.touches[0].clientX, e.touches[0].clientY);
    };

    const frame = (now: number) => {
      const dt = lastFrame ? clamp((now - lastFrame) / 1000, 0, 0.05) : 0.016;
      lastFrame = now;
      const drag = Math.exp(-dt * 2.2);
      particles = particles.filter((p) => {
        p.life -= dt;
        if (p.life <= 0) return false;
        p.vy += 140 * dt;
        p.vx *= drag;
        p.vy *= drag;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        return true;
      });

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = colors.isDark ? 'lighter' : 'source-over';
      for (const p of particles) {
        const t = p.life / p.maxLife;
        const s = p.size * (0.4 + 0.6 * t);
        ctx.globalAlpha = colors.isDark ? t : t * 0.85;
        ctx.drawImage(p.sprite, p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      if (particles.length > 0) {
        raf = requestAnimationFrame(frame);
      } else {
        running = false;
        ctx.clearRect(0, 0, W, H);
      }
    };

    resize();
    hostEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    hostEl.addEventListener('pointermove', onPointerMove, { passive: true });
    hostEl.addEventListener('touchmove', onTouchMove, { passive: true });
    hostEl.addEventListener('touchend', resetTrail, { passive: true });
    hostEl.addEventListener('pointerleave', resetTrail);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(raf);
      hostEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      hostEl.removeEventListener('pointermove', onPointerMove);
      hostEl.removeEventListener('touchmove', onTouchMove);
      hostEl.removeEventListener('touchend', resetTrail);
      hostEl.removeEventListener('pointerleave', resetTrail);
      window.removeEventListener('resize', resize);
    };
  }, [host]);

  return <canvas ref={canvasRef} aria-hidden="true" className="fixed inset-0 z-30 pointer-events-none" />;
};

export default StardustEffect;
