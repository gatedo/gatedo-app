/**
 * studioPromptLibrary.js
 * Espelho frontend do StudioPromptLibrary (backend NestJS).
 * Usado em TutorCatModulePage, PortraitModulePage, StickerModulePage,
 * MindReaderModulePage e DanceModulePage.
 */

// ─── Preset styles por módulo ─────────────────────────────────────────────────
const PRESET_STYLES = {
  // ── tutor-cat ──────────────────────────────────────────────────────────────
  cinematico:  'cinematic lighting, premium composition, dramatic but elegant look',
  magico:      'magical atmosphere, fantasy particles, dreamy cinematic light',
  lifestyle:   'editorial lifestyle photography, natural premium scene',
  divertido:   'playful energetic scene, vibrant colors, expressive tone',

  // ── portrait ──────────────────────────────────────────────────────────────
  pixar:       'Pixar 3D animation style, expressive eyes, soft lighting',
  aquarela:    'watercolor painting style, soft brushstrokes, pastel palette',
  editorial:   'high-end editorial photography, sharp contrast, studio lighting',
  anime:       'anime illustration style, clean lines, vibrant cel shading',

  // ── sticker ───────────────────────────────────────────────────────────────
  fofo:             'cute kawaii sticker style, rounded shapes, pastel colors',
  minimal:          'minimalist flat sticker, clean lines, limited palette',
  emoji:            'expressive emoji-style illustration, bold outlines',
  'recorte branco': 'sticker with clean white cutout border, transparent background',

  // ── mind-reader ───────────────────────────────────────────────────────────
  misterioso: 'dark mystical atmosphere, deep shadows, glowing eyes, cosmic vibes, dramatic vignette',
  comico:     'pop-art comic style, bold outlines, speech bubble, bright flat colors, exaggerated expression',
  drama:      'theatrical dramatic lighting, single spotlight, noir style, exaggerated sad cat expression',
  sabio:      'zen minimalist scene, soft golden light, ancient philosopher aesthetic, calm and serene',

  // ── dance ─────────────────────────────────────────────────────────────────
  trend:      'viral social media style, dynamic motion blur, neon accent lighting, energetic atmosphere',
  passinho:   'cute soft motion, warm pastel colors, playful bouncy movement, kawaii animated style',
  epico:      'epic cinematic entrance, dramatic lighting, slow-motion effect, heroic triumphant vibe',
  freestyle:  'abstract music-reactive visuals, colorful beat-synced effects, vibrant concert lighting',

  // ── fallback ──────────────────────────────────────────────────────────────
  default:    'high quality artistic illustration, polished finish',
};

/**
 * Retorna o texto de estilo para um preset.
 * @param {string} preset
 */
export function resolvePresetStyle(preset) {
  const key = (preset || '').toLowerCase().replace(/\s+/g, ' ').trim();
  return PRESET_STYLES[key] || PRESET_STYLES.default;
}

/**
 * Gera o prompt final para envio ao backend/IA.
 * Espelha StudioPromptLibrary.build() do backend.
 *
 * @param {Object} params
 * @param {'tutor-cat'|'portrait'|'sticker'|'mind-reader'|'dance'} params.moduleKey
 * @param {string|null} params.petName
 * @param {string|null} params.preset
 * @param {string|null} params.prompt    - direção criativa extra do usuário
 * @returns {string}
 */
