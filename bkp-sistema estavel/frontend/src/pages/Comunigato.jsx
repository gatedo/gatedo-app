import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, Heart, MessageCircle, Share2, Plus,
  Bookmark, Brain, Stethoscope, Sparkles, ChevronDown,
  ChevronRight, Shield, Award, TrendingUp, Camera,
  PawPrint, AlertCircle, CheckCircle, MoreHorizontal,
  Zap, ThumbsUp, Send, X, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useSensory from '../hooks/useSensory';

// ─── PALETA ──────────────────────────────────────────────────────────────────
const C = {
  purple:     '#6158ca',
  purpleDark: '#4B40C6',
  accent:     '#DFFF40',
  bg:         '#F4F3FF',
};

// ─── TIPOS DE POST ────────────────────────────────────────────────────────────
// Cada tipo carrega um contexto relacional diferente
const POST_TYPES = {
  PHOTO:       { label: 'Foto',         icon: Camera,       color: '#EC4899', bg: '#FDF2F8' },
  IGENT_TIP:   { label: 'Dica iGent',   icon: Brain,        color: '#6158ca', bg: '#F4F3FF' },
  HEALTH_WIN:  { label: 'Recuperação',  icon: CheckCircle,  color: '#16A34A', bg: '#F0FDF4' },
  VET_REVIEW:  { label: 'Vet Indicado', icon: Stethoscope,  color: '#0EA5E9', bg: '#F0F9FF' },
  QUESTION:    { label: 'Dúvida',       icon: AlertCircle,  color: '#D97706', bg: '#FFFBEB' },
  MEME:        { label: 'Humor',        icon: Sparkles,     color: '#8B5CF6', bg: '#F5F3FF' },
};

// ─── BADGES DE TUTOR ─────────────────────────────────────────────────────────
const BADGES = {
  'Gateiro Raiz':   { color: '#DFFF40', text: '#5A7000', icon: '🐾' },
  'Veterinário':    { color: '#DBEAFE', text: '#1E40AF', icon: '🩺' },
  'Resgatista':     { color: '#FCE7F3', text: '#9D174D', icon: '❤️' },
  'Especialista IA':{ color: '#EDE9FE', text: '#6158ca', icon: '🤖' },
  'Comunidade':     { color: '#D1FAE5', text: '#065F46', icon: '🌿' },
};

