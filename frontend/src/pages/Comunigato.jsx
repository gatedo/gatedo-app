import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, Heart, MessageCircle, Share2, Plus,
  Bookmark, Brain, Stethoscope, Sparkles, ChevronRight,
  Shield, CheckCircle, MoreHorizontal, X, AlertCircle, Camera,
  Copy, Download, Instagram, Facebook
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import api from '../services/api';
import useSensory from '../hooks/useSensory';
import SocialPostComposerModal from '../components/social/SocialPostComposerModal';
import CommunityCatsBar from '../components/social/CommunityCatsBar';
import OfficialNoticesStack from '../components/social/OfficialNoticesStack';

const C = {
  purple: '#823fff',
  accent: '#e5ff00',
  bg: 'var(--gatedo-light-bg)',
};

const XP_TO_SHARE = 150;
const XP_TO_PUBLISH = 100;
const APP_FALLBACK_AVATAR = '/assets/App_gatedo_logo1.webp';
const APP_FALLBACK_CAT = '/assets/App_gatedo_logo1.webp';

const POST_TYPES = {
  PHOTO: { label: 'Foto', icon: Camera, color: '#EC4899', bg: '#FDF2F8' },
  IGENT_TIP: { label: 'Dica iGent', icon: Brain, color: '#8B4AFF', bg: '#F4F3FF' },
  HEALTH_WIN: { label: 'Recuperação', icon: CheckCircle, color: '#16A34A', bg: '#F0FDF4' },
  VET_REVIEW: { label: 'Vet Indicado', icon: Stethoscope, color: '#0EA5E9', bg: '#F0F9FF' },
  QUESTION: { label: 'Dúvida', icon: AlertCircle, color: '#D97706', bg: '#FFFBEB' },
  MEME: { label: 'Humor', icon: Sparkles, color: '#8B5CF6', bg: '#F5F3FF' },
};

const BADGES = {
  'Gateiro Raiz': { color: '#ebfc66', text: '#5A7000', icon: '🐾' },
  Veterinário: { color: '#DBEAFE', text: '#1E40AF', icon: '🩺' },
  Resgatista: { color: '#FCE7F3', text: '#9D174D', icon: '❤️' },
  Comunidade: { color: '#D1FAE5', text: '#065F46', icon: '🌿' },
};

const FILTERS = [
  { id: 'Todos', emoji: '✨' },
  { id: 'Saúde', emoji: '💊' },
  { id: 'Humor', emoji: '😂' },
  { id: 'Dúvidas', emoji: '❓' },
  { id: 'Vets', emoji: '🩺' },
];

function safeImg(url, fallback = APP_FALLBACK_AVATAR) {
  return url && String(url).trim() ? url : fallback;
}

function isMemorialPet(pet) {
  if (!pet) return false;

  const memorialFlag =
    pet.isMemorial === true ||
    pet.isMemorial === 'true' ||
    pet.isMemorial === 1 ||
    pet.isMemorial === '1' ||
    pet.memorial === true ||
    pet.memorial === 'true' ||
    pet.memorial === 1 ||
    pet.memorial === '1' ||
    pet.status === 'MEMORIAL' ||
    pet.profileStatus === 'MEMORIAL';

  const hasDeathDate =
    !!pet.deathDate &&
    String(pet.deathDate).trim() !== '' &&
    String(pet.deathDate).trim().toLowerCase() !== 'null';

  return memorialFlag || hasDeathDate;
}

function AppImage({
  src,
  alt = '',
  className = '',
  fallback = APP_FALLBACK_AVATAR,
  style,
}) {
  const [imgSrc, setImgSrc] = useState(safeImg(src, fallback));

  useEffect(() => {
    setImgSrc(safeImg(src, fallback));
  }, [src, fallback]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      onError={() => {
        if (imgSrc !== fallback) setImgSrc(fallback);
      }}
    />
  );
}

function mapCategory(type) {
  if (type === 'HEALTH_WIN' || type === 'IGENT_TIP') return 'Saúde';
  if (type === 'MEME') return 'Humor';
  if (type === 'QUESTION') return 'Dúvidas';
  if (type === 'VET_REVIEW') return 'Vets';
  return 'Todos';
}

function buildShareUrl(post) {
  if (post?.cat?.id) {
    return `${window.location.origin}/gato/${post.cat.id}`;
  }
  return window.location.href;
}

function buildShareCaption(post) {
  const catName = post?.cat?.name || 'meu gato';
  const base = post?.caption?.trim() || `Olha esse momento do ${catName} no GATEDO 🐾`;
  return `${base}\n\nVeja mais no GATEDO: ${buildShareUrl(post)}`;
}

function AuthorBadge({ badge }) {
  const b = BADGES[badge];
  if (!b) return null;

  return (
    <span
      className="text-[8px] font-black px-1.5 py-0.5 rounded-md"
      style={{ background: b.color, color: b.text }}
    >
      {b.icon} {badge}
    </span>
  );
}

function TypeBadge({ type }) {
  const t = POST_TYPES[type];
  if (!t) return null;
  const Icon = t.icon;

  return (
    <span
      className="inline-flex items-center gap-1 text-[8px] font-black px-2 py-1 rounded-full"
      style={{ background: t.bg, color: t.color, border: `1px solid ${t.color}30` }}
    >
      <Icon size={9} />
      {t.label}
    </span>
  );
}