export function buildPrompt({ moduleKey, petName, preset, prompt }) {
  const name       = petName || 'o gato';
  const presetText = resolvePresetStyle(preset);
  const extra      = (prompt || '').trim();
  const extraLine  = extra ? `Extra direction: ${extra}` : '';

  switch (moduleKey) {
    case 'tutor-cat':
      return [
        'Create a high quality image using the provided tutor photo and cat photo as identity references.',
        'The tutor and the cat must remain recognizable and visually faithful to the uploaded images.',
        'Show emotional connection and a believable interaction between both.',
        `Style: ${presetText}.`,
        `Pet name reference: ${name}.`,
        'Avoid duplicated subjects, anatomy distortion, extra paws, extra fingers, cropped faces, text, watermark, logo, or frame.',
        extraLine,
      ].filter(Boolean).join('\n');

    case 'portrait':
      return [
        'Create a premium portrait of the cat using the uploaded cat photo as identity reference.',
        'The cat must remain recognizable and faithful to the uploaded image.',
        `Style: ${presetText}.`,
        `Pet name reference: ${name}.`,
        'Avoid anatomy distortion, duplicated ears, duplicated eyes, text, watermark, logo, or frame.',
        extraLine,
      ].filter(Boolean).join('\n');

    case 'sticker':
      return [
        'Create a sticker-style illustration based on the uploaded cat photo as identity reference.',
        'Keep the cat recognizable and expressive.',
        `Style: ${presetText}, clean sticker look, polished edges.`,
        'Avoid anatomy distortion, duplicated parts, text, watermark, logo, or frame.',
        extraLine,
      ].filter(Boolean).join('\n');

    case 'mind-reader':
      return [
        'Create a fun, shareable social media card that reveals what this specific cat is secretly thinking.',
        'Use the uploaded cat photo as identity reference — the cat must remain recognizable.',
        'The card should feature the cat prominently with a short inner thought or monologue overlaid as a speech bubble or text element.',
        `Style: ${presetText}.`,
        `Pet name reference: ${name}.`,
        'The thought must match the visual mood and be written in a funny, relatable, or philosophical tone.',
        'Card format: portrait or square, ready for Instagram/WhatsApp sharing.',
        'Avoid anatomy distortion, text errors, watermark, logo, or frame outside the card design.',
        extraLine,
      ].filter(Boolean).join('\n');

    case 'dance':
      return [
        'Create a short animated video clip of the cat dancing or moving to music.',
        'Use the uploaded cat photo as identity reference — the cat must remain recognizable.',
        `Dance style and visual vibe: ${presetText}.`,
        `Pet name reference: ${name}.`,
        'The animation should feel fluid and fun, optimized for short-form vertical video (Reels/TikTok format).',
        'Include subtle background effects or music-reactive visual elements that match the dance style.',
        'Avoid anatomy distortion, duplicated subjects, text, watermark, or logo.',
        extraLine,
      ].filter(Boolean).join('\n');

    default:
      return [
        'Create a high quality image using the uploaded references.',
        `Style: ${presetText}.`,
        extraLine,
      ].filter(Boolean).join('\n');
  }
}

// ─── Configurações de cada módulo para UI ────────────────────────────────────
export const MODULE_CONFIG = {
  'tutor-cat': {
    title:           'Tutor + Gato',
    subtitle:        'Cenas mágicas, afetivas ou cinematográficas com você e seu gato juntos.',
    gradient:        'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
    gptsCost:        10,
    xptReward:       25,
    xpgReward:       12,
    outputType:      'image',
    needsTutorPhoto: true,
    presets: [
      { id: 'cinematico', label: 'Cinemático', emoji: '🎬', desc: 'Cena épica com iluminação dramática' },
      { id: 'magico',     label: 'Mágico',     emoji: '✨', desc: 'Universo fantástico com partículas e luz' },
      { id: 'lifestyle',  label: 'Lifestyle',  emoji: '📸', desc: 'Editorial moderno e natural' },
      { id: 'divertido',  label: 'Divertido',  emoji: '🎉', desc: 'Cores vibrantes e estilo cartoon' },
    ],
  },

  portrait: {
    title:           'Estilos',
    subtitle:        'Transforme a foto do seu gato em obra de arte.',
    gradient:        'linear-gradient(135deg, #6366f1 0%, #8B4AFF 100%)',
    gptsCost:        8,
    xptReward:       4,
    xpgReward:       6,
    outputType:      'image',
    needsTutorPhoto: false,
    presets: [
      { id: 'pixar',     label: 'Pixar',     emoji: '🎥', desc: 'Animação 3D estilo Pixar' },
      { id: 'aquarela',  label: 'Aquarela',  emoji: '🎨', desc: 'Pintura em aquarela delicada' },
      { id: 'editorial', label: 'Editorial', emoji: '📰', desc: 'Fotografia editorial de luxo' },
      { id: 'anime',     label: 'Anime',     emoji: '⛩️', desc: 'Estilo anime japonês' },
    ],
  },

  sticker: {
    title:           'Sticker',
    subtitle:        'Seu gato vira sticker em segundos.',
    gradient:        'linear-gradient(135deg, #8B4AFF 0%, #ec4899 100%)',
    gptsCost:        3,
    xptReward:       2,
    xpgReward:       4,
    outputType:      'image',
    needsTutorPhoto: false,
    presets: [
      { id: 'fofo',            label: 'Fofo',    emoji: '🥰', desc: 'Kawaii fofo' },
      { id: 'minimal',         label: 'Minimal', emoji: '⬜', desc: 'Clean minimalista' },
      { id: 'emoji',           label: 'Emoji',   emoji: '😸', desc: 'Expressivo como emoji' },
      { id: 'recorte branco',  label: 'Recorte', emoji: '✂️', desc: 'Bordas brancas recortadas' },
    ],
  },

  'mind-reader': {
    title:           'Mente do Gato',
    subtitle:        'Humor, pensamentos e personalidade em um card divertido e pronto para post.',
    gradient:        'linear-gradient(135deg, #8B4AFF 0%, #4B40C6 100%)',
    gptsCost:        25,
    xptReward:       35,
    xpgReward:       15,
    outputType:      'image',
    needsTutorPhoto: false,
    presets: [
      { id: 'misterioso', label: 'Misterioso', emoji: '🔮', desc: 'Pensamentos enigmáticos e cósmicos' },
      { id: 'comico',     label: 'Cômico',     emoji: '😹', desc: 'Humor absurdo e irônico' },
      { id: 'drama',      label: 'Dramático',  emoji: '😿', desc: 'Crise existencial felina' },
      { id: 'sabio',      label: 'Sábio',      emoji: '🧘', desc: 'Filosofia gatesca profunda' },
    ],
  },

  dance: {
    title:           'Dancinhas',
    subtitle:        'Prepare seu gato para virar trend com animações curtas, estilos virais e visual chamativo.',
    gradient:        'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
    gptsCost:        30,
    xptReward:       10,
    xpgReward:       10,
    outputType:      'video',
    needsTutorPhoto: false,
    presets: [
      { id: 'trend',     label: 'Trend',          emoji: '🔥', desc: 'Coreografia viral do momento' },
      { id: 'passinho',  label: 'Passinho fofo',  emoji: '🐾', desc: 'Movimentos delicados e charmosos' },
      { id: 'epico',     label: 'Entrada épica',  emoji: '⚡', desc: 'Entrada triunfal com efeitos' },
      { id: 'freestyle', label: 'Freestyle',      emoji: '🎵', desc: 'Improviso com beat viral' },
    ],
  },
};

