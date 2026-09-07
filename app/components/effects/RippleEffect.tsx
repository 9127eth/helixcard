'use client';

import React, { useEffect, useRef } from 'react';
import { fitCanvasToViewport, readThemeColors, rgba } from './effectUtils';
import { EffectHost, movingPieces, observeSurface, useReducedMotion } from './surfaceUtils';

type Ring = { x: number; y: number; born: number; strength: number };

export default function RippleEffect({ host }: { host: EffectHost }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = host.current, canvas = canvasRef.current;
    if (!el || !canvas || reduced) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let rings: Ring[] = [];
    let pieces: ReturnType<typeof movingPieces> = [];
    let raf = 0, lastDrop = 0;
    let lastX = 0, lastY = 0;
    let { w, h } = fitCanvasToViewport(canvas, ctx);
    const colors = readThemeColors(el);
    const resetPieces = () => { pieces.forEach(p => p.restore()); pieces = []; };
    const frame = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      rings = rings.filter(r => now - r.born < 1700);
      for (const r of rings) {
        const age = (now - r.born) / 1000;
        const radius = age * 220;
        const alpha = Math.pow(1 - age / 1.7, 2) * r.strength;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(r.x - window.scrollX, r.y - window.scrollY, Math.max(0, radius - i * 8), 0, Math.PI * 2);
          ctx.strokeStyle = i === 1 ? `rgba(255,255,255,${alpha * 0.6})` : rgba(colors.accent, alpha * 0.5);
          ctx.lineWidth = i === 1 ? 1.2 : 2;
          ctx.stroke();
        }
      }
      for (const p of pieces) {
        let dx = 0, dy = 0, bend = 0;
        for (const r of rings) {
          const age = (now - r.born) / 1000;
          const d = Math.max(1, Math.hypot(p.x - r.x, p.y - r.y));
          const delta = d - age * 220;
          const amplitude = Math.sin(delta / 15) * Math.exp(-Math.pow(delta / 55, 2)) * (1 - age / 1.7) * r.strength;
          dx += (p.x - r.x) / d * amplitude * 6;
          dy += (p.y - r.y) / d * amplitude * 6;
          bend += amplitude * 0.012;
        }
        p.el.style.transform = `translate(${Math.max(-9, Math.min(9, dx))}px,${Math.max(-9, Math.min(9, dy))}px) scale(${1 + Math.max(-0.025, Math.min(0.025, bend))},${1 - Math.max(-0.025, Math.min(0.025, bend))})`;
      }
      if (rings.length) raf = requestAnimationFrame(frame);
      else { raf = 0; resetPieces(); }
    };
    const drop = (x: number, y: number, strength: number) => {
      const now = performance.now();
      if (strength < 1 && (now - lastDrop < 65 || Math.hypot(x - lastX, y - lastY) < 12)) return;
      lastDrop = now; lastX = x; lastY = y;
      if (!pieces.length) pieces = movingPieces(el);
      rings.push({ x: x + window.scrollX, y: y + window.scrollY, born: now, strength });
      if (rings.length > 24) rings.shift();
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const detach = observeSurface(el, { start: (x, y) => drop(x, y, 1), move: (x, y) => drop(x, y, 0.5) });
    const resize = () => { ({ w, h } = fitCanvasToViewport(canvas, ctx)); resetPieces(); rings = []; };
    window.addEventListener('resize', resize);
    return () => { detach(); cancelAnimationFrame(raf); resetPieces(); window.removeEventListener('resize', resize); };
  }, [host, reduced]);
  return <canvas ref={canvasRef} className="fx-surface-canvas" data-fx-ignore aria-hidden="true" />;
}
