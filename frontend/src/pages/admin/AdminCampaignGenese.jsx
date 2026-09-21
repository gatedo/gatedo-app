import React, { useState } from 'react';
import { Copy, CheckCircle2, Star, Zap, Crown, Heart, Flag, Video, Image, Mail, Smartphone, MessageCircle } from 'lucide-react';
import { FOUNDER_LAUNCH_PHASES } from '../../utils/founderLaunchConfig';

const P = '#8B4AFF';
const A = '#ebfc66';

function useCopy() {
  const [copied, setCopied] = useState('');
  const copy = (text, key) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(key); setTimeout(() => setCopied(''), 1800);
  };
  return [copied, copy];
}

const LAUNCH_PHASE_COPY = {
  TUTOR_GENESIS: {
    id: 'genese',
    icon: Crown,
    tagline: 'O DNA do App. O status mais raro que o Gatedo vai ter para sempre.',
  },
  TUTOR_RAIZ: {
    id: 'raiz',
    icon: Flag,
    tagline: 'A sustentacao. A base fundadora que mantem o Gatedo de pe.',
  },
  TUTOR_CERNE: {
    id: 'cerne',
    icon: Star,
    tagline: 'A essencia. Ultima fase antes de o mundo entrar.',
  },
};

const PHASES = [
  ...FOUNDER_LAUNCH_PHASES.map((phase) => {
    const copy = LAUNCH_PHASE_COPY[phase.badgeKey];
    return {
      id: copy.id,
      label: `TUTOR ${phase.displayLabel.replace(/^Tutor\s+/i, '').toUpperCase()}`,
      sub: `Fase ${phase.n} · ${phase.totalVagas} vagas · R$${phase.price}`,
      color: phase.color,
      icon: copy.icon,
      tagline: copy.tagline,
    };
  }),
  { id:'urgencia', label:'URGÊNCIA & TRANSIÇÃO', sub:'Últimas vagas · Fechamento · Abertura de fase', color:'#ef4444', icon:Zap,
    tagline:'Os posts mais importantes do lançamento. Escreva com verdade.' },
  { id:'vip', label:'TUTOR VIP', sub:'Parceiros · Influencers · Convidados do Diego', color:P, icon:Heart,
    tagline:'O link que o Diego gera pessoalmente. Tom de bastidor e exclusividade real.' },
];

