export const GALLERY_LIMITS = {
  free: 9,
  plus18: 18,
  plus27: 27,
};

export function getGalleryLimit(plan = 'free') {
  return GALLERY_LIMITS[plan] || GALLERY_LIMITS.free;
}

export function getRemainingGallerySlots(currentCount = 0, plan = 'free') {
  return Math.max(0, getGalleryLimit(plan) - currentCount);
}