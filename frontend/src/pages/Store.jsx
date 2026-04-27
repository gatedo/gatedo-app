import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import {
  Search,
  ShoppingBag,
  ExternalLink,
  Star,
  X,
  Award,
  Heart,
  Zap,
  Share2,
  ChevronRight,
  Box,
  Sparkles,
  Check,
  Tag,
  Gift,
  Flame,
  Users,
  Copy,
  Clock,
  TrendingUp,
  Crown,
  PlayCircle,
  PawPrint,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../services/api';
import useSensory from '../hooks/useSensory';
import { AuthContext } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';

const PARTNER_STYLES = {
  Amazon: { color: 'bg-[#FF9900] text-white', text: 'text-[#FF9900]' },
  Shopee: { color: 'bg-[#EE4D2D] text-white', text: 'text-[#EE4D2D]' },
  'Mercado Livre': { color: 'bg-[#FFE600] text-gray-800', text: 'text-yellow-600' },
  Gatedo: { color: 'bg-[#8B4AFF] text-white', text: 'text-[#8B4AFF]' },
};

const KIT_ICONS = { Star, Zap, Heart, Award, ShoppingBag, Box, Gift, Crown, Flame };
const CATEGORIES = ['Tudo', 'Saúde', 'Diversão', 'Higiene', 'Conforto', 'Alimentação'];
const STORE_HEADER_GRADIENT = 'linear-gradient(135deg, #8B4AFF 0%, #6d42e0 100%)';
const STORE_COUPON_GRADIENT = 'linear-gradient(135deg, #FFD3A8 0%, #FFAE63 48%, #FF7E33 100%)';
const STORE_FAVORITES_KEY = 'gatedo_store_favorites';
const SHARE_XPT_REWARD = 2;

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const getViewCount = (id) => (parseInt(String(id || '').slice(-4), 16) % 18) + 3;

function readFavoriteProductIds() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORE_FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeFavoriteProductIds(ids) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORE_FAVORITES_KEY, JSON.stringify([...new Set(ids)]));
  } catch {
    // local persistence only
  }
}