// ─── Sugestões de prompts por módulo + preset ─────────────────────────────────
export const PROMPT_SUGGESTIONS = {
  'tutor-cat': {
    cinematico: [
      'Numa floresta encantada ao anoitecer com raios de luz entre as árvores',
      'Em uma cidade futurista com néons e chuva suave ao fundo',
      'Numa praia ao pôr do sol com ondas douradas e céu alaranjado',
      'Em um castelo medieval iluminado por tochas e velas',
    ],
    magico: [
      'Flutuando em bolhas mágicas num universo de estrelas coloridas',
      'Em um jardim de cogumelos gigantes com fadas e luzes feericas',
      'Dentro de uma bola de neve com neve de purpurina e luz suave',
      'Num portal de outro mundo com espirais de luz e cores vibrantes',
    ],
    lifestyle: [
      'Num café aconchegante em Paris com xícaras e croissants na mesa',
      'Em um jardim japonês com cerejeiras em flor ao redor',
      'Num estúdio fotográfico moderno com fundo neutro e luz natural',
      'Numa varanda com plantas tropicais e luz da manhã suave',
    ],
    divertido: [
      'Numa festa de aniversário com balões coloridos e confetes',
      'Em uma praia de sorvete e algodão doce com sol amarelo',
      'Num mundo de desenho animado com cores estouradas e formas arredondadas',
      'Numa aventura de videogame como personagens pixelados 8-bit',
    ],
  },

  portrait: {
    pixar: [
      'Com expressão de curiosidade explorando um jardim de flores gigantes',
      'Como herói de aventura com capa e olhos brilhantes de determinação',
      'Num cenário de floresta mágica com cogumelos e borboletas ao redor',
      'Numa cena de filme de animação com iluminação de estúdio suave',
    ],
    aquarela: [
      'Com pétalas de flores ao redor em tons pastel suaves',
      'Em um jardim de primavera com borboletas e cores delicadas',
      'Num retrato elegante com fundo desfocado em tons de azul e lavanda',
      'Com reflexos de luz solar criando halos dourados ao redor',
    ],
    editorial: [
      'Como capa de revista de moda felina com fundo minimalista',
      'Em pose dramática com iluminação de estúdio profissional',
      'Com acessórios fashion e fundo geométrico moderno',
      'Como modelo em campanha premium de marca de luxo pet',
    ],
    anime: [
      'Com olhos enormes expressivos e detalhes de mangá japonês',
      'Em cena de ação com efeitos de vento e cabelo esvoaçante',
      'Como personagem de slice-of-life numa tarde tranquila de outono',
      'Em batalha épica com aura de energia e efeitos especiais',
    ],
  },

  sticker: {
    fofo: [
      'Com bochechas rosadas e expressão de contentamento',
      'Dormindo em bolinha com estrelinhas ao redor',
      'Segurando um coração com expressão carinhosa',
      'Com laço fofo e olhos brilhantes de felicidade',
    ],
    minimal: [
      'Apenas a silhueta em linha fina sobre fundo branco',
      'Retrato simples com apenas 3 cores sólidas',
      'Ícone flat com formas geométricas básicas',
      'Traço único contínuo formando o rosto do gato',
    ],
    emoji: [
      'Expressão de surpresa com olhos arregalados e boca aberta',
      'Rindo às gargalhadas com lágrimas nos olhos',
      'Dormindo com zzz flutuando e expressão serena',
      'Com coração nos olhos e sorriso apaixonado',
    ],
    'recorte branco': [
      'Pose dinâmica com expressão confiante e borda nítida',
      'Pulando com alegria e movimento congelado',
      'Sentado elegante em pose de modelo fotográfico',
      'Olhando curioso com cabeça inclinada e orelhas levantadas',
    ],
  },

  'mind-reader': {
    misterioso: [
      'Pensando em conspirações sobre o humano que sai todo dia sem explicação',
      'Contemplando se realmente existe algo além do corredor escuro às 3h',
      'Calculando as probabilidades de o universo ter sido criado só para ele',
      'Refletindo sobre os segredos que a gaveta da cozinha esconde',
    ],
    comico: [
      'Planejando o próximo ataque surpresa na canela do dono às 2h da manhã',
      'Fingindo não ouvir o dono chamar pelo sexto dia consecutivo',
      'Avaliando se vale a pena derrubar o copo d\'água agora ou esperar mais um minuto',
      'Calculando o momento exato para sentar em cima do notebook',
    ],
    drama: [
      'Sofrendo em silêncio após o dono ter ousado sair por 20 minutos',
      'Lamentando a tragédia de ter sido acordado do décimo cochilo do dia',
      'Chorando por dentro porque a ração favorita acabou e a substituta é inferior',
      'Vivendo a dor indescritível de ter sido ignorado enquanto dormia no sofá',
    ],
    sabio: [
      'Concluindo que o sono é a resposta para todas as perguntas existenciais',
      'Meditando sobre o equilíbrio entre pedir carinho e fingir indiferença',
      'Refletindo que o verdadeiro poder é não precisar de aprovação humana',
      'Contemplando que a caixa de papelão vazia é a posse mais valiosa do universo',
    ],
  },

  dance: {
    trend: [
      'Com efeitos de néon piscando e fundo de dança viral do TikTok',
      'Usando o filtro de câmera lenta nos momentos mais icônicos da dança',
      'Com transições rápidas e cortes sincronizados com o drop do beat',
      'Fazendo o movimento do trend mais popular da semana com swag total',
    ],
    passinho: [
      'Dançando suavemente entre pétalas de flores com luz dourada',
      'Com movimentos de ballet felino e piruetas elegantes e fofinhas',
      'Balançando as patinhas no ritmo de uma música lo-fi relaxante',
      'Em câmera lenta com efeitos de bolhas e estrelinhas ao redor',
    ],
    epico: [
      'Entrando em câmera lenta com fumaça dramática e luz de holofote',
      'Com capa ao vento e trilha sonora épica ao fundo numa arena iluminada',
      'Fazendo uma virada dramática com explosão de partículas douradas',
      'Descendo escadas lentas com efeito de clipe de super-herói',
    ],
    freestyle: [
      'Com visualizações de equalizador de música reagindo ao beat',
      'Num cenário de clube com luzes estroboscópicas e disco ball',
      'Improvisando movimentos únicos com efeitos de tinta colorida explodindo',
      'Com camadas de efeitos psicodélicos sincronizados com o ritmo',
    ],
  },
};