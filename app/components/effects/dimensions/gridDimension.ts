import { rgba, RGB } from '../effectUtils';
import { Dimension, luminance, parallax } from './types';

// Corridor geometry: the square x,y ∈ [-1,1], from Z_NEAR (just behind the
// card) to Z_FAR (the back wall). Nothing in it moves — it is a still place.
const Z_NEAR = 0.35;
const Z_FAR = 3.2;
const RING_SPACING = 0.3;
const GRID_STEP = 0.25;
const EYE_DISTANCE = 0.8;

const CYAN: RGB = [0, 210, 255];

const isGray = ([r, g, b]: RGB) => Math.max(r, g, b) - Math.min(r, g, b) < 40;
/** Wireframe lines need a saturated glow color; gray/black accents fall back to neon cyan. */
const neonize = (c: RGB, fallback: RGB) => (luminance(c) < 0.18 || isGray(c) ? fallback : c);

/**
 * The Grid: a still neon wireframe corridor behind the screen. Its vanishing
 * point is the center of the viewport, so a hole near the middle looks down
 * the corridor at the back wall while a hole near an edge shows the floor,
 * ceiling, or a side wall rushing past — the same room from wherever you cut.
 */
export function createGridDimension(): Dimension {
  return {
    update() {
      /* static dimension: nothing moves on its own */
    },

    draw(ctx, view) {
      const { W, H, ax, ay, ex, ey, hx, hy, r, colors } = view;
      const line = neonize(colors.accent, CYAN);
      const f = Math.min(W, H) * 0.62;
      const project = (x: number, y: number, z: number): [number, number] => [
        ax + (x * f) / z + parallax(ex, z, EYE_DISTANCE),
        ay + (y * f) / z + parallax(ey, z, EYE_DISTANCE),
      ];
      const fog = (z: number) => Math.pow(Math.max(0, 1 - (z - Z_NEAR) / (Z_FAR - Z_NEAR)), 1.3);
      const holeRect: [number, number, number, number] = [hx - r - 2, hy - r - 2, r * 2 + 4, r * 2 + 4];

      // Black void with a faint glow at the vanishing point
      ctx.fillStyle = '#020308';
      ctx.fillRect(...holeRect);
      const [vx, vy] = project(0, 0, Z_FAR);
      const glow = ctx.createRadialGradient(vx, vy, 0, vx, vy, Math.min(W, H) * 0.35);
      glow.addColorStop(0, rgba(line, 0.26));
      glow.addColorStop(1, rgba(line, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(...holeRect);

      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';

      const strokeGlow = (draw: () => void, alpha: number) => {
        ctx.beginPath();
        draw();
        ctx.lineWidth = 3;
        ctx.strokeStyle = rgba(line, alpha * 0.16);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.strokeStyle = rgba(line, alpha);
        ctx.stroke();
      };

      // Longitudinal lines on the four walls, fading with depth
      for (let u = -1; u <= 1.001; u += GRID_STEP) {
        const walls: [number, number][] = [
          [u, 1],
          [u, -1],
          [-1, u],
          [1, u],
        ];
        for (const [x, y] of walls) {
          const [nx, ny] = project(x, y, Z_NEAR);
          const [fx, fy] = project(x, y, Z_FAR);
          const g = ctx.createLinearGradient(nx, ny, fx, fy);
          g.addColorStop(0, rgba(line, 0.95));
          g.addColorStop(1, rgba(line, 0.12));
          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(fx, fy);
          ctx.lineWidth = 3;
          ctx.strokeStyle = rgba(line, 0.1);
          ctx.stroke();
          ctx.lineWidth = 1;
          ctx.strokeStyle = g;
          ctx.stroke();
        }
      }

      // Fixed cross-section rings
      for (let z = Z_NEAR + RING_SPACING; z < Z_FAR; z += RING_SPACING) {
        const a = 0.25 + 0.75 * fog(z);
        const p = [project(-1, -1, z), project(1, -1, z), project(1, 1, z), project(-1, 1, z)];
        strokeGlow(() => {
          ctx.moveTo(p[0][0], p[0][1]);
          for (let k = 1; k < 4; k++) ctx.lineTo(p[k][0], p[k][1]);
          ctx.closePath();
        }, a);
      }

      // Back wall grid
      for (let u = -1; u <= 1.001; u += GRID_STEP) {
        const [ax2, ay2] = project(u, -1, Z_FAR);
        const [bx, by] = project(u, 1, Z_FAR);
        const [cx2, cy2] = project(-1, u, Z_FAR);
        const [dx, dy] = project(1, u, Z_FAR);
        strokeGlow(() => {
          ctx.moveTo(ax2, ay2);
          ctx.lineTo(bx, by);
          ctx.moveTo(cx2, cy2);
          ctx.lineTo(dx, dy);
        }, 0.45);
      }

      ctx.globalCompositeOperation = 'source-over';
    },
  };
}
