import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

// Animated marks from the design guide's "Motion Ideas". Rules:
// - Purely decorative: every animation is aria-hidden and sits next to visible text.
// - Nothing loops forever unless it shows real ongoing work (loading); feature icons
//   play a few cycles when they come into view, then rest. Hover or focus replays them.
// - prefers-reduced-motion: index.css cuts every animation to its final frame.

export function useReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return undefined;
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** True once the element has scrolled into view. */
export function useInView(ref, { threshold = 0.35 } = {}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setInView(true); return undefined; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); io.disconnect(); }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
  return inView;
}

/** Wrap a section so it eases in when scrolled to. Content is visible if JS or the observer is missing. */
export function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const [state, setState] = useState('idle'); // idle -> pending -> in
  useEffect(() => {
    if (reduced || !('IntersectionObserver' in window)) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    // Already on screen: don't hide it
    if (el.getBoundingClientRect().top < window.innerHeight) return undefined;
    setState('pending');
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setState('in'); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);
  const cls = state === 'pending' ? 'reveal-pending' : state === 'in' ? 'reveal-in' : '';
  return <Tag ref={ref} className={`${className} ${cls}`} {...rest}>{children}</Tag>;
}
Reveal.propTypes = { as: PropTypes.elementType, className: PropTypes.string, children: PropTypes.node };

// Shared SVG frame. `play` starts the animation; `cycles` limits repeats ('infinite' for real loading).
const Frame = ({ size, children }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false" className="shrink-0 overflow-visible">
    {children}
  </svg>
);
Frame.propTypes = { size: PropTypes.number, children: PropTypes.node };

const CONTOUR = 'M14 52H30A20 20 0 0 0 30 12H14M14 52V38';
const anim = (play, name, dur, cycles, extra = '') =>
  (play ? { animation: `${name} ${dur} ${extra} ${cycles}` } : { animation: 'none' });

/** Loading: an accent segment traces the contour. */
export function TraceIcon({ size = 56, play = true, cycles = 'infinite' }) {
  return (
    <Frame size={size}>
      <path d={CONTOUR} pathLength="1" fill="none" stroke="var(--border)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d={CONTOUR} pathLength="1" fill="none" stroke="var(--accent)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: '.22 .78', ...anim(play, 'di-trace', '1.6s', cycles, 'linear') }} />
      <circle cx="14" cy="24" r="5" fill="var(--logo-dot)" />
    </Frame>
  );
}

const CELL = [[24, 18], [24, 32], [24, 46], [40, 18], [40, 32], [40, 46]];

/** Thinking: the six dots of a braille cell light in turn. */
export function BrailleThinkingIcon({ size = 56, play = true, cycles = 'infinite' }) {
  return (
    <Frame size={size}>
      {CELL.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="5.5" fill="var(--accent)"
          style={{ transformBox: 'fill-box', transformOrigin: 'center', opacity: play ? undefined : 1,
            ...anim(play, 'di-pulse', '1.5s', cycles, `ease-in-out ${i * 0.2}s`) }} />
      ))}
    </Frame>
  );
}

const LINES = [[18, 40], [30, 32], [42, 36]];

/** Writing a description: lines write in beside a blinking dot. */
export function WritingIcon({ size = 56, play = true, cycles = 'infinite' }) {
  return (
    <Frame size={size}>
      {LINES.map(([y, w], i) => (
        <rect key={y} x="14" y={y} width={w} height="7" rx="3.5" fill="var(--ink)"
          style={{ transformBox: 'fill-box', transformOrigin: 'left center',
            ...anim(play, 'di-write', '3.6s', cycles, `ease-out ${i * 0.45}s backwards`) }} />
      ))}
      <circle cx="7" cy="21.5" r="4" fill="var(--logo-dot)" style={anim(play, 'di-cursor', '1s', cycles, 'ease-in-out')} />
    </Frame>
  );
}

const RING = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
  return [32 + 20 * Math.cos(a), 32 + 20 * Math.sin(a)];
});

