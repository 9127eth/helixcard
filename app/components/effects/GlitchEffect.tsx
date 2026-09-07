'use client';

import React, { useEffect, useRef } from 'react';
import { attachDragBrush } from './dragBrush';
import { collectTextNodes, measureTextRects, rectsDistance } from './disruptUtils';
import { parseColor, prefersReducedMotion, readThemeColors, RGB } from './effectUtils';

interface GlitchEffectProps {
  host: React.RefObject<HTMLDivElement | null>;
}

const BRUSH_PX = 26;
/** How long a piece stays broken; the damage eases off over this time */
const GLITCH_MS = 780;
/** Broken pieces re-randomise on an irregular clock rather than every frame */
const STEP_MIN_MS = 34;
const STEP_SPREAD_MS = 70;
const COOLDOWN_MS = 320;
/** The classic split-channel palette */
const CYAN = '#00fff9';
const MAGENTA = '#ff00c8';
const GRAPHIC_SELECTOR = 'svg, img, [data-fx="avatar"]';
/** Everything that decides how a run of text is drawn, so a copy renders like the original */
const TYPOGRAPHY = [
  'font-family', 'font-size', 'font-weight', 'font-style', 'font-stretch', 'font-kerning',
  'font-variant-ligatures', 'font-variant-caps', 'font-variant-numeric', 'font-variant-east-asian',
  'font-feature-settings', 'font-variation-settings', 'font-synthesis', 'letter-spacing', 'word-spacing',
  'text-transform', 'text-rendering', '-webkit-font-smoothing', 'direction', 'unicode-bidi',
];

interface Saved { transform: string; opacity: string; filter: string; clipPath: string; transition: string }

/** One copy of a piece, with its box in viewport space */
interface Ghost { el: HTMLElement; top: number; bottom: number }

interface Layer {
  ghosts: Ghost[];
  /** Which way the copy shifts: the left channel, the right channel, or a tear that goes either way */
  dir: -1 | 0 | 1;
  /** A tear keeps the piece's own colours */
  tear: boolean;
}

interface Piece {
  /** A run of text… */
  node: Text | null;
  /** …or an icon, photo or avatar */
  graphic: HTMLElement | null;
  /** The element that shakes while the piece is broken (a graphic shakes itself) */
  shake: HTMLElement | null;
  /** Line boxes (text) or the box (graphic), in viewport space */
  rects: DOMRect[];
  active: boolean;
  elapsed: number;
  /** ms until the damage re-randomises */
  stepIn: number;
  cooldownUntil: number;
  layers: Layer[];
}

interface Line {
  rect: DOMRect;
  text: string;
  /** Offset of the line's first glyph in the source node */
  first: number;
}

const luminance = ([r, g, b]: RGB) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

/** Recolours a photo to one channel: flatten, then push the tone round to cyan or magenta. */
const tint = (color: string) =>
  `grayscale(1) brightness(1.15) contrast(1.15) sepia(1) saturate(6) hue-rotate(${color === CYAN ? 140 : 255}deg)`;

function charRect(node: Text, index: number): DOMRect {
  const range = document.createRange();
  range.setStart(node, index);
  range.setEnd(node, Math.min(index + 1, node.length));
  return range.getBoundingClientRect();
}

/** One box per rendered line: fragments on the same line (a trailing space) are merged. */
function lineRects(rects: DOMRect[]): DOMRect[] {
  const lines: DOMRect[] = [];
  for (const r of rects) {
    if (r.width < 0.5 || r.height < 0.5) continue;
    const i = lines.findIndex((l) => Math.abs(l.top - r.top) < 1 && Math.abs(l.height - r.height) < 1);
    if (i < 0) {
      lines.push(r);
      continue;
    }
    const left = Math.min(lines[i].left, r.left);
    const right = Math.max(lines[i].right, r.right);
    lines[i] = new DOMRect(left, lines[i].top, right - left, lines[i].height);
  }
  return lines;
}

