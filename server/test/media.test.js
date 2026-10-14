const { test } = require("node:test");
const assert = require("node:assert/strict");
const { withMedia, imageDataUrl } = require("../lib/media");

test("records without a dataset belong to the old NCERT collection", () => {
  assert.equal(withMedia({ image_name: "x.png" }).dataset, "ncert-old");
});

test("an image that exists in the media folder gets a site link, ignoring old S3 links", () => {
  const doc = withMedia({
    image_name: "class6_maths_ch5_primeTime_diagram_1.png",
    image_url: "https://vision-text-library.s3.ap-south-1.amazonaws.com/old.png",
  });
  assert.equal(doc.image_url, "/media/ncert-old/class6_maths_ch5_primeTime_diagram_1.png");
});

test("a missing image gets no link instead of a broken one", () => {
  assert.equal(withMedia({ image_name: "does_not_exist.png" }).image_url, null);
});

test("a diagram with a tactile PDF gets its download link", () => {
  const doc = withMedia({ image_name: "class7_Science_ch10_electricCurrent_diagram_1.png" });
  assert.equal(doc.pdf_url, "/media/tactile/class7_Science_ch10_electricCurrent_diagram_1.pdf");
});

test("a diagram without a tactile PDF has no download link", () => {
  assert.equal(withMedia({ image_name: "class6_maths_ch5_primeTime_diagram_1.png", pdf_url: "https://old" }).pdf_url, null);
});

test("the chatbot can read the image itself as a data URL", () => {
  const url = imageDataUrl({ image_name: "class6_maths_ch5_primeTime_diagram_1.png" });
  assert.match(url, /^data:image\/png;base64,/);
});
