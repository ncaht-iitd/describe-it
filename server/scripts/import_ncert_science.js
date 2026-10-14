// Adds the new-edition NCERT Science 6–10 diagrams (dataset "ncert-science") to the library.
//
//   node scripts/import_ncert_science.js            preview only: counts, nothing written
//   node scripts/import_ncert_science.js --apply    insert records that are not already there
//
// Only ever inserts. Records already in the database (same dataset + image_name) are left
// untouched, so it is safe to run again. To undo: delete records where dataset = "ncert-science".
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const DATASET = 'ncert-science';
const SHEET = path.join(__dirname, '..', 'dataset', 'ncert-science', 'master_annotations.xlsx');
const IMAGES = path.join(__dirname, '..', '..', 'frontend', 'public', 'media', 'ncert-science');

/** One spreadsheet row -> one library record. */
function rowToRecord(row) {
  const imageName = path.basename(String(row.File_Path || '').trim());
  const chapterNumber = String(row.Chapter_ID || '').replace(/^C0*/i, '');
  return {
    dataset: DATASET,
    image_name: imageName,
    subject: 'Science',
    standard: `Class ${String(row.Grade).trim()}`,
    chapter: { number: chapterNumber, name: String(row.Chapter_Name || '').trim() },
    book: 'NCERT',
    description: String(row.Human_Description || '').trim(),
    fig_no: String(row.Fig_Caption || '').trim(),
    keywords: [],
    reviews: [],
  };
}

function readRecords(file = SHEET) {
  const sheet = XLSX.readFile(file).Sheets[XLSX.readFile(file).SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' }).filter((r) => r.Image_ID).map(rowToRecord);
}

async function main() {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  const apply = process.argv.includes('--apply');
  const mongoose = require('mongoose');
  const LibraryRecord = require('../models/LibraryRecord');

  const records = readRecords();
  const missingFiles = records.filter((r) => !fs.existsSync(path.join(IMAGES, r.image_name)));
  const invalid = records.filter((r) => !r.image_name || !r.chapter.number || !r.chapter.name || !/^Class \d+$/.test(r.standard));

  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'image_descriptions' });
  const existing = new Set(
    (await LibraryRecord.find({ dataset: DATASET }, { image_name: 1 }).lean()).map((r) => r.image_name)
  );
  const toInsert = records.filter((r) => !existing.has(r.image_name));

  const byClass = toInsert.reduce((acc, r) => ({ ...acc, [r.standard]: (acc[r.standard] || 0) + 1 }), {});
  console.log(`Rows in sheet:            ${records.length}`);
  console.log(`Image files missing:      ${missingFiles.length}`);
  console.log(`Rows with bad fields:     ${invalid.length}`);
  console.log(`Already in database:      ${existing.size}`);
  console.log(`New records to insert:    ${toInsert.length}`, byClass);
  console.log('Sample record:', JSON.stringify(toInsert[0] || records[0]));

  if (missingFiles.length || invalid.length) {
    console.error('Stopping: fix missing files or bad rows first.');
    process.exitCode = 1;
  } else if (!apply) {
    console.log('\nPreview only. Run again with --apply to insert.');
  } else if (toInsert.length) {
    const result = await LibraryRecord.insertMany(toInsert, { ordered: true });
    const total = await LibraryRecord.countDocuments({ dataset: DATASET });
    console.log(`\nInserted ${result.length} records. "${DATASET}" now has ${total} records.`);
  } else {
    console.log('\nNothing to insert.');
  }
  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Import failed:', err.message);
    process.exit(1);
  });
}

module.exports = { rowToRecord, readRecords };
