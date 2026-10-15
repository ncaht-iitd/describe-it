import PropTypes from 'prop-types';

// "Contour to Point" mark from design/DESIGN_GUIDE.md: one continuous D-shaped line
// (the raised contour of a tactile graphic) ending in a dot (the description).
// Colours come from theme tokens, so it adapts to dark and high-contrast modes.
export function LogoMark({ size = 32, title }) {
  const heavy = size < 32; // design guide: heavier strokes below 32px
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <path
        d="M14 52H30A20 20 0 0 0 30 12H14M14 52V38"
        fill="none"
        stroke="var(--logo-line)"
        strokeWidth={heavy ? 9 : 7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="24" r={heavy ? 6 : 5} fill="var(--logo-dot)" />
    </svg>
  );
}

LogoMark.propTypes = { size: PropTypes.number, title: PropTypes.string };

// Mark + wordmark. "Describe" in the text colour, "-it" in the accent colour.
// The visible wordmark is the accessible name, so the mark itself is hidden.
export function LogoLockup({ fontSize = 24 }) {
  return (
    <span className="inline-flex items-center" style={{ gap: fontSize * 0.45 }}>
      <LogoMark size={Math.round(fontSize * 1.65)} />
      <span
        className="font-heading font-semibold text-ink"
        style={{ fontSize: `${fontSize / 16}rem`, letterSpacing: '-0.03em', lineHeight: 1 }}
      >
        Describe<span style={{ color: 'var(--logo-dot)' }}>-it</span>
      </span>
    </span>
  );
}

LogoLockup.propTypes = { fontSize: PropTypes.number };
