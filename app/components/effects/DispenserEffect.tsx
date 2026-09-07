'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cardContent, concealContent, EffectHost, useReducedMotion } from './surfaceUtils';

/** How much of the card hangs out of the slot at rest: the grab edge, in px. */
const PEEK = 46;

type Label = { name: string; title: string; image: string };

const clean = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();

/** The card in the slot is a miniature of the real one, read from the concealed content. */
function readLabel(host: HTMLElement): Label {
  const content = cardContent(host);
  const heading = content.querySelector('h1');
  const name = heading
    ? clean(Array.from(heading.childNodes).filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join(' '))
    : '';
  const photo = content.querySelector<HTMLImageElement>('[data-fx="avatar"] img');
  return { name, title: clean(content.querySelector('[data-fx="chunk"]')?.textContent), image: photo?.currentSrc || photo?.src || '' };
}

const opaque = (color: string) => Boolean(color) && color !== 'transparent' && !/^rgba\(.*,\s*0\)$/.test(color);

/**
 * A wall-mounted "take one" holder. The card in its slot slides out under the
 * finger and, once free, grows into the page. The gate owns every touch that
 * starts on it (touch-action: none, cancelled touchmove, overscroll-behavior:
 * none on the root), so pulling the card down never becomes pull-to-refresh.
 */
