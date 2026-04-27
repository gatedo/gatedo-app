export function isImageFile(file) {
  return file?.type?.startsWith('image/');
}

export function createObjectPreview(file) {
  if (!file) return null;
  return URL.createObjectURL(file);
}

export function revokeObjectPreview(url) {
  if (url) URL.revokeObjectURL(url);
}

/**
 * Mantém o arquivo original sem redesenhar em canvas.
 * Isso reduz bastante chance de perder orientação original.
 */
export function normalizeUploadFile(file) {
  return file;
}