'use client';

import React, { useEffect, useRef, useState } from 'react';
import { clamp } from './effectUtils';
import { concealContent, EffectHost, useReducedMotion } from './surfaceUtils';

/** The flame's light reaches this far into the dark, clearing it fully near the centre. */
const reachFor = () => clamp(Math.min(window.innerWidth, window.innerHeight) * 0.4, 130, 220);
/** Lit-coverage bookkeeping, in cells of this many pixels. */
const CELL = 40;
/** Once this much of the card has been lit, first light finishes the rest. */
const DAWN_AT = 0.7;
/** The lantern never leaves the screen: it stops this far from the edges. */
const MARGIN = 8;

/**
 * A hurricane lantern resting on the ground in the dark: bail, hood, twin air
 * tubes, a glass globe around a live flame, and a font with a filler cap. The
 * flame flickers in CSS; everything is lit from the flame, so the metal carries
 * warm inner edges and cold outer ones.
 */
function Lantern() {
  return (
    <svg className="fx-lantern-art" viewBox="0 0 120 200" width="120" height="200" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="fxlHalo" cx="60" cy="110" r="150" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffb457" stopOpacity=".34" />
          <stop offset=".3" stopColor="#f29a3c" stopOpacity=".14" />
          <stop offset=".65" stopColor="#c76b1e" stopOpacity=".035" />
          <stop offset="1" stopColor="#c76b1e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="fxlFloor" cx="60" cy="186" r="70" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffb457" stopOpacity=".26" />
          <stop offset=".5" stopColor="#e2882c" stopOpacity=".08" />
          <stop offset="1" stopColor="#e2882c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="fxlGlass" cx="60" cy="112" r="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff1c4" stopOpacity=".95" />
          <stop offset=".35" stopColor="#ffbe62" stopOpacity=".62" />
          <stop offset=".75" stopColor="#b8621c" stopOpacity=".3" />
          <stop offset="1" stopColor="#5a2c0c" stopOpacity=".3" />
        </radialGradient>
        <radialGradient id="fxlGlow" cx="60" cy="112" r="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff4d0" stopOpacity=".9" />
          <stop offset=".4" stopColor="#ffb64d" stopOpacity=".45" />
          <stop offset="1" stopColor="#ff9a2e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fxlFlame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd25a" />
          <stop offset=".55" stopColor="#ff9b1f" />
          <stop offset="1" stopColor="#ff6a00" />
        </linearGradient>
        <linearGradient id="fxlCore" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff9df" />
          <stop offset="1" stopColor="#ffe08a" />
        </linearGradient>
        {/* Tubes: cold outer edge, warm flame-facing edge. */}
        <linearGradient id="fxlTubeL" x1="23" y1="0" x2="33" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#14100d" />
          <stop offset=".45" stopColor="#4a3a2d" />
          <stop offset=".8" stopColor="#8d6a45" />
          <stop offset="1" stopColor="#c48a4e" />
        </linearGradient>
        <linearGradient id="fxlTubeR" x1="87" y1="0" x2="97" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#c48a4e" />
          <stop offset=".2" stopColor="#8d6a45" />
          <stop offset=".55" stopColor="#4a3a2d" />
          <stop offset="1" stopColor="#14100d" />
        </linearGradient>
        <linearGradient id="fxlMetal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1a1410" />
          <stop offset=".22" stopColor="#5a4634" />
          <stop offset=".5" stopColor="#a67c50" />
          <stop offset=".78" stopColor="#5a4634" />
          <stop offset="1" stopColor="#1a1410" />
        </linearGradient>
        <linearGradient id="fxlTank" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7d5c3c" />
          <stop offset=".18" stopColor="#4d3a2a" />
          <stop offset=".7" stopColor="#241b15" />
          <stop offset="1" stopColor="#0f0b09" />
        </linearGradient>
        <linearGradient id="fxlHood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b5139" />
          <stop offset=".5" stopColor="#3b2d22" />
          <stop offset="1" stopColor="#1a1410" />
        </linearGradient>
        <linearGradient id="fxlWire" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3b2d22" />
          <stop offset=".5" stopColor="#b08658" />
          <stop offset="1" stopColor="#3b2d22" />
        </linearGradient>
        <linearGradient id="fxlTankSheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".4" />
          <stop offset=".2" stopColor="#000" stopOpacity="0" />
          <stop offset=".46" stopColor="#ffd9a8" stopOpacity=".12" />
          <stop offset=".62" stopColor="#ffd9a8" stopOpacity=".05" />
          <stop offset=".84" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".4" />
        </linearGradient>
        <filter id="fxlBloom" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <clipPath id="fxlGlobeClip">
          <path d="M42 78 C31 92 31 120 42 134 H78 C89 120 89 92 78 78 Z" />
        </clipPath>
      </defs>

      {/* Ambient light thrown by the flame, the pool on the ground, and the bloom through the glass. */}
      <circle className="fx-lantern-halo" cx="60" cy="110" r="150" fill="url(#fxlHalo)" />
      <ellipse className="fx-lantern-halo" cx="60" cy="186" rx="70" ry="11" fill="url(#fxlFloor)" />
      <ellipse className="fx-lantern-halo" cx="60" cy="108" rx="30" ry="36" fill="#ffb64d" opacity=".28" filter="url(#fxlBloom)" />

      {/* Bail: a wire arch with a rounded grip at its apex. */}
      <path d="M31 58 C31 14 89 14 89 58" fill="none" stroke="#120e0b" strokeWidth="5" strokeLinecap="round" />
      <path d="M31 58 C31 14 89 14 89 58" fill="none" stroke="url(#fxlWire)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M31 58 C31 14 89 14 89 58" fill="none" stroke="#e9b878" strokeWidth=".7" strokeLinecap="round" opacity=".55" transform="translate(-.6 -.6)" />
      <rect x="49" y="19.2" width="22" height="5.6" rx="2.8" fill="#1a1410" stroke="#7a5c3d" strokeWidth=".8" />
      <path d="M52 21.5 H68" stroke="#b08658" strokeWidth=".8" strokeLinecap="round" opacity=".8" />
      <circle cx="31" cy="58" r="3" fill="#2e241c" stroke="#a67c50" strokeWidth=".8" />
      <circle cx="89" cy="58" r="3" fill="#2e241c" stroke="#a67c50" strokeWidth=".8" />

      {/* Air tubes running from the hood down into the font. */}
      <path d="M44 66 C31 66 28 78 28 92 V150" fill="none" stroke="#0e0a08" strokeWidth="11.5" strokeLinecap="round" />
      <path d="M44 66 C31 66 28 78 28 92 V150" fill="none" stroke="url(#fxlTubeL)" strokeWidth="9" strokeLinecap="round" />
      <path d="M76 66 C89 66 92 78 92 92 V150" fill="none" stroke="#0e0a08" strokeWidth="11.5" strokeLinecap="round" />
      <path d="M76 66 C89 66 92 78 92 92 V150" fill="none" stroke="url(#fxlTubeR)" strokeWidth="9" strokeLinecap="round" />
      {/* Warm rim light on the inner edge of each tube, seams where they meet the font. */}
      <path d="M31.5 96 V148" stroke="#ffb964" strokeWidth="1.1" strokeLinecap="round" opacity=".55" />
      <path d="M88.5 96 V148" stroke="#ffb964" strokeWidth="1.1" strokeLinecap="round" opacity=".55" />
      <path d="M22.5 145 H33.5 M86.5 145 H97.5" stroke="#0e0a08" strokeWidth="1.4" />

      {/* Glass globe with the flame inside. */}
      <g clipPath="url(#fxlGlobeClip)">
        <path d="M42 78 C31 92 31 120 42 134 H78 C89 120 89 92 78 78 Z" fill="url(#fxlGlass)" />
        <circle className="fx-lantern-glow" cx="60" cy="112" r="30" fill="url(#fxlGlow)" />
        <g className="fx-lantern-flame">
          <path d="M60 128 C48 116 47 103 60 86 C73 103 72 116 60 128 Z" fill="url(#fxlFlame)" opacity=".92" />
          <path d="M60 126 C53.5 117 53 107 60 96 C67 107 66.5 117 60 126 Z" fill="url(#fxlCore)" />
          <ellipse cx="60" cy="125.5" rx="4.2" ry="2.2" fill="#6fb3ff" opacity=".55" />
        </g>
        {/* Burner and wick tube at the base of the globe. */}
        <path d="M52 134 V128 Q52 125 56 125 H64 Q68 125 68 128 V134 Z" fill="#171310" stroke="#5a4634" strokeWidth=".8" />
        <rect x="57" y="121" width="6" height="4.5" rx="1" fill="#1e1712" stroke="#8d6a45" strokeWidth=".7" />
        {/* Sheen and reflections on the glass. */}
        <path d="M46 84 C39 94 39 118 46 130" fill="none" stroke="#fff5e0" strokeWidth="3.2" strokeLinecap="round" opacity=".16" />
        <path d="M45 88 C41 96 41 114 45 124" fill="none" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" opacity=".3" />
        <path d="M75 86 C79 96 79 116 75 126" fill="none" stroke="#ffffff" strokeWidth=".9" strokeLinecap="round" opacity=".14" />
      </g>
      <path d="M42 78 C31 92 31 120 42 134 H78 C89 120 89 92 78 78 Z" fill="none" stroke="#ffe3b3" strokeWidth=".9" opacity=".55" />

      {/* Globe collars: plate above, burner cup below, wick knob at the side. */}
      <rect x="38" y="72" width="44" height="7" rx="2.2" fill="url(#fxlMetal)" stroke="#0e0a08" strokeWidth=".9" />
      <rect x="38" y="133" width="44" height="7" rx="2.2" fill="url(#fxlMetal)" stroke="#0e0a08" strokeWidth=".9" />
      <path d="M40 136.5 H80" stroke="#ffb964" strokeWidth=".8" opacity=".35" />
      <path d="M82 137 H90" stroke="#3b2d22" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="93.5" cy="137" r="3.6" fill="#2e241c" stroke="#a67c50" strokeWidth=".9" />
      <path d="M93.5 134.2 V139.8 M90.7 137 H96.3" stroke="#a67c50" strokeWidth=".6" opacity=".7" />

      {/* Hood: a vented dome under a small crown. */}
      <path d="M40 72 C40 60 48 52 60 51 C72 52 80 60 80 72 Z" fill="url(#fxlHood)" stroke="#0e0a08" strokeWidth=".9" />
      <path d="M44 70 C45 62 51 56 60 55 C69 56 75 62 76 70" fill="none" stroke="#a67c50" strokeWidth=".8" opacity=".5" />
      <path d="M48 70 V64 M54 70 V60.5 M60 70 V59 M66 70 V60.5 M72 70 V64" stroke="#0e0a08" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M48 70 V64 M54 70 V60.5 M60 70 V59 M66 70 V60.5 M72 70 V64" stroke="#ffb964" strokeWidth=".5" strokeLinecap="round" opacity=".5" transform="translate(.9 0)" />
      <rect x="36" y="69" width="48" height="5" rx="2" fill="url(#fxlMetal)" stroke="#0e0a08" strokeWidth=".9" />
      <ellipse cx="60" cy="51.5" rx="9" ry="3" fill="#3b2d22" stroke="#8d6a45" strokeWidth=".8" />
      <path d="M56 49 C56 44 64 44 64 49 Z" fill="#4d3a2a" stroke="#a67c50" strokeWidth=".8" />
      <circle cx="60" cy="43.5" r="2.4" fill="#5a4634" stroke="#b08658" strokeWidth=".8" />

      {/* Font: the fuel tank, with a filler cap. */}
      <path d="M22 152 Q22 146 30 146 H90 Q98 146 98 152 V168 Q98 180 60 180 Q22 180 22 168 Z" fill="url(#fxlTank)" stroke="#0e0a08" strokeWidth="1" />
      <path d="M22 152 Q22 146 30 146 H90 Q98 146 98 152 V168 Q98 180 60 180 Q22 180 22 168 Z" fill="url(#fxlTankSheen)" />
      <path d="M27 148.5 H93" stroke="#c48a4e" strokeWidth="1" strokeLinecap="round" opacity=".55" />
      <path d="M26 165 Q28 176 60 177 Q92 176 94 165" fill="none" stroke="#ffb964" strokeWidth=".9" strokeLinecap="round" opacity=".18" />
      <ellipse cx="60" cy="151" rx="33" ry="2.6" fill="#ffb964" opacity=".08" />
      <ellipse cx="80" cy="146" rx="5" ry="1.8" fill="#4d3a2a" stroke="#a67c50" strokeWidth=".8" />
      <path d="M75 146 V143.5 Q75 141.8 77 141.8 H83 Q85 141.8 85 143.5 V146" fill="#3b2d22" stroke="#a67c50" strokeWidth=".8" />
      <path d="M77.5 142.6 H82.5" stroke="#1a1410" strokeWidth=".9" strokeLinecap="round" />
    </svg>
  );
}


