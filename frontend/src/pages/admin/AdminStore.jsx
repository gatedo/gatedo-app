/**
 * AdminStore.jsx — Gestão de Produtos + Kits + Cupons
 *
 * 3 abas:
 *   1. Produtos  — CRUD de produtos afiliados
 *   2. Kits      — Montar kits com produtos + configurar gradiente e ícone
 *   3. Cupons    — Gerar e distribuir cupons para usuários ou globalmente
 */
import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Plus, ExternalLink, Trash2, Edit,
  Video, Image as ImageIcon, Save, X, RefreshCw,
  Star, Share2, TrendingUp, Link, Tag, Gift,
  Users, Copy, Check, Zap, Package, Crown,
  Heart, Award, Flame, Box, Send,
  Download, Upload, Home, ToggleLeft, ToggleRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const PARTNERS  = ['Amazon', 'Shopee', 'Mercado Livre', 'Gatedo'];
const CATS      = ['Saúde', 'Diversão', 'Higiene', 'Conforto', 'Alimentação'];
const GRADIENTS = [
  'from-yellow-400 to-orange-500',
  'from-purple-500 to-indigo-600',
  'from-green-400 to-emerald-600',
  'from-cyan-400 to-blue-500',
  'from-pink-500 to-rose-600',
  'from-gray-700 to-gray-900',
  'from-[#8B4AFF] to-[#6d42e0]',
  'from-amber-400 to-orange-600',
];
const ICON_OPTIONS = [
  { name: 'Star', icon: Star },
  { name: 'Zap', icon: Zap },
  { name: 'Heart', icon: Heart },
  { name: 'Award', icon: Award },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'Box', icon: Box },
  { name: 'Gift', icon: Gift },
  { name: 'Crown', icon: Crown },
  { name: 'Flame', icon: Flame },
];

const EMPTY_PROD = { name: '', price: '', platform: 'Amazon', category: 'Saúde', externalLink: '', images: '', videoReview: '', badge: '', description: '', featured: false };
const EMPTY_KIT  = { title: '', subtitle: '', iconName: 'Gift', gradient: 'from-yellow-400 to-orange-500', productIds: [], active: true };
const EMPTY_CUP  = { code: '', description: '', discountType: 'POINTS', value: 10, maxUses: 1, expiresAt: '', targetUserId: '' };