export default function DispenserEffect({ host }: { host: EffectHost }) {
  const gateRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLButtonElement>(null);
  const takeRef = useRef<() => void>(() => {});
  const [taken, setTaken] = useState(false);
  const [label, setLabel] = useState<Label>({ name: '', title: '', image: '' });
  const reduced = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  // Mirror the concealed card's name, title, and photo, live while the owner edits.
  useEffect(() => {
    const el = host.current;
    if (!el || taken || reduced) return;
    const sync = () => setLabel(previous => {
      const next = readLabel(el);
      return previous.name === next.name && previous.title === next.title && previous.image === next.image ? previous : next;
    });
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(cardContent(el), { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['src'] });
    return () => observer.disconnect();
  }, [host, taken, reduced]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    el.dataset.fxRevealed = String(taken || reduced);
    if (taken || reduced) return () => { delete el.dataset.fxRevealed; };
    const gate = gateRef.current, mount = mountRef.current, card = cardRef.current;
    if (!gate || !mount || !card) return;
    const restore = concealContent(el);
    // The miniature borrows the page's own surface (a gradient for the scenic designs).
    const surface = getComputedStyle(el), body = getComputedStyle(document.body);
    gate.style.setProperty('--fx-surface-image', surface.backgroundImage);
    gate.style.setProperty('--fx-surface-color', opaque(surface.backgroundColor) ? surface.backgroundColor : opaque(body.backgroundColor) ? body.backgroundColor : '#ffffff');
    document.documentElement.classList.add('fx-dispenser-lock');
    const animations: Animation[] = [];
    const timers: number[] = [];
    let phase: 'idle' | 'pulling' | 'taking' = 'idle';
    let pointer: number | null = null, downX = 0, downY = 0, pressedAt = 0, grabbed = 0;
    let progress = 0, sway = 0, raf = 0;
    let travel = Math.max(1, card.offsetHeight - PEEK);

    const paint = (amount: number, tilt = 0) => {
      progress = Math.max(0, Math.min(1, amount));
      sway = tilt;
      card.style.transform = `translateY(${-(1 - progress) * travel}px) rotate(${sway}deg)`;
      gate.style.setProperty('--fx-pull', progress.toFixed(3));
    };
    const tween = (to: number, duration: number, done?: () => void) => {
      cancelAnimationFrame(raf);
      const from = progress, tilt = sway, start = performance.now();
      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        // Sliding free accelerates; a card let go eases back into the clip.
        const eased = to > from ? t * t : 1 - Math.pow(1 - t, 3);
        paint(from + (to - from) * eased, tilt * (1 - eased));
        if (t < 1) raf = requestAnimationFrame(frame);
        else { raf = 0; done?.(); }
      };
      raf = requestAnimationFrame(frame);
    };
    const land = () => {
      const from = card.getBoundingClientRect();
      el.dataset.fxRevealed = 'true';
      gate.dataset.dispenserState = 'landed';
      restore();
      // The wall opens along the card's silhouette and keeps opening until the
      // whole page shows: the card in hand becomes the page.
      const hole = (top: number, right: number, bottom: number, left: number) =>
        `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${left}px ${top}px, ${left}px ${bottom}px, ${right}px ${bottom}px, ${right}px ${top}px, ${left}px ${top}px)`;
      animations.push(gate.animate([
        { clipPath: hole(from.top, from.right, from.bottom, from.left) },
        { clipPath: hole(-40, window.innerWidth + 40, window.innerHeight + 40, -40) },
      ], { duration: 560, easing: 'cubic-bezier(.2,.75,.2,1)', fill: 'forwards' }));
      // The holder recoils as the clip lets go, then lifts away behind the opening.
      animations.push(mount.animate([
        { transform: 'translateY(0)', offset: 0 },
        { transform: 'translateY(-5px)', offset: 0.18 },
        { transform: 'translateY(-140%)', offset: 1 },
      ], { duration: 560, delay: 40, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }));
      timers.push(window.setTimeout(() => setTaken(true), 640));
    };
    const take = () => {
      if (phase === 'taking') return;
      phase = 'taking'; pointer = null;
      gate.dataset.dispenserState = 'taking';
      tween(1, progress > 0.6 ? 90 : 420, land);
    };
    takeRef.current = take;
    const settle = () => {
      if (phase === 'taking') return;
      pointer = null; phase = 'idle'; gate.dataset.dispenserState = 'idle';
      tween(0, 420);
    };
    const down = (e: PointerEvent) => {
      if (!e.isPrimary || e.button !== 0 || pointer !== null || phase === 'taking') return;
      cancelAnimationFrame(raf);
      travel = Math.max(1, card.offsetHeight - PEEK);
      pointer = e.pointerId; downX = e.clientX; downY = e.clientY; pressedAt = performance.now();
      grabbed = progress; phase = 'pulling';
      gate.dataset.dispenserState = 'pulling';
      card.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      // The card follows the finger 1:1 and swings a little from the point the clip holds it.
      paint(grabbed + (e.clientY - downY) / travel, Math.max(-6, Math.min(6, (e.clientX - downX) * 0.05)));
      if (progress >= 0.98) take();
    };
    const end = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      const tap = progress < 0.04 && performance.now() - pressedAt < 260;
      settle();
      // A tap without a pull tugs the card to show it is loose.
      if (tap) tween(0.16, 140, () => tween(0, 360));
    };
    const preventDefault = (e: Event) => e.preventDefault();
    const resize = () => { travel = Math.max(1, card.offsetHeight - PEEK); settle(); };
    paint(0);
    card.addEventListener('pointerdown', down); card.addEventListener('pointermove', move);
    card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
    card.addEventListener('lostpointercapture', end); gate.addEventListener('contextmenu', preventDefault);
    gate.addEventListener('wheel', preventDefault, { passive: false });
    gate.addEventListener('touchmove', preventDefault, { passive: false });
    window.addEventListener('blur', settle); window.addEventListener('resize', resize);
    return () => {
      takeRef.current = () => {};
      restore(); cancelAnimationFrame(raf); timers.forEach(window.clearTimeout);
      animations.forEach(animation => animation.cancel());
      delete el.dataset.fxRevealed;
      document.documentElement.classList.remove('fx-dispenser-lock');
      card.removeEventListener('pointerdown', down); card.removeEventListener('pointermove', move);
      card.removeEventListener('pointerup', end); card.removeEventListener('pointercancel', end);
      card.removeEventListener('lostpointercapture', end); gate.removeEventListener('contextmenu', preventDefault);
      gate.removeEventListener('wheel', preventDefault); gate.removeEventListener('touchmove', preventDefault);
      window.removeEventListener('blur', settle); window.removeEventListener('resize', resize);
    };
  }, [host, taken, reduced]);

  if (taken || reduced) return null;
  const initials = label.name.split(' ').filter(Boolean).slice(0, 2).map(word => word[0].toUpperCase()).join('');
  return <div ref={gateRef} className="fx-gate fx-dispenser" data-dispenser-state="idle" data-fx-ignore data-fx-control>
    <div ref={mountRef} className="fx-dispenser-mount">
      <div className="fx-dispenser-window" aria-hidden="true">
        <span className="fx-dispenser-stock" style={{ '--i': 2 } as React.CSSProperties} />
        <span className="fx-dispenser-stock" style={{ '--i': 1 } as React.CSSProperties} />
        <span className="fx-dispenser-stock fx-dispenser-stock-front"><i /><i /><i /></span>
      </div>
      <div className="fx-dispenser-throat" aria-hidden="true" />
      <div className="fx-dispenser-chute">
        <button ref={cardRef} type="button" className="fx-dispenser-card"
          aria-label="Pull the card down out of the holder to open it, or press Enter"
          onClick={e => { if (e.detail === 0) takeRef.current(); }}>
          <span className="fx-dispenser-face" aria-hidden="true">
            <span className="fx-dispenser-avatar" style={label.image ? { backgroundImage: `url("${label.image.replace(/"/g, '%22')}")` } : undefined}>
              {label.image ? '' : initials}
            </span>
            <span className="fx-dispenser-lines">
              <strong>{label.name || ' '}</strong>
              <small>{label.title || ' '}</small>
            </span>
          </span>
          <span className="fx-dispenser-edge" aria-hidden="true">
            <span className="fx-dispenser-pull">
              <ChevronDown size={15} strokeWidth={2.2} aria-hidden="true" />Take one<ChevronDown size={15} strokeWidth={2.2} aria-hidden="true" />
            </span>
          </span>
        </button>
      </div>
      <div className="fx-dispenser-housing" aria-hidden="true">
        <svg viewBox="0 0 360 166">
          <defs>
            <linearGradient id={`${uid}-steel`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f7f7f5" /><stop offset=".55" stopColor="#d2d3cf" /><stop offset="1" stopColor="#e8e8e4" />
            </linearGradient>
            <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4b5059" /><stop offset="1" stopColor="#23262b" />
            </linearGradient>
            <linearGradient id={`${uid}-brass`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f2e7c4" /><stop offset=".5" stopColor="#cdb977" /><stop offset="1" stopColor="#e6d7a5" />
            </linearGradient>
            <mask id={`${uid}-cut`}>
              <rect width="360" height="166" fill="#fff" />
              <rect x="64" y="32" width="232" height="64" rx="6" fill="#000" />
              <path d="M48 153a3 3 0 0 1 3-3h258a3 3 0 0 1 3 3v13H48z" fill="#000" />
            </mask>
          </defs>
          <g mask={`url(#${uid}-cut)`}>
            <rect x="14" y="4" width="332" height="162" rx="14" fill={`url(#${uid}-steel)`} stroke="rgba(0,0,0,.28)" />
            <rect x="40" y="16" width="280" height="150" rx="10" fill={`url(#${uid}-body)`} stroke="#15181c" />
            <rect x="41" y="17" width="278" height="2" rx="1" fill="rgba(255,255,255,.16)" />
          </g>
          <g fill="#cfcfca" stroke="#77776f">
            <circle cx="30" cy="18" r="4" /><circle cx="330" cy="18" r="4" /><circle cx="30" cy="152" r="4" /><circle cx="330" cy="152" r="4" />
          </g>
          <path d="M27 18h6M327 18h6M27 152h6M327 152h6" stroke="#5c5c56" strokeWidth="1.2" strokeLinecap="round" />
          <rect x="64" y="32" width="232" height="64" rx="6" fill="none" stroke="#0b0d10" strokeWidth="3" />
          <rect x="65.5" y="33.5" width="229" height="61" rx="5" fill="none" stroke="rgba(255,255,255,.12)" />
          <path d="M74 92L136 36h42l-62 56z" fill="rgba(255,255,255,.07)" />
          <path d="M48 153a3 3 0 0 1 3-3h258a3 3 0 0 1 3 3v13H48z" fill="rgba(0,0,0,.42)" />
          <path d="M51 150h258" stroke="rgba(255,255,255,.14)" />
          <rect x="92" y="106" width="176" height="26" rx="4" fill={`url(#${uid}-brass)`} stroke="#8b7a4c" />
          <text x="180" y="123" textAnchor="middle" fontSize="10.5" fontWeight="700" letterSpacing="2.4" textLength="142" lengthAdjust="spacing" fill="#3d3420">BUSINESS CARDS</text>
        </svg>
      </div>
    </div>
  </div>;
}
