export const SOCIAL_COSTS = {
  POST_TEXT_ONLY: 0,
  POST_WITH_INTERNAL_GALLERY: 10,
  POST_WITH_STUDIO_CREATION: 10,
  POST_WITH_EXTERNAL_UPLOAD: 20,
  LIKE: 1,
  SAVE: 1,
};

export const SOCIAL_XP = {
  POST: 15,
  LIKE: 1,
  SAVE: 1,
};

export type SocialImageSource =
  | 'NONE'
  | 'INTERNAL_GALLERY'
  | 'EXTERNAL_UPLOAD'
  | 'STUDIO_CREATION';

export type SocialPostVisibility = 'PUBLIC' | 'PRIVATE';

export function getPublishCost(source: SocialImageSource) {
  switch (source) {
    case 'INTERNAL_GALLERY':
      return SOCIAL_COSTS.POST_WITH_INTERNAL_GALLERY;
    case 'STUDIO_CREATION':
      return SOCIAL_COSTS.POST_WITH_STUDIO_CREATION;
    case 'EXTERNAL_UPLOAD':
      return SOCIAL_COSTS.POST_WITH_EXTERNAL_UPLOAD;
    case 'NONE':
    default:
      return SOCIAL_COSTS.POST_TEXT_ONLY;
  }
}