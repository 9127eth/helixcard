import { rgba, RGB } from '../effectUtils';
import { Dimension, TAU, parallax } from './types';

const STAR_COUNT = 1800;
const EYE_DISTANCE = 0.35;
const SPACE_CORE: RGB = [3, 5, 10];
const SPACE_EDGE: RGB = [0, 1, 3];
const NEBULA_BLUE: RGB = [35, 62, 108];
const NEBULA_DUST: RGB = [60, 76, 100];
const STAR_WHITE: RGB = [240, 245, 255];
const STAR_WARM: RGB = [255, 239, 216];

interface Star {
  x: number;
  y: number;
  z: number;
  tw: number;
  brightness: number;
  size: number;
}

interface Streak {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

/**
 * Deep space, fixed behind the screen: a 3D star field very slowly drifting
 * toward the viewer, faint blue dust against black, and the occasional
 * shooting star. Nothing here is positioned relative to the hole.
 */
export function createSpaceDimension(): Dimension {
  const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
    z: 0.03 + Math.random() * 0.97,
    tw: Math.random() * TAU,
    brightness: 0.6 + Math.random() * 0.4,
    size: 0.6 + Math.random() * 0.7,
  }));
  let streaks: Streak[] = [];
  let streakTimer = 0;

  return {
    update(dt, view) {
      if (view.reduced) return;
      for (const s of stars) {
        s.z -= 0.03 * dt;
        if (s.z < 0.03) {
          s.z = 1;
          s.x = Math.random() * 2 - 1;
          s.y = Math.random() * 2 - 1;
          s.tw = Math.random() * TAU;
        }
      }
      streakTimer -= dt;
      if (view.r > 40 && streakTimer <= 0) {
        streakTimer = 1.4 + Math.random() * 2.2;
        const a = Math.random() * TAU;
        const sp = 520 + Math.random() * 360;
        streaks.push({
          x: view.hx + (Math.random() * 2 - 1) * view.r * 0.7,
          y: view.hy + (Math.random() * 2 - 1) * view.r * 0.7,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 1,
        });
      }
      streaks = streaks.filter((st) => {
        st.x += st.vx * dt;
        st.y += st.vy * dt;
        st.life -= dt * 2.2;
        return st.life > 0;
      });
    },

    draw(ctx, view) {
      const { W, H, ax, ay, ex, ey, hx, hy, r, time } = view;
      const S = Math.min(W, H);
      const cloudTime = view.reduced ? 0 : time;
      const nebulae: { color: RGB; speed: number; phase: number; scale: number; alpha: number }[] = [
        { color: NEBULA_BLUE, speed: 0.05, phase: 0, scale: 0.55, alpha: 0.1 },
        { color: NEBULA_DUST, speed: 0.04, phase: 2.1, scale: 0.65, alpha: 0.06 },
      ];
      const holeRect: [number, number, number, number] = [hx - r - 2, hy - r - 2, r * 2 + 4, r * 2 + 4];

      // Deep-space base, anchored to the screen
      const far = parallax(1, 1, EYE_DISTANCE);
      const base = ctx.createRadialGradient(ax + ex * far, ay + ey * far, 0, ax + ex * far, ay + ey * far, Math.max(W, H) * 0.8);
      base.addColorStop(0, rgba(SPACE_CORE, 1));
      base.addColorStop(1, rgba(SPACE_EDGE, 1));
      ctx.fillStyle = base;
      ctx.fillRect(...holeRect);

      // Nebula clouds drifting very slowly around the screen center
      ctx.globalCompositeOperation = 'lighter';
      nebulae.forEach((n, i) => {
        const orbit = S * 0.28;
        const depthShift = parallax(1, 0.8 - i * 0.15, EYE_DISTANCE);
        const nx = ax + Math.cos(cloudTime * n.speed + n.phase) * orbit + ex * depthShift;
        const ny = ay + Math.sin(cloudTime * (n.speed * 0.8) + n.phase) * orbit * 0.7 + ey * depthShift;
        const nr = S * n.scale;
        const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
        g.addColorStop(0, rgba(n.color, n.alpha));
        g.addColorStop(0.55, rgba(n.color, n.alpha * 0.35));
        g.addColorStop(1, rgba(n.color, 0));
        ctx.fillStyle = g;
        ctx.fillRect(...holeRect);
      });

      // Stars: fixed on screen; nearer ones are bigger and brighter, farther ones
      // shift more with the eye (window parallax)
      const limit = r + 12;
      const fieldScale = S * 0.55;
      for (const s of stars) {
        const depth = s.z;
        const spread = fieldScale / depth;
        const shift = parallax(1, depth, EYE_DISTANCE);
        const sx = ax + s.x * spread + ex * shift;
        const sy = ay + s.y * spread + ey * shift;
        if (Math.abs(sx - hx) > limit || Math.abs(sy - hy) > limit) continue;
        const near = 1 - depth;
        const twinkle = view.reduced ? 1 : 0.85 + 0.15 * Math.sin(time * 1.5 + s.tw);
        // Keep distant pinpoints visible; the old depth fade hid most stars.
        const alpha = (0.45 + near * 0.5) * twinkle * s.brightness;
        const size = (0.55 + near * 1.5) * s.size;
        const color = s.tw > TAU * 0.85 ? STAR_WARM : STAR_WHITE;
        if (size > 1.3 && alpha > 0.65) {
          ctx.fillStyle = rgba(color, alpha * 0.1);
          ctx.beginPath();
          ctx.arc(sx, sy, size * 2.5, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = rgba(color, alpha);
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, TAU);
        ctx.fill();
      }

      for (const st of streaks) {
        const tail = 0.09;
        const g = ctx.createLinearGradient(st.x, st.y, st.x - st.vx * tail, st.y - st.vy * tail);
        g.addColorStop(0, `rgba(255,255,255,${0.9 * st.life})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(st.x, st.y);
        ctx.lineTo(st.x - st.vx * tail, st.y - st.vy * tail);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    },
  };
}
