'use client';

import React, { useEffect, useState } from 'react';

interface FxHintProps {
  /** sessionStorage key so the hint shows once per session */
  storageKey: string;
  /** Text for mouse/trackpad viewers */
  text: string;
  /** Text for touch viewers (defaults to `text`) */
  touchText?: string;
  delay?: number;
  duration?: number;
}

/**
 * A small pill in the design's button colors that teaches a hidden gesture.
 * Appears once per session, then hides on a timer or on the first press.
 */
const FxHint: React.FC<FxHintProps> = ({ storageKey, text, touchText, delay = 1400, duration = 4600 }) => {
  const [show, setShow] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    let seen = false;
    try {
      seen = sessionStorage.getItem(storageKey) === '1';
    } catch {
      /* storage unavailable */
    }
    if (seen) return;
    const markSeen = () => {
      try {
        sessionStorage.setItem(storageKey, '1');
      } catch {
        /* storage unavailable */
      }
    };
    const showTimer = window.setTimeout(() => setShow(true), delay);
    const hideTimer = window.setTimeout(() => {
      setShow(false);
      markSeen();
    }, delay + duration);
    const onPress = () => {
      setShow(false);
      markSeen();
    };
    window.addEventListener('pointerdown', onPress, { once: true });
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      window.removeEventListener('pointerdown', onPress);
    };
  }, [storageKey, delay, duration]);

  if (!show) return null;
  return (
    <div
      aria-hidden="true"
      data-fx-ignore=""
      className="fx-hint fixed bottom-5 left-1/2 z-40 -translate-x-1/2 pointer-events-none whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium shadow-lg bg-[var(--save-contact-button-bg)] text-[var(--save-contact-button-text)]"
    >
      {isTouch && touchText ? touchText : text}
    </div>
  );
};

export default FxHint;
