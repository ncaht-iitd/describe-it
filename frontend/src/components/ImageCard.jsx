import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { figureLabel, descriptionLink } from '../lib/figures';

// First sentence of the description, as a one-line summary for the card
const summaryOf = (text) => {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  const first = t.match(/^.*?[.!?](\s|$)/)?.[0] || t;
  return first.length > 160 ? `${first.slice(0, first.lastIndexOf(' ', 157))}…` : first;
};

// One diagram in a grid. Card order follows the design guide: thumbnail, title,
// summary, chips. The title is the only link (one tab stop); its ::after covers the card.
const ImageCard = ({ image }) => {
  const chapter = image.chapter?.name?.replace(/\s+/g, ' ').trim();
  const grade = image.standard?.match(/\d+/)?.[0];

  return (
    <li className="card relative flex flex-col overflow-hidden hover:border-accent focus-within:border-accent transition-colors duration-150">
      <div className="relative aspect-[4/3] bg-white border-b border-theme border-line flex items-center justify-center">
        {image.image_url ? (
          // Title and summary below carry the meaning, so the thumbnail itself is decorative
          <img src={image.image_url} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-contain p-3" />
        ) : (
          <p className="text-small text-muted">Image not available</p>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="text-h3">
          <Link
            to={descriptionLink(image)}
            state={{ imageData: image }}
            className="text-ink no-underline hover:underline after:absolute after:inset-0"
          >
            {figureLabel(image)}
          </Link>
        </h3>
        <p className={`text-small ${image.description ? 'text-muted' : 'text-muted italic'}`}>
          {image.description ? summaryOf(image.description) : 'Description not written yet.'}
        </p>
        <ul className="mt-auto pt-2 flex flex-wrap gap-2 list-none p-0 m-0" aria-label="Details">
          {image.subject && <li className="chip">{image.subject}</li>}
          {grade && <li className="chip">Class {grade}</li>}
          {chapter && image.fig_no && <li className="chip">{chapter}</li>}
          {image.pdf_url && (
            <li className="chip border-accent text-accent font-bold">
              <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                {[3, 8, 13].map((x) => [4, 12].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="2" fill="currentColor" />))}
              </svg>
              Tactile PDF
            </li>
          )}
        </ul>
      </div>
    </li>
  );
};

ImageCard.propTypes = {
  image: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    image_url: PropTypes.string,
    pdf_url: PropTypes.string,
    image_name: PropTypes.string,
    subject: PropTypes.string,
    standard: PropTypes.string,
    description: PropTypes.string,
    fig_no: PropTypes.string,
    chapter: PropTypes.shape({ name: PropTypes.string }),
  }).isRequired,
};

export default ImageCard;