const COPIES = {
  genese: [
    {
      id:'g1', format:'Hook Reels/TikTok (3 segundos)', icon:Video, formatColor:'#E1306C',
      title:'Abertura que para o scroll',
      note:'Fala direto pra câmera. Pausa de 0,5s antes de "todo o resto". Sem trilha nos primeiros 3 segundos.',
      text:`"Daqui a 10 anos, vai existir Tutor Gênese.

E vai existir todo o resto."`,
    },
    {
      id:'g2', format:'Script de vídeo — Juba (60s)', icon:Video, formatColor:'#9C27B0',
      title:'Script completo — tom do Diego, câmera frontal',
      note:'Fala pausada, olhando direto. Ambiente do app ao fundo ou câmera simples. Sem teleprompter.',
      text:`Preciso te contar uma coisa sobre o que tá acontecendo agora com o Gatedo.

A gente construiu um app inteiro para gatos. Saúde, memórias, IA, comunidade — tudo. E chegou a hora de abrir as portas.

Mas não do jeito que qualquer app faz.

A primeira vez que o Gatedo abre, ele abre pra 50 pessoas. Só. Essas 50 pessoas viram Tutor Gênese — pra sempre.

Não é título. Não é plano. É história.

Daqui a um ano, quando o Gatedo tiver 50 mil tutores, o Gênese ainda vai estar lá. No topo. Sem expiração. Sem upgrade que compra.

O preço é R$47. Por 12 meses completos. Todos os recursos. Todos os gatos que você tiver, sem nenhum limite.

Depois das 50 vagas? Vai pra R$67. Aí pra R$97. Aí abre pro mundo como Tutor Prime.

Tutor Prime é ótimo. Mas não tem o brilho de quem construiu isso comigo.

Se você tem gato e ama esse animal de verdade... o link tá aqui. Seja um dos 50.`,
    },
    {
      id:'g3', format:'Feed Instagram (legenda longa)', icon:Image, formatColor:'#E1306C',
      title:'Post de abertura da Fase 1 — impacto máximo',
      note:'Sem emoji no início. Começa com impacto seco. Parágrafos curtos. Deixa o texto respirar.',
      text:`TUTOR GÊNESE.

Esse é o status mais raro que o Gatedo vai ter — em qualquer momento, para sempre.

São 50 vagas. Quando as 50 forem, esse nome deixa de existir como possibilidade. Permanentemente.

O que significa ser Gênese?

Significa que você esteve aqui antes de todo mundo. Antes do crescimento. Antes das clínicas parceiras, dos 30 mil tutores, das matérias de jornal. Quando o Gatedo era só uma ideia que acreditamos com muita força.

Significa que o perfil do seu gato tem história. Enquanto todo mundo vier depois, você e seu gato vêm primeiro.

E isso nunca muda.

—

O que você tem no app:

🐱 Todos os gatos que você tiver — sem limite de número
⚡ GPTS incluídos para IA veterinária e Studio premium
🏅 Selo Tutor Gênese permanente no Comunigato
🔒 R$47 por 12 meses completos

Depois das 50 vagas: R$67.
Depois das 300 vagas: o mundo entra como Tutor Prime.

Tutor Prime tem acesso completo. Mas não tem o DNA.

—

50 vagas. Nunca mais.

🔗 Link na bio.`,
    },
    {
      id:'g4', format:'Meta Ads — conversão direta', icon:Image, formatColor:'#1877F2',
      title:'Anúncio pago — versão urgência e preço',
      note:'Headline separada. Body curto. CTA: "Garantir minha vaga". Audiência fria 28–45 anos com gato.',
      text:`HEADLINE: "50 vagas. Para sempre. R$47."

BODY: O Gatedo abre com 50 vagas de Tutor Gênese — o status mais raro do app. 12 meses completos, todos os gatos sem limite, Selo permanente no Comunigato. Depois das 50? R$67.

CTA: "Garantir minha vaga Gênese"`,
    },
    {
      id:'g5', format:'Meta Ads — identidade (audiência morna)', icon:Image, formatColor:'#1877F2',
      title:'Anúncio pago — versão emocional e identidade',
      note:'Para audiência que já interagiu com o perfil. Tom afetivo, menos urgência de preço.',
      text:`HEADLINE: "Seu gato merece ser o primeiro da história."

BODY: Quando o Gatedo tiver 1 milhão de tutores, os 50 Gênese vão estar no topo. Sem exceção. O perfil mais antigo. A história no DNA do app. R$47 por 12 meses.

CTA: "Quero ser Gênese"`,
    },
    {
      id:'g6', format:'Stories — sequência 5 slides', icon:Smartphone, formatColor:'#E1306C',
      title:'Sequência completa de stories — abertura',
      note:'Slide 1: fundo escuro, texto branco enorme. Slides 2–4: fundo do app. Slide 5: enquete.',
      text:`SLIDE 1 — [fundo escuro, texto branco centralizado, tamanho máximo]
"Você sabia que existem
só 50 vagas
para entrar no Gatedo
como TUTOR GÊNESE?"

—

SLIDE 2 — [imagem do app / gato olhando pra câmera]
"Gênese não é plano.
É história.

Esses 50 tutores
constroem o DNA
do app junto com a gente."

—

SLIDE 3 — [lista limpa]
O que você leva:

🐱 Todos os seus gatos sem limite
⚡ GPTS incluídos no plano
🏅 Selo Gênese permanente
📅 12 meses de acesso completo

Tudo por R$47.

—

SLIDE 4 — [fundo com tensão, cor sólida]
"Depois das 50 vagas?
R$67.

Depois das 300?
O mundo entra como Tutor Prime.

Tutor Prime é ótimo.
Mas não tem o DNA."

—

SLIDE 5 — [enquete + link]
Você tem gato?
[SIM 🐱] [AINDA NÃO 😅]

↓ Arrasta pra garantir sua vaga Gênese`,
    },
    {
      id:'g7', format:'Email de abertura (enviar 10h)', icon:Mail, formatColor:'#10b981',
      title:'Email de abertura — Fase 1',
      note:'Assunto curto e impactante. Sem imagens pesadas. Botão bem visível. Enviar às 10h no dia de abertura.',
      text:`ASSUNTO: "🟢 ABERTO: 50 vagas de Tutor Gênese — R$47"
PRÉ-HEADER: "O menor preço que o Gatedo vai ter, em qualquer momento, para sempre."

—

Oi [Nome],

Chegou a hora.

As 50 vagas de Tutor Gênese estão abertas agora.

Gênese é o status mais raro que o Gatedo vai ter — em qualquer momento, para sempre. São as pessoas que entram primeiro. Que moldam o produto. Que carregam o DNA do que estamos construindo.

O que você tem:

✅ Todos os seus gatos sem limite de número
✅ GPTS incluídos para IA veterinária e Studio premium
✅ Selo Tutor Gênese permanente no Comunigato
✅ 12 meses de acesso completo ao Gatedo

Por R$47.

Depois das 50 vagas, o preço vai para R$67.
Depois das 300 vagas, o mundo entra como Tutor Prime.

Tutor Prime é excelente. Mas não tem a história.

[BOTÃO: Garantir minha vaga Gênese — R$47]

Esse link funciona enquanto houver vaga.
Quando fechar, fecha pra sempre.

Diego
Gatedo 🐾`,
    },
    {
      id:'g8', format:'Push Notification', icon:Smartphone, formatColor:P,
      title:'Push de abertura (base ativa, 10h)',
      note:'Máximo 100 chars no título + 180 no corpo. Enviar às 10h no dia de abertura.',
      text:`TÍTULO: "🟢 As vagas Gênese abriram agora."
CORPO: "50 vagas. R$47. 12 meses completos. Quando fechar, não volta mais. Tap pra garantir."`,
    },
  ],

  raiz: [
    {
      id:'r1', format:'Script de vídeo — Juba (45s)', icon:Video, formatColor:'#9C27B0',
      title:'Abertura da Fase Raiz — tom de continuidade',
      note:'Tom mais suave que o Gênese. Reconhecer quem perdeu, abrir nova janela sem drama.',
      text:`O Gênese fechou.

50 tutores. 50 histórias. O DNA do Gatedo foi preenchido.

Mas a fase fundadora não acabou.

Acabou de abrir o Tutor Raiz. 100 vagas. R$67 por 12 meses completos.

Raiz é diferente do Gênese. O Gênese é quem chegou primeiro. O Raiz é quem sustenta. Quem mantém de pé.

E tem uma coisa que só o Raiz tem: 25% de desconto pra sempre em toda renovação. Não é promoção de lançamento. É para a vida toda.

Quando o Gatedo tiver 100 mil tutores, o Raiz vai renovar pagando menos. Pra sempre.

R$67 agora. Depois disso? R$97 na Fase 3. Depois das 300 vagas? Tutor Prime pro mundo.

O link tá aqui.`,
    },
    {
      id:'r2', format:'Feed Instagram (legenda longa)', icon:Image, formatColor:'#E1306C',
      title:'Post de abertura Fase 2',
      note:'Tom diferente do Gênese — "sustentação", não "pioneer". Quem perdeu o Gênese precisa sentir que o Raiz ainda é especial.',
      text:`TUTOR RAIZ.

O Gênese fechou. Mas o Gatedo ainda está em fase fundadora — e isso muda tudo.

Raiz não é "segunda opção". Raiz é a sustentação.

A estrutura que todo grande produto precisa depois dos pioneiros. As pessoas que vieram cedo o suficiente para ainda carregar um nome que o mundo inteiro vai conhecer depois.

—

O que você tem sendo Raiz:

🐱 Todos os seus gatos sem limite de número
⚡ GPTS incluídos no plano
🏅 Selo Tutor Raiz permanente no Comunigato
🔄 25% OFF vitalício em todas as renovações futuras — para sempre
🔒 R$67 por 12 meses completos

—

Depois das 100 vagas: Fase 3 a R$97.
Depois das 300 vagas: o mundo entra como Tutor Prime.

Tutor Prime tem o app.
Tutor Raiz tem o desconto vitalício. E o nome de quem sustentou isso no começo.

Esses dois não são a mesma coisa.

🔗 Link na bio.`,
    },
    {
      id:'r3', format:'Meta Ads — conversão', icon:Image, formatColor:'#1877F2',
      title:'Anúncio pago — Fase Raiz',
      note:'Para quem viu campanha do Gênese mas não converteu. Reconhece a perda, abre nova janela.',
      text:`HEADLINE: "O Gênese fechou. O Raiz acabou de abrir."

BODY: 100 vagas de Tutor Raiz — 25% OFF vitalício em todas as renovações, gatos ilimitados, Selo permanente. R$67 por 12 meses. Quando as 100 forem, Fase 3 a R$97.

CTA: "Garantir minha vaga Raiz"`,
    },
    {
      id:'r4', format:'Email de abertura Fase 2', icon:Mail, formatColor:'#10b981',
      title:'Email pós-fechamento do Gênese — abertura Raiz',
      note:'Enviado para TODA a base logo após fechar o Gênese. Reconhece o fechamento, abre nova janela.',
      text:`ASSUNTO: "Gênese fechou. O Tutor Raiz acabou de abrir."
PRÉ-HEADER: "Ainda dá tempo de entrar como fundador — mas a janela é menor agora."

—

Oi [Nome],

As 50 vagas do Tutor Gênese foram preenchidas.

Para os 50 fundadores: parabéns. Vocês são o DNA do Gatedo.

Para quem ficou de fora — a Fase 2 acabou de abrir.

Tutor Raiz. 100 vagas. R$67 por 12 meses.

Raiz não é Gênese. Mas raiz é fundação. É o que sustenta tudo que vem depois.

E o Raiz tem algo único: 25% de desconto vitalício em todas as renovações futuras. Para sempre. Sem condição.

Daqui a 5 anos, quando o Gatedo custar R$299/ano, o Tutor Raiz vai pagar R$224. Para sempre.

✅ Todos os gatos sem limite
✅ GPTS incluídos no plano
✅ Selo Tutor Raiz permanente
✅ 25% OFF vitalício em renovações
✅ 12 meses de acesso completo

[BOTÃO: Garantir minha vaga Raiz — R$67]

Depois das 100: Fase 3 a R$97.
Depois das 300: o mundo entra como Tutor Prime.

Diego
Gatedo 🐾`,
    },
  ],

  cerne: [
    {
      id:'c1', format:'Script de vídeo — Juba (45s)', icon:Video, formatColor:'#9C27B0',
      title:'Abertura Cerne — tom solene, última chamada',
      note:'Tom mais lento e sério. Esse é o vídeo mais importante da trilogia fundadora. Falar devagar.',
      text:`Essa é a última vez que eu abro uma fase de fundador.

Tutor Cerne. 150 vagas. R$97 por 12 meses completos.

Depois dessas 150 vagas, o Gatedo abre pro mundo.

E aí a história dos fundadores fecha. Pra sempre.

O Cerne é a essência. É a última camada antes do produto virar público. Quem entra aqui ainda é fundador — ainda tem o Selo, ainda tem acesso antecipado a tudo que a gente lançar, ainda tem o nome que vai durar.

Depois disso? Tutor Prime. Ótimo app. Mas sem história.

Eu quero que as pessoas que mais amam gatos estejam aqui desde o começo. Se você é essa pessoa, esse é o seu momento.

R$97. 12 meses. Último momento de fundador.

O link tá aqui.`,
    },
    {
      id:'c2', format:'Feed Instagram (legenda longa)', icon:Image, formatColor:'#E1306C',
      title:'Post abertura Fase 3 — peso de "última chance"',
      note:'Tom de gravidade, não de desespero. "Última fase" precisa soar como fato, não como pressão.',
      text:`TUTOR CERNE.

Esta é a última fase antes do mundo.

A Essência. As 150 pessoas que completam a fundação do Gatedo — e que, por estarem aqui agora, ainda carregam um nome que nenhum dinheiro vai comprar depois.

—

Depois das 150 vagas do Cerne, o Gatedo abre para o mundo como Tutor Prime.

Tutor Prime tem acesso completo. Mas não tem Acesso Antecipado a novas features. Não tem o Selo. Não tem a história.

—

O que você tem sendo Cerne:

🐱 Todos os seus gatos sem limite de número
⚡ GPTS incluídos no plano
🏅 Selo Tutor Cerne permanente — a essência do que somos
🔮 Acesso antecipado a todos os novos módulos antes do lançamento público
🔒 R$97 por 12 meses completos

—

Última fase. Última chance de entrar como fundador.

Depois disso, a porteira abre — e o Gatedo pertence ao mundo.

🔗 Link na bio.`,
    },
    {
      id:'c3', format:'Meta Ads — última chance', icon:Image, formatColor:'#1877F2',
      title:'Anúncio pago Cerne — urgência final',
      note:'Mais direto e urgente. Rodar no último terço das vagas da fase.',
      text:`HEADLINE: "Última fase de fundador. Depois disso, só Tutor Prime."

BODY: Tutor Cerne — 150 vagas, Selo permanente, acesso antecipado a novos módulos, gatos ilimitados. R$97 por 12 meses. Quando as 150 forem, a porteira abre pro mundo.

CTA: "Entrar como fundador Cerne"`,
    },
    {
      id:'c4', format:'Email fechamento total (300 vagas)', icon:Mail, formatColor:'#ef4444',
      title:'Email de encerramento das fases — abre o Tutor Prime',
      note:'Tom de encerramento de capítulo — não de derrota. Vai para toda a base. Abre o Prime com dignidade.',
      text:`ASSUNTO: "As 300 vagas de fundador foram preenchidas. O Gatedo agora é do mundo."
PRÉ-HEADER: "Um novo capítulo começa agora."

—

Oi [Nome],

As fases de fundador fecharam.

300 tutores. Gênese, Raiz e Cerne — a fundação do Gatedo está completa.

Para os 300 fundadores: vocês construíram isso junto com a gente. O Selo é permanente. A história é de vocês.

—

Para quem chegou agora:

O Gatedo está aberto para o mundo.

Tutor Prime. Acesso completo. Saúde, IA veterinária, Studio, Comunigato e histórico felino — tudo disponível agora. Sem limite de vagas. Sem countdown.

O que muda é simples: você não tem o Selo de fundador. Mas você tem o app.

E um app feito com muito amor por 300 pessoas que acreditaram desde o início.

[BOTÃO: Assinar como Tutor Prime]

Obrigado por estar aqui.

Diego
Gatedo 🐾`,
    },
  ],

  urgencia: [
    {
      id:'u1', format:'Feed — 10 vagas restantes', icon:Image, formatColor:'#ef4444',
      title:'Post de urgência real (últimas 10 vagas)',
      note:'SÓ postar quando for verdade. A credibilidade das fases seguintes depende disso.',
      text:`Dez.

São exatamente 10 vagas restantes de Tutor [GÊNESE/RAIZ/CERNE].

Quando essas 10 forem, a Fase [X] fecha permanentemente. O preço sobe e o status deixa de existir como possibilidade.

Para sempre.

Não é pressão de marketing. É aritmética simples: tinham [50/100/150] vagas, [40/90/140] já foram.

—

Você tem gato. Você chegou até aqui. Alguma coisa te fez parar nesse post.

Talvez seja isso.

R$[47/97/127]. 12 meses. Todos os seus gatos. Sem limite. Selo permanente.

🔗 Link na bio. Últimas 10.`,
    },
    {
      id:'u2', format:'Push — urgência (10 vagas)', icon:Smartphone, formatColor:'#ef4444',
      title:'Push notification de urgência real',
      note:'Enviar quando restarem ~10 vagas. Nunca antes. Nunca com número falso.',
      text:`TÍTULO: "🚨 Faltam 10 vagas de Tutor [GÊNESE/RAIZ/CERNE]."
CORPO: "Depois disso, essa porta fecha para sempre. R$[47/97/127]. Tap pra garantir agora."`,
    },
    {
      id:'u3', format:'Stories — countdown (3 slides)', icon:Smartphone, formatColor:'#ef4444',
      title:'Sequência stories de urgência com countdown',
      note:'Usar sticker de countdown nativo do Instagram no slide 1. Sem texto demais.',
      text:`SLIDE 1 — [fundo vermelho escuro]
[Sticker de countdown com horário de fechamento estimado]
"As vagas fecham em:"

—

SLIDE 2 — [fundo neutro]
"Quando o countdown chegar a zero,
o preço sobe de R$[47] para R$[97].

Sem exceção.
Sem prorrogação."

—

SLIDE 3 — [urgência final]
"R$[47]. 12 meses. Todos os gatos.
Selo [GÊNESE] permanente.

Arrasta pra garantir. ↓"`,
    },
    {
      id:'u4', format:'Feed — fechamento de fase', icon:Image, formatColor:'#6b7280',
      title:'Post de fechamento — quando a fase encerra',
      note:'Tom de gratidão, não de lamentação. Abre a próxima fase no mesmo post.',
      text:`[GÊNESE/RAIZ/CERNE] fechou.

[50/100/150] tutores. [50/100/150] histórias. [50/100/150] gatos que entram para o DNA do Gatedo.

Para esses tutores: obrigado por acreditar primeiro. O Selo [GÊNESE/RAIZ/CERNE] é permanente — em qualquer tela, em qualquer momento, para sempre. Vocês são parte do que o Gatedo é.

—

Para quem ficou de fora:

A Fase [SEGUINTE] acabou de abrir. [100/150] vagas de Tutor [RAIZ/CERNE].

[RAIZ/CERNE] não é [GÊNESE/RAIZ]. Mas é fundador.

R$[97/127]. O link acabou de mudar.

🔗 Vai lá.`,
    },
    {
      id:'u5', format:'DM — follow-up manual', icon:MessageCircle, formatColor:'#25D366',
      title:'DM para quem curtiu mas não comprou',
      note:'Enviar manualmente para perfis que comentaram ou curtiram o post. Tom humano, sem pressão.',
      text:`Oi [Nome]! Vi que você curtiu o post do Tutor [GÊNESE/RAIZ/CERNE] aqui.

Queria te perguntar direto: ficou alguma dúvida que te impediu de garantir a vaga?

Pode me falar — ou se preferir, te mando o link direto aqui. Ainda tem [X] vagas disponíveis nessa fase.

Diego
Gatedo 🐾`,
    },
  ],

  vip: [
    {
      id:'v1', format:'Script — Juba apresentando o VIP', icon:Video, formatColor:'#9C27B0',
      title:'Como o Diego apresentaria pra um parceiro (tom de bastidor)',
      note:'Para usar em call, DM por áudio ou story de bastidor. Tom de conversa, NÃO de pitch.',
      text:`"Se você for rápido, pode ser um Tutor Gênese — o DNA da nossa história.

Se bobear, vira Raiz ou Cerne.

Depois que a porteira abrir pro mundo, aí é só Tutor Prime... que é legal, mas não tem o brilho de quem construiu isso comigo.

E pros meus chegados? Ah, esses eu libero o Tutor VIP — mas tem que merecer, hein."

[pausa, sorrindo]

"Brincadeira. Só um pouco."`,
    },
    {
      id:'v2', format:'DM — influencers felinos', icon:MessageCircle, formatColor:'#E1306C',
      title:'Abordagem inicial para influencers gateiros',
      note:'Personalizar com o nome do gato do influencer se souber. Tom de bastidor, não de proposta comercial.',
      text:`Oi [Nome]!

Te envio isso antes de qualquer outra pessoa porque acho que você vai entender o que estamos construindo.

O Gatedo é o primeiro app brasileiro feito exclusivamente para tutores de gatos — saúde, memórias, IA veterinária e comunidade num único lugar. Estamos abrindo em fases de fundador muito pequenas: 300 vagas no total.

Quero te dar um acesso Tutor VIP — é o link que gero pessoalmente para parceiros que acredito que vão amar o produto. Você testa, usa com o [nome do gato], e se fizer sentido para a sua audiência, a gente conversa sobre como trabalhar juntos.

Sem compromisso nenhum agora.

Quer experimentar?

Diego
Gatedo 🐾`,
    },
    {
      id:'v3', format:'DM — clínicas veterinárias', icon:MessageCircle, formatColor:'#10b981',
      title:'Abordagem para clínicas (acesso VIP parceiro)',
      note:'Tom mais profissional. Focar na indicação para pacientes e no painel veterinário.',
      text:`Oi [Nome da clínica / Dra.]!

Meu nome é Diego, sou o criador do Gatedo — o primeiro app brasileiro focado exclusivamente em saúde e gestão de vida de gatos.

Estamos abrindo para os primeiros tutores essa semana, e gostaria de oferecer à [nome da clínica] um acesso Tutor VIP — para que vocês usem o app com os próprios gatos e, se fizer sentido, indiquem para os tutores que atendem.

Os tutores que chegam via indicação de clínica têm a maior taxa de ativação que vemos — porque já chegam com cultura de cuidado.

Posso te enviar o link agora?

Diego
Gatedo 🐾`,
    },
    {
      id:'v4', format:'Mensagem com link VIP', icon:MessageCircle, formatColor:P,
      title:'Mensagem ao enviar o link (após aceite)',
      note:'Simples e direta. Não vende mais depois que a pessoa aceitou. Deixa o produto falar.',
      text:`[Nome], aqui está o seu acesso Tutor VIP:

[LINK]

Com esse acesso você tem:
✅ App completo sem restrição
✅ Todos os recursos liberados
✅ Status VIP permanente no Comunigato

Qualquer dúvida, me fala aqui mesmo. Fico curioso pra saber o que você acha quando começar a usar.

Diego 🐾`,
    },
    {
      id:'v5', format:'Follow-up VIP (D7)', icon:MessageCircle, formatColor:P,
      title:'Follow-up para VIP que não ativou em 7 dias',
      note:'Só 1 follow-up. Se não responder, respeitar. Nunca insistir mais de uma vez.',
      text:`Oi [Nome]! Passando para ver se conseguiu acessar o Gatedo pelo link que te enviei.

Se tiver qualquer dificuldade no cadastro ou dúvida sobre alguma funcionalidade, me fala aqui — resolvo na hora.

E se não for o momento certo agora, sem problema nenhum.

Diego 🐾`,
    },
  ],
};

