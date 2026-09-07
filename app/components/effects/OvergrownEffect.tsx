'use client';

import React, { useEffect, useRef, useState } from 'react';
import { fitCanvasToViewport, mix, rgba } from './effectUtils';
import { concealContent, EffectHost, observeSurface, useReducedMotion } from './surfaceUtils';

type Leaf = {
  x: number; y: number; length: number; width: number; angle: number; phase: number; tone: number;
  swept: boolean; gone: boolean; px: number; py: number; vx: number; vy: number; spin: number; spinVel: number;
};

const FALL = [
  [186, 78, 22],
  [201, 140, 32],
  [148, 46, 28],
  [168, 96, 28],
  [214, 168, 52],
] as const;
const STEM = [72, 42, 24] as const;
const REACH = 120;

export default function OvergrownEffect({ host }: { host: EffectHost }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cleared, setCleared] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = host.current, canvas = canvasRef.current;
    if (!el) return;
    if (cleared || reduced) { el.dataset.fxRevealed = 'true'; return () => { delete el.dataset.fxRevealed; }; }
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) { el.dataset.fxRevealed = 'true'; return () => { delete el.dataset.fxRevealed; }; }
    let { w, h } = fitCanvasToViewport(canvas, ctx);
    let leaves: Leaf[] = [], raf = 0, lastFrame = 0;
    let revealed = false, prevX = 0, prevY = 0, hasPrev = false;
    let restore = concealContent(el);
    el.dataset.fxRevealed = 'false';
    const populate = () => {
      leaves = [];
      for (let row = -1; row < Math.ceil(h / 80) + 1; row++) {
        for (let col = -1; col < Math.ceil(w / 90) + 1; col++) {
          const seed = Math.abs(Math.sin(row * 71.3 + col * 37.9));
          const x = col * 90 + (row % 2) * 42, y = row * 80;
          leaves.push({
            x, y, px: x, py: y, vx: 0, vy: 0, spin: 0, spinVel: 0, swept: false, gone: false,
            length: 100 + seed * 75, width: 35 + seed * 23, angle: (col % 2 ? -0.85 : 0.85) + seed * 0.6,
            phase: seed * 7, tone: Math.abs(row * 3 + col * 7) % FALL.length,
          });
        }
      }
    };
    const hole = (leaf: Leaf) => Math.max(leaf.length, leaf.width) * 0.7;
    const exposed = (x: number, y: number) => leaves.some(leaf => leaf.swept && Math.hypot(leaf.x - x, leaf.y - y) < hole(leaf));
    const sweep = (x: number, y: number, dirX: number, dirY: number) => {
      if (!revealed) { revealed = true; restore(); restore = () => {}; el.dataset.fxRevealed = 'true'; }
      const stroke = Math.hypot(dirX, dirY);
      const nx = stroke > 0.5 ? dirX / stroke : 0;
      const ny = stroke > 0.5 ? dirY / stroke : 1;
      for (const leaf of leaves) {
        if (leaf.swept) continue;
        const dx = leaf.x - x, dy = leaf.y - y;
        const dist = Math.hypot(dx, dy);
        if (dist > REACH) continue;
        const awayX = dx / Math.max(dist, 1), awayY = dy / Math.max(dist, 1);
        const speed = 14 + (1 - dist / REACH) * 16 + Math.min(stroke * 0.35, 18);
        leaf.swept = true;
        leaf.vx = (nx * 0.85 + awayX * 0.5) * speed;
        leaf.vy = (ny * 0.85 + awayY * 0.5) * speed + 3;
        leaf.spinVel = (awayX || 1) * (0.12 + (1 - dist / REACH) * 0.1);
      }
    };
    const drawLeaf = (leaf: Leaf, now: number) => {
      const length = leaf.length, width = leaf.width, tone = FALL[leaf.tone];
      ctx.save();
      ctx.translate(leaf.px, leaf.py);
      ctx.rotate(leaf.swept ? leaf.angle + leaf.spin : leaf.angle + Math.sin(now / 2300 + leaf.phase) * 0.045);
      if (!leaf.swept) {
        ctx.beginPath(); ctx.moveTo(0, length * 0.8); ctx.quadraticCurveTo(-12, 10, 0, -length * 0.25);
        ctx.strokeStyle = rgba(STEM, 0.85); ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(0, length * 0.5);
      ctx.bezierCurveTo(-width * 1.3, length * 0.2, -width, -length * 0.3, 0, -length * 0.6);
      ctx.bezierCurveTo(width, -length * 0.3, width * 1.3, length * 0.2, 0, length * 0.5);
      const fill = ctx.createLinearGradient(-width, 0, width, 0);
      fill.addColorStop(0, rgba(mix(tone, [0, 0, 0], 0.2), 1));
      fill.addColorStop(0.5, rgba(tone, 1));
      fill.addColorStop(1, rgba(mix(tone, [255, 220, 140], 0.18), 1));
      ctx.fillStyle = fill; ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 7; ctx.shadowOffsetY = 4; ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.beginPath(); ctx.moveTo(0, length * 0.5); ctx.lineTo(0, -length * 0.52);
      for (let i = -2; i <= 2; i++) {
        const vein = i * length * 0.12;
        ctx.moveTo(0, vein + length * 0.12); ctx.lineTo(width * 0.65, vein - length * 0.08);
        ctx.moveTo(0, vein + length * 0.12); ctx.lineTo(-width * 0.65, vein - length * 0.08);
      }
      ctx.strokeStyle = rgba(mix(tone, [255, 220, 140], 0.4), 0.35); ctx.lineWidth = 0.8; ctx.stroke();
      ctx.restore();
    };
    const draw = (now: number) => {
      if (document.hidden) { raf = 0; return; }
      if (now - lastFrame > 32) {
        lastFrame = now;
        let remaining = false, flying = false;
        for (const leaf of leaves) {
          if (leaf.gone) continue;
          if (!leaf.swept) { remaining = true; continue; }
          leaf.vy += 0.65;
          leaf.px += leaf.vx;
          leaf.py += leaf.vy;
          leaf.spin += leaf.spinVel;
          if (leaf.px < -220 || leaf.px > w + 220 || leaf.py < -220 || leaf.py > h + 220) leaf.gone = true;
          else flying = true;
        }
        ctx.clearRect(0, 0, w, h);
        for (const leaf of leaves) if (!leaf.gone) drawLeaf(leaf, now);
        if (!remaining && !flying) { raf = 0; return; }
      }
      raf = requestAnimationFrame(draw);
    };
    const detach = observeSurface(el, {
      start: (x, y) => { sweep(x, y, 0, 1); prevX = x; prevY = y; hasPrev = true; },
      move: (x, y) => { sweep(x, y, hasPrev ? x - prevX : 0, hasPrev ? y - prevY : 1); prevX = x; prevY = y; hasPrev = true; },
      end: () => { hasPrev = false; },
    });
    const blockCoveredLink = (e: MouseEvent) => {
      if (e.detail === 0 || !(e.target instanceof Element) || !e.target.closest('a, button') || e.target.closest('[data-fx-control]')) return;
      if (!exposed(e.clientX, e.clientY)) { e.preventDefault(); e.stopPropagation(); }
    };
    const focus = (e: FocusEvent) => {
      if (!(e.target instanceof Element) || e.target.closest('[data-fx-control]')) return;
      setCleared(true);
    };
    const resize = () => {
      ({ w, h } = fitCanvasToViewport(canvas, ctx));
      if (!leaves.some(leaf => leaf.swept)) populate();
    };
    const visible = () => { if (!document.hidden && !raf) raf = requestAnimationFrame(draw); };
    populate(); raf = requestAnimationFrame(draw);
    el.addEventListener('click', blockCoveredLink, true); el.addEventListener('focusin', focus);
    window.addEventListener('resize', resize); document.addEventListener('visibilitychange', visible);
    return () => {
      restore(); detach(); cancelAnimationFrame(raf); delete el.dataset.fxRevealed;
      el.removeEventListener('click', blockCoveredLink, true); el.removeEventListener('focusin', focus);
      window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', visible);
    };
  }, [host, reduced, cleared]);

  if (cleared || reduced) return null;
  return <>
    <canvas ref={canvasRef} className="fx-surface-canvas fx-canopy" data-fx-ignore aria-hidden="true" />
    <button type="button" className="fx-accessible-reveal" data-fx-ignore data-fx-control onClick={() => setCleared(true)}>Reveal card</button>
  </>;
}
