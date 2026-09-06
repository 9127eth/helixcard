import React, { useState, useEffect, useRef, useId } from 'react';
import { ChevronDown } from 'react-feather';

interface CollapsibleSectionProps {
  title: string;
  isOpen?: boolean;
  children: React.ReactNode;
  /** Small icon shown in a tinted tile to the left of the title */
  icon?: React.ReactNode;
  /** One-line helper text under the title */
  description?: string;
  /** Optional element rendered next to the title (e.g. a Pro badge) */
  badge?: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, isOpen, icon, description, badge }) => {
  const [open, setOpen] = useState(isOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  const contentId = useId();

  const toggleSection = () => {
    setOpen(!open);
  };

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  // Animate max-height on toggle, then release it (`none`) so content that grows
  // while open (new links, validation text, native dropdowns) is never clipped.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    if (firstRender.current) {
      firstRender.current = false;
      el.style.maxHeight = open ? 'none' : '0px';
      return;
    }

    if (open) {
      el.style.maxHeight = `${el.scrollHeight}px`;
      const release = () => {
        el.style.maxHeight = 'none';
      };
      const fallback = window.setTimeout(release, 600);
      const onEnd = (event: TransitionEvent) => {
        if (event.target === el && event.propertyName === 'max-height') {
          window.clearTimeout(fallback);
          release();
        }
      };
      el.addEventListener('transitionend', onEnd);
      return () => {
        window.clearTimeout(fallback);
        el.removeEventListener('transitionend', onEnd);
      };
    }

    // Closing: pin the current height first so the collapse animates from it.
    el.style.maxHeight = `${el.scrollHeight}px`;
    void el.offsetHeight;
    el.style.maxHeight = '0px';
  }, [open]);

  return (
    <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-[#2c2d31] dark:shadow-none">
      <button
        type="button"
        onClick={toggleSection}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-50 dark:hover:bg-white/[0.03] dark:focus-visible:bg-white/[0.03] sm:px-5"
      >
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7CCEDA]/15 text-[#2E7C89] dark:bg-[#7CCEDA]/10 dark:text-[#7CCEDA]">
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-semibold tracking-tight">{title}</span>
            {badge}
          </span>
          {description && (
            <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{description}</span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        id={contentId}
        ref={contentRef}
        className="overflow-hidden transition-[max-height] duration-500 ease-in-out"
      >
        <div
          className={`border-t border-black/[0.06] px-4 pb-5 pt-4 transition-opacity duration-300 dark:border-white/10 sm:px-5 ${open ? 'opacity-100' : 'opacity-0'}`}
        >
          {children}
        </div>
      </div>
    </section>
  );
};

export default CollapsibleSection;
