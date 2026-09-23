import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus, BookOpen, ShoppingBag, ChevronUp, X,
  LayoutDashboard, Users, PawPrint, FileText, DollarSign,
  Eye, Handshake, Store, Pill, Syringe, Scale, PenTool,
  Sparkles, MessagesSquare, Stethoscope, PlusCircle,
  TrendingDown, TrendingUp, Activity,
} from 'lucide-react';
import Header from '../components/Header';
import useSensory from '../hooks/useSensory';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { getCatLifeBadge, getPrimaryTutorBadge } from '../utils/membershipMeta';
import { resolveCatThemeHex } from '../config/catThemes';
import useOfferDecision from '../hooks/useOfferDecision';
import OfferCard from '../components/offers/OfferCard';
import HealthAlertCard from '../components/offers/HealthAlertCard';
import RegistroAvulsoModal from '../components/protocol/RegistroAvulsoModal';
import SpotlightTour from '../components/SpotlightTour';
import ProfileHealthBar from '../components/ProfileModules/ProfileHealthBar';
import { extractWeightSeries, computeWeightAlerts, daysSinceLastWeight } from '../utils/weightAlerts';
import imgShortcutBiblioteca from '../assets/cards-home/gatedo-img10.webp';
import imgShortcutComunigato from '../assets/cards-home/gatedo-img7.webp';
import imgShortcutGatedoland from '../assets/cards-home/gatedo-img8.webp';
import imgShortcutLoja       from '../assets/cards-home/gatedo-img11.webp';

const C = { purple: '#8B4AFF', accent: '#e7ff60', accentDim: '#ebfc66', bg: 'var(--gatedo-light-bg)' };

// Tour spotlight dos "principais recursos" — roda em cima da Home de
// verdade, destacando os elementos reais da UI (nada de tela/mockup).
const FEATURE_TOUR_STEPS = [
  {
    selector: '[data-tour="profile-avatar"]',
    title: 'Seu perfil',
    text: 'Aqui ficam seus dados, selos e conquistas.',
  },
  {
    selector: '[data-tour="trophy-gamification"]',
    title: 'Gamificação',
    text: 'Toque no troféu pra ver seu nível, XPT e GPTS.',
  },
  {
    selector: '[data-tour="notif-bell"]',
    title: 'Notificações',
    text: 'Alertas de vacina, peso e novidades chegam aqui — o sininho avisa quando tem algo pendente.',
  },
  {
    selector: '[data-tour="cats-rail"]',
    title: 'Meus Gatos',
    text: 'Seus gatos ficam aqui na Home — toque em um pra ver o resumo de saúde na hora.',
  },
  {
    selector: '[data-tour="needs-today"]',
    title: 'O que precisa de você hoje',
    text: 'Alertas de cuidado — vacina vencendo, pesagem atrasada — aparecem aqui como cards, com o que fazer.',
  },
  {
    selector: '[data-tour="highlight-slot"]',
    title: 'Pra você',
    text: 'Um banner com o que faz mais sentido pro seu gato agora.',
  },
  {
    selector: '[data-tour="fab-center"]',
    title: 'Atalhos rápidos',
    text: 'Toque aqui pra abrir os atalhos — é por eles que você adiciona seu primeiro gato e os demais, se tiver mais de um.',
    onEnter: () => window.dispatchEvent(new CustomEvent('gatedo-tour-fab', { detail: true })),
  },
  {
    selector: '[data-tour="fab-cats"]',
    title: 'Meus Gatos',
    text: 'Aqui ficam todos os seus gatos — pode adicionar quantos precisar.',
  },
  {
    selector: '[data-tour="fab-igentvet"]',
    title: 'iGentVet',
    text: 'Nosso assistente de IA veterinária, disponível a qualquer hora.',
    onExit: () => window.dispatchEvent(new CustomEvent('gatedo-tour-fab', { detail: false })),
  },
  {
    selector: '[data-tour="nav-home"]',
    title: 'Início',
    text: 'Sua Home — tudo que precisa da sua atenção hoje aparece por aqui.',
  },
  {
    selector: '[data-tour="nav-health"]',
    title: 'Saúde',
    text: 'Histórico de saúde, peso e a curva do seu gato ao longo do tempo.',
  },
  {
    selector: '[data-tour="nav-comunigato"]',
    title: 'ComuniGato',
    text: 'Compartilhe fotos e histórias com outros tutores de gatos.',
  },
];

const stagger = { visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 26 } },
};

// ─────────────────────────────────────────────────────────────────────────────
// CatsRail — Meus Gatos, com ponto de status por card
// ─────────────────────────────────────────────────────────────────────────────
function MiniTutorBadge({ badge }) {
  const [failed, setFailed] = useState(false);
  if (!badge) return null;
  return (
    <span
      className="relative ml-2 inline-flex items-center overflow-visible rounded-full px-1.5 py-0.5 pl-4 text-[7px] font-black uppercase tracking-[1px] shadow-sm"
      style={{ background: badge.gradient || badge.pillBg || badge.color || C.purple, color: badge.pillText || '#ebfc66' }}
      title={badge.label}
    >
      {badge.launchBadge && !failed ? (
        <img
          src={badge.asset || `/assets/badges/${badge.key}.png`}
          alt={badge.label}
          className="absolute left-0 top-1/2 z-10 h-6 w-6 -translate-x-1/2 -translate-y-1/2 object-contain"
          onError={() => setFailed(true)}
        />
      ) : null}
      <span className="relative z-10">{badge.petLabel || badge.label}</span>
    </span>
  );
}

