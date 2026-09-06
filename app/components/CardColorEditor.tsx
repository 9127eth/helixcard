import React, { useEffect, useState } from 'react';
import { CARD_COLOR_FIELDS, CardColors, normalizeHexColor } from '../lib/cardColors';

function HexColorInput({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const valid = normalizeHexColor(draft);

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.06] bg-gray-50/70 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full shadow-inner ring-1 ring-black/10 transition focus-within:ring-4 focus-within:ring-[#7CCEDA]/40 dark:ring-white/15"
          style={{ background: value }}
        >
          <input
            type="color"
            aria-label={`${label} color picker`}
            value={value}
            onChange={event => onChange(event.target.value.toUpperCase())}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </span>
        <input
          type="text"
          aria-label={`${label} hex code`}
          aria-invalid={!valid}
          value={draft}
          spellCheck={false}
          maxLength={7}
          pattern="#?[0-9a-fA-F]{6}"
          title="Enter a six-digit hex color, like #7CCEDA."
          onChange={event => {
            setDraft(event.target.value);
            const hex = normalizeHexColor(event.target.value);
            if (hex) onChange(hex);
          }}
          onBlur={() => setDraft(valid || value)}
          className={`w-[5.75rem] rounded-lg border bg-white px-2 py-1.5 font-mono text-xs uppercase tracking-wide transition focus:outline-none focus:ring-4 focus:ring-[#7CCEDA]/25 dark:bg-[#1e1f23] ${valid ? 'border-gray-200 focus:border-[#7CCEDA] dark:border-white/10' : 'border-red-500'}`}
        />
      </div>
    </div>
  );
}

export default function CardColorEditor({ colors, onChange }: {
  colors: CardColors;
  onChange: (colors: CardColors) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {CARD_COLOR_FIELDS.map(({ key, label }) => (
        <HexColorInput key={key} label={label} value={colors[key]} onChange={hex => onChange({ ...colors, [key]: hex })} />
      ))}
    </div>
  );
}