/**
 * First Light: only a lantern is visible. Pick it up and carry it: everywhere
 * its light falls stays lit, including the card scrolling past beneath it,
 * and once most of the card has been lit the last of the dark lifts. The
 * lantern stays on screen wherever it is set down and can be carried again.
 */
function FirstLight({ host }: { host: EffectHost }) {
  const sheet = useRef<HTMLCanvasElement>(null);
  const lamp = useRef<HTMLButtonElement>(null);
  /** Where the lantern rests: the button's top-left corner in viewport pixels. */
  const rest = useRef<{ x: number; y: number } | null>(null);
  const dock = useRef<() => void>(() => {});
  const [lit, setLit] = useState(false);
  const [dawn, setDawn] = useState(false);
  const reduced = useReducedMotion();

  // The card stays concealed until first light.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const visible = lit || reduced;
    el.dataset.fxRevealed = String(visible);
    const restore = visible ? () => {} : concealContent(el);
    return () => { restore(); delete el.dataset.fxRevealed; };
  }, [host, lit, reduced]);

  // The sheet of dark, the lantern, and the carry gesture live in one effect
  // that never re-runs, so the pointer stream that picked the lantern up keeps
  // carrying it and nothing already lit is ever repainted dark.
  useEffect(() => {
    const el = host.current;
    const canvas = sheet.current;
    const button = lamp.current;
    if (!el || !canvas || !button || reduced) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setLit(true); setDawn(true); return; }
    const art = button.querySelector('svg');

    // --- the sheet: solid dark that the flame burns through, in card coordinates.
    let w = 0, h = 0, cols = 0, rows = 0, litCells = 0;
    let cells = new Uint8Array(0);
    let awake = false, dawned = false;
    let last: { x: number; y: number } | null = null;
    const fit = () => {
      const keep = w && h ? document.createElement('canvas') : null;
      if (keep) {
        keep.width = canvas.width; keep.height = canvas.height;
        keep.getContext('2d')?.drawImage(canvas, 0, 0);
      }
      const prevW = w, prevH = h, prevCols = cols, prevCells = cells;
      w = el.offsetWidth; h = el.offsetHeight;
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(8e6 / Math.max(1, w * h))));
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#0a0908';
      ctx.fillRect(0, 0, w, h);
      // Everything already lit stays lit through a resize; new ground starts dark.
      if (keep) { ctx.clearRect(0, 0, prevW, prevH); ctx.drawImage(keep, 0, 0, prevW, prevH); }
      cols = Math.ceil(w / CELL); rows = Math.ceil(h / CELL);
      cells = new Uint8Array(cols * rows); litCells = 0;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (c < prevCols && r * prevCols + c < prevCells.length && prevCells[r * prevCols + c]) { cells[r * cols + c] = 1; litCells++; }
      }
    };
    const stamp = (x: number, y: number) => {
      const reach = reachFor();
      const glow = ctx.createRadialGradient(x, y, 0, x, y, reach);
      glow.addColorStop(0, 'rgba(0, 0, 0, 1)');
      glow.addColorStop(0.38, 'rgba(0, 0, 0, .9)');
      glow.addColorStop(0.7, 'rgba(0, 0, 0, .35)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x, y, reach, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      const r = reach * 0.7;
      for (let row = Math.max(0, Math.floor((y - r) / CELL)); row <= Math.min(rows - 1, Math.floor((y + r) / CELL)); row++) {
        for (let col = Math.max(0, Math.floor((x - r) / CELL)); col <= Math.min(cols - 1, Math.floor((x + r) / CELL)); col++) {
          const i = row * cols + col;
          if (!cells[i] && Math.hypot((col + 0.5) * CELL - x, (row + 0.5) * CELL - y) <= r) { cells[i] = 1; litCells++; }
        }
      }
      if (!dawned && cells.length && litCells / cells.length >= DAWN_AT) { dawned = true; setDawn(true); }
    };
    /** Light the card under a point on screen, and the ground crossed since the last one. */
    const light = (vx: number, vy: number) => {
      if (!awake || dawned) return;
      const bounds = el.getBoundingClientRect();
      const x = vx - bounds.left, y = vy - bounds.top;
      if (last) {
        const step = reachFor() * 0.2;
        const n = Math.min(40, Math.floor(Math.hypot(x - last.x, y - last.y) / step));
        for (let i = 1; i <= n; i++) stamp(last.x + (x - last.x) * i / (n + 1), last.y + (y - last.y) * i / (n + 1));
      }
      stamp(x, y);
      last = { x, y };
    };
    fit();

    // --- the lantern: fixed to the screen, hanging from the hand when carried.
    let width = 0, height = 0, flameY = 0;
    const measure = () => {
      const r = button.getBoundingClientRect();
      width = r.width; height = r.height;
      const a = art?.getBoundingClientRect();
      flameY = a ? a.top - r.top + a.height * 0.56 : height * 0.56;
    };
    const place = (x: number, y: number) => {
      x = clamp(x, MARGIN, window.innerWidth - width - MARGIN);
      y = clamp(y, MARGIN, window.innerHeight - height - MARGIN);
      rest.current = { x, y };
      button.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      light(x + width / 2, y + flameY);
    };
    measure();
    const initial = rest.current ?? { x: (window.innerWidth - width) / 2, y: (window.innerHeight - height) / 2 };
    place(initial.x, initial.y);
    button.classList.add('fx-lantern-placed');
    const wake = () => {
      if (awake) return;
      awake = true;
      setLit(true);
      if (rest.current) light(rest.current.x + width / 2, rest.current.y + flameY);
    };
    // Keyboard users cannot carry it: it settles out of the way and the whole card lights.
    dock.current = () => {
      place(window.innerWidth - width - 2 * MARGIN, window.innerHeight - height - 3 * MARGIN);
      wake();
      dawned = true;
      setDawn(true);
    };

    // --- carrying: it lifts the moment it is pressed and follows the hand.
    let pressed: { id: number; x: number; y: number; ox: number; oy: number; lastX: number } | null = null;
    let settle: number | null = null;
    const sway = (deg: number) => { if (art) art.style.transform = deg ? `rotate(${deg}deg)` : ''; };
    const down = (e: PointerEvent) => {
      if (!e.isPrimary || e.button !== 0 || pressed || !rest.current) return;
      pressed = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: rest.current.x, oy: rest.current.y, lastX: e.clientX };
      try { button.setPointerCapture(e.pointerId); } catch { /* already released; the press still counts */ }
      button.classList.add('fx-lantern-carried');
      wake();
    };
    const move = (e: PointerEvent) => {
      if (!pressed || e.pointerId !== pressed.id) return;
      place(pressed.ox + e.clientX - pressed.x, pressed.oy + e.clientY - pressed.y);
      // It hangs from the hand, so it swings against the direction of travel.
      sway(clamp((e.clientX - pressed.lastX) * 1.2, -16, 16));
      pressed.lastX = e.clientX;
      if (settle !== null) window.clearTimeout(settle);
      settle = window.setTimeout(() => sway(0), 90);
    };
    const end = (e: PointerEvent) => {
      if (!pressed || e.pointerId !== pressed.id) return;
      pressed = null;
      button.classList.remove('fx-lantern-carried');
      sway(0);
    };
    // The card scrolling past beneath a lantern is lit too.
    const scrolled = () => { if (rest.current) light(rest.current.x + width / 2, rest.current.y + flameY); };
    const resized = () => { measure(); if (rest.current) place(rest.current.x, rest.current.y); };
    const grown = new ResizeObserver(() => { fit(); resized(); });
    grown.observe(el);
    const contextMenu = (e: Event) => e.preventDefault();
    button.addEventListener('pointerdown', down);
    button.addEventListener('pointermove', move);
    button.addEventListener('pointerup', end);
    button.addEventListener('pointercancel', end);
    button.addEventListener('contextmenu', contextMenu);
    window.addEventListener('scroll', scrolled, { passive: true });
    window.addEventListener('resize', resized);
    return () => {
      if (settle !== null) window.clearTimeout(settle);
      grown.disconnect();
      button.removeEventListener('pointerdown', down);
      button.removeEventListener('pointermove', move);
      button.removeEventListener('pointerup', end);
      button.removeEventListener('pointercancel', end);
      button.removeEventListener('contextmenu', contextMenu);
      window.removeEventListener('scroll', scrolled);
      window.removeEventListener('resize', resized);
    };
  }, [host, reduced]);

  return <>
    <canvas ref={sheet} data-fx-ignore aria-hidden="true" className={`fx-lantern-sheet ${dawn ? 'fx-lantern-dawn' : ''} ${reduced ? 'fx-motion-off' : ''}`} />
    {!reduced && <button ref={lamp} type="button" className="fx-lantern-handle" data-fx-ignore data-fx-control
      tabIndex={lit ? -1 : 0} aria-hidden={lit || undefined}
      aria-label="Carry the lantern to light the card, or press Enter"
      onClick={e => { if (e.detail === 0 && !lit) dock.current(); }}>
      <span className="fx-lantern-body"><Lantern /></span>
    </button>}
  </>;
}

/** Lantern · First Light. (The plain Lantern pool was replaced by Glitch.) */
export default function LanternEffect({ host }: { host: EffectHost }) {
  return <FirstLight host={host} />;
}
