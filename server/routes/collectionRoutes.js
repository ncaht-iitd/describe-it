// Browsing the library by collection (like folders), one page of images at a time.
const express = require('express');
const router = express.Router();
const LibraryRecord = require('../models/LibraryRecord');
const { COLLECTIONS, DEFAULT_COLLECTION, withMedia, tactileImageNames } = require('../lib/media');

const TACTILE = {
  id: 'tactile',
  title: 'Tactile diagrams (placeholder set)',
  description: 'Diagrams that have a downloadable tactile version. Placeholder files from Class 7 Science until the processed set is ready.',
};
const MAX_PAGE_SIZE = 60;

/** Database filter for the records in a collection, or null for an unknown collection. */
function collectionFilter(id) {
  if (id === TACTILE.id) {
    const names = tactileImageNames().flatMap((n) => [`${n}.png`, `${n}.jpg`, `${n}.jpeg`]);
    return { image_name: { $in: names } };
  }
  if (!COLLECTIONS[id]) return null;
  // Records stored before collections existed have no dataset field and belong to the default one
  return id === DEFAULT_COLLECTION
    ? { $or: [{ dataset: id }, { dataset: { $exists: false } }] }
    : { dataset: id };
}

router.get('/collections', async (req, res) => {
  try {
    const list = [...Object.entries(COLLECTIONS).map(([id, c]) => ({ id, ...c })), TACTILE];
    const withCounts = await Promise.all(list.map(async (c) => ({
      ...c,
      count: await LibraryRecord.countDocuments(collectionFilter(c.id)),
    })));
    res.json({ success: true, data: withCounts });
  } catch (error) {
    console.error('Error listing collections:', error);
    res.status(500).json({ success: false, error: 'Could not load collections' });
  }
});

router.get('/collections/:id/images', async (req, res) => {
  const filter = collectionFilter(req.params.id);
  if (!filter) return res.status(404).json({ success: false, error: 'No such collection' });

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 24, 1), MAX_PAGE_SIZE);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  try {
    const [total, records] = await Promise.all([
      LibraryRecord.countDocuments(filter),
      LibraryRecord.find(filter)
        .collation({ locale: 'en', numericOrdering: true }) // "Class 10" after "Class 9"
        .sort({ subject: 1, standard: 1, 'chapter.number': 1, image_name: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);
    res.json({
      success: true,
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
      data: records.map(withMedia),
    });
  } catch (error) {
    console.error('Error listing collection images:', error);
    res.status(500).json({ success: false, error: 'Could not load images' });
  }
});

module.exports = router;
module.exports.collectionFilter = collectionFilter;
