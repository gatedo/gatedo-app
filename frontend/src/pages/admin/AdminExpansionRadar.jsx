import React, { useState } from 'react';
import {
  Rocket, Map, Globe2, Users, Building2, Heart,
  Star, Zap, DollarSign, TrendingUp, Crown, Sparkles,
  ArrowRight, ArrowUpRight, CheckCircle2, Clock, Target,
  FlaskConical, Layers, Package, Camera, Home, Leaf,
  Palette, BookOpen, ShoppingBag, Award, RefreshCw,
  MessageCircle, Lock
} from 'lucide-react';

const P = '#8B4AFF';
const A = '#ebfc66';
const DARK = '#0f0a1e';

// ─── Data ─────────────────────────────────────────────────────────────────────

const EXPANSIONS = [
  // ── PRODUTO ──────────────────────────────────────────────────────────────
  {
    id: 'breeders',
    category: 'Produto B2B',
    title: 'Gatedo para Criadores (Breeders)',
    icon: Crown,
    color: '#8B4AFF',
    horizon: 'Q4 2026',
    effort: 'Médio',
    impact: 'Alto',
    revenue: 'R$200–800/mês por criador',
    moat: 'Alto',
    tag: 'Whitespace total',
    tldr: 'Software de gestão para criadores de gatos de raça. Não existe nada similar em PT-BR.',
    problem: 'Criadores de Maine Coon, Bengal, Ragdoll, Persa gerenciam ninhadas, pedigrees, saúde genética e relacionamento com compradores em planilhas Excel ou cadernos. Não existe software específico para isso no Brasil.',
    solution: 'Módulo "Gatedo Breeding" dentro do app: gestão de ninhadas, rastreio de pedigree, certificados digitais de saúde, agenda de vacinação por filhote, histórico de compradores e alertas de doenças genéticas por raça.',
    distribution: 'Associações de criadores (ABGAFI, ABAGG), grupos de WhatsApp e Facebook de raças. Criadores recomendam uns aos outros. Ticket alto + baixo churn.',
    numbers: ['~8.000 criadores registrados no Brasil', 'Ticket médio R$ 350/mês', 'ARR potencial: R$ 3–8mi com 1.000 clientes'],
    actions: ['Entrevistar 10 criadores para mapear dores reais', 'MVP: gestão de ninhada + certificado digital de saúde', 'Parceria com 2 associações de raça para distribuição'],
  },
  {
    id: 'condominios',
    category: 'Produto B2B',
    title: 'Gatedo para Condomínios',
    icon: Building2,
    color: '#6366f1',
    horizon: 'Q1 2026',
    effort: 'Médio',
    impact: 'Alto',
    revenue: 'R$99–299/mês por condomínio',
    moat: 'Médio',
    tag: 'Mercado de 60k condos',
    tldr: 'Plataforma de gestão de gatos para administradoras e síndicos de condomínios.',
    problem: 'SP tem +130k condomínios, maioria permitindo gatos após nova legislação. Síndicos precisam cadastrar animais, verificar vacinação em dia, gerenciar colônias de rua e resolver conflitos entre moradores. Fazem tudo no WhatsApp.',
    solution: '"Gatedo Condo": cadastro de gatos por unidade, verificação de vacinas em dia, módulo de colônia TNR, comunicados de saúde coletiva e integração com apps de gestão condominial (CondoConta, Buildi).',
    distribution: 'Administradoras (Lello, Apsa, Brasil Brokers) como canal. Cada administradora gerencia dezenas de condomínios — uma parceria escala para centenas de clientes automaticamente.',
    numbers: ['~130k condomínios só em SP', 'Média de 15–40 gatos por condomínio', 'Ticket R$ 149/mês = R$ 70k MRR com 500 clientes'],
    actions: ['Parceria piloto com 3 condomínios amigos da marca', 'Integração simples: cadastro + checklist de vacinação', 'Abordagem via administradoras como canal de venda'],
  },
  {
    id: 'memorial',
    category: 'Produto Emocional',
    title: 'Gatedo Memorial',
    icon: Heart,
    color: '#ec4899',
    horizon: 'Q3 2026',
    effort: 'Baixo',
    impact: 'Alto',
    revenue: 'R$49–299 produto único + parceiros',
    moat: 'Altíssimo',
    tag: 'Zero concorrentes',
    tldr: 'Quando o gato morre, o perfil vira memorial. O maior momento de vínculo emocional com a marca.',
    problem: 'A morte de um gato é um dos momentos mais dolorosos para um tutor. Não existe no Brasil uma plataforma que honre esse momento com dignidade e ofereça produtos e serviços de qualidade para o luto.',
    solution: 'Quando o tutor marca o gato como falecido no app, o perfil vira automaticamente um memorial bonito com a timeline de vida. O app oferece: impressão de photobook da vida do gato, joias com impressão de patinha, cremação parceira, retrato artístico, certificado de vida. Nada disso é intrusivo — tudo é opt-in.',
    distribution: 'O evento já acontece no app. O momento de conversão é o mais alto possível porque a dor é real. Parcerias com crematoriums pet, joalherias especializadas e artistas ilustradores.',
    numbers: ['~3mi gatos morrem/ano no Brasil', 'Ticket médio por memorial: R$ 150–400', 'Margem alta: produtos de parceiros com comissão 20–40%'],
    actions: ['Criar tela de "Modo Memorial" para perfis falecidos', 'Fechar parceria com 1 cremação e 1 gráfica de photobook', 'Testar com usuários que já perderam gatos — feedback emocional potente'],
  },
  {
    id: 'creator-economy',
    category: 'Plataforma',
    title: 'Gatedo Creator Economy',
    icon: Sparkles,
    color: '#f59e0b',
    horizon: 'Q2 2026',
    effort: 'Alto',
    impact: 'Altíssimo',
    revenue: '15–25% de comissão sobre deals',
    moat: 'Alto',
    tag: 'O Lefty.io felino BR',
    tldr: 'Marketplace onde marcas encontram criadores gateiros e o Gatedo toma comissão da campanha.',
    problem: 'Marcas pet querem alcançar tutores de gatos mas não sabem quais criadores têm audiência qualificada. Criadores gateiros não têm como se profissionalizar. Não existe plataforma de match especializada no universo felino no Brasil.',
    solution: 'Dentro do Gatedo, tutores ativos no Studio e Comunigato podem se inscrever como "Criadores". Marcas (rações, acessórios, vets, seguradoras) acessam o catálogo com métricas reais — seguidores, engajamento, raça dominante da audiência. O Gatedo facilita o deal e toma 20% de comissão.',
    distribution: 'Os criadores já estão no app. As marcas já estão no pipeline de parcerias. É a conexão entre dois ativos que já existem.',
    numbers: ['Ticket médio de deal: R$ 500–5.000', '20% de comissão = R$ 100–1.000 por deal', 'Com 50 deals/mês: R$ 5k–50k MRR sem custo de aquisição'],
    actions: ['Criar "Perfil de Criador" para tutores com Studio + Comunigato ativos', 'Convidar as 3 marcas do pipeline para testar o modelo', 'Construir página de descoberta de criadores para marcas'],
  },
  // ── GEOGRÁFICO ───────────────────────────────────────────────────────────
  {
    id: 'portugal',
    category: 'Expansão Geográfica',
    title: 'Portugal — Porta de Entrada Global',
    icon: Globe2,
    color: '#10b981',
    horizon: '2026',
    effort: 'Médio',
    impact: 'Altíssimo',
    revenue: 'Novo mercado + credencial EU',
    moat: 'First mover',
    tag: '🇵🇹 Mesmo idioma',
    tldr: 'Portugal primeiro: mesmo idioma, mercado sub-atendido, credencial europeia para captação.',
    problem: 'Portugal tem 2,5mi de gatos e nenhum app cat-focused dominante. Mercado europeu de pet tech cresce mais rápido que o brasileiro. Presença na UE dá credibilidade para captação internacional.',
    solution: 'Expandir o Gatedo para Portugal com localização mínima (algumas diferenças de vocabulário). Parcerias com clínicas portuguesas, influencers felinos lusitanos. Usar Portugal como validação de produto em mercado exigente para depois pitch de Série A com "tração internacional".',
    distribution: 'Influencers portugueses de gatos (audiência menor mas altamente engajada). Clínicas veterinárias. Grupos de Facebook de raças em Portugal.',
    numbers: ['2,5mi gatos em Portugal', 'Ticket premium possível em EUR (2–3x BRL)', 'Frame para captação: "lider no maior mercado lusófono do mundo"'],
    actions: ['Mapear top 5 influencers felinos portugueses', 'Revisão de linguagem/UX para PT-PT', 'Parcerias com 3 clínicas em Lisboa e Porto como piloto'],
  },
  // ── SERVIÇOS ──────────────────────────────────────────────────────────────
  {
    id: 'cathotel',
    category: 'Marketplace de Serviços',
    title: 'Gatedo Serviços — Cat Sitters & Hospedagem',
    icon: Home,
    color: '#0ea5e9',
    horizon: 'Q3 2026',
    effort: 'Médio',
    impact: 'Alto',
    revenue: '15–20% sobre transação',
    moat: 'Médio',
    tag: 'Recorrência por viagem',
    tldr: 'Marketplace de serviços cat-specific: hospedagem, cat sitting, grooming e comportamentalistas.',
    problem: 'Quando tutores viajam, precisam de alguém CONFIÁVEL para o gato — não qualquer dog walker do iFood. Cat sitters especializados, hotéis felinos e comportamentalistas não têm plataforma própria e usam Instagram precariamente.',
    solution: '"Gatedo Serviços": marketplace de prestadores verificados (cat sitting, hospedagem felina, grooming especializado, consultoria comportamental). Perfil com avaliações, fotos, especialidade por raça. Transação via app. Diferencial: só para gatos.',
    distribution: 'Prestadores se cadastram (gratuito inicialmente). Tutores descobrem na tela de home. Gatedo valida e verifica. Receita por transação.',
    numbers: ['Cat sitting: R$ 80–200/dia', 'Hospedagem felina: R$ 100–250/noite', '15% de comissão = R$ 15–37 por reserva'],
    actions: ['Mapeamento: 30 cat sitters e hotéis felinos em SP', 'MVP de perfil + agendamento simples', 'Integração com timeline de saúde para entregar histórico ao prestador'],
  },
  {
    id: 'assinatura-box',
    category: 'D2C / Receita Recorrente',
    title: 'Gatedo Box — Assinatura Personalizada por IA',
    icon: Package,
    color: '#f97316',
    horizon: '2026',
    effort: 'Alto',
    impact: 'Alto',
    revenue: 'R$ 89–199/mês por assinante',
    moat: 'Alto (dados únicos)',
    tag: 'Personalização impossível de copiar',
    tldr: 'Caixa mensal curada pelos dados reais do gato no app. Não é caixa genérica — é para o SEU gato.',
    problem: 'Boxes de pets existem (Petbox, PetLove Box) mas são genéricas. Um tutor de Bengal de 3 anos com histórico de bexiga recebe os mesmos produtos que um SRD de 1 ano saudável. Personalização real não existe.',
    solution: '"Gatedo Box": com base no perfil do gato (raça, idade, peso, histórico de saúde, preferências), a IA seleciona os produtos ideais do mês. Ração amostral, petisco funcional, brinquedo e produto de saúde — todos alinhados ao perfil. Embalagem com foto e nome do gato.',
    distribution: 'Base de tutores do app. Push personalizado: "Preparamos uma caixa especial para o [nome do gato]". Influencers do pipeline recebem a primeira caixa.',
    numbers: ['Ticket médio R$ 120/mês', 'LTV estimado 18 meses = R$ 2.160/assinante', '1.000 assinantes = R$ 120k MRR'],
    actions: ['Validar com enquete na base: "você assinaria uma box personalizada para seu gato?"', 'Parceria com 3 marcas para fornecimento das primeiras caixas', 'Testar com 50 assinantes beta antes de escalar'],
  },
  // ── IMPACTO / CIVIC ───────────────────────────────────────────────────────
  {
    id: 'tnr',
    category: 'Civic Tech / Impacto',
    title: 'Gatedo TNR — Gestão de Colônias Felinas',
    icon: Leaf,
    color: '#059669',
    horizon: 'Q2 2026',
    effort: 'Médio',
    impact: 'Alto',
    revenue: 'Prefeituras + ONGs B2G',
    moat: 'Dados + reputação',
    tag: 'B2G + reputação',
    tldr: 'Software para ONGs e prefeituras gerenciarem programas de Trap-Neuter-Return de gatos de rua.',
    problem: 'Cidades brasileiras têm milhões de gatos de rua. ONGs e prefeituras gerenciam programas TNR (captura, esterilização e retorno) em planilhas. Não existe software dedicado em PT-BR para isso.',
    solution: '"Gatedo TNR": mapa de colônias felinas por bairro, rastreio individual por foto/tag, histórico de esterilização, agenda de alimentação, gestão de voluntários. Integração com tutores próximos para adoção facilitada.',
    distribution: 'ONGs de proteção animal (grandes parceiras de imagem). Prefeituras via licitação ou convênio. CFMV (Conselho Federal de Medicina Veterinária) como endossante.',
    numbers: ['~30mi gatos de rua no Brasil', 'Contratos municipais: R$ 50–500k/ano', 'Impacto de imagem incalculável — "Gatedo é quem resolve o problema dos gatos de rua"'],
    actions: ['Parceria com 1 ONG grande (SOS Felinos, Ampara Animal) para MVP', 'Mapa de colônias como feature pública do app', 'Proposta para prefeitura de SP ou Curitiba'],
  },
  {
    id: 'imoveis',
    category: 'Partnership Inesperada',
    title: 'Apartamentos Cat-Friendly Certificados',
    icon: Home,
    color: '#7c3aed',
    horizon: 'Q4 2026',
    effort: 'Baixo',
    impact: 'Altíssimo',
    revenue: 'Lead fee + branding',
    moat: 'Posicionamento único',
    tag: 'Resolve dor enorme',
    tldr: 'Certificação "Gatedo Cat-Friendly" para imóveis. Parceria com QuintoAndar, ZAP e OLX.',
    problem: 'Achar apartamento que aceite gatos no Brasil é um pesadelo. É a reclamação mais comum de tutores felinos. Nenhuma plataforma imobiliária tem filtro específico e confiável para gatos.',
    solution: 'Criar o selo "Cat-Friendly by Gatedo" para imóveis: sem restrição a gatos, tela mosqueteira inclusa, sem piso de madeira sensível a arranhões. Parceria com QuintoAndar, ZAP Imóveis e OLX para exibir o selo nos anúncios. Gatedo ganha fee por lead qualificado.',
    distribution: 'QuintoAndar e ZAP já têm o problema — é só propor a solução. Press release garante cobertura espontânea (Folha, GloboNews). PR altíssimo.',
    numbers: ['QuintoAndar: 150k imóveis ativos', 'Fee por lead convertido: R$ 50–200', 'Mídia espontânea estimada: R$ 500k–2mi em cobertura'],
    actions: ['Criar critérios do selo "Cat-Friendly by Gatedo"', 'Cold outreach para parcerias QuintoAndar e ZAP', 'Comunicado de imprensa — esse story o jornalismo quer contar'],
  },
  // ── DADOS / TECNOLOGIA ───────────────────────────────────────────────────
  {
    id: 'longevidade',
    category: 'IA & Dados',
    title: 'Gatedo Longevidade — IA de Expectativa de Vida',
    icon: TrendingUp,
    color: '#0284c7',
    horizon: '2026',
    effort: 'Alto',
    impact: 'Altíssimo',
    revenue: 'Premium + pesquisa + farmácias',
    moat: 'Dataset único',
    tag: 'Diferencial técnico máximo',
    tldr: 'Com os dados agregados, o Gatedo prevê expectativa de vida e riscos de cada gato com mais precisão que qualquer app no mundo.',
    problem: 'Tutores não sabem quanto tempo seu gato vai viver nem quais doenças ele é mais propenso a desenvolver. Vets fazem estimativas genéricas baseadas em raça. Não existe predição personalizada e baseada em dados reais de saúde.',
    solution: 'Com 100k+ perfis de gatos com histórico real de saúde, o Gatedo treina modelos de ML que predizem: expectativa de vida personalizada, probabilidade de doenças específicas por raça/idade/peso/histórico, intervenções preventivas que mais impactam longevidade.',
    distribution: 'Feature premium para assinantes. Dataset licenciado para laboratórios farmacêuticos veterinários. Co-publicação científica com universidades.',
    numbers: ['Esse dataset não existe em lugar nenhum do mundo', 'Laboratórios como MSD Animal Health pagam US$ 500k–2mi por dados assim', 'Feature premium justifica aumento de R$ 10–20/mês no plano'],
    actions: ['Estruturar coleta de dados desde agora (cada evento de saúde é um ponto)', 'Parceria com FMVZ/USP para validação dos modelos', 'Primeiro relatório de pesquisa em 18 meses de dados'],
  },
  {
    id: 'architecture',
    category: 'Partnership Criativa',
    title: 'Gatedo x Arquitetura Cat-Friendly',
    icon: Palette,
    color: '#db2777',
    horizon: 'Q1 2026',
    effort: 'Baixo',
    impact: 'Médio/Alto',
    revenue: 'Lead fee + mídia',
    moat: 'Posicionamento',
    tag: 'PR e lifestyle',
    tldr: 'Selos, conteúdo e parcerias com arquitetos e designers que projetam apartamentos para gatos.',
    problem: 'A tendência de "cat-proofing" e projetos cat-friendly em interiores está explodindo no Brasil. Tutores reformam apartamentos com passarelas, arranhadores embutidos e janelas seguras. Não há referência de marca no mercado.',
    solution: 'Gatedo como curadora do universo cat-friendly no design. Parcerias com arquitetos especializados (certificação "Arquiteto Cat-Friendly by Gatedo"), conteúdo editorial no app sobre projetos, guia de reformas e lista de produtos recomendados.',
    distribution: 'Instagram e Pinterest de decoração e arquitetura. Parceria com Casa e Jardim, Vogue Casa, Dezeen Brasil. Tutores em reforma é um momento de altíssimo gasto.',
    numbers: ['Reforma cat-friendly média: R$ 15–80k', 'Lead fee: R$ 100–500 por projeto referenciado', 'Mídia espontânea em revistas de design = exposição para público premium'],
    actions: ['Mapear 10 arquitetos cat-friendly no Instagram', 'Criar "Guia Gatedo de Apartamento Cat-Friendly"', 'Parceria editorial com 1 revista de arquitetura'],
  },
  {
    id: 'academia',
    category: 'Conteúdo & Educação',
    title: 'Gatedo Academy — Escola de Tutores Felinos',
    icon: BookOpen,
    color: '#7c3aed',
    horizon: 'Q4 2026',
    effort: 'Médio',
    impact: 'Alto',
    revenue: 'R$49–149/curso ou plano anual',
    moat: 'Conteúdo + autoridade',
    tag: 'Conteúdo premium',
    tldr: 'Micro-cursos de 10–20 min sobre saúde, comportamento e bem-estar felino. Co-produzidos com veterinários.',
    problem: 'Tutores de gatos querem aprender mais mas o conteúdo disponível é fragmentado no YouTube, genérico e sem validação clínica. Não existe um curso em PT-BR feito por veterinários especializados em felinos.',
    solution: 'Micro-cursos dentro do app: "Alimentação correta do Bengal", "Sinais precoces de doença renal", "Enriquecimento ambiental em 30m²", "Como introduzir um segundo gato". Co-produzidos com os vets do programa de clínicas. Certificado "Tutor Consciente" compartilhável no perfil.',
    distribution: 'Base de tutores do app. Vets parceiros co-produzem e divulgam para suas audiências. Cada certificado compartilhado é aquisição orgânica.',
    numbers: ['Ticket de R$ 79/curso ou R$ 149/ano ilimitado', '1.000 alunos = R$ 79–149k de receita', 'Custo de produção por curso: R$ 2–5k'],
    actions: ['Produzir 1 curso piloto grátis com vet parceiro', 'Medir engajamento e NPS antes de monetizar', 'Integrar certificado no perfil do tutor no Comunigato'],
  },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

const CATEGORY_COLORS = {
  'Produto B2B':             { bg: `${P}15`,    text: P },
  'Produto Emocional':       { bg: '#ec487915', text: '#ec4879' },
  'Plataforma':              { bg: '#f59e0b15', text: '#f59e0b' },
  'Expansão Geográfica':     { bg: '#10b98115', text: '#10b981' },
  'Marketplace de Serviços': { bg: '#0ea5e915', text: '#0ea5e9' },
  'D2C / Receita Recorrente':{ bg: '#f9731615', text: '#f97316' },
  'Civic Tech / Impacto':    { bg: '#05966915', text: '#059669' },
  'Partnership Inesperada':  { bg: '#7c3aed15', text: '#7c3aed' },
  'IA & Dados':              { bg: '#0284c715', text: '#0284c7' },
  'Partnership Criativa':    { bg: '#db277715', text: '#db2777' },
  'Conteúdo & Educação':     { bg: '#7c3aed15', text: '#7c3aed' },
};

const EFFORT_COLOR   = { Baixo: '#10b981', Médio: '#f59e0b', Alto: '#ef4444' };
const IMPACT_COLOR   = { Médio: '#6b7280', Alto: '#8B4AFF', Altíssimo: '#ef4444' };
const HORIZON_COLOR  = { 'Q3 2026': '#10b981', 'Q4 2026': '#10b981', 'Q2 2026': '#f59e0b', 'Q1 2026': '#f59e0b', '2026': '#f59e0b', '2027': '#6b7280' };

function ImpactEffortMatrix({ data, onSelect, selected }) {
  // quadrants: x=esforço (Baixo→Alto), y=impacto (Médio→Altíssimo)
  const effortX = { Baixo: 20, Médio: 50, Alto: 80 };
  const impactY = { Médio: 75, Alto: 45, Altíssimo: 15 };
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <p className="text-sm font-black text-gray-900 mb-1">Matriz Impacto × Esforço</p>
      <p className="text-[11px] text-gray-400 mb-4">Cada bolha é uma oportunidade. Clique para ver detalhes.</p>
      <div className="relative" style={{ height: 280 }}>
        {/* Axes */}
        <div className="absolute inset-0 border border-gray-100 rounded-xl overflow-hidden">
          {/* Quadrant labels */}
          <div className="absolute top-2 left-2 text-[9px] font-black text-green-600 opacity-70">FAZER AGORA</div>
          <div className="absolute top-2 right-2 text-[9px] font-black text-amber-500 opacity-70">PLANEJAR</div>
          <div className="absolute bottom-2 left-2 text-[9px] font-black text-blue-500 opacity-70">QUICK WINS</div>
          <div className="absolute bottom-2 right-2 text-[9px] font-black text-gray-400 opacity-70">DESCARTAR</div>
          {/* Center lines */}
          <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-gray-200" />
          <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-gray-200" />
        </div>
        {/* Dots */}
        {data.map(d => {
          const x = effortX[d.effort] || 50;
          const y = impactY[d.impact] || 50;
          const Icon = d.icon;
          const isSelected = selected === d.id;
          return (
            <button key={d.id}
              onClick={() => onSelect(isSelected ? null : d.id)}
              style={{ left: `${x}%`, top: `${y}%`, backgroundColor: d.color,
                       transform: isSelected ? 'translate(-50%,-50%) scale(1.25)' : 'translate(-50%,-50%)',
                       boxShadow: isSelected ? `0 0 0 3px ${d.color}40, 0 4px 12px ${d.color}50` : undefined }}
              className="absolute w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 z-10">
              <Icon size={14} color="#fff" />
            </button>
          );
        })}
        {/* Axis labels */}
        <div className="absolute -bottom-5 left-0 right-0 flex justify-between px-2">
          <span className="text-[9px] text-gray-400">Esforço Baixo</span>
          <span className="text-[9px] text-gray-400">Esforço Alto</span>
        </div>
        <div className="absolute -left-6 top-0 bottom-0 flex flex-col justify-between py-2">
          <span className="text-[9px] text-gray-400" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Impacto Alto</span>
        </div>
      </div>
    </div>
  );
}