function CatChip({ cat, navigate }) {
  if (!cat) return null;

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate(`/gato/${cat.id}`)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full cursor-pointer max-w-full"
      style={{ background: `${C.purple}12`, border: `1px solid ${C.purple}25` }}
    >
      <div className="w-5 h-5 rounded-full overflow-hidden border border-white/50 bg-white flex-shrink-0">
        <AppImage src={cat.img} fallback={APP_FALLBACK_CAT} className="w-full h-full object-cover" alt={cat.name} />
      </div>
      <span className="text-[10px] font-black truncate" style={{ color: C.purple }}>{cat.name}</span>
      <span className="text-[9px] text-gray-400 font-bold truncate">· {cat.breed}</span>
      <ChevronRight size={10} style={{ color: C.purple, opacity: 0.6 }} className="flex-shrink-0" />
    </motion.div>
  );
}

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
    </div>
  );
}

function PostCard({ post, onLike, onSave, onShare, onMenu, onComments, navigate }) {
  const postType = POST_TYPES[post.type] || POST_TYPES.PHOTO;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[28px] overflow-hidden border border-gray-100 shadow-sm"
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 bg-white">
              <AppImage
                src={post.author.avatar}
                fallback={APP_FALLBACK_AVATAR}
                className="w-10 h-10 rounded-full object-cover"
                alt={post.author.name}
              />
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
              style={{ background: postType.bg }}
            >
              {React.createElement(postType.icon, { size: 9, color: postType.color })}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm font-black text-gray-800 leading-none truncate">{post.author.name}</h4>
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <AuthorBadge badge={post.author.badge} />
              <TypeBadge type={post.type} />
              <span className="text-[9px] text-gray-400 font-bold">{post.time}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onMenu(post)}
          className="w-8 h-8 rounded-full hover:bg-gray-50 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <MoreHorizontal size={16} className="text-gray-400" />
        </button>
      </div>

      {post.cat && (
        <div className="px-4 pb-3">
          <CatChip cat={post.cat} navigate={navigate} />
        </div>
      )}

      {post.image && (
        <div className="w-full aspect-[4/3] bg-gray-100 overflow-hidden">
          <AppImage src={post.image} fallback={APP_FALLBACK_CAT} className="w-full h-full object-cover" alt="" />
        </div>
      )}

      <div className="px-4 pt-3 pb-3 space-y-3">
        {post.caption && (
          <p className="text-sm text-gray-700 leading-relaxed">
            <span className="font-black text-gray-800 mr-1">{post.author.name}</span>
            {post.caption}
          </p>
        )}

        {post.vetRef && <VetRefChip vetRef={post.vetRef} />}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-4">
            <button onClick={() => onLike(post)} className="flex items-center gap-1.5 transition-all active:scale-90">
              <Heart
                size={22}
                style={{
                  fill: post.liked ? '#EF4444' : 'none',
                  color: post.liked ? '#EF4444' : '#9CA3AF',
                }}
              />
              <span className={`text-xs font-black ${post.liked ? 'text-red-500' : 'text-gray-400'}`}>
                {post.likes}
              </span>
            </button>

            <button onClick={() => onComments(post)} className="flex items-center gap-1.5 transition-all active:scale-90">
              <MessageCircle size={22} className="text-gray-400" />
              <span className="text-xs font-black text-gray-400">{post.comments}</span>
            </button>

            <button
              onClick={() => onShare(post)}
              className="flex items-center gap-1.5 transition-all active:scale-90 relative"
              title={!post.canShare ? `Precisa de ${XP_TO_SHARE} XP para compartilhar` : 'Compartilhar'}
            >
              <Share2 size={22} style={{ color: post.canShare ? '#8B4AFF' : '#D1D5DB' }} />
              {!post.canShare && (
                <span className="absolute -top-1.5 -right-1 text-[7px] font-black px-1 py-0.5 rounded-full bg-gray-100 text-gray-400">
                  🔒
                </span>
              )}
            </button>
          </div>

          <button onClick={() => onSave(post)} className="transition-all active:scale-90">
            <Bookmark
              size={22}
              style={{
                fill: post.bookmarked ? C.purple : 'none',
                color: post.bookmarked ? C.purple : '#9CA3AF',
              }}
            />
          </button>
        </div>

        <div>
          {(post.saved || 0) > 0 && (
            <p className="text-[10px] text-gray-400 font-bold mb-1">
              <span className="text-gray-600 font-black">{post.saved}</span> pessoas salvaram esse conteúdo
            </p>
          )}
          <button onClick={() => onComments(post)} className="text-[10px] font-bold text-gray-400">
            Ver todos os {post.comments} comentários
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function FavoritesDrawer({ open, posts, onClose, onOpenPostMenu, onLike, onSave, onShare, onComments, navigate }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[365] flex items-end justify-center p-3 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[32px] pb-8"
            style={{
              background: '#fff',
              maxHeight: '88vh',
              overflowY: 'auto',
              width: 'min(100%, 28rem)',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />

            <div className="flex items-center justify-between px-5 mb-4">
              <div>
                <p className="font-black text-gray-800 text-sm">Favoritos salvos</p>
                <p className="text-[10px] text-gray-400 font-bold mt-1">
                  {posts.length} post{posts.length === 1 ? '' : 's'} salvos
                </p>
              </div>

              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            <div className="px-4 space-y-4">
              {posts.length === 0 ? (
                <div className="rounded-[18px] p-5 bg-gray-50 border border-gray-100 text-center">
                  <p className="text-sm font-black text-gray-700">Nenhum favorito salvo ainda</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-2">
                    Toque no ícone de marcador dos posts para salvar aqui.
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={`fav_${post.id}`}
                    post={post}
                    onLike={onLike}
                    onSave={onSave}
                    onShare={onShare}
                    onMenu={onOpenPostMenu}
                    onComments={onComments}
                    navigate={navigate}
                  />
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PostActionSheet({ post, onClose, onCopyLink, onFacebookShare, onInstagramPrep, onTikTokPrep, onOpenCard }) {
  if (!post) return null;

  const itemClass = 'w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-left border border-gray-100 bg-white';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[370] flex items-end justify-center p-3 sm:p-4"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-[32px] pb-8"
          style={{
            background: '#fff',
            maxHeight: '85vh',
            overflowY: 'auto',
            width: 'min(100%, 28rem)',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />

          <div className="flex items-center justify-between px-5 mb-4">
            <div>
              <p className="font-black text-gray-800 text-sm">Ações do post</p>
              <p className="text-[10px] text-gray-400 font-bold mt-1">
                Compartilhe ou prepare conteúdo para redes
              </p>
            </div>

            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          <div className="px-5 space-y-3">
            <button onClick={onCopyLink} className={itemClass}>
              <Copy size={16} className="text-gray-600" />
              <div>
                <p className="text-sm font-black text-gray-800">Copiar link</p>
                <p className="text-[10px] text-gray-400 font-medium">Copia o link do perfil/post para compartilhar</p>
              </div>
            </button>

            <button onClick={onFacebookShare} className={itemClass}>
              <Facebook size={16} className="text-blue-600" />
              <div>
                <p className="text-sm font-black text-gray-800">Compartilhar no Facebook</p>
                <p className="text-[10px] text-gray-400 font-medium">Abre o fluxo externo com o link do GATEDO</p>
              </div>
            </button>

            <button onClick={onInstagramPrep} className={itemClass}>
              <Instagram size={16} className="text-pink-500" />
              <div>
                <p className="text-sm font-black text-gray-800">Preparar para Instagram</p>
                <p className="text-[10px] text-gray-400 font-medium">Copia legenda e abre o card social pronto</p>
              </div>
            </button>

            <button onClick={onTikTokPrep} className={itemClass}>
              <Sparkles size={16} className="text-black" />
              <div>
                <p className="text-sm font-black text-gray-800">Preparar para TikTok</p>
                <p className="text-[10px] text-gray-400 font-medium">Copia legenda e abre o card social pronto</p>
              </div>
            </button>

            <button onClick={onOpenCard} className={itemClass}>
              <Download size={16} className="text-purple-600" />
              <div>
                <p className="text-sm font-black text-gray-800">Abrir card social</p>
                <p className="text-[10px] text-gray-400 font-medium">Preview do card com branding do GATEDO</p>
              </div>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SocialCardModal({ post, onClose, onCopyCaption, onCopyLink }) {
  if (!post) return null;

  const image = post?.image || post?.cat?.img || APP_FALLBACK_CAT;
  const catName = post?.cat?.name || 'Gato';
  const author = post?.author?.name || 'Tutor';
  const caption = post?.caption || `Meu gato também vive no GATEDO 🐾`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[380] flex items-end justify-center p-3 sm:p-4"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-[32px] pb-8"
          style={{
            background: '#fff',
            maxHeight: '90vh',
            overflowY: 'auto',
            width: 'min(100%, 28rem)',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />

          <div className="flex items-center justify-between px-5 mb-4">
            <div>
              <p className="font-black text-gray-800 text-sm">Card social pronto</p>
              <p className="text-[10px] text-gray-400 font-bold mt-1">
                Preview para Instagram, Facebook ou TikTok
              </p>
            </div>

            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          <div className="px-5">
            <div
              className="rounded-[28px] overflow-hidden shadow-xl border border-white/10"
              style={{ background: 'linear-gradient(135deg, #171427 0%, #2D1567 55%, #823fff 100%)' }}
            >
              <div className="p-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15">
                  <div className="w-6 h-6 rounded-full bg-[#e1ff00] flex items-center justify-center text-[10px] font-black text-[#1a1a00]">
                    G
                  </div>
                  <span className="text-[10px] font-black text-white tracking-wide">GATEDO</span>
                </div>

                <span className="text-[10px] font-black px-2 py-1 rounded-full bg-white/10 text-white/90 border border-white/15">
                  {post?.type || 'POST'}
                </span>
              </div>

              <div className="px-4">
                <div className="rounded-[22px] overflow-hidden bg-black/20 border border-white/10">
                  <AppImage src={image} fallback={APP_FALLBACK_CAT} alt={catName} className="w-full aspect-square object-cover" />
                </div>
              </div>

              <div className="p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50 mb-2">
                  Comunidade felina
                </p>

                <h3 className="text-2xl font-black text-white leading-tight mb-1">
                  {catName}
                </h3>

                <p className="text-[11px] font-bold text-white/65 mb-3">
                  por {author}
                </p>

                <p className="text-sm text-white/90 leading-relaxed mb-4">
                  {caption}
                </p>

                <div className="rounded-[18px] px-4 py-3 bg-white/10 border border-white/10">
                  <p className="text-[11px] font-black text-[#e1ff00] mb-1">
                    Meu gato também vive no GATEDO 🐾
                  </p>
                  <p className="text-[10px] text-white/75 font-medium">
                    Organização, memória, comunidade e conteúdo para quem vive com gatos de verdade.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={onCopyCaption}
                className="py-3 rounded-[18px] font-black text-sm border border-gray-200 bg-white text-gray-700"
              >
                Copiar legenda
              </button>

              <button
                onClick={onCopyLink}
                className="py-3 rounded-[18px] font-black text-sm"
                style={{ background: `linear-gradient(135deg, ${C.purple}, #8B5CF6)`, color: '#fff' }}
              >
                Copiar link
              </button>
            </div>

            <div className="mt-3 rounded-[16px] p-3 bg-gray-50 border border-gray-100">
              <p className="text-[10px] font-black text-gray-700">
                Dica:
              </p>
              <p className="text-[10px] text-gray-500 font-medium mt-1">
                O card já está pronto visualmente. Para publicação rápida, copie a legenda e compartilhe o link junto do print/card.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function CommentsDrawer({ open, post, onClose, onCommentAdded, showToast }) {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');

  const loadComments = useCallback(async () => {
    if (!post?.id) return;
    setLoading(true);

    try {
      const res = await api.get(`/social/posts/${post.id}/comments`);
      setComments(Array.isArray(res.data?.comments) ? res.data.comments : []);
    } catch (err) {
      console.error('Erro ao carregar comentários:', err);
      setComments([]);
      showToast?.('Não foi possível carregar comentários', 'warn');
    } finally {
      setLoading(false);
    }
  }, [post?.id, showToast]);

  useEffect(() => {
    if (open && post?.id) {
      loadComments();
    } else {
      setComments([]);
      setText('');
    }
  }, [open, post?.id, loadComments]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || !post?.id) return;

    setSending(true);

    try {
      const res = await api.post(`/social/posts/${post.id}/comments`, { content });
      const comment = res.data?.comment;
      const nextCount = res.data?.commentsCount;

      if (comment) {
        setComments((prev) => [...prev, comment]);
      }

      setText('');
      onCommentAdded?.(post.id, nextCount ?? (comments.length + 1));
      showToast?.('Comentário publicado', 'success');
      window.dispatchEvent(new CustomEvent('gatedo:xp-updated', {
        detail: { amount: 2, source: 'comment' },
      }));
    } catch (err) {
      console.error('Erro ao comentar:', err);
      showToast?.(err?.response?.data?.message || 'Não foi possível comentar', 'warn');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[390] flex items-end justify-center p-3 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0.98 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 18, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 28, mass: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[32px] pb-6"
            style={{
              background: '#fff',
              maxHeight: '88vh',
              width: 'min(100%, 28rem)',
              overflow: 'hidden',
              willChange: 'transform',
              transform: 'translateZ(0)',
            }}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />

            <div className="flex items-center justify-between px-5 mb-4">
              <div>
                <p className="font-black text-gray-800 text-sm">Comentários</p>
                <p className="text-[10px] text-gray-400 font-bold mt-1">
                  {post?.comments || 0} comentário{(post?.comments || 0) === 1 ? '' : 's'}
                </p>
              </div>

              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            <div className="px-5 mb-4">
              <div className="rounded-[18px] border border-gray-100 bg-gray-50 p-3">
                <p className="text-[10px] font-black text-gray-700 mb-1">
                  {post?.author?.name}
                </p>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  {post?.caption || 'Post sem texto'}
                </p>
              </div>
            </div>

            <div
              className="px-5 space-y-3 overflow-y-auto"
              style={{
                maxHeight: '44vh',
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {loading ? (
                <div className="rounded-[18px] p-4 bg-gray-50 border border-gray-100 text-center">
                  <p className="text-sm font-black text-gray-500">Carregando comentários...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="rounded-[18px] p-4 bg-gray-50 border border-gray-100 text-center">
                  <p className="text-sm font-black text-gray-700">Ainda não há comentários</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-1">
                    Seja o primeiro a comentar.
                  </p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-white flex-shrink-0">
                      <AppImage
                        src={comment.author?.avatar}
                        fallback={APP_FALLBACK_AVATAR}
                        alt={comment.author?.name || 'Tutor'}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      />
                    </div>
                    <div className="flex-1 min-w-0 rounded-[18px] border border-gray-100 bg-white p-3 shadow-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[11px] font-black text-gray-800">
                          {comment.author?.name || 'Tutor'}
                        </p>
                        {comment.isMine && (
                          <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-[#823fff15] text-[#823fff]">
                            você
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 leading-relaxed mt-1">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 mt-4">
              <div className="flex items-end gap-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Escreva um comentário..."
                  className="flex-1 resize-none rounded-[18px] border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !text.trim()}
                  className="px-4 py-3 rounded-[18px] font-black text-sm"
                  style={
                    text.trim()
                      ? { background: `linear-gradient(135deg, ${C.purple}, #8B5CF6)`, color: '#fff' }
                      : { background: '#F3F4F6', color: '#9CA3AF' }
                  }
                >
                  {sending ? '...' : 'Enviar'}
                </button>
              </div>

              <p className="text-[10px] text-gray-400 font-medium mt-2">
                {text.trim().length}/500 caracteres
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Comunigato() {
  const navigate = useNavigate();
  const touch = useSensory();
  const { user: authUser } = useContext(AuthContext);
  const { xpt, gpts, refreshGamification } = useGamification();

  const isAdmin = authUser?.role === 'ADMIN';

  const [posts, setPosts] = useState([]);
  const [fetchingPosts, setFetchingPosts] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userXP, setUserXP] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [communityCats, setCommunityCats] = useState([]);
  const [showBetaPopup, setShowBetaPopup] = useState(true);
  const [toast, setToast] = useState(null);

  const [showComposer, setShowComposer] = useState(false);
  const [myCats, setMyCats] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);

  const [showFavorites, setShowFavorites] = useState(false);
  const [activeActionPost, setActiveActionPost] = useState(null);
  const [socialCardPost, setSocialCardPost] = useState(null);

  const [commentsPost, setCommentsPost] = useState(null);
  const [showComments, setShowComments] = useState(false);

  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(false);

  const dismissBeta = () => setShowBetaPopup(false);

  const syncGamification = useCallback(async () => {
    try {
      await refreshGamification?.();
      window.dispatchEvent(new CustomEvent('gatedo-gamification-refresh'));
    } catch {}
  }, [refreshGamification]);

  const showToast = useCallback((msg, type = 'default') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const normalizePost = useCallback((p) => ({
    id: p.id,
    type: p.type || 'PHOTO',
    visibility: p.visibility || 'PUBLIC',
    source: p.source || 'manual',
    studioCreationId: p.studioCreationId || null,
    author: {
      name:
        p.user?.name ||
        p.author?.name ||
        p.authorName ||
        'Tutor',
      avatar:
        p.user?.photoUrl ||
        p.author?.avatar ||
        p.authorAvatar ||
        APP_FALLBACK_AVATAR,
      badge: p.author?.badge || 'Gateiro Raiz',
    },
    cat: p.pet ? {
      id: p.pet.id,
      name: p.pet.name,
      breed: p.pet.breed || 'SRD',
      img: p.pet.photoUrl || APP_FALLBACK_CAT,
    } : null,
    caption: p.content || p.caption || '',
    image: p.imageUrl || p.image || null,
    vetRef: p.vetRef || null,
    likes: p.likesCount ?? (Array.isArray(p.likes) ? p.likes.length : p.likes || 0),
    comments: p.commentsCount ?? (Array.isArray(p.comments) ? p.comments.length : p.comments || 0),
    saved: p.savesCount ?? p.savedCount ?? (Array.isArray(p.saves) ? p.saves.length : p.saved || 0),
    liked: !!(p.likedByMe || p.liked),
    bookmarked: !!(p.savedByMe || p.bookmarked),
    time: p.createdAt
      ? (() => {
          const d = Date.now() - new Date(p.createdAt).getTime();
          const m = Math.floor(d / 60000);
          const h = Math.floor(d / 3600000);
          const dy = Math.floor(d / 86400000);
          return dy > 0 ? `${dy}d` : h > 0 ? `${h}h` : m > 0 ? `${m}min` : 'agora';
        })()
      : 'agora',
    category: mapCategory(p.type),
    canShare: isAdmin || userXP >= XP_TO_SHARE,
  }), [userXP, isAdmin]);

  const fetchPosts = useCallback(async () => {
    setFetchingPosts(true);

    try {
      const res = await api.get('/social/posts', {
        params: { visibility: 'PUBLIC' },
      });

      const list = Array.isArray(res.data) ? res.data : [];
      setPosts(list.map(normalizePost));
    } catch (err) {
      console.error('Erro ao carregar feed da Comunigato:', err);
      setPosts([]);
    } finally {
      setFetchingPosts(false);
    }
  }, [normalizePost]);

  const fetchCommunityCats = useCallback(async () => {
    try {
      const petsRes = await api.get('/pets');
      const pets = Array.isArray(petsRes.data) ? petsRes.data : [];

      const mapped = pets
        .filter((p) => !isMemorialPet(p))
        .map((p) => ({
          id: p.id,
          name: p.name || 'Gato',
          img: p.photoUrl || APP_FALLBACK_CAT,
          tutor: p.owner?.name || p.tutorName || 'Tutor',
          nickname: p.nickname || p.slug || '',
          active: true,
          breed: p.breed || 'SRD',
        }));

      setCommunityCats(mapped);
    } catch (err) {
      console.error('Erro ao carregar gatos da comunidade:', err);
      setCommunityCats([]);
    }
  }, []);

  const fetchMe = useCallback(async () => {
    await syncGamification();
  }, [syncGamification]);

  useEffect(() => {
    const nextXp = isAdmin ? 999999 : Number(xpt || 0);
    const nextPoints = isAdmin ? 999999 : Number(gpts || 0);
    setUserXP(nextXp);
    setUserPoints(nextPoints);
  }, [xpt, gpts, isAdmin]);

  const fetchMyCats = useCallback(async () => {
    try {
      const res = await api.get('/pets');
      const pets = Array.isArray(res.data) ? res.data : [];
      const activePets = pets.filter((pet) => !isMemorialPet(pet));

      setMyCats(activePets);

      setSelectedCat((prev) => {
        if (prev?.id) {
          const stillExists = activePets.find((pet) => pet.id === prev.id);
          if (stillExists) return stillExists;
        }
        return activePets[0] || null;
      });
    } catch (err) {
      console.error('Erro ao carregar gatos do tutor:', err);
      setMyCats([]);
      setSelectedCat(null);
    }
  }, []);

  const fetchNotices = useCallback(async () => {
    setLoadingNotices(true);

    try {
      const res = await api.get('/notices/active');
      const list = Array.isArray(res.data) ? res.data : [];
      setNotices(list);
    } catch (err) {
      console.error('Erro ao carregar notices oficiais:', err);
      setNotices([]);
    } finally {
      setLoadingNotices(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchMe();
    fetchMyCats();
    fetchNotices();
    fetchCommunityCats();
  }, [fetchPosts, fetchMe, fetchMyCats, fetchNotices, fetchCommunityCats]);

  useEffect(() => {
    const handleNewPost = () => {
      fetchPosts();
      fetchMe();
      fetchCommunityCats();
      fetchMyCats();
    };

    const handleXpUpdated = (event) => {
      const amount = Number(event?.detail?.amount || 0);
      const source = event?.detail?.source || '';

      if (amount > 0) {
        const prefix = source === 'share'
          ? 'Compartilhamento'
          : source === 'official-notice'
            ? 'Comunicado lido'
            : source === 'comment'
              ? 'Comentário'
              : source === 'publish'
                ? 'Publicação'
                : 'XP recebido';

        showToast(`+${amount} XP • ${prefix}`, 'success');
      }

      fetchMe();
    };

    const handleRefreshNotices = () => {
      fetchNotices();
    };

    const handleGamificationRefresh = () => {
      fetchMe();
    };

    const handleSocialPublished = () => {
      fetchPosts();
      fetchMe();
      fetchCommunityCats();
      fetchMyCats();
      showToast('Post publicado no feed', 'success');
    };

    window.addEventListener('comunigato:new_post', handleNewPost);
    window.addEventListener('gatedo:xp-updated', handleXpUpdated);
    window.addEventListener('gatedo:refresh-notices', handleRefreshNotices);
    window.addEventListener('gatedo-gamification-refresh', handleGamificationRefresh);
    window.addEventListener('gatedo-social-published', handleSocialPublished);

    return () => {
      window.removeEventListener('comunigato:new_post', handleNewPost);
      window.removeEventListener('gatedo:xp-updated', handleXpUpdated);
      window.removeEventListener('gatedo:refresh-notices', handleRefreshNotices);
      window.removeEventListener('gatedo-gamification-refresh', handleGamificationRefresh);
      window.removeEventListener('gatedo-social-published', handleSocialPublished);
    };
  }, [fetchPosts, fetchMe, fetchNotices, fetchCommunityCats, fetchMyCats, showToast]);

  const copyToClipboard = async (text, successMsg = 'Copiado com sucesso') => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMsg, 'success');
    } catch {
      showToast('Não foi possível copiar agora', 'warn');
    }
  };

  const openComposerFlow = () => {
    touch('success');

    if (!isAdmin && userXP < XP_TO_PUBLISH) {
      showToast(`Você precisa de ${XP_TO_PUBLISH} XP para publicar. XP atual: ${userXP}.`, 'warn');
      return;
    }

    if (!myCats.length) {
      showToast('Cadastre ao menos um gato ativo antes de publicar.', 'warn');
      return;
    }

    const nextSelectedCat =
      (selectedCat?.id && myCats.find((cat) => cat.id === selectedCat.id)) ||
      myCats[0] ||
      null;

    setSelectedCat(nextSelectedCat);
    setShowComposer(true);
  };

  const handleLike = async (post) => {
    touch();

    try {
      if (post.liked) {
        const res = await api.delete(`/social/posts/${post.id}/like`);
        setPosts((prev) => prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                liked: false,
                likes: res.data?.likesCount ?? Math.max(0, p.likes - 1),
              }
            : p
        ));
      } else {
        const res = await api.post(`/social/posts/${post.id}/like`);
        setPosts((prev) => prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                liked: true,
                likes: res.data?.likesCount ?? (p.likes + 1),
              }
            : p
        ));
      }

      await fetchMe();
    } catch {
      showToast('Não foi possível curtir agora', 'warn');
    }
  };

  const handleSave = async (post) => {
    touch();

    try {
      if (post.bookmarked) {
        const res = await api.delete(`/social/posts/${post.id}/save`);
        setPosts((prev) => prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                bookmarked: false,
                saved: res.data?.savesCount ?? Math.max(0, p.saved - 1),
              }
            : p
        ));
        showToast('Removido dos favoritos', 'default');
      } else {
        const res = await api.post(`/social/posts/${post.id}/save`);
        setPosts((prev) => prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                bookmarked: true,
                saved: res.data?.savesCount ?? (p.saved + 1),
              }
            : p
        ));
        showToast('Post salvo nos favoritos', 'success');
      }

      await fetchMe();
    } catch {
      showToast('Não foi possível salvar agora', 'warn');
    }
  };

  const handleComments = async (post) => {
    setCommentsPost(post);
    setShowComments(true);
  };

  const handleCommentAdded = async (postId, commentsCount) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: typeof commentsCount === 'number' ? commentsCount : (p.comments || 0) + 1,
            }
          : p
      )
    );

    setCommentsPost((prev) =>
      prev?.id === postId
        ? {
            ...prev,
            comments: typeof commentsCount === 'number' ? commentsCount : (prev.comments || 0) + 1,
          }
        : prev
    );

    await fetchMe();
  };

  const handleShare = async (post) => {
    if (!isAdmin && userXP < XP_TO_SHARE) {
      showToast(`Precisa de ${XP_TO_SHARE} XP para compartilhar. Você tem ${userXP} XP.`, 'warn');
      return;
    }

    touch();

    const url = buildShareUrl(post);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post?.cat?.name || 'Gato'} no GATEDO`,
          text: post?.caption?.slice(0, 100) || 'Veja este perfil no GATEDO',
          url,
        });
        showToast('Compartilhado com sucesso! 🚀', 'success');
        window.dispatchEvent(new CustomEvent('gatedo:xp-updated', {
          detail: { amount: 3, source: 'share' },
        }));
        await fetchMe();
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        showToast('Link copiado para compartilhar', 'success');
        window.dispatchEvent(new CustomEvent('gatedo:xp-updated', {
          detail: { amount: 3, source: 'share' },
        }));
        await fetchMe();
      } catch {
        showToast('Não foi possível compartilhar agora', 'warn');
      }
    }
  };

  const openPostMenu = (post) => {
    setActiveActionPost(post);
  };

  const handleFacebookShare = async (post) => {
    const url = encodeURIComponent(buildShareUrl(post));
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer');
    setActiveActionPost(null);
    window.dispatchEvent(new CustomEvent('gatedo:xp-updated', {
      detail: { amount: 3, source: 'share' },
    }));
    await fetchMe();
  };

  const handleInstagramPrep = async (post) => {
    await copyToClipboard(buildShareCaption(post), 'Legenda copiada para Instagram');
    setActiveActionPost(null);
    setSocialCardPost(post);
    window.dispatchEvent(new CustomEvent('gatedo:xp-updated', {
      detail: { amount: 3, source: 'share' },
    }));
    await fetchMe();
  };

  const handleTikTokPrep = async (post) => {
    await copyToClipboard(buildShareCaption(post), 'Legenda copiada para TikTok');
    setActiveActionPost(null);
    setSocialCardPost(post);
    window.dispatchEvent(new CustomEvent('gatedo:xp-updated', {
      detail: { amount: 3, source: 'share' },
    }));
    await fetchMe();
  };

  const filtered = posts.filter((p) => {
    const matchCat = activeFilter === 'Todos' || p.category === activeFilter;
    const matchSearch =
      !searchQuery ||
      p.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.cat?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchCat && matchSearch;
  });

  const igentTips = posts.filter((p) => p.type === 'IGENT_TIP' || p.type === 'HEALTH_WIN').length;
  const favoritePosts = posts.filter((p) => p.bookmarked);

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] pb-32 font-sans">
      <FavoritesDrawer
        open={showFavorites}
        posts={favoritePosts}
        onClose={() => setShowFavorites(false)}
        onOpenPostMenu={openPostMenu}
        onLike={handleLike}
        onSave={handleSave}
        onShare={handleShare}
        onComments={handleComments}
        navigate={navigate}
      />

      <CommentsDrawer
        open={showComments}
        post={commentsPost}
        onClose={() => {
          setShowComments(false);
          setCommentsPost(null);
        }}
        onCommentAdded={handleCommentAdded}
        showToast={showToast}
      />

      <SocialPostComposerModal
        isOpen={showComposer}
        onClose={() => setShowComposer(false)}
        onSuccess={async () => {
          setShowComposer(false);
          await fetchPosts();
          await fetchMe();
          await fetchCommunityCats();
          await fetchMyCats();

          window.dispatchEvent(new CustomEvent('comunigato:new_post'));
          window.dispatchEvent(new CustomEvent('gatedo-social-published'));
          window.dispatchEvent(new CustomEvent('gatedo:xp-updated', {
            detail: { amount: 5, source: 'publish' },
          }));
        }}
        selectedPetId={selectedCat?.id || myCats?.[0]?.id || null}
        selectedStudioCreation={null}
      />

      <AnimatePresence>
        {activeActionPost && (
          <PostActionSheet
            post={activeActionPost}
            onClose={() => setActiveActionPost(null)}
            onCopyLink={() => {
              copyToClipboard(buildShareUrl(activeActionPost), 'Link copiado');
              setActiveActionPost(null);
            }}
            onFacebookShare={() => handleFacebookShare(activeActionPost)}
            onInstagramPrep={() => handleInstagramPrep(activeActionPost)}
            onTikTokPrep={() => handleTikTokPrep(activeActionPost)}
            onOpenCard={() => {
              setSocialCardPost(activeActionPost);
              setActiveActionPost(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {socialCardPost && (
          <SocialCardModal
            post={socialCardPost}
            onClose={() => setSocialCardPost(null)}
            onCopyCaption={() => copyToClipboard(buildShareCaption(socialCardPost), 'Legenda copiada')}
            onCopyLink={() => copyToClipboard(buildShareUrl(socialCardPost), 'Link copiado')}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="fixed bottom-28 left-0 right-0 flex justify-center z-[300] pointer-events-none px-4"
          >
            <div
              className="px-5 py-3 rounded-full font-black text-sm shadow-lg"
              style={
                toast.type === 'success'
                  ? { background: '#e1ff00', color: '#1a1a00' }
                  : toast.type === 'warn'
                    ? { background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' }
                    : { background: '#111827', color: '#fff' }
              }
            >
              {toast.msg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isAdmin && userXP < XP_TO_SHARE && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-3 px-4 py-2.5 rounded-[16px] flex items-center gap-3"
          style={{ background: '#FFFBEB', border: '1px solid #FCD34D' }}
        >
          <span className="text-base">🔒</span>
          <div className="flex-1">
            <p className="text-[10px] font-black text-amber-700">Compartilhamento bloqueado</p>
            <p className="text-[9px] text-amber-600 font-medium">
              Você tem {userXP} XP. Precisa de {XP_TO_SHARE} XP para compartilhar.
            </p>
          </div>
        </motion.div>
      )}

      {isAdmin && (
        <div className="mx-4 mt-3 px-4 py-2.5 rounded-[16px] flex items-center gap-3" style={{ background: '#EEFDF3', border: '1px solid #86EFAC' }}>
          <span className="text-base">🛡️</span>
          <div className="flex-1">
            <p className="text-[10px] font-black text-emerald-700">ADMIN: compartilhamento liberado sem restrição</p>
            <p className="text-[9px] text-emerald-600 font-medium">
              XP: ilimitado • Points: ilimitado
            </p>
          </div>
        </div>
      )}

      {userXP < XP_TO_PUBLISH && !isAdmin && (
        <div className="mx-4 mb-4 mt-3 px-4 py-2.5 rounded-[16px] flex items-center gap-3" style={{ background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
          <span className="text-base">✍️</span>
          <div className="flex-1">
            <p className="text-[10px] font-black text-indigo-700">Publicação liberada a partir de 100 XP</p>
            <p className="text-[9px] text-indigo-600 font-medium">
              XP atual: {userXP} • Points atuais: {userPoints}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white sticky top-0 z-40 border-b border-gray-100 shadow-sm">
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
                <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-2xl mt-8 px-3 py-2 border border-gray-100">
                  <Search size={15} className="text-gray-400" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                    <span style={{ color: C.purple }}>{igentTips} dicas</span> do iGentVet compartilhadas
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowSearch((s) => !s)} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center">
              <Search size={18} className="text-gray-500" />
            </button>

            <button
              onClick={() => setShowFavorites(true)}
              className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center relative"
              title="Favoritos"
            >
              <Bookmark size={18} className="text-gray-500" />
              {favoritePosts.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#823fff] text-white text-[8px] font-black flex items-center justify-center">
                  {favoritePosts.length}
                </span>
              )}
            </button>

            <button className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center relative" title="Notificações">
              <Bell size={18} className="text-gray-500" />
              {notices.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
              )}
            </button>
          </div>
        </div>

        <div className="px-5 pb-3">
          <CommunityCatsBar
            cats={communityCats}
            onSelectCat={(cat) => navigate(`/gato/${cat.id}`)}
            onAddPress={() => navigate('/mundo-gatedo')}
          />
        </div>

        <div className="flex gap-2 px-5 pb-3 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                touch();
                setActiveFilter(f.id);
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
              style={activeFilter === f.id
                ? { background: C.purple, color: 'white', boxShadow: `0 4px 12px ${C.purple}40` }
                : { background: 'var(--gatedo-light-bg)', color: '#6B7280', border: '1px solid #E5E7EB' }}
            >
              <span>{f.emoji}</span>
              {f.id}
            </button>
          ))}
        </div>
      </div>

      {activeFilter === 'Todos' && (
        <div className="px-4 pt-4 space-y-3">
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/igent-vet')}
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

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/mundo-gatedo')}
            className="w-full rounded-[22px] flex items-center gap-4 px-5 py-4 border"
            style={{ background: '#fff', borderColor: '#E9D5FF' }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#F5F3FF' }}>
              🌍
            </div>
            <div className="text-left flex-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#8B4AFF] mb-0.5">Ecossistema</p>
              <p className="text-sm font-black text-gray-800 leading-tight">Explorar o Mundo GATEDO</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Mais contexto, visão da comunidade e evolução do app</p>
            </div>
            <ChevronRight size={18} className="text-[#8B4AFF]" />
          </motion.button>
        </div>
      )}

      <div className="px-4 pt-4">
       <OfficialNoticesStack
  notices={notices}
  loading={loadingNotices}
  onNoticeRead={async (notice) => {
    try {
      await api.post(`/notices/${notice.id}/read`);

      const xpReward = Number(notice?.xpReward || 0);

      setNotices((prev) => prev.filter((item) => item.id !== notice.id));

      if (xpReward > 0) {
        setUserXP((prev) => (isAdmin ? 999999 : prev + xpReward));

        window.dispatchEvent(
          new CustomEvent('gatedo:xp-updated', {
            detail: {
              amount: xpReward,
              source: 'official-notice',
              noticeId: notice.id,
            },
          }),
        );
      }

      await fetchMe();
      await fetchNotices();
    } catch (err) {
      console.error('Erro ao confirmar leitura do notice:', err);
      showToast(
        err?.response?.data?.message || 'Não foi possível confirmar o comunicado agora',
        'warn',
      );
    }
  }}
/>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {fetchingPosts ? (
          <div className="text-center py-16">
            <p className="font-black text-gray-400">Carregando feed...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🐱</p>
            <p className="font-black text-gray-500">Nenhum post encontrado</p>
            <p className="text-sm text-gray-400 mt-1">Seja o primeiro a compartilhar!</p>
          </div>
        ) : (
          filtered.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <PostCard
                post={post}
                onLike={handleLike}
                onSave={handleSave}
                onShare={handleShare}
                onMenu={openPostMenu}
                onComments={handleComments}
                navigate={navigate}
              />
            </motion.div>
          ))
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={openComposerFlow}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full shadow-xl flex items-center justify-center z-40"
        style={{ background: `linear-gradient(135deg, ${C.purple} 0%, #8B5CF6 100%)`, boxShadow: `0 8px 24px ${C.purple}50` }}
      >
        <Plus size={26} strokeWidth={2.5} className="text-white" />
      </motion.button>
    </div>
  );
}
