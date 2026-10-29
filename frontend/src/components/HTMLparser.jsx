import parse from "html-react-parser";
import { marked } from "marked";
import PropTypes from "prop-types";

const HTMLparser = ({ htmlString }) => {
  return (
    <div className="rich-text text-left">
      {parse(marked.parse(htmlString))}
    </div>
  );
};

HTMLparser.propTypes = {
    htmlString: PropTypes.string, // htmlString should be a string
  };

export default HTMLparser;
