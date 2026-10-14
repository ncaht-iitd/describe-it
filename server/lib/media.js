// Where library images and tactile PDFs live, and how records link to them.
//
// Prototype choice (see tracker O1/O4): files are kept in the repo under
// frontend/public/media/<folder>/ and published with the website, so links are
// site-relative ("/media/ncert-old/x.png"). The API works out each record's links
// from its file name when it answers, so stored records are never edited.
const fs = require('fs');
const path = require('path');

const MEDIA_DIR = process.env.MEDIA_DIR || path.join(__dirname, '..', '..', 'frontend', 'public', 'media');
const MEDIA_URL = '/media';

const COLLECTIONS = {
  'ncert-old': {
    title: 'NCERT diagrams (old edition)',
    description: 'Selected diagrams from older NCERT textbooks for Classes 6–8: Science, Mathematics and Social Science.',
  },
  'ncert-science': {
    title: 'NCERT Science 6–10 (new edition)',
    description: 'Diagrams from the current NCERT Science textbooks for Classes 6–10.',
  },
};
const DEFAULT_COLLECTION = 'ncert-old';
const TACTILE_FOLDER = 'tactile';

// file name -> exact name on disk, per folder (case-insensitive lookup; Linux hosts are case-sensitive)
const index = {};
function loadFolder(folder) {
  const dir = path.join(MEDIA_DIR, folder);
  const files = new Map();
  if (fs.existsSync(dir)) {
    for (const name of fs.readdirSync(dir)) files.set(name.toLowerCase(), name);
  }
  index[folder] = files;
}
function reload() {
  for (const folder of [...Object.keys(COLLECTIONS), TACTILE_FOLDER]) loadFolder(folder);
}
reload();

const collectionOf = (record) => record.dataset || DEFAULT_COLLECTION;

function imageFile(record) {
  if (!record.image_name) return null;
  const folder = collectionOf(record);
  const name = index[folder]?.get(record.image_name.trim().toLowerCase());
  return name ? { folder, name } : null;
}

function tactileFile(record) {
  if (!record.image_name) return null;
  const pdf = record.image_name.trim().replace(/\.[a-z0-9]+$/i, '.pdf').toLowerCase();
  const name = index[TACTILE_FOLDER].get(pdf);
  return name ? { folder: TACTILE_FOLDER, name } : null;
}

const urlFor = (file) => (file ? `${MEDIA_URL}/${file.folder}/${encodeURIComponent(file.name)}` : null);

/** A plain copy of a library record with its collection and working file links. */
function withMedia(record) {
  if (!record) return record;
  const doc = typeof record.toObject === 'function' ? record.toObject() : { ...record };
  doc.dataset = collectionOf(doc);
  doc.image_url = urlFor(imageFile(doc));
  doc.pdf_url = urlFor(tactileFile(doc));
  return doc;
}

/** The image as a data URL, for sending to the AI model (works without a public URL). */
function imageDataUrl(record) {
  const file = imageFile(record);
  if (!file) return null;
  const bytes = fs.readFileSync(path.join(MEDIA_DIR, file.folder, file.name));
  const type = /\.jpe?g$/i.test(file.name) ? 'image/jpeg' : 'image/png';
  return `data:${type};base64,${bytes.toString('base64')}`;
}

/** Image names that have a tactile PDF, as stored in records (".png" form). */
function tactileImageNames() {
  return [...index[TACTILE_FOLDER].values()].map((n) => n.replace(/\.pdf$/i, ''));
}

module.exports = {
  COLLECTIONS, DEFAULT_COLLECTION, MEDIA_DIR,
  withMedia, imageDataUrl, tactileImageNames, collectionOf, reload,
};
