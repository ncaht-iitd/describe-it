import { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';

// Accessibility menu (modelled on the old VisionText menu): text size, line spacing and
// word spacing with − and + steps, colour theme, and reading mode. Saved in this browser
// and applied on every page; index.html applies the saved values before the page draws.

const TEXT_SIZES = [87.5, 100, 112.5, 125, 150, 175, 200]; // % of the default
const LINE_HEIGHTS = [1.4, 1.6, 1.8, 2.0, 2.2];
const WORD_SPACINGS = [0, 0.08, 0.16, 0.24, 0.32]; // em
const THEMES = [['system', 'Match my device'], ['light', 'Light'], ['dark', 'Dark'], ['contrast', 'High contrast']];
const DEFAULTS = { size: 100, lineHeight: 1.6, wordSpacing: 0, theme: 'system', reading: false };

const read = (key, fallback, parse = (v) => v) => {
  try { const v = localStorage.getItem(key); return v === null ? fallback : parse(v); } catch { return fallback; }
};
const write = (key, value) => { try { localStorage.setItem(key, String(value)); } catch { /* private mode */ } };

function applySettings(s) {
  const root = document.documentElement;
  root.style.fontSize = s.size === 100 ? '' : `${s.size}%`;
  root.style.setProperty('--line-height', String(s.lineHeight));
  root.style.setProperty('--word-spacing', s.wordSpacing ? `${s.wordSpacing}em` : 'normal');
  if (s.theme === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', s.theme);
  if (s.reading) root.setAttribute('data-reading', 'on'); else root.removeAttribute('data-reading');
  write('di-text-scale', s.size);
  write('di-line-height', s.lineHeight);
  write('di-word-spacing', s.wordSpacing);
  write('di-theme', s.theme);
  write('di-reading', s.reading ? 'on' : 'off');
}

const AccessibilityIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="6.5" r="1.8" fill="currentColor" />
    <path d="M6.5 9.5 12 10.5l5.5-1M12 10.5v4.5m0 0-2.5 4.5M12 15l2.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// One "− value +" row. The value is announced after each change.
function Stepper({ id, label, values, value, format, onChange }) {
  const i = values.indexOf(value);
  const index = i === -1 ? values.indexOf(DEFAULTS[id]) : i;
  const btn = 'w-11 h-11 rounded-control border-2 border-control bg-surface text-ink text-xl font-bold leading-none hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed';
  return (
    <div className="flex items-center justify-between gap-3 py-2" role="group" aria-labelledby={`a11y-${id}`}>
      <span id={`a11y-${id}`} className="font-bold">{label}</span>
      <span className="flex items-center gap-2">
        <button type="button" className={btn} onClick={() => onChange(values[index - 1])} disabled={index <= 0} aria-label={`Decrease ${label.toLowerCase()}`}>−</button>
        <output aria-live="polite" className="w-16 text-center font-bold tabular-nums">{format(values[index])}</output>
        <button type="button" className={btn} onClick={() => onChange(values[index + 1])} disabled={index >= values.length - 1} aria-label={`Increase ${label.toLowerCase()}`}>+</button>
      </span>
    </div>
  );
}

Stepper.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  values: PropTypes.arrayOf(PropTypes.number).isRequired,
  value: PropTypes.number,
  format: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
};

const DisplaySettings = () => {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [s, setS] = useState(() => ({
    size: read('di-text-scale', DEFAULTS.size, Number),
    lineHeight: read('di-line-height', DEFAULTS.lineHeight, Number),
    wordSpacing: read('di-word-spacing', DEFAULTS.wordSpacing, Number),
    theme: read('di-theme', DEFAULTS.theme),
    reading: read('di-reading', 'off') === 'on',
  }));
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => { applySettings(s); }, [s]);

  // Escape closes and returns focus to the button; clicking outside closes
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

  const set = (patch) => setS((prev) => ({ ...prev, ...patch }));
  const changed = JSON.stringify(s) !== JSON.stringify(DEFAULTS);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 min-h-[44px] px-3 rounded-full border-2 border-accent bg-accent text-on-accent font-bold text-label hover:bg-accent-hover"
      >
        <AccessibilityIcon />
        <span>Accessibility</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="region"
          aria-label="Accessibility options"
          className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] max-h-[80vh] overflow-y-auto z-50 bg-surface border-theme border-line rounded-card p-5 shadow-lg"
        >
          <h2 className="text-h3 mb-2">Accessibility options</h2>

          <Stepper id="size" label="Text size" values={TEXT_SIZES} value={s.size} format={(v) => `${v}%`} onChange={(v) => set({ size: v })} />
          <Stepper id="lineHeight" label="Line spacing" values={LINE_HEIGHTS} value={s.lineHeight} format={(v) => v.toFixed(1)} onChange={(v) => set({ lineHeight: v })} />
          <Stepper id="wordSpacing" label="Word spacing" values={WORD_SPACINGS} value={s.wordSpacing}
            format={(v) => (v === 0 ? 'Normal' : `+${WORD_SPACINGS.indexOf(v)}`)} onChange={(v) => set({ wordSpacing: v })} />

          <fieldset className="mt-3 pt-3 border-t border-theme border-line">
            <legend className="font-bold mb-1">Colours</legend>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map(([value, text]) => (
                <label key={value} className={`flex items-center gap-2 min-h-[44px] px-3 rounded-control border-2 cursor-pointer ${s.theme === value ? 'border-accent bg-accent-tint' : 'border-line'}`}>
                  <input type="radio" name={`${panelId}-theme`} value={value} checked={s.theme === value}
                    onChange={() => set({ theme: value })} className="w-4 h-4 accent-[var(--accent)]" />
                  <span className="text-small font-bold">{text}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-3 pt-3 border-t border-theme border-line flex items-center justify-between gap-3">
            <div>
              <p className="font-bold" id={`${panelId}-reading`}>Reading mode</p>
              <p className="text-caption text-muted" id={`${panelId}-reading-hint`}>Stops all animation and underlines every link.</p>
            </div>
            <button
              type="button"
              aria-pressed={s.reading}
              aria-labelledby={`${panelId}-reading`}
              aria-describedby={`${panelId}-reading-hint`}
              onClick={() => set({ reading: !s.reading })}
              className={`min-w-[4.5rem] min-h-[44px] px-3 rounded-full border-2 font-bold ${s.reading ? 'bg-accent border-accent text-on-accent' : 'bg-surface border-control text-ink'}`}
            >
              {s.reading ? 'On' : 'Off'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => set(DEFAULTS)}
            disabled={!changed}
            className="mt-4 w-full btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Reset to default
          </button>
        </div>
      )}
    </div>
  );
};

export default DisplaySettings;
