const { test } = require("node:test");
const assert = require("node:assert/strict");
const { rowToRecord, readRecords } = require("../scripts/import_ncert_science");
const { withMedia } = require("../lib/media");

test("a spreadsheet row becomes a library record in the ncert-science dataset", () => {
  const record = rowToRecord({
    Image_ID: "G06_C02_I010", Grade: 6, Chapter_ID: "C02", Chapter_Name: "Diversity in the Living World ",
    File_Path: "images_renamed/Grade 6/G06_C02_I010.png", Human_Description: "", Fig_Caption: "",
  });
  assert.deepEqual(record, {
    dataset: "ncert-science", image_name: "G06_C02_I010.png", subject: "Science", standard: "Class 6",
    chapter: { number: "2", name: "Diversity in the Living World" }, book: "NCERT",
    description: "", fig_no: "", keywords: [], reviews: [],
  });
});

test("every row in the real sheet maps to a record with an image file on disk", () => {
  const records = readRecords();
  assert.equal(records.length, 1469);
  const unlinked = records.filter((r) => !withMedia(r).image_url);
  assert.deepEqual(unlinked.map((r) => r.image_name), []);
  assert.equal(new Set(records.map((r) => r.image_name)).size, records.length, "image names are unique");
});
