import { useRef } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { TraceIcon, WritingIcon, BrailleThinkingIcon, TactileRiseIcon, useReplayOnInteraction } from './Motion';

// "What you can do" tiles. Each icon plays twice when it scrolls into view (the modern
// version of the old site's icon-turns-into-GIF effect), and again on hover or focus.
// Two cycles keep movement under 5 seconds (WCAG 2.2.2), so no pause button is needed.
function AnimatedTile({ Icon, title, text, to, linkText, headingLevel: Heading }) {
  const ref = useRef(null);
  const { play, key, handlers } = useReplayOnInteraction(ref);
  return (
    <li ref={ref} className="card relative p-6 flex flex-col gap-3 hover:border-accent focus-within:border-accent transition-colors duration-150" {...handlers}>
      <div className="h-16 flex items-center" key={key}>
        <Icon size={64} play={play} cycles={2} />
      </div>
      <Heading className="text-h3">
        {to ? (
          <Link to={to} className="text-ink no-underline hover:underline after:absolute after:inset-0">{title}</Link>
        ) : title}
      </Heading>
      <p className="text-small text-muted">{text}</p>
      {to && linkText && <p aria-hidden="true" className="mt-auto font-bold text-accent">{linkText} →</p>}
    </li>
  );
}

AnimatedTile.propTypes = {
  Icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  text: PropTypes.node.isRequired,
  to: PropTypes.string,
  linkText: PropTypes.string,
  headingLevel: PropTypes.oneOf(['h2', 'h3']).isRequired,
};

export function FeatureList() {
  const features = [
    [TraceIcon, 'Find a diagram', 'Search by topic or browse a collection of NCERT textbook diagrams.'],
    [WritingIcon, 'Read a clear description', 'Every description is written for screen reader users: what is shown, where, and why it matters.'],
    [BrailleThinkingIcon, 'Ask follow-up questions', 'Not sure about a detail? Ask about the diagram in English or Hindi, by typing or speaking.'],
    [TactileRiseIcon, 'Get a tactile version', 'Download a print-ready tactile graphic for swell paper or embossing, where one is available.'],
  ];
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 list-none p-0 m-0">
      {features.map(([Icon, title, text]) => (
        <AnimatedTile key={title} Icon={Icon} title={title} text={text} headingLevel="h3" />
      ))}
    </ul>
  );
}

export const TOOLS = [
  {
    to: '/describe-image', Icon: WritingIcon, title: 'Describe an image',
    give: 'One image (PNG or JPG)', get: 'An AI-written description to review, and the option to request a tactile version',
  },
  {
    to: '/image-description-generator', Icon: BrailleThinkingIcon, title: 'Describe many images',
    give: 'Several images or a ZIP file', get: 'A spreadsheet with a description for every image',
  },
  {
    to: '/file-extractor', Icon: TraceIcon, title: 'Extract images from a PDF',
    give: 'A textbook PDF', get: 'Every image in it, ready to describe',
  },
];

export function ToolList({ headingLevel = 'h3' }) {
  return (
    <ul className="grid gap-6 md:grid-cols-3 list-none p-0 m-0">
      {TOOLS.map((t) => (
        <AnimatedTile
          key={t.to}
          Icon={t.Icon}
          title={t.title}
          to={t.to}
          linkText="Open tool"
          headingLevel={headingLevel}
          text={(
            <span className="grid gap-1">
              <span><strong className="text-ink">You give:</strong> {t.give}</span>
              <span><strong className="text-ink">You get:</strong> {t.get}</span>
            </span>
          )}
        />
      ))}
    </ul>
  );
}

ToolList.propTypes = { headingLevel: PropTypes.oneOf(['h2', 'h3']) };
