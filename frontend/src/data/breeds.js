// src/data/breeds.js

export const breedsData = {
  // A CHAVE (ex: 'abissinio') deve ser IGUAL ao ID que usamos na lista anterior
  
  'abissinio': {
    name: "Abissínio",
    tagline: "O Gato Atleta",
    desc: "Parece um puma em miniatura. É extremamente ativo, curioso e adora escalar lugares altos. Não é um gato de colo, prefere participar de tudo o que você faz.",
    img: "https://images.unsplash.com/photo-1596798205622-c32360db9360?auto=format&fit=crop&w=800&q=80",
    stats: {
      energy: 95,      // 0 a 100
      affection: 80,
      shedding: 20,    // Queda de pelo
      intelligence: 90
    },
    specs: {
      origin: "Etiópia / Egito",
      life: "12-15 anos",
      weight: "3-5 kg"
    },
    tags: ["Ativo", "Curioso", "Independente"]
  },

  'maine_coon': {
    name: "Maine Coon",
    tagline: "O Gigante Gentil",
    desc: "Conhecidos por seu tamanho impressionante e personalidade doce. São os 'cães' do mundo felino: seguem os donos, adoram água e são muito vocais.",
    img: "https://images.unsplash.com/photo-1583002626490-67c74c93390d?auto=format&fit=crop&w=800&q=80",
    stats: {
      energy: 60,
      affection: 100,
      shedding: 90,
      intelligence: 85
    },
    specs: {
      origin: "EUA",
      life: "12-15 anos",
      weight: "6-11 kg"
    },
    tags: ["Gigante", "Dócil", "Peludo"]
  },

  'persa': {
    name: "Persa",
    tagline: "A Majestade Felina",
    desc: "Calmo, silencioso e muito peludo. O Persa é o gato de apartamento ideal para quem quer tranquilidade. Exige escovação diária.",
    img: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=800&q=80",
    stats: {
      energy: 20,
      affection: 85,
      shedding: 100,
      intelligence: 70
    },
    specs: {
      origin: "Irã (Pérsia)",
      life: "14-18 anos",
      weight: "3-6 kg"
    },
    tags: ["Calmo", "Peludo", "Tranquilo"]
  },

  // ... Adicione aqui as outras raças seguindo o mesmo modelo ...
  // Lembre-se: O nome antes dos dois pontos (ex: 'bengal') tem que bater com o ID da lista principal.
};