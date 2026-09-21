// src/data/breeds.js

export const BREED_TYPE_OPTIONS = [
  { value: 'curta', label: 'Pelagem curta', shortLabel: 'Curta' },
  { value: 'media', label: 'Pelagem media', shortLabel: 'Media' },
  { value: 'longa', label: 'Pelagem longa', shortLabel: 'Longa' },
];

const baseBreeds = [
  { id: 'abissinio', name: 'Abissinio', type: 'curta', img: 'https://images.unsplash.com/photo-1596798205622-c32360db9360?auto=format&fit=crop&w=800&q=80' },
  { id: 'bobtail_americano', name: 'American Bobtail', type: 'curta', img: 'https://images.unsplash.com/photo-1565552634629-b6348873730e?auto=format&fit=crop&w=800&q=80' },
  { id: 'bengal', name: 'Bengal', type: 'curta', img: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=800&q=80' },
  { id: 'bombay', name: 'Bombay', type: 'curta', img: 'https://images.unsplash.com/photo-1577051320663-1498b30a9042?auto=format&fit=crop&w=800&q=80' },
  { id: 'burmes', name: 'Burmes', type: 'curta', img: 'https://images.unsplash.com/photo-1511275560982-95ac24b90e84?auto=format&fit=crop&w=800&q=80' },
  { id: 'british_shorthair', name: 'British Shorthair', type: 'curta', img: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=800&q=80' },
  { id: 'chartreux', name: 'Chartreux', type: 'curta', img: 'https://images.unsplash.com/photo-1548802673-380ab8ebc427?auto=format&fit=crop&w=800&q=80' },
  { id: 'cornish_rex', name: 'Cornish Rex', type: 'curta', img: 'https://images.unsplash.com/photo-1579844627236-47b2b3a62886?auto=format&fit=crop&w=800&q=80' },
  { id: 'devon_rex', name: 'Devon Rex', type: 'curta', img: 'https://images.unsplash.com/photo-1520315342629-6ea920342047?auto=format&fit=crop&w=800&q=80' },
  { id: 'sphynx', name: 'Sphynx', type: 'curta', img: 'https://images.unsplash.com/photo-1543160206-df67e23730e6?auto=format&fit=crop&w=800&q=80' },
  { id: 'siames', name: 'Siames', type: 'curta', img: 'https://images.unsplash.com/photo-1568152950566-c1bf43b4ab51?auto=format&fit=crop&w=800&q=80' },
  { id: 'oriental', name: 'Oriental Shorthair', type: 'curta', img: 'https://images.unsplash.com/photo-1599453272990-2ee288b20929?auto=format&fit=crop&w=800&q=80' },
  { id: 'russo_azul', name: 'Russo Azul', type: 'curta', img: 'https://images.unsplash.com/photo-1626260029339-e47321896895?auto=format&fit=crop&w=800&q=80' },
  { id: 'angora', name: 'Angora Turco', type: 'media', img: 'https://images.unsplash.com/photo-1627918544973-77293a38892f?auto=format&fit=crop&w=800&q=80' },
  { id: 'bobtail_japones', name: 'Bobtail Japones', type: 'media', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80' },
  { id: 'cymric', name: 'Cymric', type: 'media', img: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=800&q=80' },
  { id: 'exotico', name: 'Exotico', type: 'media', img: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=800&q=80' },
  { id: 'laperm', name: 'LaPerm', type: 'media', img: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=800&q=80' },
  { id: 'maine_coon', name: 'Maine Coon', type: 'media', img: 'https://images.unsplash.com/photo-1583002626490-67c74c93390d?auto=format&fit=crop&w=800&q=80' },
  { id: 'ragdoll', name: 'Ragdoll', type: 'media', img: 'https://images.unsplash.com/photo-1603598579979-3738096f2e23?auto=format&fit=crop&w=800&q=80' },
  { id: 'sagrado_birmania', name: 'Sagrado da Birmania', type: 'media', img: 'https://images.unsplash.com/photo-1577980833299-4d6402324707?auto=format&fit=crop&w=800&q=80' },
  { id: 'scottish_fold', name: 'Scottish Fold', type: 'media', img: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=800&q=80' },
  { id: 'balines', name: 'Balines', type: 'longa', img: 'https://images.unsplash.com/photo-1563297750-f84478207ea3?auto=format&fit=crop&w=800&q=80' },
  { id: 'british_longhair', name: 'British Longhair', type: 'longa', img: 'https://images.unsplash.com/photo-1582269932087-2bc92440939f?auto=format&fit=crop&w=800&q=80' },
  { id: 'himalaio', name: 'Himalaio', type: 'longa', img: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&w=800&q=80' },
  { id: 'noruegues', name: 'Noruegues da Floresta', type: 'longa', img: 'https://images.unsplash.com/photo-1520315342629-6ea920342047?auto=format&fit=crop&w=800&q=80' },
  { id: 'persa', name: 'Persa', type: 'longa', img: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=800&q=80' },
  { id: 'siberiano', name: 'Siberiano', type: 'longa', img: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&q=80' },
];

const detailsById = {
  abissinio: {
    tagline: 'O gato atleta',
    desc: 'Parece um puma em miniatura. E ativo, curioso e adora lugares altos. Nao costuma ser um gato de colo, mas participa de tudo que acontece na casa.',
    specs: { origin: 'Etiopia / Egito', life: '12-15 anos', weight: '3-5 kg' },
    stats: { energy: 95, affection: 80, shedding: 20, intelligence: 90 },
    tags: ['Ativo', 'Curioso', 'Independente'],
  },
  bengal: {
    tagline: 'Energia selvagem em casa',
    desc: 'Marcante pela pelagem manchada e pelo temperamento atletico. Precisa de enriquecimento ambiental, brincadeiras e rotina para gastar energia com qualidade.',
    specs: { origin: 'EUA', life: '12-16 anos', weight: '4-7 kg' },
    stats: { energy: 95, affection: 75, shedding: 35, intelligence: 90 },
    tags: ['Atletico', 'Inteligente', 'Curioso'],
  },
  maine_coon: {
    tagline: 'O gigante gentil',
    desc: 'Conhecido pelo tamanho impressionante e personalidade doce. Costuma seguir os tutores, vocalizar com delicadeza e conviver bem com familias.',
    specs: { origin: 'EUA', life: '12-15 anos', weight: '6-11 kg' },
    stats: { energy: 60, affection: 100, shedding: 90, intelligence: 85 },
    tags: ['Gigante', 'Docil', 'Peludo'],
  },
  persa: {
    tagline: 'A majestade felina',
    desc: 'Calmo, silencioso e muito ligado ao conforto. E uma raca que pede escovacao frequente, cuidado respiratorio e acompanhamento veterinario preventivo.',
    specs: { origin: 'Ira / Persia', life: '14-18 anos', weight: '3-6 kg' },
    stats: { energy: 20, affection: 85, shedding: 100, intelligence: 70 },
    tags: ['Calmo', 'Peludo', 'Tranquilo'],
  },
  siames: {
    tagline: 'O falante elegante',
    desc: 'Uma das racas mais reconheciveis. Costuma ser vocal, inteligente e muito conectado aos tutores, pedindo interacao diaria e previsibilidade.',
    specs: { origin: 'Tailandia', life: '15-20 anos', weight: '3-5 kg' },
    stats: { energy: 95, affection: 100, shedding: 40, intelligence: 100 },
    tags: ['Vocal', 'Inteligente', 'Afetuoso'],
  },
};

const defaultDetails = {
  tagline: 'Perfil editorial em evolucao',
  desc: 'Conteudo base da Gatedopedia. Use o painel admin para ajustar origem, comportamento, cuidados, tags e imagem desta raca.',
  specs: { origin: 'A revisar', life: '12-16 anos', weight: 'Variavel' },
  stats: { energy: 50, affection: 60, shedding: 50, intelligence: 60 },
  tags: ['Gatedopedia', 'Em revisao'],
};

export const defaultBreedCatalog = baseBreeds.map((breed, index) => ({
  ...defaultDetails,
  ...breed,
  ...(detailsById[breed.id] || {}),
  order: index + 1,
  published: true,
}));

export const breedsData = defaultBreedCatalog.reduce((acc, breed) => {
  acc[breed.id] = breed;
  return acc;
}, {});