function CatsRail({ cats, loading, onAdd, tutorBadge, selectedCatId, onSelect }) {
  const navigate = useNavigate();
  const touch    = useSensory();
  const active   = cats.filter(c => !c.isMemorial && !c.isArchived);
  const memorial = cats.filter(c => c.isMemorial || c.isArchived);

  if (loading) return (
    <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {[1, 2, 3].map(i => <div key={i} className="flex-shrink-0 w-28 h-36 rounded-[22px] bg-gray-100 animate-pulse" />)}
    </div>
  );

  return (
    <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {active.map((cat, i) => {
        const skinColor = resolveCatThemeHex(cat.themeColor);
        const isSelected = selectedCatId === cat.id;
        return (
          <motion.button key={cat.id}
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            whileHover={{ y: -5, scale: 1.035, transition: { type: 'spring', stiffness: 380, damping: 24 } }}
            whileTap={{ scale: 0.96, transition: { type: 'spring', stiffness: 380, damping: 24 } }}
            onClick={() => { touch(); navigate(`/cat/${cat.id}`); }}
            className="flex-shrink-0 w-28 rounded-[22px] overflow-hidden relative cursor-pointer"
            style={{
              height: 140,
              boxShadow: isSelected ? `0 8px 22px ${skinColor}55` : '0 2px 8px rgba(0,0,0,0.08)',
              outline: isSelected ? `2px solid ${skinColor}` : 'none',
              outlineOffset: 2,
              transition: 'box-shadow 0.25s ease',
            }}>
            <div className="w-full h-full">
              {cat.photoUrl
                ? <img src={cat.photoUrl} className="w-full h-full object-cover" alt={cat.name} />
                : <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: `${C.purple}12` }}>🐱</div>}
            </div>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.35) 40%,transparent 100%)' }} />

            {/* Painel preditivo — micro score + gráfico, sem sair da Home */}
            <motion.button
              whileHover={{ scale: 1.14 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                touch();
                onSelect(isSelected ? null : cat.id);
              }}
              title="Painel de saúde"
              className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
              style={{
                background: isSelected ? skinColor : 'rgba(255,255,255,0.28)',
                border: '1px solid rgba(255,255,255,0.5)',
                backdropFilter: 'blur(3px)',
              }}
            >
              <Activity size={11} className="text-white" />
            </motion.button>

            <div className="absolute bottom-2 left-0 right-0 px-2.5 pb-1.5">
              <p className="font-black text-white text-sm leading-none truncate">{cat.name}</p>
              <div className="mt-1 flex flex-col items-start gap-1">
                <MiniTutorBadge badge={tutorBadge} />
                <p className="text-[8px] text-white/70 font-black uppercase tracking-[1.6px] truncate">{getCatLifeBadge(cat)}</p>
              </div>
            </div>
            {/* Barrinha com a cor da skin do gato — abaixo do texto, na borda do card */}
            <div className="absolute bottom-0 left-0 right-0 h-[5px]" style={{ background: skinColor }} />
          </motion.button>
        );
      })}
      {memorial.map(cat => (
        <motion.button key={cat.id} onClick={() => { touch(); navigate(`/cat/${cat.id}`); }}
          className="flex-shrink-0 w-28 rounded-[22px] overflow-hidden relative cursor-pointer opacity-50" style={{ height: 140 }}>
          <div className="w-full h-full">
            {cat.photoUrl
              ? <img src={cat.photoUrl} className="w-full h-full object-cover grayscale" alt={cat.name} />
              : <div className="w-full h-full flex items-center justify-center text-5xl bg-gray-100">🐱</div>}
          </div>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.65) 40%,transparent)' }} />
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <p className="font-black text-white text-sm leading-none truncate">{cat.name}</p>
            <div className="mt-1 flex flex-col items-start gap-1">
              <MiniTutorBadge badge={tutorBadge} />
              <p className="text-[8px] text-white/50 font-bold uppercase tracking-[1.6px]">In memoriam</p>
            </div>
          </div>
        </motion.button>
      ))}
      <motion.button whileTap={{ scale: 0.95 }} onClick={() => { touch(); onAdd(); }}
        className="flex-shrink-0 w-28 rounded-[22px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 bg-white/60"
        style={{ height: 140 }}>
        <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
          <Plus size={18} className="text-gray-300" />
        </div>
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-wider text-center px-2">Novo gato</p>
      </motion.button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// "O que precisa de você hoje" — no máx. 3 itens acionáveis, por urgência.
