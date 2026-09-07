'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  clamp,
  fitCanvasToViewport,
  isInteractiveTarget,
  prefersReducedMotion,
  readThemeColors,
  rgba,
  ThemeColors,
} from './effectUtils';
import { Dimension, DimensionView } from './dimensions/types';
import { createSpaceDimension } from './dimensions/spaceDimension';
import { createGridDimension } from './dimensions/gridDimension';

export type PortalDimension = 'space' | 'grid';

interface PortalEffectProps {
  host: React.RefObject<HTMLDivElement | null>;
  dimension: PortalDimension;
}

// A press shorter than this is a tap (quick "peek"); moving further than the
// tolerance before it elapses means the user is scrolling, not pressing.
const HOLD_MS = 300;
const MOVE_TOLERANCE = 8;
// Both portals retain their anchor and every revealed area. Grid starts with
// a fixed diamond; Space rounds the accumulated drag shape with a large circle.
const GRID_ANCHOR_RADIUS = 110;
const SPACE_RADIUS = 110;
const CLOSE_MS = 130;
// Max eye offset (px) from tilting the phone; the world behind shifts by a
// depth-dependent fraction of this relative to the hole edge.
const EYE_RANGE_PX = 48;
const TILT_RANGE_DEG = 18;

type OrientationCtor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

type Pt = [number, number];