function CopyCard({ item }) {
  const [copied, copy] = useCopy();
  const [open, setOpen] = useState(false);
  const Icon = item.icon;

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-all shadow-sm hover:shadow-md ${open?'border-purple-200':'border-gray-100 hover:border-purple-100'}`}>
      <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setOpen(!open)}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor:`${item.formatColor}15` }}>
          <Icon size={16} style={{ color:item.formatColor }}/>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full border inline-block mb-1"
            style={{ backgroundColor:`${item.formatColor}12`, color:item.formatColor, borderColor:`${item.formatColor}30` }}>
            {item.format}
          </span>
          <p className="text-sm font-black text-gray-900 leading-tight">{item.title}</p>
        </div>
        <button onClick={e => { e.stopPropagation(); copy(item.text, item.id); }}
          className="p-1.5 rounded-lg hover:bg-purple-50 transition-colors flex-shrink-0"
          style={{ color:copied===item.id?'#10b981':'#9ca3af' }}>
          {copied===item.id ? <CheckCircle2 size={15}/> : <Copy size={15}/>}
        </button>
      </button>

      {open && (
        <div className="border-t border-gray-50">
          {item.note && (
            <div className="px-4 pt-3 pb-2 bg-amber-50/50 border-b border-amber-100">
              <p className="text-[10px] font-black text-amber-600 mb-0.5">📌 DIREÇÃO</p>
              <p className="text-xs text-amber-700 leading-relaxed">{item.note}</p>
            </div>
          )}
          <div className="p-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative">
              <button onClick={() => copy(item.text, `${item.id}_o`)}
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white transition-colors"
                style={{ color:copied===`${item.id}_o`?'#10b981':'#9ca3af' }}>
                {copied===`${item.id}_o` ? <CheckCircle2 size={14}/> : <Copy size={14}/>}
              </button>
              <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-line pr-6">{item.text}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCampaignGenese() {
  const [active, setActive] = useState('genese');
  const current = PHASES.find(p => p.id === active);
  const PhIcon = current.icon;

  return (
    <div className="space-y-5">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8"
        style={{ background:'linear-gradient(135deg, #0f0a1e 0%, #1a0830 100%)' }}>
        <div className="absolute inset-0 opacity-25"
          style={{ backgroundImage:`radial-gradient(ellipse at 10% 60%, ${current.color}60 0%, transparent 55%), radial-gradient(ellipse at 90% 20%, ${A}40 0%, transparent 50%)` }}/>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor:A }}>
              <Star size={14} style={{ color:P }}/>
            </div>
            <span className="text-[10px] font-black tracking-[3px] uppercase" style={{ color:A }}>
              Gatedo · Campanhas de Lançamento
            </span>
          </div>
          <h1 className="text-3xl font-black text-white leading-tight mb-2">
            Copies Ultra Refinados<br/>
            <span style={{ color:current.color }}>{current.label}</span>
          </h1>
          <p className="text-white/55 text-sm max-w-2xl leading-relaxed">{current.tagline}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {['Reels/TikTok','Feed','Stories','Meta Ads','Email','Push','DM'].map(f => (
              <span key={f} className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/15 text-white/70">{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Phase nav */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {PHASES.map(p => {
          const PIco = p.icon;
          const isActive = active === p.id;
          return (
            <button key={p.id} onClick={() => setActive(p.id)}
              className={`rounded-2xl p-3 text-left border-2 transition-all hover:shadow-md ${isActive?'shadow-lg':'bg-white hover:border-gray-200'}`}
              style={isActive?{ borderColor:p.color, background:`linear-gradient(135deg, ${p.color}18, ${p.color}06)` }:{ borderColor:'#f0f0f0' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <PIco size={13} style={{ color:p.color }}/>
                <span className="text-[9px] font-black uppercase tracking-wider" style={{ color:p.color }}>
                  {p.label.includes(' ')?p.label.split(' ')[1]:p.label}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 leading-tight">{p.sub}</p>
            </button>
          );
        })}
      </div>

      {/* Phase header */}
      <div className="flex items-center gap-3 p-4 rounded-2xl border-2"
        style={{ borderColor:`${current.color}40`, backgroundColor:`${current.color}08` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor:current.color }}>
          <PhIcon size={20} color="white"/>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-gray-900">{current.label}</p>
          <p className="text-xs text-gray-500">{current.sub} · {COPIES[active]?.length} formatos</p>
        </div>
        <p className="text-xs text-gray-500 max-w-xs text-right leading-relaxed hidden md:block">{current.tagline}</p>
      </div>

      {/* Copies */}
      <div className="space-y-3">
        {(COPIES[active]||[]).map(item => <CopyCard key={item.id} item={item}/>)}
      </div>

      {/* Principles */}
      <div className="rounded-3xl p-6 relative overflow-hidden"
        style={{ background:`linear-gradient(135deg, ${P}, #4B1FA8)` }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
          style={{ backgroundColor:A, transform:'translate(30%,-30%)' }}/>
        <div className="relative z-10">
          <p className="text-[10px] font-black tracking-[3px] uppercase mb-3" style={{ color:A }}>
            Princípios da Campanha
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { t:'O nome é o produto', d:'Gênese, Raiz, Cerne não são nomes de plano — são identidades. A copy não vende features, vende quem a pessoa vai ser dentro do Gatedo.' },
              { t:'Nunca mentir sobre vagas', d:'A credibilidade de cada fase depende da anterior ter sido real. Se o Gênese tinha 50 e fechou com 50, o Raiz fecha com 100. Sem exceção.' },
              { t:'O gato é o protagonista emocional', d:'O humano toma a decisão, mas o gato é o centro emocional. "Seu gato vai ser o primeiro da história" converte mais que qualquer feature.' },
              { t:'Tom do Diego, não de marketing', d:'Os copies do Juba precisam soar como ele fala — não como anúncio. Se parecer script, reescreve. Se parecer conversa, publica.' },
            ].map(s => (
              <div key={s.t} className="rounded-2xl p-4 border border-white/15"
                style={{ backgroundColor:'rgba(255,255,255,0.07)' }}>
                <p className="text-xs font-black text-white mb-1">{s.t}</p>
                <p className="text-[11px] leading-relaxed" style={{ color:'rgba(255,255,255,0.6)' }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
