import React, { useState, useEffect } from 'react';
import { 
  Search, ShoppingBag, ExternalLink, Star, X,
  Award, Heart, ArrowRight, Zap, Share2, PlayCircle, 
  ChevronRight, Box, Sparkles, Filter 
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../services/api';
import useSensory from '../hooks/useSensory';

// --- ESTILOS DAS MARCAS ---
const PARTNER_STYLES = {
    "Amazon": { color: "bg-[#FF9900] text-white", text: "text-[#FF9900]" },
    "Shopee": { color: "bg-[#EE4D2D] text-white", text: "text-[#EE4D2D]" },
    "Mercado Livre": { color: "bg-[#FFE600] text-gray-800", text: "text-yellow-600" },
    "Gatedo": { color: "bg-[#6158ca] text-white", text: "text-[#6158ca]" }
};

// --- COLEÇÕES (ACHADINHOS) ---
const COLLECTIONS = [
    { id: 1, title: "Kit Boas-Vindas", subtitle: "Essencial para começar", icon: Star, gradient: "from-yellow-400 to-orange-500", items: [1, 3] },
    { id: 2, title: "Gatificação", subtitle: "Paredes e diversão", icon: Zap, gradient: "from-purple-500 to-indigo-600", items: [2] },
    { id: 3, title: "Saúde Blindada", subtitle: "Prevenção total", icon: Heart, gradient: "from-green-400 to-emerald-600", items: [1] },
    { id: 4, title: "Higiene Premium", subtitle: "Areias e caixas", icon: Award, gradient: "from-cyan-400 to-blue-500", items: [3] },
    { id: 5, title: "Nutrição", subtitle: "Sachês e rações", icon: ShoppingBag, gradient: "from-pink-500 to-rose-600", items: [] },
    { id: 6, title: "Mimos & Tech", subtitle: "Fontes e robôs", icon: Box, gradient: "from-gray-700 to-gray-900", items: [1, 2] },
];

const CATEGORIES = ["Tudo", "Saúde", "Diversão", "Higiene", "Conforto", "Alimentação"];

export default function Store() {
  const touch = useSensory();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("Tudo");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [pointsAnim, setPointsAnim] = useState(null);

  // BUSCA REAL DO BACKEND
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const response = await api.get('/products');
        setProducts(response.data);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const handleProductClick = (prod) => {
      touch('light');
      setSelectedProduct(prod);
      setActiveImgIndex(0);
  };

  const handleShare = async (e, product) => {
    e.stopPropagation();
    touch('success');
    const rect = e.target.getBoundingClientRect();
    setPointsAnim({ x: rect.left + rect.width/2, y: rect.top });
    setTimeout(() => setPointsAnim(null), 2000);

    const shareData = { title: `Gatedo: ${product.name}`, text: `Olha isso!`, url: product.link };
    try { if (navigator.share) await navigator.share(shareData); else navigator.clipboard.writeText(product.link); } catch (err) {}
  };

  const filteredProducts = products.filter(p => {
      const matchesCat = activeCat === "Tudo" || p.category === activeCat;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FE] pb-24 font-sans relative selection:bg-purple-100">
      
      <div className="bg-white px-6 pt-6 pb-4 rounded-b-[35px] shadow-sm sticky top-0 z-20">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h1 className="text-2xl font-black text-[#6158ca] tracking-tight">
                    Gatedo<span className="text-[#ebfc66] text-shadow-sm" style={{textShadow: '1px 1px 0 #caaa00'}}>Shop</span>
                </h1>
                <p className="text-xs text-gray-400 font-bold">Curadoria inteligente para seu felino</p>
            </div>
            <div className="bg-[#ebfc66] p-2 rounded-full text-[#6158ca] font-black text-xs flex items-center gap-1 px-3 shadow-md shadow-yellow-100">
                <Star size={14} fill="currentColor" /> 120 pts
            </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-2xl flex items-center gap-2 border border-gray-100 focus-within:border-[#6158ca] transition-colors">
            <Search size={20} className="text-gray-400" />
            <input 
                placeholder="Busque por 'Fonte', 'Areia'..." 
                className="bg-transparent w-full outline-none text-sm font-bold text-gray-700"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="p-4 space-y-8 max-w-5xl mx-auto">
        {!searchTerm && (
            <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {COLLECTIONS.map(col => (
                        <motion.div 
                            key={col.id}
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => { touch('heavy'); setSelectedCollection(col); }}
                            className={`h-32 bg-gradient-to-br ${col.gradient} p-4 rounded-[24px] shadow-sm relative overflow-hidden group cursor-pointer flex flex-col justify-between`}
                        >
                            <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm text-white shadow-inner">
                                <col.icon size={16} />
                            </div>
                            <div>
                                <h4 className="font-black text-white text-sm leading-tight">{col.title}</h4>
                                <p className="text-[9px] text-white/80 font-bold mt-0.5">{col.subtitle}</p>
                            </div>
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-colors" />
                        </motion.div>
                    ))}
                </div>
            </div>
        )}

        <div className="sticky top-[140px] z-10 bg-[#F8F9FE] py-2 -mx-4 px-4 overflow-x-auto scrollbar-hide flex gap-2">
            {CATEGORIES.map(cat => (
                <button 
                    key={cat}
                    onClick={() => { touch('light'); setActiveCat(cat); }}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black transition-all border ${activeCat === cat ? 'bg-[#6158ca] text-white border-[#6158ca] shadow-md shadow-indigo-200 transform scale-105' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                >
                    {cat}
                </button>
            ))}
        </div>

        <div>
            <div className="flex justify-between items-end px-1 mb-4">
                <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
                    Achadinhos Gatedo <Sparkles size={16} className="text-yellow-400 fill-current"/>
                </h3>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1,2,3,4,5,6,7,8].map(i => (
                        <div key={i} className="bg-white p-3 h-64 rounded-[24px] animate-pulse">
                            <div className="h-32 bg-gray-100 rounded-[18px] mb-4"/>
                            <div className="h-3 bg-gray-100 rounded w-3/4 mb-2"/>
                            <div className="h-3 bg-gray-100 rounded w-1/2"/>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {filteredProducts.map(prod => (
                        <motion.div 
                            layoutId={`card-${prod.id}`}
                            key={prod.id} 
                            onClick={() => handleProductClick(prod)}
                            className="bg-white p-3 rounded-[24px] shadow-sm border border-gray-50 flex flex-col gap-2 group relative overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                        >
                            <div className={`absolute top-3 left-3 ${PARTNER_STYLES[prod.partner]?.color} text-[8px] font-bold px-2 py-1 rounded-full z-10 shadow-sm uppercase tracking-wide`}>
                                {prod.partner}
                            </div>
                            {prod.badge && <div className="absolute top-3 right-3 bg-yellow-400 text-[#6158ca] text-[8px] font-black px-2 py-1 rounded-full z-10 shadow-sm flex items-center gap-1"><Star size={8} fill="currentColor"/> {prod.badge}</div>}

                            <div className="h-32 bg-gray-100 rounded-[18px] overflow-hidden relative">
                                <img src={prod.images[0]} className="w-full h-full object-cover mix-blend-multiply opacity-95 group-hover:scale-110 transition-transform duration-700" alt={prod.name}/>
                            </div>

                            <div className="pt-1 px-1">
                                <h3 className="font-black text-gray-800 text-xs leading-tight line-clamp-2 h-8">{prod.name}</h3>
                                <p className="text-lg font-black text-[#6158ca] mt-1">{prod.price}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>

        <div className="mt-8 bg-gradient-to-r from-[#6158ca] to-[#7c73e6] rounded-[24px] p-6 text-white relative overflow-hidden shadow-lg shadow-indigo-200">
            <div className="relative z-10">
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-md mb-2 inline-block">PARCEIROS</span>
                <h3 className="font-black text-lg mb-1">Descontos Exclusivos</h3>
                <p className="text-xs text-purple-100 mb-4 max-w-[200px]">Assinantes Founder ganham até 15% OFF nas marcas parceiras.</p>
                <button className="bg-[#ebfc66] text-[#6158ca] px-5 py-2.5 rounded-xl text-xs font-black hover:brightness-110 shadow-lg shadow-yellow-100/50">
                    Ver Meus Cupons
                </button>
            </div>
            <Award size={120} className="absolute -right-6 -bottom-6 text-white opacity-10 rotate-12" />
        </div>
      </div>

      <AnimatePresence>
        {pointsAnim && (
            <motion.div 
                initial={{ opacity: 0, y: 0, scale: 0.5 }} animate={{ opacity: 1, y: -50, scale: 1.5 }} exit={{ opacity: 0 }}
                className="fixed z-[100] pointer-events-none text-yellow-400 font-black text-2xl flex items-center gap-1 drop-shadow-md"
                style={{ left: pointsAnim.x, top: pointsAnim.y }}
            >
                +5 PTS <Sparkles size={24} fill="currentColor" />
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProduct(null)} className="absolute inset-0 bg-black/40 backdrop-blur-md"/>
                <motion.div layoutId={`card-${selectedProduct.id}`} className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden relative z-10 flex flex-col md:flex-row">
                    <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-20 bg-gray-100/50 p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"><X size={20} /></button>
                    
                    <div className="w-full md:w-1/2 bg-gray-50 p-6 flex flex-col justify-center relative">
                        <div className="aspect-square relative rounded-2xl overflow-hidden mb-4">
                            <motion.img key={activeImgIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={selectedProduct.images[activeImgIndex]} className="w-full h-full object-contain mix-blend-multiply"/>
                        </div>
                        <div className="flex justify-center gap-2">
                            {selectedProduct.images.map((_, idx) => (
                                <button key={idx} onClick={() => setActiveImgIndex(idx)} className={`w-2 h-2 rounded-full transition-all ${activeImgIndex === idx ? 'bg-[#6158ca] w-6' : 'bg-gray-300'}`}/>
                            ))}
                        </div>
                    </div>

                    <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto">
                        <div className="mb-auto">
                            <div className="flex gap-2 mb-3">
                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${PARTNER_STYLES[selectedProduct.partner]?.color}`}>{selectedProduct.partner}</span>
                            </div>
                            <h2 className="text-2xl font-black text-gray-800 leading-tight mb-2">{selectedProduct.name}</h2>
                            <h3 className="text-3xl font-black text-[#6158ca] mb-4">{selectedProduct.price}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed mb-4">{selectedProduct.description || "Produto selecionado pela curadoria Gatedo."}</p>
                            
                            {selectedProduct.videoReview && (
                                <div className="aspect-video rounded-2xl overflow-hidden bg-black mb-4 shadow-xl">
                                    <iframe width="100%" height="100%" src={selectedProduct.videoReview} frameBorder="0" allowFullScreen title="Review"/>
                                </div>
                            )}
                        </div>
                        <div className="mt-8 flex flex-col gap-3">
                            <button onClick={(e) => handleShare(e, selectedProduct)} className="w-full bg-gray-100 text-gray-600 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-green-50 hover:text-green-600 transition-all active:scale-95">
                                <Share2 size={18} /> COMPARTILHAR (+5 PTS)
                            </button>
                            <a href={selectedProduct.link} target="_blank" rel="noreferrer" className="w-full bg-[#6158ca] text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:brightness-110 active:scale-95 transition-all">
                                VER NA LOJA <ExternalLink size={18} />
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
          {selectedCollection && (
              <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCollection(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"/>
                  <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full max-w-2xl h-[80vh] md:h-auto md:max-h-[80vh] rounded-t-[40px] md:rounded-[40px] p-6 pointer-events-auto relative z-10 flex flex-col">
                      <div className={`-mx-6 -mt-6 p-8 pb-12 bg-gradient-to-br ${selectedCollection.gradient} text-white rounded-t-[40px] relative overflow-hidden shrink-0`}>
                          <button onClick={() => setSelectedCollection(null)} className="absolute top-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/40"><X size={20}/></button>
                          <div className="relative z-10 flex items-center gap-4">
                            <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm"><selectedCollection.icon size={24}/></div>
                            <div><h2 className="text-3xl font-black">{selectedCollection.title}</h2><p className="opacity-90 font-medium">{selectedCollection.subtitle}</p></div>
                          </div>
                      </div>
                      <div className="flex-1 overflow-y-auto py-6 space-y-4 -mt-6 relative z-20">
                          <h3 className="font-black text-gray-800 text-sm px-2 mb-2">Itens inclusos neste Kit:</h3>
                          {products.filter(p => selectedCollection.items.includes(p.id)).map(prod => (
                                <div key={prod.id} onClick={() => { setSelectedProduct(prod); }} className="bg-white border border-gray-100 p-3 rounded-2xl flex gap-4 hover:shadow-md cursor-pointer transition-all items-center">
                                    <img src={prod.images[0]} className="w-16 h-16 rounded-xl object-cover bg-gray-50 mix-blend-multiply" alt={prod.name}/>
                                    <div className="flex-1"><h4 className="font-bold text-gray-800 text-sm line-clamp-1">{prod.name}</h4><p className="text-[#6158ca] font-black text-sm">{prod.price}</p></div>
                                    <div className="bg-gray-50 p-2 rounded-full text-gray-400"><ChevronRight size={16}/></div>
                                </div>
                          ))}
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
}