// Sem pendências, a seção inteira não renderiza nada (retorna null).
// ─────────────────────────────────────────────────────────────────────────────
const PREVENTIVE_TYPE_PARAM = { VACCINE: 'vaccine', VERMIFUGE: 'vermifuge', PARASITE: 'parasite' };
const PREVENTIVE_LABEL = { VACCINE: 'Vacina', VERMIFUGE: 'Vermífugo', PARASITE: 'Antipulgas' };

function buildTodayItems(cats, enrollments, onboardingDone) {
  const items = [];
  const now = Date.now();
  const active = cats.filter((c) => !c.isMemorial && !c.isArchived);

  // Tour de boas-vindas pulado — os dois passos reais (cadastrar gato,
  // primeira pesagem) continuam pendentes aqui até serem concluídos, com ou
  // sem o assistente do tour.
  if (!onboardingDone && active.length === 0) {
    items.push({
      key: 'onboarding-cat',
      urgency: 3, catId: null, catName: 'Novo gato', catPhoto: null,
      icon: PawPrint,
      label: 'Cadastre seu gato',
      deadline: 'menos de 2 min',
      ctaLabel: 'Cadastrar',
      kind: 'onboarding-cat',
    });
  }

  let anyNeverWeighed = false;

  for (const cat of active) {
    const records = cat.healthRecords || [];

    // 1 — preventivo vencido ou vencendo
    for (const r of records) {
      if (!PREVENTIVE_TYPE_PARAM[r.type] || !r.nextDueDate) continue;
      const days = Math.ceil((new Date(r.nextDueDate).getTime() - now) / 86400000);
      if (days < 0) {
        items.push({
          key: `prev-${cat.id}-${r.type}-${r.nextDueDate}`,
          urgency: 3, catId: cat.id, catName: cat.name, catPhoto: cat.photoUrl,
          icon: Syringe,
          label: `${PREVENTIVE_LABEL[r.type]} vencido`,
          deadline: `há ${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''}`,
          ctaLabel: 'Registrar',
          kind: 'health-new',
          typeParam: PREVENTIVE_TYPE_PARAM[r.type],
        });
      } else if (days <= 14) {
        items.push({
          key: `prev-${cat.id}-${r.type}-${r.nextDueDate}`,
          urgency: 2, catId: cat.id, catName: cat.name, catPhoto: cat.photoUrl,
          icon: Syringe,
          label: `${PREVENTIVE_LABEL[r.type]} vencendo`,
          deadline: `em ${days} dia${days !== 1 ? 's' : ''}`,
          ctaLabel: 'Registrar',
          kind: 'health-new',
          typeParam: PREVENTIVE_TYPE_PARAM[r.type],
        });
      }
    }

    // 2 — pesagem atrasada (>45 dias) ou nunca registrada
    const lastWeightDays = daysSinceLastWeight(records);
    if (lastWeightDays === null) anyNeverWeighed = true;
    if (lastWeightDays === null || lastWeightDays > 45) {
      items.push({
        key: `weight-${cat.id}`,
        urgency: lastWeightDays === null ? 1 : 2, catId: cat.id, catName: cat.name, catPhoto: cat.photoUrl,
        icon: Scale,
        label: lastWeightDays === null ? 'Ainda não foi pesado' : 'Pesagem atrasada',
        deadline: lastWeightDays === null ? 'sem registro' : `há ${lastWeightDays} dias`,
        ctaLabel: 'Pesar agora',
        kind: 'quick-weight',
      });
    }

    // 3 — alerta de padrão ativo (Linha do tempo)
    const series = extractWeightSeries(records);
    const alerts = computeWeightAlerts(series);
    if (alerts.length > 0) {
      const a = alerts[0];
      items.push({
        key: `pattern-${cat.id}`,
        urgency: a.type === 'drop' ? 3 : 2, catId: cat.id, catName: cat.name, catPhoto: cat.photoUrl,
        icon: a.type === 'drop' ? TrendingDown : TrendingUp,
        label: a.message,
        deadline: a.rule,
        ctaLabel: 'Ver detalhes',
        kind: 'open-tab',
        targetTab: 'LINHATEMPO',
      });
    }
  }

  // Já fez os dois passos reais (tem gato, já pesou) mas nunca voltou pro
  // tour pra fechar — oferece o selo direto, sem repetir os passos 2 e 3.
  if (!onboardingDone && active.length > 0 && !anyNeverWeighed) {
    items.push({
      key: 'onboarding-finish',
      urgency: 1, catId: active[0].id, catName: active[0].name, catPhoto: active[0].photoUrl,
      icon: Sparkles,
      label: 'Pegue seu selo da Primeira Jornada',
      deadline: 'menos de 1 min',
      ctaLabel: 'Ver selo',
      kind: 'onboarding-finish',
    });
  }

  return items.sort((a, b) => b.urgency - a.urgency).slice(0, 3);
}

