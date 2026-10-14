// A readable name for a diagram instead of its file name, e.g.
// "Figure 3.3", "Prime Time, diagram 2", or for the new edition "Class 6 · Chapter 2 · Image 1".
export function figureLabel(image) {
  if (image.fig_no?.trim()) return image.fig_no.trim();
  const chapter = image.chapter?.name?.replace(/\s+/g, ' ').trim();

  const newEdition = image.image_name?.match(/^G(\d+)_C(\d+)_I(\d+)/i);
  if (newEdition) {
    const [, , , n] = newEdition;
    return chapter ? `${chapter}, image ${Number(n)}` : `Image ${Number(n)}`;
  }

  const number = image.image_name?.match(/(\d+)\.[a-z]+$/i)?.[1];
  if (chapter && number) return `${chapter}, diagram ${number}`;
  return chapter || 'Diagram';
}

export function descriptionLink(image) {
  const grade = image.standard?.match(/\d+/)?.[0] || image.standard || '';
  const params = new URLSearchParams({
    grade,
    subject: image.subject || '',
    chapter: image.chapter?.name || '',
    figNo: image.fig_no || '',
    imageName: image.image_name || '',
  });
  return `/description?${params}`;
}
