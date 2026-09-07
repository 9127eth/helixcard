'use client';

import React, { useEffect } from 'react';
import { attachDragBrush } from './dragBrush';
import { collectTextNodes, measureTextRects, rectDistance, rectsDistance } from './disruptUtils';
import { prefersReducedMotion } from './effectUtils';

interface ScrambleEffectProps {
  host: React.RefObject<HTMLDivElement | null>;
}

const GLYPHS = '!<>-_\\/[]{}=+*^?#%&@$0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BRUSH_PX = 26;
const SETTLE_MIN_MS = 380;
const SETTLE_SPREAD_MS = 520;
const COOLDOWN_MS = 300;
// Icons and the photo can't be re-spelled, so they get a signal glitch instead
const GLITCH_MS = 620;
const GRAPHIC_SELECTOR = 'svg, img, [data-fx="avatar"]';

interface TextTarget {
  node: Text;
  /** Code points, so emoji survive the shuffle */
  chars: string[];
  original: string;
  rects: DOMRect[];
  settleAt: Float64Array | null;
  /** ms of animation time since the scramble began (accumulated from frame deltas) */
  elapsed: number;
  cooldownUntil: number;
}

interface GraphicTarget {
  el: HTMLElement;
  rect: DOMRect;
  active: boolean;
  elapsed: number;
  cooldownUntil: number;
}

/**
 * Scramble: text under the drag dissolves into cipher glyphs and decodes
 * itself back, character by character in random order. Icons and the photo
 * glitch — jitter, skew, inverted colors, sliced flicker — then snap back.
 */
const ScrambleEffect: React.FC<ScrambleEffectProps> = ({ host }) => {
  useEffect(() => {
    const hostEl = host.current;
    if (!hostEl || prefersReducedMotion()) return;

    let targets: TextTarget[] = [];
    const graphics = new Map<HTMLElement, GraphicTarget>();
    let raf = 0;
    let running = false;
    let lastFrame = 0;

    const collect = () => {
      const active = new Map(targets.filter((t) => t.settleAt).map((t) => [t.node, t]));
      targets = collectTextNodes(hostEl)
        .filter((node) => node.nodeValue!.trim().length >= 2)
        .map((node) => {
          const existing = active.get(node);
          if (existing) {
            existing.rects = measureTextRects(node);
            return existing;
          }
          const original = node.nodeValue!;
          return {
            node,
            chars: Array.from(original),
            original,
            rects: measureTextRects(node),
            settleAt: null,
            elapsed: 0,
            cooldownUntil: 0,
          };
        });

      for (const [el, g] of graphics) {
        if (!el.isConnected) {
          restoreGraphic(g);
          graphics.delete(el);
        }
      }
      for (const el of Array.from(hostEl.querySelectorAll<HTMLElement>(GRAPHIC_SELECTOR))) {
        if (el.closest('canvas, [data-fx-ignore], [role="dialog"]')) continue;
        // the avatar wrapper glitches as one piece; skip the image inside it
        if (el.tagName === 'IMG' && el.closest('[data-fx="avatar"]')) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const existing = graphics.get(el);
        if (existing) existing.rect = rect;
        else graphics.set(el, { el, rect, active: false, elapsed: 0, cooldownUntil: 0 });
      }
    };

    const restoreGraphic = (g: GraphicTarget) => {
      g.el.style.transform = '';
      g.el.style.filter = '';
      g.el.style.clipPath = '';
      g.el.style.transition = '';
      g.active = false;
    };

    const ensureLoop = () => {
      if (!running) {
        running = true;
        lastFrame = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    const beginText = (t: TextTarget) => {
      const settle = new Float64Array(t.chars.length);
      for (let i = 0; i < settle.length; i++) settle[i] = SETTLE_MIN_MS + Math.random() * SETTLE_SPREAD_MS;
      t.settleAt = settle;
      t.elapsed = 0;
      ensureLoop();
    };

    const beginGraphic = (g: GraphicTarget) => {
      g.active = true;
      g.elapsed = 0;
      g.el.style.transition = 'none';
      ensureLoop();
    };

    const glitchFrame = (g: GraphicTarget) => {
      const p = g.elapsed / GLITCH_MS;
      const k = 1 - p;
      const jx = (Math.random() - 0.5) * 10 * k;
      const jy = (Math.random() - 0.5) * 5 * k;
      const skew = (Math.random() - 0.5) * 18 * k;
      g.el.style.transform = `translate(${jx.toFixed(1)}px, ${jy.toFixed(1)}px) skewX(${skew.toFixed(1)}deg)`;
      const roll = Math.random();
      g.el.style.filter =
        roll < 0.35 ? 'invert(1) hue-rotate(90deg)' : roll < 0.7 ? 'contrast(1.8) saturate(2.5) hue-rotate(-60deg)' : '';
      if (Math.random() < 0.55 * k + 0.1) {
        const top = Math.random() * 65;
        const h = 18 + Math.random() * 30;
        g.el.style.clipPath = `inset(${top.toFixed(0)}% 0 ${Math.max(0, 100 - top - h).toFixed(0)}% 0)`;
      } else {
        g.el.style.clipPath = '';
      }
    };

    const tick = (now: number) => {
      const dt = lastFrame ? Math.min(Math.max(now - lastFrame, 0), 50) : 16;
      lastFrame = now;
      let anyActive = false;

      for (const t of targets) {
        if (!t.settleAt) continue;
        t.elapsed += dt;
        let done = true;
        let out = '';
        for (let i = 0; i < t.chars.length; i++) {
          const ch = t.chars[i];
          if (/\s/.test(ch) || t.elapsed >= t.settleAt[i]) {
            out += ch;
          } else {
            done = false;
            out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }
        }
        if (done) {
          t.node.data = t.original;
          t.settleAt = null;
          t.cooldownUntil = performance.now() + COOLDOWN_MS;
        } else {
          t.node.data = out;
          anyActive = true;
        }
      }

      for (const g of graphics.values()) {
        if (!g.active) continue;
        g.elapsed += dt;
        if (g.elapsed >= GLITCH_MS) {
          restoreGraphic(g);
          g.cooldownUntil = performance.now() + COOLDOWN_MS;
        } else {
          glitchFrame(g);
          anyActive = true;
        }
      }

      if (anyActive) raf = requestAnimationFrame(tick);
      else running = false;
    };

    const brush = (x: number, y: number) => {
      const now = performance.now();
      for (const t of targets) {
        if (t.settleAt || now < t.cooldownUntil) continue;
        if (rectsDistance(t.rects, x, y) <= BRUSH_PX) beginText(t);
      }
      for (const g of graphics.values()) {
        if (g.active || now < g.cooldownUntil) continue;
        if (rectDistance(g.rect, x, y) <= BRUSH_PX) beginGraphic(g);
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
      for (const t of targets) if (t.settleAt && t.node.isConnected) t.node.data = t.original;
      for (const g of graphics.values()) restoreGraphic(g);
    };
  }, [host]);

  return null;
};

export default ScrambleEffect;
