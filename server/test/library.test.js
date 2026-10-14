const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../app");
const LibraryRecord = require("../models/LibraryRecord");
const fixtures = require("./fixtures");

let mongo;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await LibraryRecord.insertMany(fixtures);
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const names = (res) => res.body.data.map((r) => r.image_name).sort();

// ---- browse ----

test("allData groups chapters by subject and a normalised class name", async () => {
  const res = await request(app).get("/api/allData").expect(200);
  assert.equal(res.body.success, true);
  assert.deepEqual(Object.keys(res.body.data.Mathematics).sort(), ["Class 6", "Class 7"]);
  assert.ok(res.body.data.Science["Class 8"], "'class 8' is listed as 'Class 8'");
});

test("chapterImages lists every image in a chapter when the chapter is sent as a name", async () => {
  const res = await request(app)
    .post("/api/chapterImages")
    .send({ grade: "Class 6", subject: "Mathematics", chapter: "Prime Time" })
    .expect(200);
  assert.equal(res.body.count, 2);
});

test("chapterImages accepts the class as a bare number", async () => {
  const res = await request(app)
    .post("/api/chapterImages")
    .send({ grade: "7", subject: "Mathematics", chapter: "Lines and Angles" })
    .expect(200);
  assert.deepEqual(names(res), ["class7_maths_ch5_linesAndAngles_diagram_3.png"]);
});

test("chapterImages matches chapter names that have stray spaces, with or without them", async () => {
  for (const chapter of [" The Wonderful World of Science ", "The Wonderful World of Science"]) {
    const res = await request(app)
      .post("/api/chapterImages")
      .send({ grade: "Class 6", subject: "Science", chapter })
      .expect(200);
    assert.equal(res.body.count, 1, `chapter ${JSON.stringify(chapter)}`);
  }
});

test("chapterImages matches chapter names containing line breaks", async () => {
  const res = await request(app)
    .post("/api/chapterImages")
    .send({ grade: "Class 6", subject: "Social-Science", chapter: "Grassroots Democracy Part 3: Local Government \r\nin Urban Areas" })
    .expect(200);
  assert.equal(res.body.count, 1);
});

// ---- figure lookup ----

test("figData finds a figure using the class label the search form sends", async () => {
  const res = await request(app)
    .post("/api/figData")
    .send({ grade: "Class 7", subject: "Mathematics", chapter: "Lines and Angles", figNo: "Figure 3.3" })
    .expect(200);
  assert.equal(res.body.success, true);
  assert.deepEqual(names(res), ["class7_maths_ch5_linesAndAngles_diagram_3.png"], "not the Science figure with the same number");
});

test("figData returns 404 with success false when nothing matches", async () => {
  const res = await request(app)
    .post("/api/figData")
    .send({ grade: "6", subject: "Mathematics", chapter: "Prime Time", figNo: "Figure 99.1" })
    .expect(404);
  assert.equal(res.body.success, false);
});

test("figData returns 400 when a field is missing", async () => {
  await request(app).post("/api/figData").send({ grade: "6", subject: "Mathematics" }).expect(400);
});

// ---- keyword search ----

test("keyword search works across a whole subject, matching descriptions and chapter names", async () => {
  const res = await request(app).post("/api/search").send({ subject: "Mathematics", keyword: "prime" }).expect(200);
  assert.deepEqual(names(res), ["class6_maths_ch5_primeTime_diagram_1.png", "class6_maths_ch5_primeTime_diagram_2.png"]);
});

test("keyword search applies a class filter sent as 'standard'", async () => {
  const res = await request(app).post("/api/search").send({ standard: "6", subject: "Mathematics", keyword: "angle" }).expect(200);
  assert.deepEqual(names(res), ["class6_maths_ch5_primeTime_diagram_2.png"]);
});

test("keyword search applies a class filter sent as 'grade' (what the website sends)", async () => {
  const res = await request(app).post("/api/search").send({ grade: "Class 7", subject: "Mathematics", keyword: "angle" }).expect(200);
  assert.deepEqual(names(res), ["class7_maths_ch5_linesAndAngles_diagram_3.png"]);
});

test("keyword search treats special characters as plain text, not a pattern", async () => {
  const bad = await request(app).post("/api/search").send({ subject: "Mathematics", keyword: "(" }).expect(200);
  assert.equal(bad.body.count, 0);
  const dot = await request(app).post("/api/search").send({ keyword: "ping.pong" }).expect(200);
  assert.equal(dot.body.count, 0, "'.' must not match the '-' in 'ping-pong'");
});

test("keyword search ignores surrounding spaces in the chapter filter", async () => {
  const res = await request(app)
    .post("/api/search")
    .send({ subject: "Science", chapter: " SOUND", keyword: "tuning" })
    .expect(200);
  assert.equal(res.body.count, 1);
});