// ─── MOCK DATA — estrutura relacional real ────────────────────────────────────
const STORIES = [
  { id: 'add',    isAdd: true,  label: 'Seu Story' },
  { id: 's1',    name: 'Paçoca', tutor: 'Aline',   img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&q=80',  active: true,  breed: 'Persa' },
  { id: 's2',    name: 'Luna',   tutor: 'Marcos',  img: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=150&q=80', active: true,  breed: 'Siamês' },
  { id: 's3',    name: 'Simba',  tutor: 'Carla',   img: 'https://images.unsplash.com/photo-1495360019602-e001922271aa?w=150&q=80', active: false, breed: 'SRD' },
  { id: 's4',    name: 'Mimi',   tutor: 'Felipe',  img: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=150&q=80',  active: true,  breed: 'Maine Coon' },
  { id: 's5',    name: 'Bob',    tutor: 'Tati',    img: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=150&q=80', active: false, breed: 'Ragdoll' },
];

const POSTS = [
  // ── POST TIPO: IGENT_TIP ──────────────────────────────────────────────────
  {
    id: 'p1',
    type: 'IGENT_TIP',
    author: {
      name: 'Carla Mendes',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b830?w=100&q=80',
      badge: 'Gateiro Raiz',
    },
    // Vínculo relacional: gato específico
    cat: { name: 'Simba', breed: 'SRD', age: '4a', img: 'https://images.unsplash.com/photo-1495360019602-e001922271aa?w=80&q=80' },
    // Contexto da interação com a IA
    igentContext: {
      symptom: 'Coceira excessiva',
      symptomId: 'skin',
      analysisSnippet: 'Pode indicar dermatite atópica ou alergia alimentar. Frequência de coceira e localização são determinantes.',
      care: ['Trocar proteína da ração por peixe', 'Adicionar ômega-3', 'Monitorar por 15 dias'],
      isUrgent: false,
      outcome: 'Funcionou! Em 2 semanas a coceira sumiu quase 100%.',
      outcomePositive: true,
    },
    caption: 'Pessoal, o iGentVet salvou o Simba! Ele ficou coçando por meses, a IA identificou que era alergia à proteína da ração. Trocamos para ração de peixe e em 2 semanas melhorou demais 🐟✨',
    image: 'https://images.unsplash.com/photo-1495360019602-e001922271aa?w=800&q=80',
    likes: 247, comments: 34, saved: 89,
    liked: false, bookmarked: false,
    time: '3h', category: 'Saúde',
  },

  // ── POST TIPO: PHOTO ─────────────────────────────────────────────────────
  {
    id: 'p2',
    type: 'PHOTO',
    author: {
      name: 'Aline & Paçoca',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
      badge: 'Gateiro Raiz',
    },
    cat: { name: 'Paçoca', breed: 'Persa', age: '2a', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=80&q=80' },
    caption: 'Alguém mais tem um gato que acha que é planta? 🌱😂 O Paçoca não sai desse vaso! #GatoJardineiro #Humor',
    image: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=800&q=80',
    likes: 124, comments: 18, saved: 31,
    liked: true, bookmarked: false,
    time: '5h', category: 'Humor',
  },

  // ── POST TIPO: HEALTH_WIN ─────────────────────────────────────────────────
  {
    id: 'p3',
    type: 'HEALTH_WIN',
    author: {
      name: 'Felipe Rocha',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
      badge: 'Gateiro Raiz',
    },
    cat: { name: 'Mimi', breed: 'Maine Coon', age: '6a', img: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=80&q=80' },
    igentContext: {
      symptom: 'Vômito frequente',
      symptomId: 'digestion',
      care: ['Ração úmida 2x ao dia', 'Comedouro lento', 'Ausência de petiscos'],
      outcome: 'Veterinário confirmou gastrite leve. Protocolo da IA foi certeiro.',
      outcomePositive: true,
    },
    // Referência ao vet que confirmou
    vetRef: { name: 'Dr. Ricardo Silva', clinic: 'Gatos & Cia', verified: true },
    caption: 'Mimi vomitava todo dia por quase 2 meses. O iGentVet sugeriu comedouro lento e ração úmida antes de qualquer exame. Dr. Ricardo confirmou gastrite leve e disse que a abordagem foi perfeita! 💪',
    likes: 512, comments: 67, saved: 145,
    liked: false, bookmarked: true,
    time: '1d', category: 'Saúde',
  },

  // ── POST TIPO: QUESTION ───────────────────────────────────────────────────
  {
    id: 'p4',
    type: 'QUESTION',
    author: {
      name: 'Tati Lima',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&q=80',
      badge: 'Gateiro Raiz',
    },
    cat: { name: 'Bob', breed: 'Ragdoll', age: '1a', img: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=80&q=80' },
    question: 'Bob começou a beber muita água essa semana. Isso é sinal de algum problema? Alguém passou por isso? Ainda não consultei o iGentVet mas vou fazer isso hoje!',
    caption: 'Bob começou a beber muita água essa semana. Isso é sinal de algum problema? Alguém passou por isso? Ainda não consultei o iGentVet mas vou fazer isso hoje!',
    topAnswer: {
      author: 'Dr. Ana Vet',
      badge: 'Veterinária',
      text: 'Polidipsia em gatos jovens merece atenção. Pode ser desde estresse térmico até início de diabetes. Consulte urgente!',
    },
    likes: 88, comments: 41, saved: 22,
    liked: false, bookmarked: false,
    time: '2h', category: 'Dúvidas',
  },

  // ── POST TIPO: VET_REVIEW ─────────────────────────────────────────────────
  {
    id: 'p5',
    type: 'VET_REVIEW',
    author: {
      name: 'Marcos Souza',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
      badge: 'Gateiro Raiz',
    },
    cat: { name: 'Luna', breed: 'Siamês', age: '3a', img: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=80&q=80' },
    vetRef: { name: 'Clínica VetLife 24h', clinic: 'VetLife Hospital', verified: true, rating: 5, dist: '3.2km' },
    caption: 'Luna deu uma convulsão às 2h da manhã e a VetLife nos atendeu em 15 minutos. Diagnóstico de epilepsia idiopática, já está medicada e estável. Muito obrigado à equipe! 🙏',
    likes: 334, comments: 29, saved: 78,
    liked: false, bookmarked: false,
    time: '2d', category: 'Vets',
  },
];

const FILTERS = [
  { id: 'Todos',  emoji: '✨' },
  { id: 'Saúde',  emoji: '💊' },
  { id: 'Humor',  emoji: '😂' },
  { id: 'Dúvidas',emoji: '❓' },
  { id: 'Vets',   emoji: '🩺' },
];

// ─── STORY BUBBLE ─────────────────────────────────────────────────────────────
function StoryBubble({ story, onPress }) {
  if (story.isAdd) {
    return (
      <button onClick={onPress} className="flex flex-col items-center gap-1.5 min-w-[60px]">
        <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-white">
          <Plus size={20} className="text-gray-400" />
        </div>
        <span className="text-[9px] font-bold text-gray-400 truncate w-14 text-center">Seu Story</span>
      </button>
    );
  }
  return (
    <button onClick={onPress} className="flex flex-col items-center gap-1.5 min-w-[60px] group">
      <div className={`w-14 h-14 rounded-full p-[2.5px] ${story.active ? 'bg-gradient-to-tr from-[#DFFF40] to-[#6158ca]' : 'bg-gray-200'}`}>
        <div className="w-full h-full rounded-full border-[2.5px] border-white overflow-hidden">
          <img src={story.img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={story.name} />
        </div>
      </div>
      <span className="text-[9px] font-bold text-gray-500 truncate w-14 text-center">{story.name}</span>
    </button>
  );
}

// ─── MINI CAT CHIP ────────────────────────────────────────────────────────────
function CatChip({ cat, color = C.purple }) {
  if (!cat) return null;
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
      style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
      <div className="w-5 h-5 rounded-full overflow-hidden border border-white/50">
        <img src={cat.img} className="w-full h-full object-cover" alt={cat.name} />
      </div>
      <span className="text-[10px] font-black" style={{ color }}>
        {cat.name}
      </span>
      <span className="text-[9px] text-gray-400 font-bold">
        · {cat.breed} · {cat.age}
      </span>
    </div>
  );
}

// ─── AUTHOR BADGE ─────────────────────────────────────────────────────────────
function AuthorBadge({ badge }) {
  const b = BADGES[badge];
  if (!b) return null;
  return (
    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md"
      style={{ background: b.color, color: b.text }}>
      {b.icon} {badge}
    </span>
  );
}

// ─── TIPO BADGE ───────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const t = POST_TYPES[type];
  if (!t) return null;
  const Icon = t.icon;
  return (
    <span className="inline-flex items-center gap-1 text-[8px] font-black px-2 py-1 rounded-full"
      style={{ background: t.bg, color: t.color, border: `1px solid ${t.color}30` }}>
      <Icon size={9} />
      {t.label}
    </span>
  );
}

// ─── IGENT CARD (expandível) ──────────────────────────────────────────────────
function IgentCard({ igentContext, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  if (!igentContext) return null;

  return (
    <div className="rounded-[18px] overflow-hidden border"
      style={{ background: `${C.purple}06`, borderColor: `${C.purple}20` }}>

      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${C.purple}15` }}>
          <Brain size={16} style={{ color: C.purple }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full"
              style={{ background: `${C.purple}15`, color: C.purple }}>
              iGentVet IA
            </span>
            {igentContext.isUrgent && (
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-red-50 text-red-500">
                🔴 Urgente
              </span>
            )}
            {igentContext.outcomePositive && (
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-green-50 text-green-600">
                ✅ Funcionou
              </span>
            )}
          </div>
          <p className="text-xs font-black text-gray-700 mt-0.5">Sintoma: {igentContext.symptom}</p>
        </div>
        <ChevronDown size={14} className={`text-gray-300 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {igentContext.analysisSnippet && (
                <p className="text-[11px] text-gray-500 leading-relaxed bg-white rounded-xl px-3 py-2.5">
                  "{igentContext.analysisSnippet}"
                </p>
              )}
              {igentContext.care?.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2">Recomendações</p>
                  <div className="space-y-1.5">
                    {igentContext.care.map((c, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: `${C.purple}15` }}>
                          <span className="text-[7px] font-black" style={{ color: C.purple }}>{i + 1}</span>
                        </div>
                        <p className="text-[11px] text-gray-600 font-bold leading-snug">{c}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {igentContext.outcome && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: igentContext.outcomePositive ? '#F0FDF4' : '#FFF7ED' }}>
                  <span className="text-sm">{igentContext.outcomePositive ? '🌟' : '⚠️'}</span>
                  <p className="text-[11px] font-bold leading-snug"
                    style={{ color: igentContext.outcomePositive ? '#15803d' : '#92400e' }}>
                    {igentContext.outcome}
                  </p>
                </div>
              )}
              <button
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black transition-all"
                style={{ background: `${C.purple}10`, color: C.purple }}
              >
                <Zap size={11} />
                Consultar iGentVet sobre isso
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── VET REF CHIP ─────────────────────────────────────────────────────────────
function VetRefChip({ vetRef }) {
  if (!vetRef) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-sky-50 border border-sky-100">
      <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center">
        <Stethoscope size={13} className="text-sky-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-[10px] font-black text-sky-700 truncate">{vetRef.name}</p>
          {vetRef.verified && <Shield size={9} className="text-sky-500 flex-shrink-0" />}
        </div>
        <p className="text-[9px] text-sky-500 font-bold">{vetRef.clinic}</p>
      </div>
      {vetRef.rating && (
        <div className="flex items-center gap-0.5">
          <span className="text-[10px]">⭐</span>
          <span className="text-[9px] font-black text-sky-600">{vetRef.rating}</span>
        </div>
      )}
    </div>
  );
}

// ─── POST CARD ────────────────────────────────────────────────────────────────
function PostCard({ post, onLike, onSave }) {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState('');
  const postType = POST_TYPES[post.type];

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[28px] overflow-hidden border border-gray-100 shadow-sm"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={post.author.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-100" alt={post.author.name} />
            {/* Indicador do tipo de post */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
              style={{ background: postType?.bg, border: `2px solid white` }}>
              {postType && React.createElement(postType.icon, { size: 9, color: postType.color })}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm font-black text-gray-800 leading-none">{post.author.name}</h4>
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <AuthorBadge badge={post.author.badge} />
              <TypeBadge type={post.type} />
              <span className="text-[9px] text-gray-400 font-bold">{post.time}</span>
            </div>
          </div>
        </div>
        <button className="w-8 h-8 rounded-full hover:bg-gray-50 flex items-center justify-center transition-colors">
          <MoreHorizontal size={16} className="text-gray-400" />
        </button>
      </div>

      {/* ── Cat Chip ── */}
      {post.cat && (
        <div className="px-4 pb-3">
          <CatChip cat={post.cat} color={postType?.color || C.purple} />
        </div>
      )}

      {/* ── Imagem ── */}
      {post.image && (
        <div className="w-full aspect-[4/3] bg-gray-100 overflow-hidden">
          <img src={post.image} className="w-full h-full object-cover" alt="" />
        </div>
      )}

      {/* ── CARD QUESTION (sem imagem, texto destacado) ── */}
      {post.type === 'QUESTION' && !post.image && (
        <div className="mx-4 mb-3 px-5 py-5 rounded-[22px] bg-amber-50 border border-amber-100">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-gray-700 leading-relaxed">{post.question}</p>
          </div>
          {post.topAnswer && (
            <div className="bg-white rounded-xl px-3 py-2.5 border border-amber-100">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <Stethoscope size={9} className="text-blue-600" />
                </div>
                <span className="text-[9px] font-black text-blue-600">{post.topAnswer.author}</span>
                <AuthorBadge badge={post.topAnswer.badge} />
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">{post.topAnswer.text}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Body ── */}
      <div className="px-4 pt-3 pb-1 space-y-3">

        {/* Caption */}
        {post.caption && (
          <p className="text-sm text-gray-700 leading-relaxed">
            <span className="font-black text-gray-800 mr-1">{post.author.name}</span>
            {post.caption}
          </p>
        )}

        {/* iGentVet card */}
        {post.igentContext && (
          <IgentCard igentContext={post.igentContext} />
        )}

        {/* Vet reference */}
        {post.vetRef && (
          <VetRefChip vetRef={post.vetRef} />
        )}

        {/* ── Ações ── */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-4">
            {/* Like */}
            <button
              onClick={() => onLike(post.id)}
              className="flex items-center gap-1.5 transition-all active:scale-90"
            >
              <Heart
                size={22}
                className="transition-all"
                style={{
                  fill: post.liked ? '#EF4444' : 'none',
                  color: post.liked ? '#EF4444' : '#9CA3AF',
                }}
              />
              <span className={`text-xs font-black ${post.liked ? 'text-red-500' : 'text-gray-400'}`}>
                {post.likes}
              </span>
            </button>

            {/* Comentar */}
            <button
              onClick={() => setShowCommentInput(s => !s)}
              className="flex items-center gap-1.5 transition-all active:scale-90"
            >
              <MessageCircle size={22} className="text-gray-400 hover:text-[#6158ca] transition-colors" />
              <span className="text-xs font-black text-gray-400">{post.comments}</span>
            </button>

            {/* Compartilhar */}
            <button className="flex items-center gap-1.5 transition-all active:scale-90">
              <Share2 size={22} className="text-gray-400 hover:text-[#6158ca] transition-colors" />
            </button>
          </div>

          {/* Salvar */}
          <button
            onClick={() => onSave(post.id)}
            className="transition-all active:scale-90"
          >
            <Bookmark
              size={22}
              className="transition-all"
              style={{
                fill: post.bookmarked ? C.purple : 'none',
                color: post.bookmarked ? C.purple : '#9CA3AF',
              }}
            />
          </button>
        </div>

        {/* Engajamento */}
        <div className="pb-1">
          {post.saved > 0 && (
            <p className="text-[10px] text-gray-400 font-bold mb-1">
              <span className="text-gray-600 font-black">{post.saved}</span> pessoas salvaram essa dica
            </p>
          )}
          <button className="text-[10px] font-bold text-gray-400 hover:text-[#6158ca] transition-colors">
            Ver todos os {post.comments} comentários
          </button>
        </div>

        {/* Input de comentário */}
        <AnimatePresence>
          {showCommentInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 pb-2">
                <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2 border border-gray-100">
                  <input
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Adicionar comentário..."
                    className="flex-1 bg-transparent outline-none text-sm text-gray-700 font-medium placeholder-gray-300"
                  />
                </div>
                <button
                  disabled={!comment.trim()}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
                  style={{ background: comment.trim() ? C.purple : '#F3F4F6' }}
                >
                  <Send size={14} className={comment.trim() ? 'text-white' : 'text-gray-400'} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function Comunigato() {
  const navigate = useNavigate();
  const touch = useSensory();

  const [posts, setPosts] = useState(POSTS);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLike = (id) => {
    touch();
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
  };

  const handleSave = (id) => {
    touch();
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, bookmarked: !p.bookmarked, saved: p.bookmarked ? p.saved - 1 : p.saved + 1 } : p
    ));
  };

  const filtered = posts.filter(p => {
    const matchCat = activeFilter === 'Todos' || p.category === activeFilter;
    const matchSearch = !searchQuery || p.caption?.toLowerCase().includes(searchQuery.toLowerCase()) || p.cat?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Stats do feed
  const igentTips = posts.filter(p => p.type === 'IGENT_TIP' || p.type === 'HEALTH_WIN').length;

  return (
    <div className="min-h-screen bg-[#F4F3FF] pb-32 font-sans">

      {/* ── HEADER STICKY ─────────────────────────────────────────────────── */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-100 shadow-sm">

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <AnimatePresence mode="wait">
            {showSearch ? (
              <motion.div
                key="search"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 flex items-center gap-2"
              >
                <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2 border border-gray-100">
                  <Search size={15} className="text-gray-400" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar gateiros, dicas, raças..."
                    className="flex-1 bg-transparent outline-none text-sm text-gray-700 font-medium"
                  />
                </div>
                <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
                  <X size={18} className="text-gray-400" />
                </button>
              </motion.div>
            ) : (
              <motion.div key="title" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-2xl font-black text-gray-800">
                  Comuni<span style={{ color: C.purple }}>gato</span>
                </h1>
                {igentTips > 0 && (
                  <p className="text-[9px] font-bold text-gray-400">
                    <span style={{ color: C.purple }}>{igentTips} dicas</span> do iGentVet compartilhadas hoje
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowSearch(s => !s)}
              className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center"
            >
              <Search size={18} className="text-gray-500" />
            </button>
            <button className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center relative">
              <Bell size={18} className="text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>
          </div>
        </div>

        {/* Stories */}
        <div className="flex items-center gap-4 px-5 pb-3 overflow-x-auto scrollbar-hide">
          {STORIES.map(s => (
            <StoryBubble key={s.id} story={s} onPress={() => touch()} />
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 px-5 pb-3 overflow-x-auto scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => { touch(); setActiveFilter(f.id); }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
              style={activeFilter === f.id
                ? { background: C.purple, color: 'white', boxShadow: `0 4px 12px ${C.purple}40` }
                : { background: '#F4F3FF', color: '#6B7280', border: '1px solid #E5E7EB' }
              }
            >
              <span>{f.emoji}</span>
              {f.id}
            </button>
          ))}
        </div>
      </div>

      {/* ── BANNER IA DESTAQUE ─────────────────────────────────────────────── */}
      {activeFilter === 'Todos' && (
        <div className="px-4 pt-4">
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/igentvet')}
            className="w-full rounded-[24px] overflow-hidden relative flex items-center gap-4 px-5 py-4 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${C.purple} 0%, #8B5CF6 100%)` }}
          >
            <div className="absolute right-0 top-0 bottom-0 opacity-10">
              <Brain size={100} className="text-white translate-x-8 translate-y-[-10px]" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Brain size={24} className="text-white" />
            </div>
            <div className="text-left relative z-10">
              <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-0.5">Comunidade + IA</p>
              <p className="text-sm font-black text-white leading-tight">Compartilhe uma dica do iGentVet</p>
              <p className="text-[10px] text-white/60 mt-0.5">Ajude outros gateiros com o que funcionou</p>
            </div>
            <ChevronRight size={18} className="text-white/60 ml-auto flex-shrink-0" />
          </motion.button>
        </div>
      )}

      {/* ── FEED ──────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🐱</p>
            <p className="font-black text-gray-500">Nenhum post encontrado</p>
            <p className="text-sm text-gray-400 mt-1">Seja o primeiro a compartilhar!</p>
          </div>
        ) : (
          filtered.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <PostCard post={post} onLike={handleLike} onSave={handleSave} />
            </motion.div>
          ))
        )}

        {/* Load more hint */}
        {filtered.length > 0 && (
          <div className="text-center py-4">
            <p className="text-[10px] font-bold text-gray-400">Você está em dia com o Comunigato ✨</p>
          </div>
        )}
      </div>

      {/* ── FAB ───────────────────────────────────────────────────────────── */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => { touch('success'); navigate('/studio'); }}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full shadow-xl flex items-center justify-center z-40"
        style={{
          background: `linear-gradient(135deg, ${C.purple} 0%, #8B5CF6 100%)`,
          boxShadow: `0 8px 24px ${C.purple}50`,
        }}
      >
        <Plus size={26} strokeWidth={2.5} className="text-white" />
      </motion.button>
    </div>
  );
}