export default function AdminStore() {
  const [tab,        setTab]       = useState('produtos');
  const [products,   setProducts]  = useState([]);
  const [kits,       setKits]      = useState([]);
  const [coupons,    setCoupons]   = useState([]);
  const [users,      setUsers]     = useState([]);
  const [fetching,   setFetching]  = useState(true);

  // Produto
  const [showProdModal, setShowProdModal] = useState(false);
  const [editingProdId, setEditingProdId] = useState(null);
  const [savingProd,    setSavingProd]    = useState(false);
  const [prodForm,      setProdForm]      = useState(EMPTY_PROD);

  // Kit
  const [showKitModal,  setShowKitModal]  = useState(false);
  const [editingKitId,  setEditingKitId]  = useState(null);
  const [savingKit,     setSavingKit]     = useState(false);
  const [kitForm,       setKitForm]       = useState(EMPTY_KIT);

  // Cupom
  const [showCupModal,  setShowCupModal]  = useState(false);
  const [savingCup,     setSavingCup]     = useState(false);
  const [cupForm,       setCupForm]       = useState(EMPTY_CUP);
  const [copiedCode,    setCopiedCode]    = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setFetching(true);
    try {
      const [p, k, c, u] = await Promise.all([
        api.get('/products'),
        api.get('/kits').catch(() => ({ data: [] })),
        api.get('/coupons').catch(() => ({ data: [] })),
        api.get('/users').catch(() => ({ data: [] })),
      ]);
      setProducts(p.data || []);
      setKits(k.data || []);
      setCoupons(c.data || []);
      setUsers(u.data || []);
    } catch (err) { console.error(err); }
    finally { setFetching(false); }
  };

  // ── Produto ──────────────────────────────────────────────────────────────
  const openProdModal = (prod = null) => {
    if (prod) {
      setEditingProdId(prod.id);
      setProdForm({ name: prod.name || '', price: prod.price || '', platform: prod.platform || 'Amazon', category: prod.category?.name || 'Saúde', externalLink: prod.externalLink || '', images: (prod.images || []).join(', '), videoReview: prod.videoReview || '', badge: prod.badge || '', description: prod.description || '', featured: prod.featured ?? false });
    } else {
      setEditingProdId(null);
      setProdForm(EMPTY_PROD);
    }
    setShowProdModal(true);
  };

  const saveProd = async (e) => {
    e.preventDefault();
    setSavingProd(true);
    try {
      const payload = { name: prodForm.name.trim(), description: prodForm.description.trim() || '', price: parseFloat(String(prodForm.price).replace(',', '.')) || 0, platform: prodForm.platform, externalLink: prodForm.externalLink.trim(), images: prodForm.images.split(',').map(u => u.trim()).filter(Boolean), videoReview: prodForm.videoReview.trim() || null, badge: prodForm.badge.trim() || null, categoryName: prodForm.category, featured: prodForm.featured ?? false };
      if (editingProdId) {
        const r = await api.patch(`/products/${editingProdId}`, payload);
        setProducts(prev => prev.map(p => p.id === editingProdId ? r.data : p));
      } else {
        const r = await api.post('/products', payload);
        setProducts(prev => [r.data, ...prev]);
      }
      setShowProdModal(false);
    } catch (err) { alert(err.response?.data?.message || 'Erro ao salvar produto.'); }
    finally { setSavingProd(false); }
  };

  const deleteProd = async (id) => {
    if (!window.confirm('Remover produto?')) return;
    await api.delete(`/products/${id}`);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // ── Toggle destaque na home ───────────────────────────────────────────────
  const toggleFeatured = async (prod) => {
    const newVal = !prod.featured;
    try {
      await api.patch(`/products/${prod.id}`, { featured: newVal });
      setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, featured: newVal } : p));
    } catch { alert('Erro ao atualizar destaque.'); }
  };

  // ── Exportar/Importar JSON ────────────────────────────────────────────────
  const exportProducts = () => {
    const clean = products.map(({ id, createdAt, updatedAt, category, ...rest }) => ({
      ...rest,
      categoryName: category?.name || rest.categoryName || '',
    }));
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `gatedo-products-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importProducts = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const list = JSON.parse(text);
      if (!Array.isArray(list)) throw new Error('Formato inválido — esperado array.');
      const confirm = window.confirm(`Importar ${list.length} produto(s)? Produtos existentes com mesmo nome serão duplicados.`);
      if (!confirm) return;
      setFetching(true);
      const results = await Promise.allSettled(list.map(p => api.post('/products', p)));
      const ok  = results.filter(r => r.status === 'fulfilled').length;
      const err = results.filter(r => r.status === 'rejected').length;
      await fetchAll();
      alert(`Importação concluída: ${ok} criados${err ? `, ${err} com erro` : ''}.`);
    } catch (err) {
      alert('Erro ao importar: ' + err.message);
    } finally {
      setFetching(false);
      e.target.value = '';
    }
  };

  // ── Kit ──────────────────────────────────────────────────────────────────
  const openKitModal = (kit = null) => {
    if (kit) {
      setEditingKitId(kit.id);
      setKitForm({ title: kit.title, subtitle: kit.subtitle, iconName: kit.iconName || 'Gift', gradient: kit.gradient, productIds: kit.productIds || [], active: kit.active ?? true });
    } else {
      setEditingKitId(null);
      setKitForm(EMPTY_KIT);
    }
    setShowKitModal(true);
  };

  const saveKit = async (e) => {
    e.preventDefault();
    setSavingKit(true);
    try {
      if (editingKitId) {
        const r = await api.patch(`/kits/${editingKitId}`, kitForm);
        setKits(prev => prev.map(k => k.id === editingKitId ? r.data : k));
      } else {
        const r = await api.post('/kits', kitForm);
        setKits(prev => [r.data, ...prev]);
      }
      setShowKitModal(false);
    } catch (err) { alert(err.response?.data?.message || 'Erro ao salvar kit.'); }
    finally { setSavingKit(false); }
  };

  const toggleProdInKit = (prodId) => {
    setKitForm(prev => ({
      ...prev,
      productIds: prev.productIds.includes(prodId)
        ? prev.productIds.filter(id => id !== prodId)
        : [...prev.productIds, prodId],
    }));
  };

  const deleteKit = async (id) => {
    if (!window.confirm('Remover kit?')) return;
    await api.delete(`/kits/${id}`);
    setKits(prev => prev.filter(k => k.id !== id));
  };

  // ── Cupom ────────────────────────────────────────────────────────────────
  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return 'GATEDO' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const openCupModal = () => {
    setCupForm({ ...EMPTY_CUP, code: generateCode() });
    setShowCupModal(true);
  };

  const saveCoupon = async (e) => {
    e.preventDefault();
    setSavingCup(true);
    try {
      const payload = { ...cupForm, value: parseInt(cupForm.value), maxUses: parseInt(cupForm.maxUses), expiresAt: cupForm.expiresAt || null, targetUserId: cupForm.targetUserId || null };
      const r = await api.post('/coupons', payload);
      setCoupons(prev => [r.data, ...prev]);
      setShowCupModal(false);
    } catch (err) { alert(err.response?.data?.message || 'Erro ao criar cupom.'); }
    finally { setSavingCup(false); }
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm('Desativar cupom?')) return;
    await api.delete(`/coupons/${id}`);
    setCoupons(prev => prev.filter(c => c.id !== id));
  };

  const copyCouponCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const pf  = key => e => setProdForm(prev => ({ ...prev, [key]: e.target.value }));
  const kf  = key => e => setKitForm(prev => ({ ...prev, [key]: typeof e === 'string' ? e : e.target.value }));
  const cf  = key => e => setCupForm(prev => ({ ...prev, [key]: e.target.value }));

  const TABS = [
    { id: 'produtos', label: 'Produtos', count: products.length, icon: ShoppingBag },
    { id: 'kits',     label: 'Kits',     count: kits.length,     icon: Package },
    { id: 'cupons',   label: 'Cupons',   count: coupons.length,  icon: Tag },
  ];

  return (
    <div className="space-y-5">

      {/* Header + tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
              <ShoppingBag className="text-[#8B4AFF]" /> Gestão da Loja
            </h2>
            <p className="text-sm text-gray-400">Produtos, kits curados e cupons.</p>
          </div>
          <button onClick={fetchAll} disabled={fetching} className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400">
            <RefreshCw size={15} className={fetching ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all
                ${tab === t.id ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'}`}>
              <t.icon size={13} />
              {t.label}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${tab === t.id ? 'bg-[#8B4AFF] text-white' : 'bg-gray-200 text-gray-400'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── ABA PRODUTOS ──────────────────────────────────────────────────── */}
      {tab === 'produtos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Contador de destaques */}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                <Home size={10} className="text-[#8B4AFF]" />
                {products.filter(p => p.featured).length} na home
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Import */}
              <label className="cursor-pointer flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-500 hover:border-[#8B4AFF] hover:text-[#8B4AFF] transition-all">
                <Upload size={14} /> Importar
                <input type="file" accept=".json" className="hidden" onChange={importProducts} />
              </label>
              {/* Export */}
              <button onClick={exportProducts} disabled={products.length === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-500 hover:border-[#8B4AFF] hover:text-[#8B4AFF] disabled:opacity-40 transition-all">
                <Download size={14} /> Exportar
              </button>
              <button onClick={() => openProdModal()}
                className="bg-[#8B4AFF] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 hover:brightness-110 active:scale-95 transition-all">
                <Plus size={16} /> Novo Produto
              </button>
            </div>
          </div>

          {fetching ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-52 bg-gray-100 rounded-[24px] animate-pulse" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-gray-300">
              <ShoppingBag size={40} className="mx-auto mb-3" />
              <p className="font-bold text-gray-400">Nenhum produto cadastrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(prod => (
                <div key={prod.id} className="bg-white rounded-[20px] border border-gray-100 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-all">
                  <div className="h-36 bg-gray-50 relative overflow-hidden">
                    {prod.images?.[0]
                      ? <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover mix-blend-multiply p-2" />
                      : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={28} className="text-gray-200" /></div>}
                    {prod.badge && <span className="absolute top-2 left-2 bg-[#8B4AFF] text-white text-[8px] font-black px-2 py-0.5 rounded-full">{prod.badge}</span>}
                    {prod.featured && (
                      <span className="absolute top-2 right-2 bg-[#DFFF40] text-[#1a1a00] text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Home size={7} /> HOME
                      </span>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-black text-[#8B4AFF] bg-purple-50 px-1.5 py-0.5 rounded-full">{prod.platform}</span>
                      <span className="text-[8px] text-gray-400 font-bold">{prod.category?.name}</span>
                    </div>
                    <h3 className="font-black text-gray-800 text-sm line-clamp-1">{prod.name}</h3>
                    <p className="text-sm font-black text-[#8B4AFF]">R$ {parseFloat(prod.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="flex gap-1.5 p-3 border-t border-gray-50">
                    <button onClick={() => toggleFeatured(prod)}
                      title={prod.featured ? 'Remover da home' : 'Mostrar na home'}
                      className={`p-2 rounded-xl transition-all ${prod.featured ? 'bg-[#DFFF40] text-[#1a1a00]' : 'bg-gray-100 text-gray-400 hover:bg-yellow-50 hover:text-yellow-600'}`}>
                      <Home size={14} />
                    </button>
                    <button onClick={() => openProdModal(prod)} className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-100">
                      <Edit size={12} /> Editar
                    </button>
                    <button onClick={() => deleteProd(prod.id)} className="p-2 bg-red-50 text-red-400 rounded-xl hover:bg-red-100"><Trash2 size={14} /></button>
                    {prod.externalLink && <a href={prod.externalLink} target="_blank" rel="noreferrer" className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:text-[#8B4AFF]"><ExternalLink size={14} /></a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ABA KITS ──────────────────────────────────────────────────────── */}
      {tab === 'kits' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-bold">Kits aparecem na loja com badge "2× Pontos"</p>
            <button onClick={() => openKitModal()}
              className="bg-[#8B4AFF] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 hover:brightness-110 active:scale-95 transition-all">
              <Plus size={16} /> Novo Kit
            </button>
          </div>

          {kits.length === 0 ? (
            <div className="text-center py-16 text-gray-300">
              <Package size={40} className="mx-auto mb-3" />
              <p className="font-bold text-gray-400">Nenhum kit criado</p>
              <p className="text-xs text-gray-300 mt-1">Crie um kit agrupando produtos relacionados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kits.map(kit => {
                const Icon = ICON_OPTIONS.find(i => i.name === kit.iconName)?.icon || Gift;
                const kitProds = products.filter(p => (kit.productIds || []).includes(p.id));
                return (
                  <div key={kit.id} className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
                    <div className={`bg-gradient-to-br ${kit.gradient} p-5 text-white flex items-center gap-4`}>
                      <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Icon size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-sm">{kit.title}</h3>
                        <p className="text-white/70 text-[10px] font-bold">{kit.subtitle}</p>
                      </div>
                      <span className={`text-[8px] font-black px-2 py-1 rounded-full ${kit.active ? 'bg-[#ebfc66] text-[#1a0533]' : 'bg-white/20 text-white/60'}`}>
                        {kit.active ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] text-gray-400 font-bold mb-2">{kitProds.length} produto{kitProds.length !== 1 ? 's' : ''} no kit</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {kitProds.slice(0, 4).map(p => (
                          <span key={p.id} className="text-[9px] bg-gray-50 text-gray-500 font-bold px-2 py-0.5 rounded-full border border-gray-100 line-clamp-1 max-w-[120px]">
                            {p.name}
                          </span>
                        ))}
                        {kitProds.length > 4 && <span className="text-[9px] text-gray-400 font-bold">+{kitProds.length - 4}</span>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openKitModal(kit)} className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                          <Edit size={12} /> Editar
                        </button>
                        <button onClick={() => deleteKit(kit.id)} className="p-2 bg-red-50 text-red-400 rounded-xl"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ABA CUPONS ────────────────────────────────────────────────────── */}
      {tab === 'cupons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-bold">Cupons de pontos ou desconto para usuários</p>
            <button onClick={openCupModal}
              className="bg-amber-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-amber-200 hover:brightness-110 active:scale-95 transition-all">
              <Plus size={16} /> Novo Cupom
            </button>
          </div>

          {coupons.length === 0 ? (
            <div className="text-center py-16 text-gray-300">
              <Tag size={40} className="mx-auto mb-3" />
              <p className="font-bold text-gray-400">Nenhum cupom criado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map(c => (
                <div key={c.id} className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                    {c.discountType === 'POINTS' ? <Star size={18} className="text-amber-400" /> : <Tag size={18} className="text-amber-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-black text-gray-800 text-sm">{c.description}</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${c.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {c.active ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold">
                      {c.discountType === 'POINTS' ? `+${c.value} pontos` : `${c.value}% OFF`}
                      {' · '}{c.usedCount}/{c.maxUses} usos
                      {c.expiresAt && ` · Expira ${new Date(c.expiresAt).toLocaleDateString('pt-BR')}`}
                      {c.targetUserId && ' · Usuário específico'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => copyCouponCode(c.code)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${copiedCode === c.code ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>
                      {copiedCode === c.code ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> {c.code}</>}
                    </button>
                    <button onClick={() => deleteCoupon(c.id)} className="p-2 bg-red-50 text-red-400 rounded-xl"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL PRODUTO ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showProdModal && (
          <div className="fixed inset-0 bg-black/60 z-[3000] flex items-end sm:items-center justify-center backdrop-blur-sm">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="bg-white w-full sm:max-w-2xl sm:rounded-[32px] rounded-t-[32px] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 shrink-0">
                <h3 className="font-black text-lg text-gray-800">{editingProdId ? 'Editar Produto' : 'Novo Produto'}</h3>
                <button onClick={() => setShowProdModal(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <X size={14} className="text-gray-500" />
                </button>
              </div>
              <form onSubmit={saveProd} className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="lbl">Nome *</label><input required value={prodForm.name} onChange={pf('name')} className="inp" placeholder="Ex: Fonte Inox" /></div>
                  <div><label className="lbl">Preço *</label><input required value={prodForm.price} onChange={pf('price')} className="inp" type="number" step="0.01" min="0" placeholder="89.90" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="lbl">Loja</label><select value={prodForm.platform} onChange={pf('platform')} className="inp">{PARTNERS.map(p => <option key={p}>{p}</option>)}</select></div>
                  <div><label className="lbl">Categoria</label><select value={prodForm.category} onChange={pf('category')} className="inp">{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
                </div>
                <div><label className="lbl flex items-center gap-1"><Link size={9} /> Link de Afiliado *</label><input required value={prodForm.externalLink} onChange={pf('externalLink')} className="inp font-mono text-xs text-blue-600" placeholder="https://amzn.to/..." /></div>
                <div className="bg-gray-50 p-4 rounded-[20px] space-y-3">
                  <label className="lbl flex items-center gap-1"><ImageIcon size={10} /> Mídia</label>
                  <div><label className="lbl">URLs das Imagens (vírgula)</label><textarea value={prodForm.images} onChange={pf('images')} className="inp text-xs font-mono" rows={3} placeholder="https://img1.jpg, https://img2.jpg" /></div>
                  <div><label className="lbl">Vídeo Embed</label><input value={prodForm.videoReview} onChange={pf('videoReview')} className="inp text-xs" placeholder="https://www.youtube.com/embed/..." /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="lbl">Badge</label><input value={prodForm.badge} onChange={pf('badge')} className="inp" placeholder="Top 1" /></div>
                  <div><label className="lbl">Descrição</label><input value={prodForm.description} onChange={pf('description')} className="inp" placeholder="Resumo..." /></div>
                </div>

                {/* Mostrar na Home */}
                <div className={`flex items-center justify-between p-4 rounded-[18px] border-2 cursor-pointer transition-all ${prodForm.featured ? 'border-[#DFFF40] bg-yellow-50' : 'border-gray-100 bg-gray-50'}`}
                  onClick={() => setProdForm(prev => ({ ...prev, featured: !prev.featured }))}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${prodForm.featured ? 'bg-[#DFFF40]' : 'bg-gray-100'}`}>
                      <Home size={16} className={prodForm.featured ? 'text-[#1a1a00]' : 'text-gray-400'} />
                    </div>
                    <div>
                      <p className="font-black text-sm text-gray-800">Mostrar na Home</p>
                      <p className="text-[10px] text-gray-400 font-bold">Aparece no carrossel "Seus Gatos Vão Amar"</p>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${prodForm.featured ? 'bg-[#8B4AFF]' : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${prodForm.featured ? 'right-0.5' : 'left-0.5'}`} />
                  </div>
                </div>
                <button type="submit" disabled={savingProd} className="w-full py-4 bg-[#8B4AFF] text-white rounded-[20px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:brightness-110 active:scale-95 transition-all">
                  {savingProd ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={15} /> Salvar Produto</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL KIT ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showKitModal && (
          <div className="fixed inset-0 bg-black/60 z-[3000] flex items-end sm:items-center justify-center backdrop-blur-sm">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="bg-white w-full sm:max-w-2xl sm:rounded-[32px] rounded-t-[32px] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 shrink-0">
                <h3 className="font-black text-lg text-gray-800">{editingKitId ? 'Editar Kit' : 'Novo Kit'}</h3>
                <button onClick={() => setShowKitModal(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <X size={14} className="text-gray-500" />
                </button>
              </div>
              <form onSubmit={saveKit} className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
                {/* Preview */}
                <div className={`bg-gradient-to-br ${kitForm.gradient} p-5 rounded-[20px] text-white flex items-center gap-4`}>
                  {(() => { const Icon = ICON_OPTIONS.find(i => i.name === kitForm.iconName)?.icon || Gift; return <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-sm"><Icon size={20} /></div>; })()}
                  <div>
                    <p className="font-black text-sm">{kitForm.title || 'Nome do Kit'}</p>
                    <p className="text-white/70 text-[10px]">{kitForm.subtitle || 'Subtítulo'}</p>
                  </div>
                  <span className="ml-auto text-[8px] font-black bg-[#ebfc66] text-[#1a0533] px-2 py-1 rounded-full">2× PTS</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div><label className="lbl">Título *</label><input required value={kitForm.title} onChange={kf('title')} className="inp" placeholder="Kit Boas-Vindas" /></div>
                  <div><label className="lbl">Subtítulo</label><input value={kitForm.subtitle} onChange={kf('subtitle')} className="inp" placeholder="Essencial para começar" /></div>
                </div>

                {/* Ícone */}
                <div>
                  <label className="lbl">Ícone</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {ICON_OPTIONS.map(opt => (
                      <button key={opt.name} type="button"
                        onClick={() => setKitForm(prev => ({ ...prev, iconName: opt.name }))}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${kitForm.iconName === opt.name ? 'border-[#8B4AFF] bg-purple-50' : 'border-gray-100 bg-white'}`}>
                        <opt.icon size={17} className={kitForm.iconName === opt.name ? 'text-[#8B4AFF]' : 'text-gray-400'} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gradiente */}
                <div>
                  <label className="lbl">Cor do Kit</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {GRADIENTS.map(g => (
                      <button key={g} type="button" onClick={() => setKitForm(prev => ({ ...prev, gradient: g }))}
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${g} border-2 transition-all ${kitForm.gradient === g ? 'border-[#8B4AFF] scale-110' : 'border-transparent'}`} />
                    ))}
                  </div>
                </div>

                {/* Produtos */}
                <div>
                  <label className="lbl">Produtos do Kit ({kitForm.productIds.length} selecionados)</label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {products.map(p => (
                      <div key={p.id}
                        onClick={() => toggleProdInKit(p.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${kitForm.productIds.includes(p.id) ? 'border-[#8B4AFF] bg-purple-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${kitForm.productIds.includes(p.id) ? 'bg-[#8B4AFF] border-[#8B4AFF]' : 'border-gray-300'}`}>
                          {kitForm.productIds.includes(p.id) && <Check size={11} color="white" />}
                        </div>
                        {p.images?.[0] && <img src={p.images[0]} className="w-8 h-8 rounded-lg object-cover mix-blend-multiply bg-white shrink-0" alt="" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-gray-700 line-clamp-1">{p.name}</p>
                          <p className="text-[9px] text-[#8B4AFF] font-bold">R$ {parseFloat(p.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ativo */}
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setKitForm(prev => ({ ...prev, active: !prev.active }))}
                    className={`w-12 h-6 rounded-full transition-all relative ${kitForm.active ? 'bg-[#8B4AFF]' : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${kitForm.active ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                  <span className="text-sm font-bold text-gray-600">{kitForm.active ? 'Kit ativo (visível na loja)' : 'Kit inativo (oculto)'}</span>
                </div>

                <button type="submit" disabled={savingKit} className="w-full py-4 bg-[#8B4AFF] text-white rounded-[20px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:brightness-110 active:scale-95 transition-all">
                  {savingKit ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={15} /> Salvar Kit</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL CUPOM ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCupModal && (
          <div className="fixed inset-0 bg-black/60 z-[3000] flex items-end sm:items-center justify-center backdrop-blur-sm">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="bg-white w-full sm:max-w-lg sm:rounded-[32px] rounded-t-[32px] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 shrink-0">
                <h3 className="font-black text-lg text-gray-800">Novo Cupom</h3>
                <button onClick={() => setShowCupModal(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <X size={14} className="text-gray-500" />
                </button>
              </div>
              <form onSubmit={saveCoupon} className="flex-1 overflow-y-auto px-7 py-6 space-y-5">

                {/* Código */}
                <div>
                  <label className="lbl">Código do Cupom</label>
                  <div className="flex gap-2">
                    <input required value={cupForm.code} onChange={cf('code')}
                      className="inp flex-1 uppercase tracking-widest font-black" placeholder="GATEDO10" />
                    <button type="button" onClick={() => setCupForm(prev => ({ ...prev, code: generateCode() }))}
                      className="px-3 py-2 bg-gray-100 rounded-xl text-xs font-black text-gray-500 hover:bg-gray-200 shrink-0">
                      Gerar
                    </button>
                  </div>
                </div>

                <div><label className="lbl">Descrição</label><input required value={cupForm.description} onChange={cf('description')} className="inp" placeholder="Ex: Bônus de boas-vindas" /></div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="lbl">Tipo</label>
                    <select value={cupForm.discountType} onChange={cf('discountType')} className="inp">
                      <option value="POINTS">Pontos Gatedo</option>
                      <option value="PERCENT">Desconto %</option>
                    </select>
                  </div>
                  <div>
                    <label className="lbl">{cupForm.discountType === 'POINTS' ? 'Pontos' : 'Desconto %'}</label>
                    <input required value={cupForm.value} onChange={cf('value')} className="inp" type="number" min="1" placeholder={cupForm.discountType === 'POINTS' ? '50' : '10'} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="lbl">Máx. de usos</label>
                    <input required value={cupForm.maxUses} onChange={cf('maxUses')} className="inp" type="number" min="1" placeholder="1" />
                  </div>
                  <div>
                    <label className="lbl">Expira em</label>
                    <input value={cupForm.expiresAt} onChange={cf('expiresAt')} className="inp" type="date" />
                  </div>
                </div>

                {/* Usuário específico */}
                <div>
                  <label className="lbl flex items-center gap-1"><Users size={9} /> Entregar para usuário (opcional)</label>
                  <select value={cupForm.targetUserId} onChange={cf('targetUserId')} className="inp">
                    <option value="">Global — qualquer um pode usar</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                  </select>
                  {cupForm.targetUserId && (
                    <p className="text-[9px] text-[#8B4AFF] font-bold mt-1 flex items-center gap-1">
                      <Send size={8} /> Só esse usuário pode resgatar este cupom
                    </p>
                  )}
                </div>

                <button type="submit" disabled={savingCup} className="w-full py-4 bg-amber-400 text-white rounded-[20px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-200 hover:brightness-110 active:scale-95 transition-all">
                  {savingCup ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Gift size={15} /> Criar Cupom</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .lbl{display:block;font-size:9px;font-weight:900;color:#9CA3AF;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
        .inp{width:100%;background:#F9FAFB;border:1px solid #F3F4F6;border-radius:14px;padding:12px 16px;font-weight:700;font-size:13px;color:#374151;outline:none;transition:border-color .15s;resize:vertical}
        .inp:focus{border-color:#8B4AFF}
      `}</style>
    </div>
  );
}