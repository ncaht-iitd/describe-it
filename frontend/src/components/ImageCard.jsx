import { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { figureLabel, descriptionLink } from '../lib/figures';

// One diagram in a results or collection grid. The title link covers the whole
// card for mouse users; keyboard and screen-reader users reach it with Tab.
const ImageCard = ({ image }) => {
  const [expanded, setExpanded] = useState(false);
  const descriptionId = `desc-${image._id}`;
  const chapter = image.chapter?.name?.replace(/\s+/g, ' ').trim();

  return (
    <li className="image-card relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow focus-within:ring-4 focus-within:ring-yellow-400">
      <div className="image-container relative aspect-video bg-white flex items-center justify-center">
        {image.image_url ? (
          // The visible title and description carry the meaning, so the thumbnail is decorative
          <img src={image.image_url} alt="" loading="lazy" className="w-full h-full object-contain p-2" />
        ) : (
          <p className="text-gray-600 text-sm">Image not available</p>
        )}
      </div>
      <div className="image-details p-5">
        <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-yellow-400">
          <Link
            to={descriptionLink(image)}
            state={{ imageData: image }}
            className="after:absolute after:inset-0 hover:underline focus:outline-none"
          >
            {figureLabel(image)}
          </Link>
        </h2>
        <p className="text-sm text-gray-700 dark:text-yellow-200">
          {[image.subject, image.standard, chapter].filter(Boolean).join(' · ')}
        </p>
        {image.pdf_url && (
          <p className="mt-2 inline-block text-xs font-bold bg-yellow-100 text-yellow-900 rounded-full px-2 py-1">
            Tactile version available
          </p>
        )}
        {image.description ? (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p id={descriptionId} className={`text-gray-700 dark:text-yellow-100/90 ${expanded ? '' : 'line-clamp-3'}`}>
              {image.description}
            </p>
            {image.description.length > 150 && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
                aria-controls={descriptionId}
                className="relative z-10 mt-2 text-yellow-800 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 font-medium underline"
              >
                {expanded ? 'Show less' : 'Show full description'}
              </button>
            )}
          </div>
        ) : (
          <p className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 italic">
            Description not written yet.
          </p>
        )}
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
    chapter: PropTypes.shape({ name: PropTypes.string }),
  }).isRequired,
};

export default ImageCard;