// Cards de protocolo — separados da lista genérica porque precisam de mais
// espaço (titulo_curto, acao_do_dia inteira, "Aconteceu de novo"), sem o
// limite/truncamento dos itens de "O que precisa de você hoje".
function buildProtocolCards(cats, enrollments) {
  const now = Date.now();
  const active = cats.filter((c) => !c.isMemorial && !c.isArchived);
  const cards = [];

  for (const enr of enrollments || []) {
    if (enr.status !== 'EM_ANDAMENTO' || enr.currentDay < 1) continue;
    const log = (enr.logs || []).find((l) => l.dayNumber === enr.currentDay);
    if (!log || log.completedAt) continue;
    if (new Date(log.unlockedAt).getTime() > now) continue;

    const cat = active.find((c) => c.id === enr.petId);
    if (!cat) continue;
    const spec = enr.protocol?.spec;
    const dia = (spec?.dias || []).find((d) => d.numero === enr.currentDay);

    cards.push({
      key: `protocol-${enr.id}`,
      enrollmentId: enr.id,
      catId: enr.petId,
      catName: cat.name,
      catPhoto: cat.photoUrl,
      slug: enr.protocol?.slug,
      spec,
      tituloCurto: spec?.titulo_curto || enr.protocol?.title || 'Protocolo',
      dayNumber: enr.currentDay,
      totalDays: enr.protocol?.totalDays,
      acaoDoDia: dia?.acao_do_dia || dia?.tarefa || '',
    });
  }

  return cards;
}

// Card dedicado de protocolo — titulo_curto, progresso, a ação do dia
// inteira (sem truncar) e o atalho pra "Aconteceu de novo" sem sair da home.
function ProtocolTodayCard({ card, onOpen, onAvulso }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[22px] p-4 border border-gray-50 shadow-sm">
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0" style={{ border: `2px solid ${C.purple}25` }}>
          {card.catPhoto
            ? <img src={card.catPhoto} className="w-full h-full object-cover" alt="" />
            : <div className="w-full h-full flex items-center justify-center text-xs" style={{ background: `${C.purple}10` }}>🐱</div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-wide truncate" style={{ color: C.purple }}>
            {card.catName} · {card.tituloCurto}
          </p>
          <p className="text-[10px] font-bold text-gray-400">Dia {card.dayNumber} de {card.totalDays}</p>
        </div>
      </div>
      <p className="text-[13px] font-bold text-gray-800 mb-3 leading-snug">{card.acaoDoDia}</p>
      <div className="flex gap-2">
        <button onClick={onOpen}
          className="flex-1 py-2.5 rounded-xl font-black text-[11px] text-white"
          style={{ background: `linear-gradient(135deg, ${C.purple} 0%, #4B40C6 100%)` }}>
          Abrir dia
        </button>
        <button onClick={onAvulso}
          className="px-3.5 py-2.5 rounded-xl font-black text-[11px] flex items-center gap-1"
          style={{ background: '#FEF2F2', color: '#DC2626' }}>
          <PlusCircle size={13} /> Aconteceu de novo
        </button>
      </div>
    </motion.div>
  );
}