/** Keep the entire previous opening and fill the area toward new drag points. */
const convexHull = (points: Pt[]): Pt[] => {
  const sorted = [...points].sort(([ax, ay], [bx, by]) => ax - bx || ay - by);
  const unique = sorted.filter(([x, y], i) => i === 0 || x !== sorted[i - 1][0] || y !== sorted[i - 1][1]);
  if (unique.length <= 2) return unique;
  const cross = (a: Pt, b: Pt, c: Pt) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const lower: Pt[] = [];
  const upper: Pt[] = [];
  for (const p of unique) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  for (let i = unique.length - 1; i >= 0; i--) {
    const p = unique[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
};

/** Treat subpixel boundary noise as retracing, including a one-point/line hull. */
const hullContains = (hull: Pt[], [x, y]: Pt): boolean => {
  let inside = hull.length >= 3;
  for (let i = 0; i < hull.length; i++) {
    const [ax, ay] = hull[i];
    const [bx, by] = hull[(i + 1) % hull.length];
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;
    const t = lengthSq ? clamp(((x - ax) * dx + (y - ay) * dy) / lengthSq, 0, 1) : 0;
    if (Math.hypot(x - ax - t * dx, y - ay - t * dy) <= 0.001) return true;
    if (dx * (y - ay) - dy * (x - ax) < 0) inside = false;
  }
  return inside;
};

/**
 * Expand a convex hull by a circle: a circle at rest, a capsule on a straight
 * drag, and a broad rounded opening after a turn. Exact outward arcs preserve
 * every previously revealed area as the hull grows, without rotating it.
 */
const roundedHullPath = (hull: Pt[], radius: number, offsetX = 0, offsetY = 0): string => {
  if (!hull.length || radius <= 0) return '';
  const point = (x: number, y: number) => `${(x - offsetX).toFixed(1)} ${(y - offsetY).toFixed(1)}`;
  const r = radius.toFixed(1);
  if (hull.length === 1) {
    const [x, y] = hull[0];
    return `M${point(x + radius, y)}A${r} ${r} 0 1 1 ${point(x - radius, y)}A${r} ${r} 0 1 1 ${point(x + radius, y)}Z`;
  }
  const normals = hull.map(([x, y], i): Pt => {
    const next = hull[(i + 1) % hull.length];
    const dx = next[0] - x;
    const dy = next[1] - y;
    const length = Math.hypot(dx, dy);
    return [dy / length, -dx / length];
  });
  const first = hull[0];
  const lastNormal = normals[normals.length - 1];
  let d = `M${point(first[0] + lastNormal[0] * radius, first[1] + lastNormal[1] * radius)}`;
  hull.forEach(([x, y], i) => {
    const [nx, ny] = normals[i];
    const next = hull[(i + 1) % hull.length];
    d += `A${r} ${r} 0 0 1 ${point(x + nx * radius, y + ny * radius)}`;
    d += `L${point(next[0] + nx * radius, next[1] + ny * radius)}`;
  });
  return d + 'Z';
};

/**
 * Portal: press and hold to tear a hole through the card, then drag to rip it
 * further open around the press anchor and every drag point. Grid keeps sharp
 * corners; Space wraps the same growing shape in a circular rim. The hole is a real clip-path cut in
 * the page container, and the dimension behind it is drawn on a canvas that
 * sits *behind* the page and is anchored to the screen, not to the hole — so
 * the card reads as a sheet you're looking through at a fixed world.
 */
const PortalEffect: React.FC<PortalEffectProps> = ({ host, dimension }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    const hostEl = host.current;
    const canvas = canvasRef.current;
    if (!hostEl || !canvas || !portalTarget) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    let colors: ThemeColors = readThemeColors(hostEl);
    const world: Dimension = dimension === 'grid' ? createGridDimension() : createSpaceDimension();
    hostEl.classList.add('fx-portal-host');

    let W = 0;
    let H = 0;
    let raf = 0;
    let running = false;
    let lastFrame = 0;
    let time = 0;
    // open (spring on `scale`) / close (fast ease on `closeT`)
    let scale = 0;
    let scaleVel = 0;
    let targetScale = 0;
    let closing = false;
    let closeT = 0;
    let open = false;
    let peeking = false;
    let ringFlash = 0;
    let holeSet = false;
    // eye parallax (from device tilt)
    let ex = 0;
    let ey = 0;
    let exT = 0;
    let eyT = 0;
    let baseBeta: number | null = null;
    let baseGamma: number | null = null;

    let pointerId: number | null = null;
    let pressing = false;
    let downX = 0;
    let downY = 0;
    let opening: Pt[] = [];
    let holdTimer: number | null = null;

    const resize = () => {
      ({ w: W, h: H } = fitCanvasToViewport(canvas, ctx));
      if (open || peeking) closePortal();
    };

    const ensureLoop = () => {
      if (!running) {
        running = true;
        lastFrame = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    const addSample = (x: number, y: number) => {
      // Preserve everything already revealed. Turns fill the area between
      // drag points; retracing the center hull leaves the opening unchanged.
      if (hullContains(opening, [x, y])) return;
      opening = convexHull([...opening, [x, y]]);
    };

    const openingContours = (progress: number): Pt[][] => {
      if (progress <= 0 || opening.length === 0) return [];
      return [opening.map(([x, y]): Pt => [
        downX + (x - downX) * progress,
        downY + (y - downY) * progress,
      ])];
    };

    // Use identical geometry for the page cutout and the shaded canvas edge.
    const outlinePath = (loops: Pt[][], radius = 0, offsetX = 0, offsetY = 0) => {
      const point = (x: number, y: number) => `${(x - offsetX).toFixed(1)} ${(y - offsetY).toFixed(1)}`;
      return loops.map((loop) => {
        if (dimension === 'space') return roundedHullPath(loop, radius, offsetX, offsetY);
        return loop.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${point(x, y)}`).join('') + 'Z';
      }).join('');
    };

    // Both convex outlines run clockwise; the opposite outer rectangle
    // leaves a real hole through the page using the nonzero fill rule.
    const setHole = (loops: Pt[][], radius = 0) => {
      if (loops.length === 0) {
        if (holeSet) {
          hostEl.style.clipPath = '';
          holeSet = false;
        }
        return;
      }
      const rect = hostEl.getBoundingClientRect();
      const w = hostEl.offsetWidth;
      const h = hostEl.offsetHeight;
      const d = `M0 0V${h}H${w}V0Z` + outlinePath(loops, radius, rect.left, rect.top);
      hostEl.style.clipPath = `path('${d}')`;
      holeSet = true;
    };

    // ---- interaction
    const lockSelection = (lock: boolean) => {
      const style = hostEl.style as CSSStyleDeclaration & { webkitUserSelect?: string; webkitTouchCallout?: string };
      style.userSelect = lock ? 'none' : '';
      style.webkitUserSelect = lock ? 'none' : '';
      style.webkitTouchCallout = lock ? 'none' : '';
    };

    const beginRip = (x: number, y: number) => {
      colors = readThemeColors(hostEl);
      if (dimension === 'grid') {
        opening = convexHull([
          [x - GRID_ANCHOR_RADIUS, y],
          [x, y - GRID_ANCHOR_RADIUS],
          [x + GRID_ANCHOR_RADIUS, y],
          [x, y + GRID_ANCHOR_RADIUS],
        ]);
      } else {
        opening = [[x, y]];
      }
      closing = false;
      scale = 0;
      scaleVel = 0;
      ringFlash = 1;
      ensureLoop();
    };

    const openPortal = () => {
      beginRip(downX, downY);
      open = true;
      peeking = false;
      targetScale = 1;
    };

    const closePortal = () => {
      open = false;
      peeking = false;
      targetScale = 0;
      closing = true;
      closeT = 0;
      ensureLoop();
    };

    const peek = () => {
      beginRip(downX, downY);
      peeking = true;
      targetScale = 0.8;
    };

    const clearHold = () => {
      if (holdTimer !== null) {
        window.clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    // Move/up/cancel are tracked on window during a press so the release is
    // never missed once the card is clipped away under the pointer.
    const endPress = () => {
      clearHold();
      pressing = false;
      pointerId = null;
      lockSelection(false);
      window.removeEventListener('pointermove', onPointerMove, true);
      window.removeEventListener('pointerup', onPointerUp, true);
      window.removeEventListener('pointercancel', onPointerCancel, true);
    };

    const release = () => {
      const wasQuickTap = !open && holdTimer !== null;
      endPress();
      if (wasQuickTap) peek();
      else if (open) closePortal();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      if (e.pointerType === 'mouse' && e.buttons === 0) {
        // The button is up but we never saw the release
        release();
        return;
      }
      if (!open) {
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > MOVE_TOLERANCE) endPress();
        return;
      }
      addSample(e.clientX, e.clientY);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      release();
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      endPress();
      if (open) closePortal();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (pointerId !== null || !e.isPrimary) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (isInteractiveTarget(e.target)) return;
      pointerId = e.pointerId;
      pressing = true;
      downX = e.clientX;
      downY = e.clientY;
      lockSelection(true);
      window.addEventListener('pointermove', onPointerMove, true);
      window.addEventListener('pointerup', onPointerUp, true);
      window.addEventListener('pointercancel', onPointerCancel, true);
      holdTimer = window.setTimeout(() => {
        holdTimer = null;
        openPortal();
      }, HOLD_MS);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (open) e.preventDefault();
    };
    const onContextMenu = (e: Event) => {
      if (pressing) e.preventDefault();
    };
    const onBlur = () => {
      endPress();
      if (open) closePortal();
    };

    // Eye parallax from the phone's tilt, relative to how it is being held.
    // Only bound where it needs no permission prompt (not iOS).
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      if (baseBeta === null || baseGamma === null) {
        baseBeta = e.beta;
        baseGamma = e.gamma;
      }
      baseBeta += (e.beta - baseBeta) * 0.01;
      baseGamma += (e.gamma - baseGamma) * 0.01;
      exT = clamp((e.gamma - baseGamma) / TILT_RANGE_DEG, -1, 1) * EYE_RANGE_PX;
      eyT = clamp((e.beta - baseBeta) / TILT_RANGE_DEG, -1, 1) * EYE_RANGE_PX;
    };
    const Orientation = (
      typeof DeviceOrientationEvent !== 'undefined' ? DeviceOrientationEvent : undefined
    ) as OrientationCtor | undefined;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const useOrientation = !!Orientation && isTouchDevice && typeof Orientation.requestPermission !== 'function';

    // ---- simulation + drawing
    const stepScale = (dt: number) => {
      const k = 260;
      const d = 16;
      const accel = k * (targetScale - scale) - d * scaleVel;
      scaleVel += accel * dt;
      scale += scaleVel * dt;
      if (scale < 0) {
        scale = 0;
        scaleVel = 0;
      }
      // Once open, keep the cutout steady instead of letting the spring
      // briefly shrink and reopen it while the pointer is held in place.
      if (open && scale >= targetScale) {
        scale = targetScale;
        scaleVel = 0;
      }
      if (peeking && scale >= targetScale * 0.92) {
        peeking = false;
        closePortal();
      }
    };

    /**
     * Shading that makes the rip read as a hole in a thick sheet in front of
     * the world. Light comes from the top-left: the card casts a shadow onto
     * the world along the top-left edges, and the cut face of the card is
     * dark where it faces away from the light and bright where it catches it.
     * Everything is stroked along the outline so it follows any rip shape;
     * the halves that fall outside the hole are clipped away.
     */
    const drawEdge = (path: Path2D, bbox: { x0: number; y0: number; x1: number; y1: number }) => {
      ctx.lineJoin = dimension === 'space' ? 'round' : 'miter';
      ctx.miterLimit = 6;
      ctx.save();
      ctx.translate(5, 6);
      const bands: [number, number][] = [
        [40, 0.08],
        [28, 0.1],
        [18, 0.14],
        [10, 0.2],
      ];
      for (const [w, a] of bands) {
        ctx.lineWidth = w;
        ctx.strokeStyle = `rgba(0,0,0,${a})`;
        ctx.stroke(path);
      }
      ctx.restore();

      ctx.lineWidth = 10;
      ctx.strokeStyle = rgba(colors.accent, 0.18 + ringFlash * 0.45);
      ctx.stroke(path);

      const lit = colors.isDark ? 0.24 : 0.55;
      const lip = ctx.createLinearGradient(bbox.x0, bbox.y0, bbox.x1, bbox.y1);
      lip.addColorStop(0, 'rgba(0,0,0,0.6)');
      lip.addColorStop(0.45, 'rgba(0,0,0,0.25)');
      lip.addColorStop(0.7, `rgba(255,255,255,${lit * 0.35})`);
      lip.addColorStop(1, `rgba(255,255,255,${lit})`);
      ctx.lineWidth = 6;
      ctx.strokeStyle = lip;
      ctx.stroke(path);
    };

    const finishClose = () => {
      closing = false;
      running = false;
      ctx.clearRect(0, 0, W, H);
      setHole([]);
    };

    const frame = (now: number) => {
      const dt = lastFrame ? clamp((now - lastFrame) / 1000, 0, 0.05) : 0.016;
      lastFrame = now;
      time += dt;

      let progress: number;
      if (closing) {
        closeT += (dt * 1000) / CLOSE_MS;
        if (closeT >= 1) {
          finishClose();
          return;
        }
        progress = 1 - closeT * closeT;
      } else {
        stepScale(dt);
        progress = clamp(scale, 0, 1);
      }
      ringFlash *= Math.exp(-dt * 6);
      ex += (exT - ex) * Math.min(1, dt * 6);
      ey += (eyT - ey) * Math.min(1, dt * 6);

      const loops = openingContours(progress);
      const radius = dimension === 'space' ? SPACE_RADIUS * progress : 0;
      const bbox = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
      for (const loop of loops) {
        for (const [x, y] of loop) {
          if (x - radius < bbox.x0) bbox.x0 = x - radius;
          if (y - radius < bbox.y0) bbox.y0 = y - radius;
          if (x + radius > bbox.x1) bbox.x1 = x + radius;
          if (y + radius > bbox.y1) bbox.y1 = y + radius;
        }
      }
      const hasHole = loops.length > 0;
      const view: DimensionView = {
        W,
        H,
        ax: W / 2,
        ay: H / 2,
        ex,
        ey,
        hx: hasHole ? (bbox.x0 + bbox.x1) / 2 : 0,
        hy: hasHole ? (bbox.y0 + bbox.y1) / 2 : 0,
        r: hasHole ? Math.max(bbox.x1 - bbox.x0, bbox.y1 - bbox.y0) / 2 + 4 : 0,
        time,
        reduced,
        colors,
      };
      world.update(dt, view);

      ctx.clearRect(0, 0, W, H);
      if (hasHole) {
        const path = new Path2D(outlinePath(loops, radius));
        ctx.save();
        ctx.clip(path);
        world.draw(ctx, view);
        drawEdge(path, bbox);
        ctx.restore();
      }
      setHole(loops, radius);

      const active = open || peeking || closing || scale > 0.001 || Math.abs(scaleVel) > 0.01;
      if (active) {
        raf = requestAnimationFrame(frame);
      } else {
        running = false;
        ctx.clearRect(0, 0, W, H);
        setHole([]);
      }
    };

    resize();
    hostEl.addEventListener('pointerdown', onPointerDown);
    hostEl.addEventListener('touchmove', onTouchMove, { passive: false });
    hostEl.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('resize', resize);
    window.addEventListener('blur', onBlur);
    if (useOrientation) window.addEventListener('deviceorientation', onOrientation);

    return () => {
      cancelAnimationFrame(raf);
      endPress();
      hostEl.style.clipPath = '';
      hostEl.classList.remove('fx-portal-host');
      hostEl.removeEventListener('pointerdown', onPointerDown);
      hostEl.removeEventListener('touchmove', onTouchMove);
      hostEl.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('resize', resize);
      window.removeEventListener('blur', onBlur);
      if (useOrientation) window.removeEventListener('deviceorientation', onOrientation);
    };
  }, [host, dimension, portalTarget]);

  return (
    <>
      {portalTarget &&
        createPortal(
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            data-fx-ignore=""
            style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
          />,
          portalTarget,
        )}
    </>
  );
};

export default PortalEffect;
