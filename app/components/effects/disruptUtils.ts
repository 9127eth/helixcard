/**
 * Shared helpers for the "disruption" effects (Scramble, Repel, Shatter):
 * finding the pieces of the card a drag can act on.
 */

export const CHUNK_SELECTOR = 'h1, h2, h3, p, a, button, svg, [data-fx="avatar"], [data-fx="chunk"]';

const SKIP_INSIDE = 'canvas, [data-fx-ignore], [role="dialog"], script, style';

/**
 * Visible, top-level "chunks" of the card: headings, paragraphs, links,
 * buttons, standalone icons, the avatar, and anything marked data-fx="chunk"
 * (e.g. the job title / company line). A chunk nested inside another chunk
 * (an icon inside a link) is skipped so each piece is only moved once.
 */
export function collectChunks(host: HTMLElement): HTMLElement[] {
  const all = Array.from(host.querySelectorAll<HTMLElement>(CHUNK_SELECTOR));
  return all.filter((el) => {
    if (el.closest(SKIP_INSIDE)) return false;
    const parentChunk = el.parentElement?.closest(CHUNK_SELECTOR);
    if (parentChunk && host.contains(parentChunk)) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
}

/** Every non-empty text node in the card (excluding effect UI and dialogs). */
export function collectTextNodes(host: HTMLElement): Text[] {
  const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent || parent.closest(SKIP_INSIDE)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  return nodes;
}

/** Distance from a point to a rect (0 when inside). */
export function rectDistance(r: DOMRect, x: number, y: number): number {
  const dx = Math.max(r.left - x, 0, x - r.right);
  const dy = Math.max(r.top - y, 0, y - r.bottom);
  return Math.hypot(dx, dy);
}

export function rectsDistance(rects: DOMRect[], x: number, y: number): number {
  let best = Infinity;
  for (const r of rects) best = Math.min(best, rectDistance(r, x, y));
  return best;
}

export function measureTextRects(node: Text): DOMRect[] {
  const range = document.createRange();
  range.selectNodeContents(node);
  return Array.from(range.getClientRects());
}