function NeedsTodaySection({ cats, enrollments, onOpenWeight }) {
  const navigate = useNavigate();
  const touch    = useSensory();
  const { user } = useContext(AuthContext);
  const [onboardingDone, setOnboardingDone] = useState(true); // otimista até saber

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/users/${user.id}/onboarding`)
      .then((r) => setOnboardingDone(Boolean(r.data?.completedAt)))
      .catch(() => {});
  }, [user?.id]);

  const items = useMemo(() => buildTodayItems(cats, enrollments, onboardingDone), [cats, enrollments, onboardingDone]);
  const protocolCards = useMemo(() => buildProtocolCards(cats, enrollments), [cats, enrollments]);
  const [avulsoCard, setAvulsoCard] = useState(null);

  if (items.length === 0 && protocolCards.length === 0) return null;

  const resolve = (item) => {
    touch();
    if (item.kind === 'quick-weight') {
      const cat = cats.find((c) => c.id === item.catId);
      onOpenWeight(cat);
      return;
    }
    if (item.kind === 'health-new') {
      navigate(`/cat/${item.catId}/health-new?type=${item.typeParam}`);
      return;
    }
    if (item.kind === 'open-tab') {
      navigate(`/cat/${item.catId}`, { state: { restoreTab: item.targetTab } });
      return;
    }
    if (item.kind === 'onboarding-cat') {
      navigate('/onboarding?step=2');
      return;
    }
    if (item.kind === 'onboarding-finish') {
      navigate(`/onboarding?step=5&catId=${item.catId}`);
    }
  };

  return (
    <motion.section variants={fadeUp} data-tour="needs-today">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">O que precisa de você hoje</h2>
      </div>
      <div className="space-y-2">
        {protocolCards.map((card) => (
          <ProtocolTodayCard
            key={card.key}
            card={card}
            onOpen={() => { touch(); navigate(`/protocolos/${card.slug}`, { state: { catId: card.catId } }); }}
            onAvulso={() => { touch(); setAvulsoCard(card); }}
          />
        ))}

        {items.map((item) => (
          <motion.div key={item.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-white rounded-[20px] px-3.5 py-3 border border-gray-50 shadow-sm">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl overflow-hidden" style={{ border: `2px solid ${C.purple}25` }}>
                {item.catPhoto
                  ? <img src={item.catPhoto} className="w-full h-full object-cover" alt="" />
                  : <div className="w-full h-full flex items-center justify-center text-sm" style={{ background: `${C.purple}10` }}>🐱</div>}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <item.icon size={10} style={{ color: C.purple }} className="shrink-0" />
                <p className="text-[9px] font-black uppercase tracking-wide truncate" style={{ color: C.purple }}>{item.catName}</p>
              </div>
              <p className="text-[12px] font-bold text-gray-700 truncate">{item.label}</p>
              <p className="text-[10px] font-bold text-gray-400">{item.deadline}</p>
            </div>
            <button onClick={() => resolve(item)}
              className="shrink-0 px-3 py-2 rounded-full text-[9px] font-black text-white uppercase tracking-wide"
              style={{ background: C.purple }}>
              {item.ctaLabel}
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {avulsoCard && (
          <RegistroAvulsoModal
            spec={avulsoCard.spec}
            slug={avulsoCard.slug}
            enrollmentId={avulsoCard.enrollmentId}
            catName={avulsoCard.catName}
            onClose={() => setAvulsoCard(null)}
          />
        )}
      </AnimatePresence>
    </motion.section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Registro rápido — mesmas ações do FAB do perfil, com seletor de gato
// quando há mais de um ativo (mesmo padrão do ícone de emergência da nav).
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_RECORD_ACTIONS = [
  { type: 'consultation', label: 'Consulta',   icon: Stethoscope, color: '#6366F1' },
  { type: 'medicine',     label: 'Medicação',  icon: Pill,         color: '#F59E0B' },
  { type: 'vaccine',      label: 'Vacina',     icon: Syringe,      color: '#EC4899' },
  { type: 'vermifuge',    label: 'Vermífugo',  icon: Pill,         color: '#3B82F6' },
  { type: 'parasite',     label: 'Antipulgas', icon: Pill,         color: '#8B4AFF' },
  { type: 'weight_quick', label: 'Peso',       icon: Scale,        color: '#10B981' },
  { type: 'diary',        label: 'Diário',     icon: PenTool,      color: '#F97316' },
];

const QUICK_RECORD_LOOP = 3;

// Desktop tem espaço/mouse pra ver a lista inteira sem rolar — a duplicação
// pra loop infinito só faz sentido na faixa touch/mobile, mais estreita.
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 768
  );
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

function QuickRecordSection({ cats, onOpenWeight }) {
  const navigate = useNavigate();
  const touch    = useSensory();
  const active   = cats.filter((c) => !c.isMemorial && !c.isArchived);
  const isDesktop = useIsDesktop();

  const [pendingAction, setPendingAction] = useState(null);
  const [pickerOpen, setPickerOpen]       = useState(false);

  // Rolagem lateral infinita (só mobile/touch) — 3 cópias da lista; ao chegar
  // perto de uma borda, salta sem transição pra mesma posição no set do meio.
  const scrollRef = useRef(null);
  const [loopReady, setLoopReady] = useState(false);

  useEffect(() => {
    if (isDesktop) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth / QUICK_RECORD_LOOP;
    setLoopReady(true);
  }, [isDesktop]);

  const handleLoopScroll = () => {
    if (isDesktop) return;
    const el = scrollRef.current;
    if (!el) return;
    const setWidth = el.scrollWidth / QUICK_RECORD_LOOP;
    if (el.scrollLeft < setWidth * 0.5) el.scrollLeft += setWidth;
    else if (el.scrollLeft > setWidth * 1.5) el.scrollLeft -= setWidth;
  };

  const loopedActions = useMemo(
    () => isDesktop ? QUICK_RECORD_ACTIONS : Array.from({ length: QUICK_RECORD_LOOP }, () => QUICK_RECORD_ACTIONS).flat(),
    [isDesktop]
  );

  const performAction = (action, cat) => {
    if (action.type === 'weight_quick') { onOpenWeight(cat); return; }
    if (action.type === 'diary') { navigate(`/cat/${cat.id}/diary`); return; }
    navigate(`/cat/${cat.id}/health-new?type=${action.type}`);
  };

  const handleTap = (action) => {
    touch();
    if (active.length === 0) { navigate('/cat-new'); return; }
    if (active.length === 1) { performAction(action, active[0]); return; }
    setPendingAction(action);
    setPickerOpen(true);
  };

  const pickCat = (cat) => {
    setPickerOpen(false);
    if (pendingAction) performAction(pendingAction, cat);
    setPendingAction(null);
  };

  return (
    <motion.section variants={fadeUp}>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Registro rápido</h2>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleLoopScroll}
        className="flex gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', opacity: (isDesktop || loopReady) ? 1 : 0, transition: 'opacity 0.15s ease' }}
      >
        {loopedActions.map((action, idx) => (
          <button key={`${action.type}-${idx}`} onClick={() => handleTap(action)}
            className="flex flex-col items-center gap-1.5 shrink-0" style={{ width: 62 }}>
            <motion.div
              whileHover={{ scale: 1.18 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
              style={{ background: action.color }}
            >
              <action.icon size={19} className="text-white" />
            </motion.div>
            <span className="text-[8px] font-black text-gray-500 uppercase text-center leading-tight">{action.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
            onClick={() => setPickerOpen(false)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[28px] p-6 w-full max-w-sm shadow-2xl relative"
            >
              <button onClick={() => setPickerOpen(false)} className="absolute top-4 right-4">
                <X size={18} className="text-gray-300" />
              </button>
              <p className="font-black text-gray-900 text-[15px] mb-4">Registrar em qual gato?</p>
              <div className="space-y-2">
                {active.map((cat) => (
                  <button key={cat.id} onClick={() => pickCat(cat)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-gray-100 text-left">
                    <img
                      src={cat.photoUrl || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&q=60'}
                      alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    <span className="text-[13px] font-black text-gray-800">{cat.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal rápido de peso — mesmo fluxo usado no FAB do perfil / Linha do tempo
// ─────────────────────────────────────────────────────────────────────────────
function QuickWeightModal({ cat, onClose, onSaved }) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    const weightNum = parseFloat(String(value).replace(',', '.'));
    if (!weightNum || weightNum <= 0) { setError('Informe um peso válido.'); return; }

    setSaving(true);
    setError('');
    try {
      await api.patch(`/pets/${cat.id}`, { weight: weightNum });
      await api.post('/health-records', {
        petId: cat.id, type: 'EXAM', title: `Check-in de Peso: ${weightNum}kg`,
        date: new Date(), notes: 'Peso registrado via Home.',
      });
      await onSaved?.();
      onClose();
    } catch {
      setError('Não foi possível registrar agora. Tente de novo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="font-black text-gray-800 text-sm">Registrar peso de {cat?.name}</p>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3 mb-2">
          <input type="number" inputMode="decimal" step="0.01" autoFocus
            value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.0"
            className="flex-1 bg-transparent text-2xl font-black text-gray-800 outline-none" />
          <span className="font-black text-gray-400 text-sm">kg</span>
        </div>
        {error && <p className="text-[11px] font-bold text-red-500 mb-2">{error}</p>}
        <button onClick={save} disabled={saving}
          className="w-full py-3.5 rounded-2xl font-black text-white text-sm mt-2"
          style={{ background: saving ? '#9ca3af' : `linear-gradient(135deg, ${C.purple} 0%, #4B40C6 100%)` }}>
          {saving ? 'Salvando...' : 'Salvar pesagem'}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Slot de destaque — pergunta ao módulo único de decisão (GET /offers/decide,
// surface=HOME_SLOT). A cascata inteira vive no backend; aqui só exibe o que
// vier: alerta de saúde tem prioridade sobre qualquer oferta, nunca os dois.
// ─────────────────────────────────────────────────────────────────────────────
function HighlightSlot() {
  const { offer, alert, loading, dismiss } = useOfferDecision({ surface: 'HOME_SLOT' });

  if (loading) {
    return (
      <motion.section variants={fadeUp}>
        <div className="h-16 rounded-[20px] bg-gray-100 animate-pulse" />
      </motion.section>
    );
  }

  if (!offer && !alert) return null;

  return (
    <motion.section variants={fadeUp} data-tour="highlight-slot">
      {!alert && (
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={13} style={{ color: C.purple }} />
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Pra você</h2>
        </div>
      )}
      {alert ? <HealthAlertCard alert={alert} /> : <OfferCard offer={offer} surface="HOME_SLOT" onDismiss={dismiss} />}
    </motion.section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Atalhos — Biblioteca · Comunigato · GATEDOLAND · Loja
// ─────────────────────────────────────────────────────────────────────────────
const SHORTCUT_CARD_RADIUS = 20;

function ShortcutsRow() {
  const navigate = useNavigate();
  const touch    = useSensory();
  const items = [
    { label: 'Biblioteca', icon: BookOpen,       path: '/guia',       img: imgShortcutBiblioteca, tint: 'rgba(14,165,233,0.30)',  band: '#0369A1' },
    { label: 'Comunigato', icon: MessagesSquare, path: '/comunigato', img: imgShortcutComunigato, tint: 'rgba(6,182,212,0.30)',   band: '#0E7490' },
    { label: 'GATEDOLAND', icon: Sparkles,       path: '/gatedoland', img: imgShortcutGatedoland, tint: 'rgba(139,74,255,0.30)',  band: '#6D28D9' },
    { label: 'Loja',       icon: ShoppingBag,    path: '/store',      img: imgShortcutLoja,       tint: 'rgba(245,158,11,0.30)',  band: '#B45309' },
  ];

  return (
    <motion.section variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {items.map((it, i) => (
        <motion.button key={it.path}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          whileHover={{ y: -3, scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { touch(); navigate(it.path); }}
          className="relative overflow-hidden text-left group"
          style={{ height: 132, borderRadius: SHORTCUT_CARD_RADIUS }}
        >
          <img src={it.img} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0" style={{ background: it.tint }} />

          {/* Ícone com contorno + fundo glass — cresce ("estoura") no hover */}
          <motion.div
            whileHover={{ scale: 1.28 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            className="absolute top-2.5 left-2.5 w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.32)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          >
            <it.icon size={15} strokeWidth={2} className="text-white" />
          </motion.div>

          {/* Base em cor chapada — topo reto, com degradê transparente do lado direito */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center px-3"
            style={{ height: 44, background: `linear-gradient(to right, ${it.band} 60%, ${it.band}00 100%)` }}
          >
            <span className="text-[13px] font-black text-white uppercase tracking-wide leading-none truncate">{it.label}</span>
          </div>
        </motion.button>
      ))}
    </motion.section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Welcome modal de selo do tutor — inalterado
// ─────────────────────────────────────────────────────────────────────────────
function TutorBadgeWelcomeModal({ badge, onClose }) {
  const [hasImage, setHasImage] = useState(true);
  if (!badge) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[240] flex items-center justify-center px-5 bg-slate-950/55 backdrop-blur-md"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ y: 28, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 18, scale: 0.98, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 24 }}
        className="relative mt-24 w-full max-w-[390px] overflow-visible rounded-[34px] bg-white shadow-2xl"
      >
        <button type="button" onClick={onClose}
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-500 shadow-sm"
          aria-label="Fechar">
          <X size={17} />
        </button>

        {badge.launchBadge && hasImage && (
          <img src={badge.asset} alt={badge.label}
            className="absolute left-1/2 top-[-92px] z-20 h-48 w-48 -translate-x-1/2 object-contain drop-shadow-2xl"
            onError={() => setHasImage(false)} />
        )}

        <div className="relative overflow-hidden rounded-t-[34px] px-7 pb-8 pt-24 text-white" style={{ background: badge.gradient }}>
          <div className="absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-black/6" />
          {(!badge.launchBadge || !hasImage) && (
            <div className="relative mx-auto mb-5 grid h-28 w-28 place-items-center rounded-[32px] border border-white/30 bg-white/18 shadow-xl backdrop-blur">
              <Sparkles size={46} className="text-white drop-shadow" />
            </div>
          )}
          <p className="relative text-center text-[10px] font-black uppercase tracking-[4px] text-white/75">Selo ativado</p>
          <h2 className="relative mt-2 text-center text-3xl font-black leading-none tracking-tight">{badge.label}</h2>
          <p className="relative mx-auto mt-3 max-w-[290px] text-center text-sm font-bold leading-relaxed text-white/82">
            {badge.title}. Bem-vindo ao círculo fundador do Gatedo.
          </p>
        </div>

        <div className="space-y-3 px-7 py-6">
          <div className="flex items-start gap-3 rounded-2xl bg-[#f5f1ff] p-4">
            <Sparkles size={18} className="mt-0.5 text-[#8B4AFF]" />
            <p className="text-sm font-extrabold leading-snug text-slate-700">
              Seu perfil recebeu a condecoração e ela aparecerá no app conforme sua hierarquia.
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="h-12 w-full rounded-2xl bg-[#8B4AFF] text-sm font-black uppercase tracking-[2px] text-white shadow-lg shadow-purple-200">
            Entrar no Gatedo
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Home
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const touch    = useSensory();
  const { user } = useContext(AuthContext);
  const [featureTourOn, setFeatureTourOn] = useState(() => Boolean(location.state?.startFeatureTour));

  const finishFeatureTour = () => {
    setFeatureTourOn(false);
    window.dispatchEvent(new CustomEvent('gatedo-tour-fab', { detail: false }));
    navigate(location.pathname, { replace: true, state: {} });
  };

  const [cats, setCats]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [showBadgeWelcome, setShowBadgeWelcome] = useState(false);
  const [weightModalCat, setWeightModalCat]     = useState(null);
  const [selectedCatId, setSelectedCatId]       = useState(null);
  const tutorBadge = getPrimaryTutorBadge(user);
  const selectedCat = cats.find((c) => c.id === selectedCatId) || null;

  const isAdmin = user?.email === 'diegobocktavares@gmail.com' || user?.role === 'ADMIN';

  const loadCats = () =>
    api.get('/pets').then((r) => {
      const sorted = (r.data || []).sort((a, b) => {
        const aMemo = a.isMemorial || a.isArchived ? 1 : 0;
        const bMemo = b.isMemorial || b.isArchived ? 1 : 0;
        if (aMemo !== bMemo) return aMemo - bMemo;
        return (a.healthRecords?.some((r) => r.type === 'MEDICINE') ? 0 : 1) -
               (b.healthRecords?.some((r) => r.type === 'MEDICINE') ? 0 : 1);
      });
      setCats(sorted);
    }).finally(() => setLoading(false));

  useEffect(() => { loadCats(); }, []);

  useEffect(() => {
    if (!user?.id) return;
    api.get('/content/protocols/enrollments/mine', { params: { userId: user.id } })
      .then((r) => setEnrollments(Array.isArray(r.data) ? r.data : []))
      .catch(() => setEnrollments([]));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !tutorBadge?.key) return;
    const storageKey = `gatedo_badge_welcome_${user.id}_${tutorBadge.key}`;
    if (!localStorage.getItem(storageKey)) setShowBadgeWelcome(true);
  }, [user?.id, tutorBadge?.key]);

  const closeBadgeWelcome = () => {
    if (user?.id && tutorBadge?.key) {
      localStorage.setItem(`gatedo_badge_welcome_${user.id}_${tutorBadge.key}`, '1');
    }
    setShowBadgeWelcome(false);
  };

  const activeCount = cats.filter((c) => !c.isMemorial && !c.isArchived).length;

  const adminRoutes = [
    { label: 'Geral',      icon: LayoutDashboard, path: '/admin'           },
    { label: 'Users',      icon: Users,           path: '/admin/users'     },
    { label: 'Cats',       icon: PawPrint,        path: '/admin/cats'      },
    { label: 'Conteúdo',   icon: FileText,        path: '/admin/content'   },
    { label: 'Financeiro', icon: DollarSign,      path: '/admin/financial' },
    { label: 'Overview',   icon: Eye,             path: '/admin/overview'  },
    { label: 'Partners',   icon: Handshake,       path: '/admin/partners'  },
    { label: 'Loja',       icon: Store,           path: '/admin/store'     },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="pb-36 min-h-screen"
      style={{ background: C.bg, fontFamily: "'Nunito', sans-serif" }}>

      <Header />

      {featureTourOn && (
        <SpotlightTour steps={FEATURE_TOUR_STEPS} onFinish={finishFeatureTour} />
      )}

      <AnimatePresence>
        {showBadgeWelcome && tutorBadge && (
          <TutorBadgeWelcomeModal badge={tutorBadge} onClose={closeBadgeWelcome} />
        )}
      </AnimatePresence>

      <motion.div className="px-4 space-y-5 max-w-[920px] mx-auto"
        variants={stagger} initial="hidden" animate="visible">

        {/* 1 ─ Meus Gatos */}
        <motion.section variants={fadeUp} data-tour="cats-rail">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-black text-gray-800 tracking-tighter leading-none">Meus Gatos</h2>
              {activeCount > 0 && (
                <p className="text-[10px] font-black mt-0.5" style={{ color: C.purple }}>
                  {activeCount} ativo{activeCount !== 1 ? 's' : ''} · toque para o perfil
                </p>
              )}
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { touch(); navigate('/cats'); }}
              className="px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-wider"
              style={{ background: C.accentDim, color: C.purple }}>
              Caixinha
            </motion.button>
          </div>
          <CatsRail
            cats={cats} loading={loading} onAdd={() => navigate('/cat-new')} tutorBadge={tutorBadge}
            selectedCatId={selectedCatId} onSelect={setSelectedCatId}
          />
          <AnimatePresence>
            {selectedCat && (
              <motion.div
                key={selectedCat.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="pt-4 relative">
                  <button
                    onClick={() => { touch(); setSelectedCatId(null); }}
                    className="absolute -top-0.5 right-1 z-20 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center"
                    aria-label="Fechar painel"
                  >
                    <X size={12} className="text-gray-400" />
                  </button>
                  <ProfileHealthBar cat={selectedCat} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* 2 ─ O que precisa de você hoje */}
        <NeedsTodaySection cats={cats} enrollments={enrollments} onOpenWeight={setWeightModalCat} />

        {/* 3 ─ Registro rápido */}
        <QuickRecordSection cats={cats} onOpenWeight={setWeightModalCat} />

        {/* 4 ─ Slot de destaque */}
        <HighlightSlot />

        {/* 5 ─ Atalhos */}
        <ShortcutsRow />

        <div className="h-4" />
      </motion.div>

      <AnimatePresence>
        {weightModalCat && (
          <QuickWeightModal
            cat={weightModalCat}
            onClose={() => setWeightModalCat(null)}
            onSaved={loadCats}
          />
        )}
      </AnimatePresence>

      {/* Admin panel */}
      {isAdmin && (
        <>
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[100] w-24 flex justify-center">
            <motion.button onClick={() => { touch(); setIsAdminOpen(true); }}
              animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}
              className="text-[#8B4AFF] px-4 py-1.5 rounded-t-2xl shadow-lg border-x border-t border-white/50 flex flex-col items-center group active:scale-95"
              style={{ background: C.accentDim }}>
              <ChevronUp size={16} strokeWidth={4} className="group-hover:-translate-y-1 transition-transform" />
            </motion.button>
          </div>
          <AnimatePresence>
            {isAdminOpen && (
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-x-0 bottom-0 z-[200] rounded-t-[40px] shadow-[0_-15px_40px_rgba(0,0,0,0.15)] p-8 max-h-[70vh] overflow-y-auto"
                style={{ background: C.accentDim }}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter" style={{ color: C.purple }}>Gatedo Admin</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: `${C.purple}60` }}>Painel de Controle</p>
                  </div>
                  <button onClick={() => setIsAdminOpen(false)} className="p-2 rounded-full" style={{ background: `${C.purple}15`, color: C.purple }}>
                    <X size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3 pb-8">
                  {adminRoutes.map(route => (
                    <button key={route.path} onClick={() => { touch(); navigate(route.path); setIsAdminOpen(false); }}
                      className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm active:scale-95 border border-gray-50">
                      <route.icon size={18} style={{ color: C.purple }} />
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-tight text-center">{route.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
