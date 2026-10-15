const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server-core");

const app = require("../app");
const LibraryRecord = require("../models/LibraryRecord");
const fixtures = require("./fixtures");

const base = { book: "NCERT", subject: "Science", keywords: [] };
const extra = [
  // New-edition record: no description yet
  { ...base, dataset: "ncert-science", image_name: "G06_C02_I001.png", standard: "Class 6",
    chapter: { number: "2", name: "Diversity in the Living World" }, description: "" },
  { ...base, dataset: "ncert-science", image_name: "G10_C01_I001.png", standard: "Class 10",
    chapter: { number: "1", name: "Chemical Reactions and Equations" }, description: "" },
  // Old-edition record that has a tactile PDF in media/tactile
  { ...base, image_name: "class7_Science_ch10_electricCurrent_diagram_1.png", standard: "Class 7",
    chapter: { number: "10", name: "Electric Current and its Effects" }, description: "A simple electric circuit with a bulb." },
];

let mongo;
before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await LibraryRecord.insertMany([...fixtures, ...extra]);
});
after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test("collections are listed with their record counts", async () => {
  const res = await request(app).get("/api/collections").expect(200);
  const counts = Object.fromEntries(res.body.data.map((c) => [c.id, c.count]));
  assert.deepEqual(counts, { "ncert-old": fixtures.length + 1, "ncert-science": 2, tactile: 1 });
  assert.ok(res.body.data.every((c) => c.title && c.description));
});

test("a collection page returns its images with working links", async () => {
  const res = await request(app).get("/api/collections/tactile/images").expect(200);
  assert.equal(res.body.total, 1);
  assert.equal(res.body.data[0].pdf_url, "/media/tactile/class7_Science_ch10_electricCurrent_diagram_1.pdf");
});

test("collection pages are numbered and class 10 sorts after class 6", async () => {
  const first = await request(app).get("/api/collections/ncert-science/images?limit=1&page=1").expect(200);
  const second = await request(app).get("/api/collections/ncert-science/images?limit=1&page=2").expect(200);
  assert.equal(first.body.pages, 2);
  assert.equal(first.body.data[0].image_name, "G06_C02_I001.png");
  assert.equal(second.body.data[0].image_name, "G10_C01_I001.png");
});

test("an unknown collection returns 404", async () => {
  await request(app).get("/api/collections/nope/images").expect(404);
});

test("keyword search can be limited to one collection", async () => {
  const all = await request(app).post("/api/search").send({ keyword: "Diversity" }).expect(200);
  const old = await request(app).post("/api/search").send({ keyword: "Diversity", collection: "ncert-old" }).expect(200);
  assert.equal(all.body.count, 1);
  assert.equal(old.body.count, 0);
});

test("keyword search matches the subject name", async () => {
  const res = await request(app).post("/api/search").send({ keyword: "science", collection: "ncert-science" }).expect(200);
  assert.equal(res.body.count, 2);
});

test("each collection comes with preview images that have working links", async () => {
  const res = await request(app).get("/api/collections").expect(200);
  for (const c of res.body.data) {
    assert.ok(Array.isArray(c.preview), c.id);
    assert.ok(c.preview.length <= 6, c.id);
    assert.ok(c.preview.every((p) => p.image_url && p.image_url.startsWith("/media/")), c.id);
  }
});
