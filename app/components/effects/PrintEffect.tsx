'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { cardContent, concealContent, EffectHost, useReducedMotion } from './surfaceUtils';

/** Temporarily unused — commented out of CARD_EFFECTS. Restore with the print case in CardEffectLayer.
 *  A mechanical impression: the upward stroke closes the platen onto the stock. */
export default function PrintEffect({ host }: { host: EffectHost }) {
  const gateRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const armsRef = useRef<SVGPathElement>(null);
  const platenRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const machineRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<() => void>(() => {});
  const [printed, setPrinted] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    el.dataset.fxRevealed = String(printed || reduced);
    if (printed || reduced) return () => { delete el.dataset.fxRevealed; };
    const gate = gateRef.current, handle = handleRef.current, arms = armsRef.current;
    const platen = platenRef.current, paper = paperRef.current, machine = machineRef.current;
    if (!gate || !handle || !arms || !platen || !paper || !machine) return;
    const restore = concealContent(el);
    const animations: Animation[] = [];
    const timers: number[] = [];
    let phase: 'idle' | 'pulling' | 'stamping' = 'idle';
    let pointer: number | null = null, downY = 0, progress = 0, raf = 0;
    let startHandleY = 250, machineHeight = 300;

    const paint = (amount: number) => {
      progress = Math.max(0, Math.min(1, amount));
      // The handle ends trace an arc around two fixed hinge pins.
      const angle = (12 + progress * 130) * Math.PI / 180;
      const x = 36 + Math.sin(angle) * 66;
      const y = 108 + Math.cos(angle) * 145;
      arms.setAttribute('d', `M36 108 L${x} ${y} M484 108 L${520 - x} ${y}`);
      handle.style.left = `${x / 520 * 100}%`;
      handle.style.width = `${(520 - 2 * x) / 520 * 100}%`;
      handle.style.top = `${y / 300 * 100}%`;
      platen.style.transform = `perspective(1100px) rotateX(${78 * (1 - progress)}deg)`;
      platen.style.opacity = String(Math.max(0, Math.min(1, progress * 2.5)));
    };
    const tween = (to: number, duration: number, done?: () => void) => {
      cancelAnimationFrame(raf);
      const from = progress, start = performance.now();
      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        // Pulling into the stop accelerates; an incomplete stroke eases home.
        const eased = to === 1 ? t * t * t : 1 - Math.pow(1 - t, 3);
        paint(from + (to - from) * eased);
        if (t < 1) raf = requestAnimationFrame(frame);
        else { raf = 0; done?.(); }
      };
      raf = requestAnimationFrame(frame);
    };
    const impression = () => {
      const content = cardContent(el), rect = content.getBoundingClientRect();
      const contactY = platen.getBoundingClientRect().bottom;
      const line = Math.max(0, Math.min(rect.height, contactY - rect.top));
      // Keep the blank stock until the plate actually makes contact. Ink then
      // spreads in both directions from that horizontal line, not a radial unlock.
      el.dataset.fxRevealed = 'true';
      gate.dataset.pressState = 'impression';
      restore();
      animations.push(content.animate([
        { clipPath: `inset(${line}px 0 ${rect.height - line}px 0)`, transform: 'translateY(5px) scaleY(.985)', transformOrigin: `50% ${line}px`, offset: 0 },
        { clipPath: 'inset(0px 0 0px 0)', transform: 'translateY(-2px) scaleY(1.006)', transformOrigin: `50% ${line}px`, offset: 0.65 },
        { clipPath: 'inset(0px 0 0px 0)', transform: 'none', transformOrigin: `50% ${line}px`, offset: 1 },
      ], { duration: 420, easing: 'cubic-bezier(.12,.75,.2,1)' }));
      animations.push(paper.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 210, fill: 'forwards' }));
      animations.push(platen.animate([
        { transform: 'perspective(1100px) rotateX(0deg) scaleY(1)', opacity: 1, offset: 0 },
        { transform: 'perspective(1100px) rotateX(0deg) scaleY(.992)', opacity: 1, offset: 0.12 },
        { transform: 'perspective(1100px) rotateX(82deg) scaleY(1)', opacity: 0, offset: 1 },
      ], { duration: 440, easing: 'cubic-bezier(.2,.8,.25,1)', fill: 'forwards' }));
      animations.push(machine.animate([
        { transform: 'translateX(-50%) translateY(0)', opacity: 1 },
        { transform: 'translateX(-50%) translateY(30px)', opacity: 0 },
      ], { duration: 340, delay: 200, fill: 'forwards', easing: 'ease-in' }));
      timers.push(window.setTimeout(() => setPrinted(true), 560));
    };
    const press = () => {
      if (phase === 'stamping') return;
      phase = 'stamping'; pointer = null;
      gate.dataset.pressState = 'stamping';
      tween(1, progress > 0 ? 110 : 340, impression);
    };
    printRef.current = press;
    const cancel = () => {
      if (phase === 'stamping') return;
      pointer = null; phase = 'idle'; gate.dataset.pressState = 'idle';
      tween(0, 300);
    };
    const down = (e: PointerEvent) => {
      if (!e.isPrimary || e.button !== 0 || pointer !== null || phase === 'stamping') return;
      cancelAnimationFrame(raf);
      pointer = e.pointerId; downY = e.clientY; phase = 'pulling';
      machineHeight = Math.max(1, machine.getBoundingClientRect().height);
      startHandleY = 108 + Math.cos((12 + progress * 130) * Math.PI / 180) * 145;
      gate.dataset.pressState = 'pulling';
      handle.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      // Invert the arc so the bar stays under the finger, including re-grabs
      // partway through its return stroke.
      const y = startHandleY - (downY - e.clientY) / machineHeight * 300;
      const angle = Math.acos(Math.max(-1, Math.min(1, (y - 108) / 145))) * 180 / Math.PI;
      paint((angle - 12) / 130);
      if (progress >= 0.86) press();
    };
    const end = (e: PointerEvent) => { if (e.pointerId === pointer) cancel(); };
    const preventDefault = (e: Event) => e.preventDefault();
    paint(0);
    handle.addEventListener('pointerdown', down); handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end); handle.addEventListener('pointercancel', end);
    handle.addEventListener('lostpointercapture', end); gate.addEventListener('contextmenu', preventDefault);
    gate.addEventListener('wheel', preventDefault, { passive: false });
    window.addEventListener('blur', cancel); window.addEventListener('resize', cancel);
    return () => {
      printRef.current = () => {};
      restore(); cancelAnimationFrame(raf); timers.forEach(window.clearTimeout);
      animations.forEach(animation => animation.cancel());
      delete el.dataset.fxRevealed;
      handle.removeEventListener('pointerdown', down); handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end); handle.removeEventListener('pointercancel', end);
      handle.removeEventListener('lostpointercapture', end); gate.removeEventListener('contextmenu', preventDefault);
      gate.removeEventListener('wheel', preventDefault);
      window.removeEventListener('blur', cancel); window.removeEventListener('resize', cancel);
    };
  }, [host, printed, reduced]);

  if (printed || reduced) return null;
  return <div ref={gateRef} className="fx-gate fx-letterpress" data-press-state="idle" data-fx-ignore data-fx-control>
    <div ref={paperRef} className="fx-print-paper fx-print-stock" aria-hidden="true" />
    <div ref={platenRef} className="fx-print-platen" aria-hidden="true">
      <div className="fx-print-plate-face" />
      <span className="fx-print-contact-line" />
    </div>
    <div ref={machineRef} className="fx-print-machine">
      <svg className="fx-print-linkage" viewBox="0 0 520 300" preserveAspectRatio="none" aria-hidden="true">
        <path d="M36 108 H484" className="fx-print-axle" />
        <path ref={armsRef} d="M36 108 L50 250 M484 108 L470 250" className="fx-print-arms" />
        <circle cx="36" cy="108" r="9" className="fx-print-hinge" />
        <circle cx="484" cy="108" r="9" className="fx-print-hinge" />
        <circle cx="36" cy="108" r="2.5" className="fx-print-pin" />
        <circle cx="484" cy="108" r="2.5" className="fx-print-pin" />
      </svg>
      <button ref={handleRef} type="button" className="fx-print-handle" aria-label="Pull the letterpress handle up to print the card, or press Enter"
        onClick={e => { if (e.detail === 0) printRef.current(); }}>
        <ChevronUp size={17} strokeWidth={1.5} aria-hidden="true" />
        <span>Pull to print</span>
      </button>
    </div>
  </div>;
}
