import { RGB, ThemeColors } from '../effectUtils';

/**
 * Everything a portal dimension needs to draw one frame.
 *
 * The dimension is a fixed world *behind the screen*: it is anchored to the
 * viewport (`ax, ay`), never to the hole. The hole (`hx, hy, r`) is only a
 * window onto it — moving the hole reveals a different part of the same world,
 * which is what makes it read as "behind the card" rather than painted on top.
 */
export interface DimensionView {
  /** Viewport size in px */
  W: number;
  H: number;
  /** Where the world's vanishing point / origin sits on screen (viewport center) */
  ax: number;
  ay: number;
  /** Eye offset in px (from device tilt); applied per depth via `parallax()` */
  ex: number;
  ey: number;
  /** The hole, for culling only */
  hx: number;
  hy: number;
  r: number;
  time: number;
  reduced: boolean;
  colors: ThemeColors;
}

export interface Dimension {
  update(dt: number, view: DimensionView): void;
  /** Called with the canvas already clipped to the hole */
  draw(ctx: CanvasRenderingContext2D, view: DimensionView): void;
}

export const TAU = Math.PI * 2;

/**
 * Screen shift of a point at `depth` behind the card when the eye moves by
 * `eye` px, with the eye `eyeDistance` in front of the card (same units as
 * depth). Farther points shift more relative to the hole edge — the correct
 * cue for looking through a window.
 */
export const parallax = (eye: number, depth: number, eyeDistance: number) =>
  (eye * depth) / (eyeDistance + depth);

export const luminance = ([r, g, b]: RGB) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
