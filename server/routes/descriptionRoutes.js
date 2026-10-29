// Description generation for library images: choose a model, generate, keep every
// result in history, and let an admin save one to the library.
const express = require('express');
const mongoose = require('mongoose');
const { rateLimit } = require('express-rate-limit');
const LibraryRecord = require('../models/LibraryRecord');
const GeneratedDescription = require('../models/GeneratedDescription');
const describeClient = require('../lib/describeClient');
const auth = require('../lib/auth');
const { imageBase64 } = require('../lib/media');

const router = express.Router();

// Each generation is a paid model call; limit how fast one visitor can run them
const generateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.GENERATE_PER_MINUTE || 6),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Too many descriptions in a short time. Wait a minute and try again.' },
});

const sendError = (res, err) => {
  if (err instanceof describeClient.ServiceError) {
    return res.status(err.status || 502).json({ success: false, error: err.message });
  }
  console.error('Description route error:', err);
  return res.status(500).json({ success: false, error: 'Something went wrong on the server. Try again.' });
};

async function findRecord(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ success: false, error: 'Diagram not found.' });
    return null;
  }
  const record = await LibraryRecord.findById(req.params.id);
  if (!record) res.status(404).json({ success: false, error: 'Diagram not found.' });
  return record;
}

// Who is signed in (if anyone) and whether they may save to the library
router.get('/me', async (req, res) => {
  const user = await auth.verifyUser(req);
  res.json({ success: true, user: user && { name: user.name, isAdmin: user.isAdmin } });
});

router.get('/describe/models', async (req, res) => {
  try {
    const data = await describeClient.listModels();
    res.json({ success: true, models: data.models, defaultPrompt: data.default_prompt });
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/records/:id/descriptions', async (req, res) => {
  try {
    const record = await findRecord(req, res);
    if (!record) return;
    const history = await GeneratedDescription.find({ record: record._id }).sort({ created_at: -1 }).limit(100);
    res.json({ success: true, data: history });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/records/:id/descriptions', generateLimit, async (req, res) => {
  try {
    const { model, prompt_version: promptVersion } = req.body || {};
    if (!model) return res.status(400).json({ success: false, error: 'Choose a model first.' });
    const record = await findRecord(req, res);
    if (!record) return undefined;
    const image = imageBase64(record);
    if (!image) return res.status(404).json({ success: false, error: 'This diagram has no image file to describe.' });

    const result = await describeClient.describe({
      base64: image.base64,
      mediaType: image.mediaType,
      model,
      promptVersion,
      context: {
        subject: record.subject || '',
        grade: (record.standard || '').match(/\d+/)?.[0] || '',
        chapter: (record.chapter?.name || '').replace(/\s+/g, ' ').trim(),
        caption: record.fig_no || '',
      },
    });

    const saved = await GeneratedDescription.create({
      record: record._id,
      alt_text: result.alt_text,
      long_description: result.long_description,
      model: result.model,
      prompt_version: result.prompt_version,
      usage: result.usage,
      seconds: result.seconds,
    });
    return res.status(201).json({ success: true, data: saved });
  } catch (err) {
    return sendError(res, err);
  }
});

router.post('/records/:id/descriptions/:genId/save', auth.requireAdmin, async (req, res) => {
  try {
    const record = await findRecord(req, res);
    if (!record) return undefined;
    if (!mongoose.isValidObjectId(req.params.genId)) return res.status(404).json({ success: false, error: 'Description not found.' });
    const gen = await GeneratedDescription.findOne({ _id: req.params.genId, record: record._id });
    if (!gen) return res.status(404).json({ success: false, error: 'Description not found.' });

    // Keep the description being replaced, so nothing written by hand is ever lost
    const current = (record.description || '').trim();
    const alreadyKept = current && await GeneratedDescription.exists({
      record: record._id,
      long_description: record.description,
    });
    if (current && !alreadyKept) {
      await GeneratedDescription.create({
        record: record._id,
        source: 'library',
        alt_text: record.alt_text || '',
        long_description: record.description,
        model: { label: 'Library (before replacement)' },
      });
    }

    const now = new Date();
    const by = req.user.email || req.user.name || req.user.id;
    record.description = gen.long_description;
    record.alt_text = gen.alt_text;
    record.description_meta = {
      generation_id: gen._id,
      model_label: gen.model?.label,
      prompt_version: gen.prompt_version,
      saved_at: now,
      saved_by: by,
    };
    await record.save();
    gen.saved_to_library_at = now;
    gen.saved_by = by;
    await gen.save();
    return res.json({ success: true, data: { record_id: record._id, generation: gen } });
  } catch (err) {
    return sendError(res, err);
  }
});

module.exports = router;
