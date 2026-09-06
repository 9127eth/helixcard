export type RGB = [number, number, number];

/** Parses `#rgb`, `#rrggbb`, `rgb()` / `rgba()` strings. Alpha is ignored. */
export function parseColor(input: string, fallback: RGB): RGB {
  const s = input.trim();
  if (!s) return fallback;
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
      ];
    }
    if (hex.length === 6 || hex.length === 8) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
    return fallback;
  }
  const m = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  return fallback;
}

export const rgba = ([r, g, b]: RGB, a: number) => `rgba(${r}, ${g}, ${b}, ${a})`;

export const mix = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

export interface ThemeColors {
  /** Primary accent: the design's button color */
  accent: RGB;
  /** Secondary accent: the design's link-icon color */
  accent2: RGB;
  /** True when the design's surface is dark (light text) */
  isDark: boolean;
}

/**
 * Reads the active design's colors off the card container so an effect
 * automatically harmonizes with whichever theme is applied.
 */
export function readThemeColors(host: HTMLElement): ThemeColors {
  const cs = getComputedStyle(host);
  const accent = parseColor(cs.getPropertyValue('--save-contact-button-bg'), [124, 206, 218]);
  const accent2 = parseColor(cs.getPropertyValue('--link-icon-color'), [252, 154, 153]);
  // Gradient backgrounds report a transparent background-color, so infer
  // light/dark from the text color instead (light text => dark surface).
  const text = parseColor(cs.color, [0, 0, 0]);
  const textLum = (0.2126 * text[0] + 0.7152 * text[1] + 0.0722 * text[2]) / 255;
  const isDark = host.classList.contains('dark') || textLum > 0.5;
  return { accent, accent2, isDark };
}

const INTERACTIVE_SELECTOR =
  'a, button, input, textarea, select, label, [role="button"], [role="dialog"], [data-fx-ignore]';

/** True when a press landed on something that has its own behavior (links, buttons, modals). */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Sizes a full-viewport canvas for the device pixel ratio (capped at 2 for battery). */
export function fitCanvasToViewport(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h };
}