function formatCurrency(value) {
  return `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR');
}

export default function Store() {
  const touch = useSensory();
  const { user } = useContext(AuthContext);
  const { gpts, xpt } = useGamification();

  const [products, setProducts] = useState([]);
  const [kits, setKits] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('Tudo');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedKit, setSelectedKit] = useState(null);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [rewardAnim, setRewardAnim] = useState(null);
  const [wallet, setWallet] = useState({ gpts: 0, xpt: 0 });
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);
  const [videoModal, setVideoModal] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(() => readFavoriteProductIds());

  const rewardTimeoutRef = useRef(null);
  const copiedTimeoutRef = useRef(null);

  const featuredIds = useMemo(() => new Set(products.slice(0, 3).map((product) => product.id)), [products]);
  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const filterCategories = useMemo(
    () => ['Tudo', 'Favoritos', ...CATEGORIES.filter((category) => category !== 'Tudo')],
    [],
  );

  useEffect(() => {
    Promise.all([
      api.get('/products'),
      api.get('/kits').catch(() => ({ data: [] })),
    ])
      .then(([productResponse, kitsResponse]) => {
        setProducts(productResponse.data || []);
        setKits(kitsResponse.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setWallet({
      gpts: Number(gpts || 0),
      xpt: Number(xpt || 0),
    });
  }, [gpts, xpt]);

  useEffect(() => {
    if (!user?.id) {
      setCoupons([]);
      return;
    }

    api
      .get('/coupons/my', { headers: { 'x-user-id': user.id } })
      .then((response) => setCoupons(response.data || []))
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    writeFavoriteProductIds(favoriteIds);
  }, [favoriteIds]);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (!ref) return;

    api.post('/products/track-click', { shareToken: ref }).catch(() => {});

    const url = new URL(window.location.href);
    url.searchParams.delete('ref');
    window.history.replaceState({}, '', url.toString());
  }, []);

  useEffect(() => {
    setCopied(false);
    setActiveImgIndex(0);
  }, [selectedProduct?.id]);

  useEffect(() => () => {
    if (rewardTimeoutRef.current) window.clearTimeout(rewardTimeoutRef.current);
    if (copiedTimeoutRef.current) window.clearTimeout(copiedTimeoutRef.current);
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);

    return products.filter((product) => {
      const categoryName = product.category?.name || '';
      const matchesCategory =
        activeCat === 'Tudo' ||
        (activeCat === 'Favoritos' && favoriteSet.has(product.id)) ||
        normalizeText(categoryName) === normalizeText(activeCat);

      const matchesSearch =
        !normalizedSearch ||
        normalizeText(product.name).includes(normalizedSearch) ||
        normalizeText(product.description).includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [activeCat, favoriteSet, products, searchTerm]);

  const fireRewardAnim = (x, y, type, amount) => {
    if (!amount) return;

    if (rewardTimeoutRef.current) {
      window.clearTimeout(rewardTimeoutRef.current);
    }

    setRewardAnim({
      x,
      y,
      amount,
      type,
    });

    rewardTimeoutRef.current = window.setTimeout(() => {
      setRewardAnim(null);
      rewardTimeoutRef.current = null;
    }, 2200);
  };

  const syncGamification = () => {
    window.dispatchEvent(new CustomEvent('gatedo-gamification-refresh'));
  };

  const toggleFavorite = (productId, event) => {
    event?.stopPropagation?.();
    touch('light');

    setFavoriteIds((current) => (
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    ));
  };

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim() || !user?.id) return;

    setCouponLoading(true);
    setCouponResult(null);

    try {
      const response = await api.post(
        '/coupons/redeem',
        { code: couponCode.trim().toUpperCase() },
        { headers: { 'x-user-id': user.id } },
      );

      const earned = Number(response.data?.pointsEarned || 0);

      setCouponResult({
        success: true,
        message: response.data?.message || 'Cupom resgatado com sucesso!',
        points: earned,
      });

      setWallet((current) => ({
        ...current,
        gpts: Number(current.gpts || 0) + earned,
      }));

      setCouponCode('');

      api
        .get('/coupons/my', { headers: { 'x-user-id': user.id } })
        .then((couponResponse) => setCoupons(couponResponse.data || []))
        .catch(() => {});

      fireRewardAnim(window.innerWidth / 2, 190, 'gpts', earned);
      syncGamification();
    } catch (error) {
      setCouponResult({
        success: false,
        message: error.response?.data?.message || 'Cupom inválido ou expirado.',
        points: 0,
      });
    } finally {
      setCouponLoading(false);
      window.setTimeout(() => setCouponResult(null), 4200);
    }
  };

  const handleShare = async (event, product) => {
    event.stopPropagation();
    setShareLoading(true);
    setCopied(false);

    const rect = event.currentTarget.getBoundingClientRect();

    try {
      const response = await api.post('/products/share', { productId: product.id });
      const shareToken = response.data?.shareToken;
      const shareUrl = shareToken
        ? `${window.location.origin}/loja?ref=${shareToken}`
        : product.externalLink || '';

      let shareConfirmed = false;

      if (navigator.share) {
        await navigator.share({
          title: `Gatedo Shop - ${product.name}`,
          text: 'Olha esse produto incrível para gatos que encontrei na Gatedo Shop.',
          url: shareUrl,
        });
        shareConfirmed = true;
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        shareConfirmed = true;
        copiedTimeoutRef.current = window.setTimeout(() => {
          setCopied(false);
          copiedTimeoutRef.current = null;
        }, 2000);
      }

      if (!shareConfirmed || !shareToken) return;

      const confirmResponse = await api.post('/products/share/confirm', { shareToken });
      const earnedXpt = Number(confirmResponse.data?.xptEarned || 0);

      setWallet((current) => ({
        gpts: Number(confirmResponse.data?.gptsTotal ?? current.gpts ?? 0),
        xpt: Number(confirmResponse.data?.xptTotal ?? current.xpt ?? 0),
      }));

      if (!confirmResponse.data?.alreadyRewarded) {
        fireRewardAnim(rect.left + rect.width / 2, rect.top, 'xpt', earnedXpt);
      }

      touch('success');
      syncGamification();
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error(error);
      }
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] pb-28 font-sans relative">
      <div
        className="px-5 pt-6 pb-5 rounded-b-[32px] shadow-[0_18px_42px_rgba(109,66,224,0.22)] sticky top-0 z-20 text-white"
        style={{ background: STORE_HEADER_GRADIENT }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Gatedo<span style={{ color: '#ebfc66', textShadow: '1px 1px 0 rgba(68,39,155,0.28)' }}>Shop</span>
            </h1>
              <p className="text-[10px] text-white/75 font-bold">Curadoria inteligente para seu felino</p>
          </div>

          <div className="flex items-start gap-2 shrink-0">
            {coupons.length > 0 && (
              <button
                onClick={() => setShowCoupons(true)}
                className="relative bg-white/16 border border-white/20 backdrop-blur-sm p-2.5 rounded-2xl hover:bg-white/22 transition-colors"
              >
                <Tag size={16} className="text-white" />
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-[#ebfc66] text-[#5e37cf] text-[8px] font-black rounded-full flex items-center justify-center">
                  {coupons.length}
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="bg-white/16 border border-white/18 backdrop-blur-sm px-3 py-2 rounded-2xl text-white font-black text-xs flex items-center gap-1.5">
            <PawPrint size={13} fill="currentColor" />
            {formatNumber(wallet.gpts)} GPTS
          </div>
          <div className="bg-[#ebfc66] px-3 py-2 rounded-2xl text-[#5730c2] font-black text-xs flex items-center gap-1.5 shadow-[0_8px_24px_rgba(235,252,102,0.28)]">
            <Zap size={13} fill="currentColor" />
            {formatNumber(wallet.xpt)} XPT
          </div>
        </div>

        <div className="bg-white/16 backdrop-blur-sm p-3 rounded-2xl flex items-center gap-2 border border-white/15 focus-within:border-white/40 transition-colors">
          <Search size={18} className="text-white/70 shrink-0" />
          <input
            placeholder="Busque por fonte, areia, brinquedo..."
            className="bg-transparent w-full outline-none text-sm font-bold text-white placeholder:text-white/65"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      <div className="p-4 space-y-7 max-w-5xl mx-auto">
        {!searchTerm && (
          <div
            className="rounded-[26px] p-4 text-white shadow-[0_18px_40px_rgba(255,126,51,0.18)]"
            style={{ background: STORE_COUPON_GRADIENT }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-white/18 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-sm">
                <Gift size={15} color="white" />
              </div>
              <div>
                <p className="font-black text-sm">Tem um cupom? Resgate aqui</p>
                <p className="text-[10px] text-white/75 font-bold">Ganhe GPTS e descontos instantaneamente</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                onKeyDown={(event) => event.key === 'Enter' && handleRedeemCoupon()}
                placeholder="Ex: GATEDO10"
                className="flex-1 bg-white/92 border border-white/35 rounded-xl px-4 py-2.5 text-sm font-black text-[#5e3a17] outline-none focus:border-white uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:font-normal placeholder:text-[#9f6b48]"
              />
              <button
                onClick={handleRedeemCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="bg-[#ff6a1a] text-white px-4 py-2.5 rounded-xl font-black text-sm flex items-center gap-1.5 disabled:opacity-50 hover:brightness-105 active:scale-95 transition-all shrink-0 shadow-[0_8px_18px_rgba(255,106,26,0.28)]"
              >
                {couponLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Tag size={13} /> Resgatar
                  </>
                )}
              </button>
            </div>

            <AnimatePresence>
              {couponResult && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-3 flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl ${
                    couponResult.success ? 'bg-white/18 text-white' : 'bg-[#7d1f12]/25 text-white'
                  }`}
                >
                  {couponResult.success ? <Check size={12} /> : <X size={12} />}
                  {couponResult.message}
                  {couponResult.points > 0 && ` (+${couponResult.points} GPTS)`}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {!searchTerm && kits.filter((kit) => kit.active).length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-gray-800 text-base flex items-center gap-2">
                <Sparkles size={14} className="text-[#8B4AFF]" /> Kits Curados
              </h3>
              <span className="text-[9px] font-black text-[#8B4AFF] bg-purple-50 px-2 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                <Zap size={8} fill="currentColor" /> 2x pontos
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {kits.filter((kit) => kit.active).map((kit) => {
                const Icon = KIT_ICONS[kit.iconName] || Gift;

                return (
                  <motion.div
                    key={kit.id}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      touch('heavy');
                      setSelectedKit(kit);
                    }}
                    className={`h-36 bg-gradient-to-br ${kit.gradient} p-4 rounded-[24px] relative overflow-hidden cursor-pointer flex flex-col justify-between`}
                  >
                    <div className="absolute top-2 right-2 bg-[#ebfc66] text-[#1a0533] text-[7px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Zap size={7} fill="currentColor" /> 2x PTS
                    </div>
                    <div className="bg-white/20 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm text-white">
                      <Icon size={17} />
                    </div>
                    <div>
                      <h4 className="font-black text-white text-sm leading-tight">{kit.title}</h4>
                      <p className="text-[9px] text-white/75 font-bold mt-0.5">{kit.subtitle}</p>
                      <p className="text-[8px] text-white/50 mt-1 font-bold">
                        {(kit.productIds || []).length} produto{(kit.productIds || []).length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <div className="sticky top-[154px] z-10 bg-[var(--gatedo-light-bg)] py-2 -mx-4 px-4 overflow-x-auto flex gap-2">
          {filterCategories.map((category) => (
            <button
              key={category}
              onClick={() => {
                touch('light');
                setActiveCat(category);
              }}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                activeCat === category
                  ? 'bg-[#8B4AFF] text-white border-[#8B4AFF] shadow-md shadow-indigo-200 scale-105'
                  : category === 'Favoritos'
                    ? 'bg-white border-[#ffb6cf] text-[#d64a80]'
                    : 'bg-white border-gray-100 text-gray-400'
              }`}
            >
              {category === 'Favoritos' ? 'Favoritos' : category}
            </button>
          ))}
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-gray-800 text-base flex items-center gap-2">
              Achadinhos <Sparkles size={13} className="text-yellow-400 fill-current" />
            </h3>
            <span className="text-[9px] text-gray-400 font-bold">{filteredProducts.length} produtos</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <div key={index} className="bg-white p-3 h-56 rounded-[24px] animate-pulse">
                  <div className="h-28 bg-gray-100 rounded-[18px] mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              {activeCat === 'Favoritos' ? (
                <>
                  <Heart size={40} className="mx-auto mb-3 text-pink-200" />
                  <p className="font-bold text-gray-500">Nenhum favorito salvo ainda</p>
                  <p className="text-sm text-gray-350 mt-1">Marque os produtos com o coracao para montar sua lista.</p>
                </>
              ) : (
                <>
                  <ShoppingBag size={40} className="mx-auto mb-3 text-gray-200" />
                  <p className="font-bold text-gray-400">Nenhum produto encontrado</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const isFeatured = featuredIds.has(product.id);
                const isFavorite = favoriteSet.has(product.id);

                return (
                  <motion.div
                    key={product.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      touch('light');
                      setSelectedProduct(product);
                    }}
                    className="bg-white p-3 rounded-[24px] shadow-sm border border-gray-50 flex flex-col gap-2 group relative overflow-hidden cursor-pointer hover:shadow-[0_14px_30px_rgba(92,63,188,0.12)] transition-[transform,box-shadow] duration-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className={`inline-flex ${PARTNER_STYLES[product.platform]?.color || 'bg-gray-200 text-gray-600'} text-[7px] font-bold px-1.5 py-0.5 rounded-full uppercase`}>
                        {product.platform}
                      </div>
                      <button
                        onClick={(event) => toggleFavorite(product.id, event)}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                          isFavorite
                            ? 'bg-[#ffe7f0] border-[#ffb7d2] text-[#e14584]'
                            : 'bg-white border-gray-100 text-gray-300 hover:text-[#e14584] hover:border-[#ffd0e2]'
                        }`}
                        aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      >
                        <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <div className="h-28 bg-gray-50 rounded-[18px] overflow-hidden relative">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                          alt={product.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={22} className="text-gray-200" />
                        </div>
                      )}

                      {(isFeatured || product.badge) && (
                        <div className={`absolute left-2 bottom-2 text-[7px] font-black px-2 py-1 rounded-full z-10 flex items-center gap-1 ${
                          isFeatured ? 'bg-red-500 text-white' : 'bg-[#ebfc66] text-[#6d42e0]'
                        }`}>
                          {isFeatured ? <Flame size={7} fill="currentColor" /> : <Star size={7} fill="currentColor" />}
                          {isFeatured ? 'TOP' : product.badge}
                        </div>
                      )}
                    </div>

                    <div className="px-0.5">
                      <h3 className="font-black text-gray-800 text-[11px] leading-tight line-clamp-2">{product.name}</h3>
                      <p className="text-base font-black text-[#8B4AFF] mt-0.5">{formatCurrency(product.price)}</p>
                      <p className="text-[8px] text-gray-400 font-bold flex items-center gap-1 mt-0.5">
                        <Users size={7} /> {getViewCount(product.id)} vendo agora
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div
          className="rounded-[24px] p-6 text-white relative overflow-hidden shadow-[0_18px_42px_rgba(109,66,224,0.2)]"
          style={{ background: STORE_HEADER_GRADIENT }}
        >
          <div className="relative z-10">
            <span className="bg-white/20 text-white text-[9px] font-black px-2 py-1 rounded-lg mb-2 inline-block uppercase tracking-widest">
              Parceiros
            </span>
            <h3 className="font-black text-lg mb-1">Descontos Exclusivos</h3>
            <p className="text-xs text-purple-100 mb-4 max-w-[220px]">
              Assinantes Founder ganham até 15% OFF nas marcas parceiras.
            </p>
            <button
              onClick={() => setShowCoupons(true)}
              className="bg-[#ebfc66] text-[#8B4AFF] px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 hover:brightness-110"
            >
              <Tag size={13} /> Ver Meus Cupons
            </button>
          </div>
          <Award size={110} className="absolute -right-6 -bottom-6 text-white opacity-10 rotate-12" />
        </div>
      </div>

      <AnimatePresence>
        {rewardAnim && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: 1, y: -56, scale: 1.2 }}
            exit={{ opacity: 0, scale: 0.7 }}
            className={`fixed z-[300] pointer-events-none font-black text-xl flex items-center gap-1.5 drop-shadow-lg ${
              rewardAnim.type === 'xpt' ? 'text-[#dfff40]' : 'text-[#8B4AFF]'
            }`}
            style={{ left: rewardAnim.x - 40, top: rewardAnim.y }}
          >
            {rewardAnim.type === 'xpt' ? (
              <>
                +{rewardAnim.amount} XPT <Zap size={20} fill="currentColor" />
              </>
            ) : (
              <>
                +{rewardAnim.amount} GPTS <PawPrint size={18} fill="currentColor" />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCoupons && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCoupons(false)}
              className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="relative z-10 bg-white w-full max-w-lg rounded-t-[32px] p-6 max-h-[80vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between mb-5 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Tag size={15} className="text-amber-500" />
                  </div>
                  <h3 className="font-black text-gray-800">Meus Cupons</h3>
                </div>
                <button
                  onClick={() => setShowCoupons(false)}
                  className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <X size={13} className="text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {coupons.length === 0 ? (
                  <div className="text-center py-12">
                    <Tag size={36} className="mx-auto mb-3 text-gray-200" />
                    <p className="font-bold text-gray-400 text-sm">Nenhum cupom disponível</p>
                    <p className="text-xs text-gray-300 mt-1">Novos cupons aparecerão aqui</p>
                  </div>
                ) : (
                  coupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-dashed border-amber-200 rounded-2xl p-4 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                        {coupon.discountType === 'POINTS' ? (
                          <Star size={17} className="text-amber-500" />
                        ) : (
                          <Tag size={17} className="text-amber-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-800 text-sm">{coupon.description}</p>
                        <p className="font-black text-amber-600 text-xs mt-0.5">
                          {coupon.discountType === 'POINTS' ? `+${coupon.value} GPTS` : `${coupon.value}% OFF`}
                        </p>
                        {coupon.expiresAt && (
                          <p className="text-[9px] text-gray-400 font-bold flex items-center gap-1 mt-0.5">
                            <Clock size={8} /> Válido até {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(coupon.code);
                          touch('success');
                        }}
                        className="bg-amber-400 text-white px-3 py-2 rounded-xl text-[9px] font-black flex items-center gap-1 shrink-0"
                      >
                        <Copy size={9} /> {coupon.code}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            />

            <motion.div
              key={selectedProduct.id}
              initial={{ opacity: 0, y: 28, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 290, damping: 28, mass: 0.9 }}
              className="relative z-10 bg-white w-full md:max-w-4xl md:rounded-[36px] rounded-t-[36px] flex flex-col md:flex-row md:h-auto md:max-h-[88vh] shadow-2xl overflow-hidden transform-gpu"
              style={{ height: 'calc(100dvh - 72px)' }}
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-30 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <X size={17} />
              </button>

              <div className="w-full md:w-[45%] bg-[#f7f7fc] flex flex-col justify-center shrink-0 px-5 pt-5 pb-3 md:p-5">
                <div className="aspect-square rounded-2xl overflow-hidden mb-2 bg-white relative max-h-[38vh] md:max-h-none border border-gray-100">
                  {selectedProduct.images?.[activeImgIndex] ? (
                    <motion.img
                      key={`${selectedProduct.id}-${activeImgIndex}`}
                      initial={{ opacity: 0.2, scale: 0.985 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      src={selectedProduct.images[activeImgIndex]}
                      alt={selectedProduct.name}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag size={24} className="text-gray-200" />
                    </div>
                  )}

                  {selectedProduct.images?.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImgIndex((index) => (index - 1 + selectedProduct.images.length) % selectedProduct.images.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/88 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white active:scale-95 z-10"
                      >
                        <ChevronRight size={16} className="rotate-180 text-gray-600" />
                      </button>
                      <button
                        onClick={() => setActiveImgIndex((index) => (index + 1) % selectedProduct.images.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/88 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white active:scale-95 z-10"
                      >
                        <ChevronRight size={16} className="text-gray-600" />
                      </button>
                    </>
                  )}
                </div>

                {selectedProduct.images?.length > 1 && (
                  <div className="flex justify-center gap-2">
                    {selectedProduct.images.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        onClick={() => setActiveImgIndex(index)}
                        className={`h-1.5 rounded-full transition-all ${activeImgIndex === index ? 'bg-[#8B4AFF] w-6' : 'bg-gray-300 w-1.5'}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col min-h-0 md:w-[55%]">
                <div className="flex-1 overflow-y-auto px-6 pt-4 pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${PARTNER_STYLES[selectedProduct.platform]?.color || 'bg-gray-100 text-gray-500'}`}>
                      {selectedProduct.platform}
                    </span>
                    {featuredIds.has(selectedProduct.id) && (
                      <span className="px-2 py-1 rounded-lg text-[9px] font-black bg-red-50 text-red-500 flex items-center gap-1">
                        <Flame size={9} fill="currentColor" /> Mais vendido
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg font-black text-gray-800 leading-tight mb-1">{selectedProduct.name}</h2>
                  <h3 className="text-2xl font-black text-[#8B4AFF] mb-3">{formatCurrency(selectedProduct.price)}</h3>

                  <div className="flex items-center gap-3 mb-3 bg-gray-50 rounded-2xl p-3">
                    <div className="flex -space-x-2">
                      {['🐱', '😺', '🐾'].map((emoji, index) => (
                        <div key={`${emoji}-${index}`} className="w-6 h-6 bg-white rounded-full border-2 border-gray-100 flex items-center justify-center text-xs">
                          {emoji}
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-700">{getViewCount(selectedProduct.id) + 12} tutores compraram</p>
                      <p className="text-[9px] text-gray-400 font-bold">nos últimos 30 dias</p>
                    </div>
                  </div>

                  <p className="text-gray-500 text-sm leading-relaxed mb-3">
                    {selectedProduct.description || 'Produto selecionado pela curadoria Gatedo.'}
                  </p>

                  {selectedProduct.videoReview && (
                    <button
                      onClick={() => setVideoModal(selectedProduct.videoReview)}
                      className="w-full flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-2xl mb-3 hover:bg-black active:scale-95 transition-all"
                    >
                      <div className="w-8 h-8 bg-[#8B4AFF] rounded-full flex items-center justify-center shrink-0">
                        <PlayCircle size={16} fill="white" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black">Ver vídeo do produto</p>
                        <p className="text-[9px] text-gray-400">Review completo</p>
                      </div>
                    </button>
                  )}

                  <div className="flex items-center gap-2 text-[10px] font-bold text-orange-600 bg-orange-50 px-3 py-2 rounded-xl">
                    <TrendingUp size={11} /> {getViewCount(selectedProduct.id)} pessoas estao vendo agora
                  </div>
                </div>

                <div className="shrink-0 px-5 pt-4 pb-[125px] md:pb-5 border-t border-gray-100 bg-white">
                  <div className="flex gap-3 mb-3">
                    <button
                      onClick={(event) => handleShare(event, selectedProduct)}
                      disabled={shareLoading}
                      className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 hover:bg-green-50 hover:text-green-700 transition-all active:scale-95 disabled:opacity-60"
                    >
                      {shareLoading ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      ) : copied ? (
                        <>
                          <Check size={14} className="text-green-500" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Share2 size={14} /> +{SHARE_XPT_REWARD} XPT
                        </>
                      )}
                    </button>

                    <button
                      onClick={(event) => toggleFavorite(selectedProduct.id, event)}
                      className={`px-4 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 border transition-all active:scale-95 ${
                        favoriteSet.has(selectedProduct.id)
                          ? 'bg-[#ffe7f0] text-[#df4b86] border-[#ffc2d9]'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-[#ffc2d9] hover:text-[#df4b86]'
                      }`}
                    >
                      <Heart size={14} fill={favoriteSet.has(selectedProduct.id) ? 'currentColor' : 'none'} />
                      Favorito
                    </button>
                  </div>

                  <a
                    href={selectedProduct.externalLink || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className={`w-full bg-[#8B4AFF] text-white py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-200 hover:brightness-110 active:scale-95 transition-all ${
                      !selectedProduct.externalLink ? 'pointer-events-none opacity-50' : ''
                    }`}
                  >
                    VER NA LOJA <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {videoModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setVideoModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="relative z-10 w-full max-w-2xl bg-black rounded-[24px] overflow-hidden shadow-2xl"
            >
              <button
                onClick={() => setVideoModal(null)}
                className="absolute top-3 right-3 z-20 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
              >
                <X size={16} color="white" />
              </button>
              <div className="aspect-video">
                <iframe width="100%" height="100%" src={videoModal} frameBorder="0" allowFullScreen title="Review" allow="autoplay" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedKit && (() => {
          const kitProducts = products.filter((product) => (selectedKit.productIds || []).includes(product.id));
          const Icon = KIT_ICONS[selectedKit.iconName] || Gift;

          return (
            <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedKit(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                className="bg-white w-full max-w-lg max-h-[88vh] rounded-t-[36px] md:rounded-[36px] pointer-events-auto relative z-10 flex flex-col overflow-hidden"
              >
                <div className={`p-7 pb-10 bg-gradient-to-br ${selectedKit.gradient} text-white relative overflow-hidden shrink-0`}>
                  <button onClick={() => setSelectedKit(null)} className="absolute top-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/40">
                    <X size={17} />
                  </button>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Icon size={22} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black">{selectedKit.title}</h2>
                      <p className="text-white/80 text-sm font-bold">{selectedKit.subtitle}</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-[#ebfc66] text-[#1a0533] px-3 py-1.5 rounded-xl text-xs font-black">
                    <Zap size={11} fill="currentColor" /> Compre todos e ganhe pontos em dobro!
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3 -mt-4">
                  <h3 className="font-black text-gray-500 text-[10px] uppercase tracking-widest mb-3">
                    {kitProducts.length} produto{kitProducts.length !== 1 ? 's' : ''} neste kit
                  </h3>

                  {kitProducts.length === 0 ? (
                    <p className="text-gray-300 text-sm text-center py-8">Produtos em breve</p>
                  ) : (
                    kitProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => {
                          setSelectedProduct(product);
                          setSelectedKit(null);
                        }}
                        className="bg-white border border-gray-100 p-3 rounded-2xl flex gap-3 items-center hover:shadow-md cursor-pointer transition-all"
                      >
                        <div className="w-14 h-14 rounded-xl bg-gray-50 overflow-hidden shrink-0">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} className="w-full h-full object-cover mix-blend-multiply" alt={product.name} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag size={16} className="text-gray-200" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-800 text-xs line-clamp-2 leading-tight">{product.name}</h4>
                          <p className="text-[#8B4AFF] font-black text-sm mt-0.5">{formatCurrency(product.price)}</p>
                        </div>
                        <ChevronRight size={15} className="text-gray-300 shrink-0" />
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