/** Which words sit on which line, so each line can be copied as its own run. */
function measureLines(node: Text, rects: DOMRect[]): Line[] {
  const text = node.data;
  if (rects.length === 1) {
    const first = text.search(/\S/);
    return first < 0 ? [] : [{ rect: rects[0], text: text.replace(/\s+/g, ' '), first }];
  }
  const lines = rects.map((rect) => ({ rect, words: [] as string[], first: -1 }));
  const range = document.createRange();
  const lineAt = (start: number, end: number) => {
    range.setStart(node, start);
    range.setEnd(node, end);
    const r = range.getBoundingClientRect();
    const cy = r.top + r.height / 2;
    let best = lines[0];
    let bestGap = Infinity;
    for (const line of lines) {
      const gap = Math.abs(line.rect.top + line.rect.height / 2 - cy);
      if (gap < bestGap) {
        bestGap = gap;
        best = line;
      }
    }
    return best;
  };
  const put = (line: (typeof lines)[number], start: number, end: number) => {
    if (line.first < 0) line.first = start;
    line.words.push(text.slice(start, end));
  };
  const words = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = words.exec(text))) {
    const start = m.index;
    const end = start + m[0].length;
    range.setStart(node, start);
    range.setEnd(node, end);
    if (range.getClientRects().length <= 1) {
      put(lineAt(start, end), start, end);
      continue;
    }
    // A word broken across lines (a long URL): follow it character by character.
    let runStart = start;
    let runLine = lineAt(start, start + 1);
    for (let i = start + 1; i < end; i++) {
      const line = lineAt(i, i + 1);
      if (line !== runLine) {
        put(runLine, runStart, i);
        runStart = i;
        runLine = line;
      }
    }
    put(runLine, runStart, end);
  }
  return lines.filter((l) => l.words.length).map((l) => ({ rect: l.rect, text: l.words.join(' '), first: l.first }));
}

/**
 * Glitch: whatever the drag passes over breaks up like a bad signal. Copies of
 * it in split colour channels (cyan one way, magenta the other) slide apart and
 * tear into horizontal slices, the piece itself shakes and drops out for a beat,
 * and icons and the photo flash the wrong colours. Then everything snaps back.
 * The copies are real text and cloned graphics laid over the originals, so
 * every design's own type and colours take part.
 */