function ExpansionCard({ exp, onSelect, selected }) {
  const Icon = exp.icon;
  const catStyle = CATEGORY_COLORS[exp.category] || { bg: '#f3f4f6', text: '#6b7280' };
  const isOpen = selected === exp.id;
  return (
    <div onClick={() => onSelect(isOpen ? null : exp.id)}
      className={`bg-white border rounded-2xl overflow-hidden cursor-pointer transition-all shadow-sm
        ${isOpen ? 'border-purple-200 shadow-md' : 'border-gray-100 hover:border-purple-100 hover:shadow-md'}`}>
      <div className="p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${exp.color}15` }}>
          <Icon size={20} style={{ color: exp.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
            <p className="text-sm font-black text-gray-900">{exp.title}</p>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: A, color: P }}>{exp.tag}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: catStyle.bg, color: catStyle.text }}>
              {exp.category}
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${HORIZON_COLOR[exp.horizon]}20`, color: HORIZON_COLOR[exp.horizon] }}>
              📅 {exp.horizon}
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${EFFORT_COLOR[exp.effort]}15`, color: EFFORT_COLOR[exp.effort] }}>
              ⚡ Esforço {exp.effort}
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${IMPACT_COLOR[exp.impact]}15`, color: IMPACT_COLOR[exp.impact] }}>
              🎯 Impacto {exp.impact}
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">{exp.tldr}</p>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-gray-50 p-4 space-y-4 bg-gray-50/40">
          {/* Revenue */}
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: `${exp.color}10`, border: `0.5px solid ${exp.color}25` }}>
            <DollarSign size={14} style={{ color: exp.color }} className="flex-shrink-0" />
            <div>
              <p className="text-[9px] font-black" style={{ color: exp.color }}>MODELO DE RECEITA</p>
              <p className="text-xs font-bold text-gray-800">{exp.revenue}</p>
            </div>
          </div>

          {/* Problem / Solution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-red-50 rounded-xl p-3 border border-red-100">
              <p className="text-[9px] font-black text-red-600 mb-1">🔴 PROBLEMA</p>
              <p className="text-xs text-gray-700 leading-relaxed">{exp.problem}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
              <p className="text-[9px] font-black text-green-600 mb-1">✅ SOLUÇÃO GATEDO</p>
              <p className="text-xs text-gray-700 leading-relaxed">{exp.solution}</p>
            </div>
          </div>

          {/* Distribution */}
          <div className="bg-white rounded-xl p-3 border border-gray-100">
            <p className="text-[9px] font-black text-gray-500 mb-1">📡 CANAL DE DISTRIBUIÇÃO</p>
            <p className="text-xs text-gray-600 leading-relaxed">{exp.distribution}</p>
          </div>

          {/* Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {exp.numbers.map(n => (
              <div key={n} className="bg-white rounded-xl p-2.5 border border-gray-100 flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: exp.color }} />
                <p className="text-[11px] text-gray-600 leading-relaxed">{n}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div>
            <p className="text-[9px] font-black text-gray-400 mb-2">🚀 PRÓXIMAS 3 AÇÕES</p>
            <div className="space-y-1.5">
              {exp.actions.map((a, i) => (
                <div key={a} className="flex items-start gap-2">
                  <span className="text-[9px] font-black text-white w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: exp.color }}>{i + 1}</span>
                  <p className="text-xs text-gray-600 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminExpansionRadar() {
  const [selected, setSelected] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [horizonFilter, setHorizonFilter] = useState('Todos');
  const [view, setView] = useState('cards');

  const categories = ['Todas', ...new Set(EXPANSIONS.map(e => e.category))];
  const horizons   = ['Todos', 'Q3 2026', 'Q4 2026', 'Q1 2026', 'Q2 2026', '2026', '2027'];

  const filtered = EXPANSIONS.filter(e => {
    const catOk = categoryFilter === 'Todas' || e.category === categoryFilter;
    const horOk = horizonFilter  === 'Todos' || e.horizon === horizonFilter;
    return catOk && horOk;
  });

  const totalRevPotential = '~R$5–25mi ARR';

  return (
    <div className="space-y-5">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl" style={{ background: DARK }}>
        <div className="absolute inset-0"
          style={{ backgroundImage: `radial-gradient(ellipse at 5% 50%, #7c3aed50 0%, transparent 50%), radial-gradient(ellipse at 95% 30%, ${A}25 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, ${P}30 0%, transparent 50%)` }} />
        <div className="relative z-10 p-7 md:p-9">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: A }}>
              <Rocket size={14} style={{ color: P }} />
            </div>
            <span className="text-[10px] font-black tracking-[3px] uppercase" style={{ color: A }}>
              Gatedo · Radar de Expansão Estratégica
            </span>
          </div>
          <h1 className="text-3xl font-black text-white leading-tight mb-2">
            {EXPANSIONS.length} Oportunidades.<br />
            <span style={{ color: A }}>Nenhuma ainda explorada.</span>
          </h1>
          <p className="text-white/55 text-sm max-w-2xl leading-relaxed">
            Movimentos de expansão de produto, mercado, serviços e parcerias para o Gatedo dominar
            o universo felino brasileiro e escalar além. Cada oportunidade tem problema, solução,
            canal de distribuição e próximas ações mapeadas.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            {[
              { label: 'Oportunidades mapeadas', value: EXPANSIONS.length },
              { label: 'Prontas para Q3–Q4/26', value: EXPANSIONS.filter(e => ['Q3 2026','Q4 2026'].includes(e.horizon)).length },
              { label: 'ARR potencial combinado', value: totalRevPotential },
              { label: 'Esforço baixo/médio', value: EXPANSIONS.filter(e => e.effort !== 'Alto').length },
            ].map(k => (
              <div key={k.label} className="rounded-2xl px-4 py-2.5 border border-white/10"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-[9px] text-white/40 font-medium">{k.label}</p>
                <p className="text-lg font-black text-white">{k.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-2 flex gap-1 shadow-sm">
          {['cards', 'matrix'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${view === v ? 'text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
              style={view === v ? { backgroundColor: P } : {}}>
              {v === 'cards' ? '📋 Cards' : '📊 Matriz'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="text-xs border border-gray-100 rounded-xl bg-white shadow-sm px-3 py-2 focus:outline-none focus:border-purple-300">
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={horizonFilter} onChange={e => setHorizonFilter(e.target.value)}
            className="text-xs border border-gray-100 rounded-xl bg-white shadow-sm px-3 py-2 focus:outline-none focus:border-purple-300">
            {horizons.map(h => <option key={h}>{h}</option>)}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-4 py-2 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-[10px] font-bold text-gray-500">{filtered.length} oportunidades visíveis</p>
        </div>
      </div>

      {/* Matrix View */}
      {view === 'matrix' && (
        <div className="space-y-4">
          <ImpactEffortMatrix data={EXPANSIONS} onSelect={setSelected} selected={selected} />
          {selected && (() => {
            const exp = EXPANSIONS.find(e => e.id === selected);
            if (!exp) return null;
            return <ExpansionCard exp={exp} onSelect={setSelected} selected={selected} />;
          })()}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {EXPANSIONS.map(e => {
              const Icon = e.icon;
              return (
                <button key={e.id} onClick={() => setSelected(selected === e.id ? null : e.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all text-xs font-bold
                    ${selected === e.id ? 'border-purple-200 bg-purple-50' : 'border-gray-100 bg-white hover:border-purple-100'}`}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${e.color}20` }}>
                    <Icon size={12} style={{ color: e.color }} />
                  </div>
                  <span className="text-gray-700 truncate">{e.title.split('—')[0].trim()}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Cards View */}
      {view === 'cards' && (
        <div className="space-y-3">
          {/* Quick-start highlight */}
          <div className="rounded-2xl p-4 border-2 flex items-start gap-3" style={{ borderColor: A, backgroundColor: `${A}12` }}>
            <Zap size={18} style={{ color: P }} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-gray-900 mb-0.5">⚡ Faça primeiro, ainda esse trimestre:</p>
              <div className="flex flex-wrap gap-2">
                {EXPANSIONS.filter(e => e.effort === 'Baixo').map(e => (
                  <span key={e.id} onClick={() => setSelected(selected === e.id ? null : e.id)}
                    className="text-[10px] font-bold px-2 py-1 rounded-full cursor-pointer transition-all hover:opacity-80"
                    style={{ backgroundColor: e.color, color: '#fff' }}>
                    {e.title.split('—')[0].trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {filtered.map(exp => (
            <ExpansionCard key={exp.id} exp={exp} onSelect={setSelected} selected={selected} />
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${P}, #4B1FA8)` }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10" style={{ backgroundColor: A, transform: 'translate(30%,-30%)' }} />
        <div className="relative z-10">
          <p className="text-[10px] font-black tracking-[3px] uppercase mb-2" style={{ color: A }}>Princípio Central</p>
          <p className="text-xl font-black text-white mb-3">
            Não é sobre ter a ideia certa. É sobre executar a ideia certa, na ordem certa, com o recurso que você tem agora.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { step: '1', title: 'Escolha 2 itens de esforço baixo', desc: 'Watermark Studio + WhatsApp por raça. Comece essa semana.' },
              { step: '2', title: 'Valide 1 item médio em 90 dias', desc: 'Memorial ou Apartamentos Cat-Friendly. Custo próximo de zero.' },
              { step: '3', title: 'Use os resultados como argumento', desc: 'Cada validação vira dado para o próximo parceiro, investidor ou deal.' },
            ].map(s => (
              <div key={s.step} className="rounded-2xl p-4 border border-white/15" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black mb-2"
                  style={{ backgroundColor: A, color: P }}>{s.step}</div>
                <p className="text-xs font-black text-white mb-1">{s.title}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
