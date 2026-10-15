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

const PREVIEW_SIZE = 6;
const SORT = { subject: 1, standard: 1, 'chapter.number': 1, image_name: 1 };

/** A few images spread evenly through a collection, so the preview shows its range. */
async function previewImages(filter, count) {
  const slots = Math.min(PREVIEW_SIZE, count);
  const picks = await Promise.all(Array.from({ length: slots }, async (_, i) => {
    // Take the first record with an image file at or just after this slot's position
    const records = await LibraryRecord.find(filter).sort(SORT).skip(Math.floor((i * count) / slots)).limit(3);
    const doc = records.map(withMedia).find((r) => r.image_url);
    return doc && { _id: doc._id, image_name: doc.image_name, image_url: doc.image_url };
  }));
  return picks.filter(Boolean);
}

router.get('/collections', async (req, res) => {
  try {
    const list = [...Object.entries(COLLECTIONS).map(([id, c]) => ({ id, ...c })), TACTILE];
    const withCounts = await Promise.all(list.map(async (c) => {
      const filter = collectionFilter(c.id);
      const count = await LibraryRecord.countDocuments(filter);
      return { ...c, count, preview: await previewImages(filter, count) };
    }));
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
