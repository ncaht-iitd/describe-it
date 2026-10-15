import { useEffect, useId, useRef, useState } from 'react';

// Theme, text size and spacing. Saved in this browser, applied on every page
// (index.html applies them before the page draws). Replaces the old accessibility menu.
const OPTIONS = {
  theme: {
    label: 'Colours',
    storage: 'di-theme',
    attr: 'data-theme',
    choices: [['system', 'Match my device'], ['light', 'Light'], ['dark', 'Dark'], ['contrast', 'High contrast']],
    fallback: 'system',
  },
  size: {
    label: 'Text size',
    storage: 'di-text-size',
    attr: 'data-text-size',
    choices: [['normal', 'Default'], ['large', 'Large'], ['larger', 'Larger'], ['largest', 'Largest']],
    fallback: 'normal',
  },
  spacing: {
    label: 'Spacing',
    storage: 'di-spacing',
    attr: 'data-spacing',
    choices: [['normal', 'Default'], ['wide', 'Wide (easier reading)']],
    fallback: 'normal',
  },
};

const read = (key, fallback) => {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
};

function apply({ attr, storage, fallback }, value) {
  const root = document.documentElement;
  if (value === fallback) root.removeAttribute(attr); else root.setAttribute(attr, value);
  try { localStorage.setItem(storage, value); } catch { /* private mode: still applies for this visit */ }
}

const DisplaySettings = () => {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(() =>
    Object.fromEntries(Object.entries(OPTIONS).map(([k, o]) => [k, read(o.storage, o.fallback)])));
  const panelId = useId();
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  // Close with Escape (focus returns to the button) or by clicking outside
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); buttonRef.current?.focus(); } };
    const onClick = (e) => {
      if (!panelRef.current?.contains(e.target) && !buttonRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, [open]);

  const choose = (key, value) => {
    apply(OPTIONS[key], value);
    setValues((v) => ({ ...v, [key]: value }));
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-control border-2 border-control text-ink bg-surface font-bold text-label hover:border-accent"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
        </svg>
        Display
      </button>
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] z-50 bg-surface border-theme border-line rounded-card p-5 shadow-lg"
        >
          {Object.entries(OPTIONS).map(([key, o]) => (
            <fieldset key={key} className="mb-4 last:mb-0">
              <legend className="font-bold text-label mb-2">{o.label}</legend>
              <div className="flex flex-col gap-1">
                {o.choices.map(([value, text]) => (
                  <label key={value} className="flex items-center gap-3 min-h-[44px] px-2 rounded-control cursor-pointer hover:bg-accent-tint">
                    <input
                      type="radio"
                      name={`${panelId}-${key}`}
                      value={value}
                      checked={values[key] === value}
                      onChange={() => choose(key, value)}
                      className="w-5 h-5 accent-[var(--accent)]"
                    />
                    {text}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      )}
    </div>
  );
};

export default DisplaySettings;
