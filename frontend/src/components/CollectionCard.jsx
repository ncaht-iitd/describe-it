import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

// One collection ("folder"): a preview of 6 diagrams from across the collection, then
// what it is and how many diagrams it holds. The title is the single link; its ::after
// covers the card. Preview images are decorative (the text says what the collection is).
const CollectionCard = ({ collection, headingLevel = 'h3' }) => {
  const Heading = headingLevel;
  const preview = collection.preview || [];
  return (
    <li className="group card relative overflow-hidden flex flex-col hover:border-accent focus-within:border-accent transition-colors duration-150">
      <div className="grid grid-cols-3 gap-px bg-[var(--border)] border-b border-theme border-line" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => preview[i]).map((p, i) => (
          <div key={p?._id || i} className="aspect-square bg-white overflow-hidden">
            {p ? (
              <img
                src={p.image_url}
                alt=""
                loading="lazy"
                className="w-full h-full object-contain p-1.5 transition-transform duration-200 ease-out motion-safe:group-hover:scale-105"
              />
            ) : (
              // Placeholder: the guide's diagonal hatch motif
              <div className="w-full h-full bg-[repeating-linear-gradient(45deg,var(--border)_0_2px,transparent_2px_10px)]" />
            )}
          </div>
        ))}
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <Heading className="text-h3">
          <Link to={`/collections/${collection.id}`} className="text-ink no-underline hover:underline after:absolute after:inset-0">
            {collection.title}
          </Link>
        </Heading>
        <p className="text-small text-muted">{collection.description}</p>
        <p className="mt-auto pt-2 flex items-center justify-between gap-2 font-bold">
          <span>{(collection.count ?? 0).toLocaleString('en-IN')} diagrams</span>
          <span aria-hidden="true" className="text-accent transition-transform duration-150 motion-safe:group-hover:translate-x-1">Browse →</span>
        </p>
      </div>
    </li>
  );
};

CollectionCard.propTypes = {
  collection: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    count: PropTypes.number,
    preview: PropTypes.arrayOf(PropTypes.shape({ _id: PropTypes.string, image_url: PropTypes.string })),
  }).isRequired,
  headingLevel: PropTypes.oneOf(['h2', 'h3']),
};

export default CollectionCard;