/** Creating a tactile graphic: dots rise one by one into a ring, like embossing. */
export function TactileRiseIcon({ size = 56, play = true, cycles = 'infinite' }) {
  return (
    <Frame size={size}>
      {RING.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="5" fill={i % 2 ? 'var(--ink)' : 'var(--accent)'}
          style={{ transformBox: 'fill-box', transformOrigin: 'center',
            ...anim(play, 'di-rise', '3.2s', cycles, `ease-out ${i * 0.15}s backwards`) }} />
      ))}
    </Frame>
  );
}

/** Saved: a ring closes and a check draws itself. Plays once. */
export function SavedIcon({ size = 28 }) {
  return (
    <Frame size={size}>
      <circle cx="32" cy="32" r="26" pathLength="1" fill="none" stroke="var(--success)" strokeWidth="6" strokeLinecap="round"
        transform="rotate(-90 32 32)" style={{ strokeDasharray: 1, animation: 'di-draw .45s ease-out both' }} />
      <path d="M21 33L29 41L44 24" pathLength="1" fill="none" stroke="var(--success)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: 1, animation: 'di-draw .35s ease-out .35s both' }} />
    </Frame>
  );
}

/** Empty state: a dotted contour with the dot bobbing, as if looking around. */
export function EmptyIcon({ size = 72, cycles = 3 }) {
  return (
    <Frame size={size}>
      <path d={CONTOUR} fill="none" stroke="var(--control-border)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 9" />
      <circle cx="14" cy="24" r="5" fill="var(--logo-dot)" style={{ animation: `di-sniff 2.4s ease-in-out ${cycles}` }} />
    </Frame>
  );
}

const iconProps = { size: PropTypes.number, play: PropTypes.bool, cycles: PropTypes.oneOfType([PropTypes.number, PropTypes.string]) };
[TraceIcon, BrailleThinkingIcon, WritingIcon, TactileRiseIcon].forEach((c) => { c.propTypes = iconProps; });
SavedIcon.propTypes = { size: PropTypes.number };
EmptyIcon.propTypes = { size: PropTypes.number, cycles: PropTypes.oneOfType([PropTypes.number, PropTypes.string]) };

/** Loading message with the trace mark. The text is what screen readers announce. */
export function LoadingStatus({ children }) {
  return (
    <p role="status" className="flex items-center gap-3 text-muted">
      <TraceIcon size={32} />
      <span>{children}</span>
    </p>
  );
}
LoadingStatus.propTypes = { children: PropTypes.node };

/** Logo reveal: the contour draws, the dot drops with a squash and ripple, the letters rise. Plays once. */
export function LogoReveal({ size = 120 }) {
  const reduced = useReducedMotion();
  const letters = 'Describe-it'.split('');
  return (
    <div className="flex items-center gap-4" aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size} height={size} focusable="false" className="overflow-visible">
        <path d={CONTOUR} pathLength="1" fill="none" stroke="var(--logo-line)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"
          style={{ strokeDasharray: 1, animation: reduced ? 'none' : 'di-draw .9s cubic-bezier(.65,0,.35,1) both' }} />
        <circle cx="14" cy="24" r="5" fill="var(--logo-dot)" style={{ transformBox: 'fill-box', transformOrigin: 'center', opacity: 0,
          animation: 'di-ripple .7s ease-out 1.25s both' }} />
        <circle cx="14" cy="24" r="5" fill="var(--logo-dot)" style={{ transformBox: 'fill-box', transformOrigin: 'center bottom',
          animation: 'di-drop .75s ease-out .85s both' }} />
      </svg>
      <span className="font-heading font-semibold text-ink" style={{ fontSize: size * 0.42, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {letters.map((ch, i) => (
          <span key={i} className="inline-block" style={{ color: i >= 8 ? 'var(--logo-dot)' : undefined,
            animation: `di-letter .5s ease-out ${1.1 + i * 0.045}s both` }}>{ch}</span>
        ))}
      </span>
    </div>
  );
}
LogoReveal.propTypes = { size: PropTypes.number };

/** Plays its icon once it is in view, and again on hover or keyboard focus. */
export function useReplayOnInteraction(ref) {
  const inView = useInView(ref);
  const [round, setRound] = useState(0);
  const replay = () => setRound((r) => r + 1);
  return { play: inView, key: round, handlers: { onMouseEnter: replay, onFocus: replay } };
}
