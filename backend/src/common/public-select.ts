// Selects "de vitrine" — o que pode sair de um usuário/gato pra OUTRO usuário
// (feed, comentários, perfil social). Nunca usar `user: true`/`owner: true`/
// `pet: true` em resposta que chega a terceiros: traz senha, tokens, e-mail,
// telefone, microchip e anotações clínicas/da ONG.

export const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  photoUrl: true,
  tutorTitle: true,
  role: true,
  plan: true,
  badges: true,
} as const;

export const PUBLIC_PET_SELECT = {
  id: true,
  ownerId: true,
  name: true,
  nicknames: true,
  breed: true,
  themeColor: true,
  photoUrl: true,
  gallery: true,
  gender: true,
  birthDate: true,
  ageYears: true,
  ageMonths: true,
  city: true,
  bio: true,
  level: true,
  xpg: true,
  badges: true,
  isMemorial: true,
  deathDate: true,
} as const;