const GlitchEffect: React.FC<GlitchEffectProps> = ({ host }) => {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hostEl = host.current;
    const layer = layerRef.current;
    if (!hostEl || !layer || prefersReducedMotion()) return;

    const theme = readThemeColors(hostEl);
    let pieces: Piece[] = [];
    /** Inline styles of the elements being shaken. Text pieces can share one, so it is reference counted. */
    const held = new Map<HTMLElement, { saved: Saved; count: number }>();
    let raf = 0;
    let running = false;
    let lastFrame = 0;

    const hold = (el: HTMLElement | null) => {
      if (!el) return;
      const entry = held.get(el);
      if (entry) {
        entry.count++;
        return;
      }
      const s = el.style;
      held.set(el, { saved: { transform: s.transform, opacity: s.opacity, filter: s.filter, clipPath: s.clipPath, transition: s.transition }, count: 1 });
      s.transition = 'none';
    };

    const release = (el: HTMLElement | null) => {
      const entry = el && held.get(el);
      if (!el || !entry) return;
      if (--entry.count > 0) return;
      Object.assign(el.style, entry.saved);
      held.delete(el);
    };

    /** The nearest block around a run of text: transforms do nothing on inline boxes. */
    const shakeTarget = (el: HTMLElement): HTMLElement | null => {
      let node: HTMLElement | null = el;
      while (node && node !== hostEl && !node.hasAttribute('data-fx-content') && getComputedStyle(node).display === 'inline') {
        node = node.parentElement;
      }
      return node && node !== hostEl && !node.hasAttribute('data-fx-content') ? node : null;
    };

    const restore = (p: Piece) => {
      for (const l of p.layers) for (const g of l.ghosts) g.el.remove();
      p.layers = [];
      release(p.shake);
      p.active = false;
    };

    const collect = () => {
      const now = performance.now();
      const keep = new Map<Node, Piece>();
      for (const p of pieces) {
        const anchor = p.node ?? p.graphic!;
        if (p.active && !anchor.isConnected) {
          restore(p);
          continue;
        }
        if (p.active || now < p.cooldownUntil) keep.set(anchor, p);
      }
      const next: Piece[] = [];
      for (const node of collectTextNodes(hostEl)) {
        if (node.data.trim().length < 2 || !node.parentElement) continue;
        const kept = keep.get(node);
        if (kept) {
          next.push(kept);
          continue;
        }
        const rects = lineRects(measureTextRects(node));
        if (!rects.length) continue;
        next.push({ node, graphic: null, shake: shakeTarget(node.parentElement), rects, active: false, elapsed: 0, stepIn: 0, cooldownUntil: 0, layers: [] });
      }
      for (const el of Array.from(hostEl.querySelectorAll<HTMLElement>(GRAPHIC_SELECTOR))) {
        if (el.closest('canvas, [data-fx-ignore], [role="dialog"]')) continue;
        // the avatar breaks up as one piece; skip the image inside it
        if (el.tagName === 'IMG' && el.closest('[data-fx="avatar"]')) continue;
        const kept = keep.get(el);
        if (kept) {
          next.push(kept);
          continue;
        }
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        next.push({ node: null, graphic: el, shake: el, rects: [rect], active: false, elapsed: 0, stepIn: 0, cooldownUntil: 0, layers: [] });
      }
      // A broken piece that is no longer collectable still has to finish and clean up.
      for (const p of keep.values()) if (!next.includes(p)) next.push(p);
      pieces = next;
    };

    const ensureLoop = () => {
      if (!running) {
        running = true;
        lastFrame = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    /** Light ink screens onto a dark surface; dark ink multiplies onto a light one. */
    const blendFor = (light: boolean) => (light ? 'screen' : 'multiply');

    const buildText = (p: Piece) => {
      const node = p.node!;
      const parent = node.parentElement;
      if (!parent) return;
      const lines = measureLines(node, p.rects);
      if (!lines.length) return;
      const cs = getComputedStyle(parent);
      const ink = cs.color;
      const blend = blendFor(luminance(parseColor(ink, [0, 0, 0])) > 0.5);
      const specs: Array<[string, string, Layer['dir'], boolean]> = [
        [CYAN, blend, -1, false],
        [MAGENTA, blend, 1, false],
        [ink, 'normal', 0, true],
      ];
      const made: Layer[] = specs.map(([color, mode, dir, tear]) => ({
        dir,
        tear,
        ghosts: lines.map((line) => {
          const el = document.createElement('span');
          el.className = 'fx-glitch-ghost fx-glitch-text';
          el.textContent = line.text;
          for (const prop of TYPOGRAPHY) el.style.setProperty(prop, cs.getPropertyValue(prop));
          el.style.lineHeight = `${line.rect.height}px`;
          el.style.color = color;
          el.style.mixBlendMode = mode;
          el.style.opacity = '0';
          layer.appendChild(el);
          return { el, top: line.rect.top, bottom: line.rect.bottom };
        }),
      }));
      // Land each copy on its original by lining up their first glyphs (reads first, then writes).
      const shifts = lines.map((line, i) => {
        const probe = made[0].ghosts[i].el;
        const copy = probe.firstChild as Text;
        const target = charRect(node, line.first);
        const glyph = charRect(copy, Math.max(copy.data.search(/\S/), 0));
        const box = probe.getBoundingClientRect();
        return { dx: target.left - glyph.left, dy: target.top - glyph.top, box };
      });
      for (const l of made) {
        l.ghosts.forEach((g, i) => {
          const { dx, dy, box } = shifts[i];
          g.el.style.left = `${dx.toFixed(2)}px`;
          g.el.style.top = `${dy.toFixed(2)}px`;
          g.top = box.top + dy;
          g.bottom = box.bottom + dy;
        });
      }
      p.layers = made;
    };

    const buildGraphic = (p: Piece) => {
      const src = p.graphic!;
      const rect = p.rects[0];
      const photo = src.tagName === 'IMG' || src.matches('[data-fx="avatar"]');
      const blend = blendFor(photo ? theme.isDark : luminance(parseColor(getComputedStyle(src).color, [0, 0, 0])) > 0.5);
      const specs: Array<[string | null, string, Layer['dir'], boolean]> = [
        [CYAN, blend, -1, false],
        [MAGENTA, blend, 1, false],
        [null, 'normal', 0, true],
      ];
      const made: Layer[] = specs.map(([color, mode, dir, tear]) => {
        const el = src.cloneNode(true) as HTMLElement;
        el.removeAttribute('id');
        for (const inner of Array.from(el.querySelectorAll('[id]'))) inner.removeAttribute('id');
        el.classList.add('fx-glitch-ghost');
        const s = el.style;
        s.position = 'absolute';
        s.left = '0px';
        s.top = '0px';
        s.margin = '0';
        s.width = `${rect.width}px`;
        s.height = `${rect.height}px`;
        s.transform = '';
        s.transition = 'none';
        s.opacity = '0';
        s.mixBlendMode = mode;
        if (color) {
          s.color = color;
          if (photo) s.filter = tint(color);
        }
        layer.appendChild(el);
        return { dir, tear, ghosts: [{ el, top: rect.top, bottom: rect.bottom }] };
      });
      const box = made[0].ghosts[0].el.getBoundingClientRect();
      const dx = rect.left - box.left;
      const dy = rect.top - box.top;
      for (const l of made) {
        l.ghosts[0].el.style.left = `${dx.toFixed(2)}px`;
        l.ghosts[0].el.style.top = `${dy.toFixed(2)}px`;
      }
      p.layers = made;
    };

    const activate = (p: Piece) => {
      p.active = true;
      p.elapsed = 0;
      p.stepIn = 0;
      hold(p.shake);
      if (p.node) buildText(p);
      else buildGraphic(p);
      ensureLoop();
    };

    /** Re-roll the damage. `k` is the remaining intensity, 1 → 0. */
    const step = (p: Piece, k: number) => {
      let top = Infinity;
      let bottom = -Infinity;
      for (const r of p.rects) {
        top = Math.min(top, r.top);
        bottom = Math.max(bottom, r.bottom);
      }
      const height = bottom - top;
      for (const l of p.layers) {
        const roll = Math.random();
        // Channels are usually split a few pixels apart; now and then a slice of one tears away or the whole copy blinks off.
        const mode = l.tear ? (roll < 0.06 + 0.4 * k ? 'band' : 'off') : roll < 0.2 ? 'off' : roll < 0.58 ? 'full' : 'band';
        const dir = l.dir || (Math.random() < 0.5 ? -1 : 1);
        const reach = mode === 'band' ? 4 + Math.random() * (l.tear ? 22 : 12) : 1.5 + Math.random() * 4;
        const dx = dir * reach * (0.3 + 0.7 * k);
        const dy = mode === 'band' ? (Math.random() - 0.5) * 3 * k : 0;
        let y0 = top;
        let y1 = bottom;
        if (mode === 'band') {
          const h = height * (0.12 + Math.random() * 0.4);
          y0 = top + Math.random() * (height - h);
          y1 = y0 + h;
        }
        for (const g of l.ghosts) {
          const s = g.el.style;
          if (mode === 'off') {
            s.opacity = '0';
            continue;
          }
          const clipTop = Math.max(0, y0 - g.top);
          const clipBottom = Math.max(0, g.bottom - y1);
          if (clipTop + clipBottom >= g.bottom - g.top - 1) {
            s.opacity = '0';
            continue;
          }
          s.clipPath = mode === 'band' ? `inset(${clipTop.toFixed(1)}px 0 ${clipBottom.toFixed(1)}px 0)` : '';
          s.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
          s.opacity = l.tear ? '1' : '0.85';
        }
      }

      const entry = p.shake && held.get(p.shake);
      if (!p.shake || !entry) return;
      const { saved } = entry;
      const s = p.shake.style;
      s.opacity = Math.random() < 0.09 * k ? '0' : saved.opacity;
      if (p.node) {
        const jx = (Math.random() - 0.5) * 4 * k;
        const jy = (Math.random() - 0.5) * 2 * k;
        s.transform = Math.random() < 0.1 + 0.45 * k ? `translate(${jx.toFixed(1)}px, ${jy.toFixed(1)}px)` : saved.transform;
        return;
      }
      // Signal damage on the graphic itself: jitter, skew, a flash of wrong colours, a sliced frame.
      const jx = (Math.random() - 0.5) * 8 * k;
      const jy = (Math.random() - 0.5) * 4 * k;
      const skew = (Math.random() - 0.5) * 14 * k;
      s.transform = `translate(${jx.toFixed(1)}px, ${jy.toFixed(1)}px) skewX(${skew.toFixed(1)}deg)`;
      const roll = Math.random();
      s.filter = roll < 0.16 * k ? 'invert(1) hue-rotate(90deg)' : roll < 0.34 * k ? 'contrast(1.7) saturate(2.4) hue-rotate(-60deg)' : saved.filter;
      if (Math.random() < 0.05 + 0.3 * k) {
        const t = Math.random() * 65;
        const h = 18 + Math.random() * 30;
        s.clipPath = `inset(${t.toFixed(0)}% 0 ${Math.max(0, 100 - t - h).toFixed(0)}% 0)`;
      } else {
        s.clipPath = saved.clipPath;
      }
    };

    const tick = (now: number) => {
      const dt = lastFrame ? Math.min(Math.max(now - lastFrame, 0), 50) : 16;
      lastFrame = now;
      let anyActive = false;
      for (const p of pieces) {
        if (!p.active) continue;
        p.elapsed += dt;
        if (p.elapsed >= GLITCH_MS) {
          restore(p);
          p.cooldownUntil = performance.now() + COOLDOWN_MS;
          continue;
        }
        anyActive = true;
        p.stepIn -= dt;
        if (p.stepIn > 0) continue;
        const t = p.elapsed / GLITCH_MS;
        step(p, 1 - t * t);
        p.stepIn = STEP_MIN_MS + Math.random() * STEP_SPREAD_MS;
      }
      if (anyActive) raf = requestAnimationFrame(tick);
      else running = false;
    };

    const brush = (x: number, y: number) => {
      const now = performance.now();
      for (const p of pieces) {
        if (p.active || now < p.cooldownUntil) continue;
        if (rectsDistance(p.rects, x, y) <= BRUSH_PX) activate(p);
      }
    };

    const detach = attachDragBrush(hostEl, {
      onStart: (x, y) => {
        collect();
        brush(x, y);
      },
      onMove: brush,
    });

    return () => {
      detach();
      cancelAnimationFrame(raf);
      for (const p of pieces) if (p.active) restore(p);
      for (const [el, entry] of held) Object.assign(el.style, entry.saved);
      held.clear();
    };
  }, [host]);

  return <div ref={layerRef} data-fx-ignore aria-hidden="true" className="fx-glitch-layer" />;
};

export default GlitchEffect;
