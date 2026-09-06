'use client';

import React, { useEffect, useRef, useState } from 'react';
import { clamp, prefersReducedMotion, readThemeColors } from './effectUtils';

interface HoloEffectProps {
  host: React.RefObject<HTMLDivElement | null>;
}

type OrientationCtor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

// Degrees of phone tilt that map to full sheen travel
const TILT_RANGE_DEG = 22;

const HoloEffect: React.FC<HoloEffectProps> = ({ host }) => {
  const [askTilt, setAskTilt] = useState(false);
  const enableTiltRef = useRef<() => void>(() => {});

  useEffect(() => {
    const hostEl = host.current;
    if (!hostEl || prefersReducedMotion()) return;

    const colors = readThemeColors(hostEl);
    hostEl.classList.add('fx-holo');
    hostEl.dataset.fxSurface = colors.isDark ? 'dark' : 'light';

    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;
    let raf = 0;
    let running = false;
    let usingOrientation = false;
    let baseBeta: number | null = null;
    let baseGamma: number | null = null;

    const apply = () => {
      hostEl.style.setProperty('--tilt-x', curX.toFixed(4));
      hostEl.style.setProperty('--tilt-y', curY.toFixed(4));
    };

    const loop = () => {
      curX += (targetX - curX) * 0.14;
      curY += (targetY - curY) * 0.14;
      apply();
      if (Math.abs(targetX - curX) > 0.001 || Math.abs(targetY - curY) > 0.001) {
        raf = requestAnimationFrame(loop);
      } else {
        running = false;
      }
    };

    // A full-width header rotated in 3D overflows the viewport on wide screens,
    // so the tilt amplitude shrinks as the viewport grows (full strength on phones).
    const tiltScale = () => clamp(480 / window.innerWidth, 0.3, 1);

    const setTarget = (x: number, y: number) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      const s = tiltScale();
      targetX = clamp(x, -1, 1) * s;
      targetY = clamp(y, -1, 1) * s;
      if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };

    const fromViewport = (clientX: number, clientY: number) =>
      setTarget((clientX / window.innerWidth) * 2 - 1, (clientY / window.innerHeight) * 2 - 1);

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') fromViewport(e.clientX, e.clientY);
    };

    // Touch fallback when there is no gyroscope: the finger steers the tilt.
    // touchmove (not pointermove) keeps firing while the page scrolls.
    const onTouchMove = (e: TouchEvent) => {
      if (usingOrientation || e.touches.length === 0) return;
      fromViewport(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => {
      if (!usingOrientation) setTarget(0, 0);
    };

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      if (baseBeta === null || baseGamma === null) {
        baseBeta = e.beta;
        baseGamma = e.gamma;
      }
      // Slowly re-center on however the phone is actually being held
      baseBeta += (e.beta - baseBeta) * 0.01;
      baseGamma += (e.gamma - baseGamma) * 0.01;
      usingOrientation = true;
      setTarget((e.gamma - baseGamma) / TILT_RANGE_DEG, (e.beta - baseBeta) / TILT_RANGE_DEG);
    };

    const Orientation = (
      typeof DeviceOrientationEvent !== 'undefined' ? DeviceOrientationEvent : undefined
    ) as OrientationCtor | undefined;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    let orientationBound = false;
    const bindOrientation = () => {
      if (orientationBound) return;
      orientationBound = true;
      window.addEventListener('deviceorientation', onOrientation);
    };

    if (Orientation && typeof Orientation.requestPermission === 'function') {
      // iOS: motion access must be requested from a user gesture
      if (isTouchDevice) setAskTilt(true);
      enableTiltRef.current = () => {
        Orientation.requestPermission!()
          .then((state) => {
            if (state === 'granted') bindOrientation();
          })
          .catch(() => {
            /* denied or unavailable; touch fallback stays active */
          })
          .finally(() => setAskTilt(false));
      };
    } else if (Orientation && isTouchDevice) {
      bindOrientation();
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    hostEl.addEventListener('touchmove', onTouchMove, { passive: true });
    hostEl.addEventListener('touchend', onTouchEnd, { passive: true });
    hostEl.addEventListener('touchcancel', onTouchEnd, { passive: true });
    apply();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('deviceorientation', onOrientation);
      hostEl.removeEventListener('touchmove', onTouchMove);
      hostEl.removeEventListener('touchend', onTouchEnd);
      hostEl.removeEventListener('touchcancel', onTouchEnd);
      hostEl.classList.remove('fx-holo');
      delete hostEl.dataset.fxSurface;
      hostEl.style.removeProperty('--tilt-x');
      hostEl.style.removeProperty('--tilt-y');
    };
  }, [host]);

  return (
    <>
      <div className="fx-holo-sheen" aria-hidden="true" />
      {askTilt && (
        <button
          type="button"
          onClick={() => enableTiltRef.current()}
          className="fx-hint fixed bottom-5 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium shadow-lg bg-[var(--save-contact-button-bg)] text-[var(--save-contact-button-text)]"
        >
          ✦ Enable tilt
        </button>
      )}
    </>
  );
};

export default HoloEffect;
