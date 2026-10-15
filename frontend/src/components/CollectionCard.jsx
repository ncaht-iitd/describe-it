import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

// One collection ("folder"). The title is the single link; its ::after covers the card.
const CollectionCard = ({ collection, headingLevel = 'h3' }) => {
  const Heading = headingLevel;
  return (
    <li className="card relative p-6 hover:border-accent focus-within:border-accent transition-colors duration-150">
      <div aria-hidden="true" className="mb-4 h-2 w-16 rounded-full bg-accent" />
      <Heading className="text-h3 mb-2">
        <Link to={`/collections/${collection.id}`} className="text-ink no-underline hover:underline after:absolute after:inset-0">
          {collection.title}
        </Link>
      </Heading>
      <p className="font-bold text-body mb-2">{collection.count.toLocaleString('en-IN')} diagrams</p>
      <p className="text-small text-muted">{collection.description}</p>
    </li>
  );
};

CollectionCard.propTypes = {
  collection: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    count: PropTypes.number,
  }).isRequired,
  headingLevel: PropTypes.oneOf(['h2', 'h3']),
};

export default CollectionCard;
