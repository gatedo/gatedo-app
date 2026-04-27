import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, ChevronRight, BookOpen, 
  Utensils, Brain, Home, Activity, Scissors, 
  Sparkles, Heart, Cat, Dna, FileText, X,
  Syringe, Shield, User, Share2, MessageCircle 
} from 'lucide-react';
import useSensory from '../hooks/useSensory';
import api from '../services/api'; // <--- Importante para buscar dados

// DADOS ESTÁTICOS (Base)
// Converti as strings simples em objetos para padronizar com o banco de dados
const BASE_CATEGORIES = [
  {
    id: 'nutricao',
    title: "Nutrição",
    subtitle: "Ração, sachês e petiscos",
    color: "bg-green-100 text-green-700",
    icon: Utensils,
    articles: [
        { title: "Melhores Rações do Mercado", isStatic: true },
        { title: "Alimentação Natural: Guia", isStatic: true }
    ]
  },
  {
    id: 'comportamento',
    title: "Comportamento",
    subtitle: "Entenda a mente felina",
    color: "bg-purple-100 text-purple-700",
    icon: Brain,
    articles: [
        { title: "Linguagem Corporal: O Rabo", isStatic: true }
    ]
  },
  {
    id: 'ambiente',
    title: "Ambiente", // Se no admin salvar como "Ambiente", cai aqui
    subtitle: "Gatificação e bem-estar",
    color: "bg-orange-100 text-orange-700",
    icon: Home,
    articles: [{ title: "Guia de Gatificação", isStatic: true }]
  },
  {
    id: 'saude',
    title: "Saúde",
    subtitle: "Prevenção e cuidados",
    color: "bg-red-100 text-red-700",
    icon: Activity,
    articles: [{ title: "Vacinas Obrigatórias", isStatic: true }]
  },
  {
    id: 'higiene',
    title: "Higiene",
    subtitle: "Banhos e limpeza",
    color: "bg-blue-100 text-blue-700",
    icon: Scissors,
    articles: [{ title: "Como cortar as unhas", isStatic: true }]
  },
  {
    id: 'curiosidades',
    title: "Curiosidades",
    subtitle: "Mitos e lendas",
    color: "bg-yellow-100 text-yellow-700",
    icon: Sparkles,
    articles: [{ title: "Por que gatos caem em pé?", isStatic: true }]
  },
];

export default function Wiki() {
  const navigate = useNavigate();
  const touch = useSensory();
  
  // ESTADOS
  const [categories, setCategories] = useState(BASE_CATEGORIES);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [readingArticle, setReadingArticle] = useState(null); // <--- Artigo sendo lido

  const isSearching = search.length > 0;

  // 1. BUSCAR ARTIGOS DO BACKEND
  useEffect(() => {
    async function fetchArticles() {
      try {
        const response = await api.get('/articles');
        const dbArticles = response.data;

        // Mescla os artigos do banco nas categorias estáticas
        const updatedCategories = BASE_CATEGORIES.map(cat => {
            // Filtra artigos que pertencem a essa categoria
            // (Compara o nome da categoria, ex: "Saúde" === "Saúde")
            const matchArticles = dbArticles.filter(a => a.category === cat.title);
            
            return {
                ...cat,
                // Coloca os artigos do banco PRIMEIRO (destaque), depois os estáticos
                articles: [...matchArticles, ...cat.articles]
            };
        });

        setCategories(updatedCategories);

      } catch (error) {
        console.error("Erro ao carregar Wiki:", error);
      }
    }
    fetchArticles();
  }, []);

  // --- NAVEGAÇÃO ---
  const openCategory = (cat) => { touch(); setSelectedCategory(cat); };
  const closeCategory = () => { touch(); setSelectedCategory(null); };
  
  const openArticle = (article) => {
      touch();
      if (article.isStatic) {
          alert("Este é um artigo demonstrativo do App.");
      } else {
          setReadingArticle(article);
      }
  };

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] pb-32 pt-6 px-5 font-sans relative">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6 sticky top-0 bg-[var(--gatedo-light-bg)] z-20 py-2">
        <button onClick={() => { 
            if(readingArticle) setReadingArticle(null);
            else if(selectedCategory) closeCategory();
            else { touch(); navigate(-1); }
        }} className="bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-sm text-gray-600 border border-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
            <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
                {readingArticle ? 'Lendo Artigo' : <>Gatedo <span className="text-[#8B4AFF]">Pédia</span> <BookOpen size={20} className="text-[#8B4AFF]"/></>}
            </h1>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
       {/* --- TELA 1: LEITOR DE ARTIGO --- */}
{readingArticle ? (
    <motion.div 
        key="reader"
        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
        className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-gray-100 min-h-[80vh] relative"
    >
        {/* Imagem de Capa */}
        <div className="h-64 w-full relative">
            <img 
                src={readingArticle.imageUrl || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba"} 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <span className="absolute bottom-4 left-6 bg-[#8B4AFF] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                {readingArticle.category}
            </span>
        </div>

        {/* Conteúdo */}
        <div className="p-8">
            <div className="flex justify-between items-start gap-4 mb-4">
                <h1 className="text-2xl font-black text-gray-800 leading-tight">
                    {readingArticle.title}
                </h1>
                
                {/* BOTÕES DE COMPARTILHAMENTO */}
                <div className="flex gap-2 shrink-0">
                    <button 
                        onClick={() => {
                            const text = `Olha esse artigo do Gatedo: ${readingArticle.title}`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors"
                    >
                        <MessageCircle size={20} />
                    </button>
                    <button 
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: readingArticle.title,
                                    text: `Leia no Gatedo: ${readingArticle.title}`,
                                    url: window.location.href
                                }).catch(console.error);
                            } else {
                                alert("Link copiado para a área de transferência!");
                                // Aqui você pode implementar copiar para clipboard
                            }
                        }}
                        className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                        <Share2 size={20} />
                    </button>
                </div>
            </div>
            
            <div className="flex items-center gap-3 mb-8 pb-8 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <User size={20} />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Escrito por</p>
                    <p className="text-sm font-bold text-[#8B4AFF]">{readingArticle.author || "Equipe Gatedo"}</p>
                </div>
                <div className="ml-auto text-xs font-bold text-gray-400">
                    {new Date(readingArticle.createdAt).toLocaleDateString()}
                </div>
            </div>

            <div className="prose prose-purple max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
                {readingArticle.content}
            </div>
        </div>
    </motion.div>
        )

        /* --- TELA 2: BUSCA ATIVA --- */
        : isSearching ? (
             <div className="space-y-3">
                 {/* Barra de Busca Fixa */}
                <SearchBar search={search} setSearch={setSearch} />
                
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-400 uppercase">Resultados</h3>
                    {categories.map(cat => {
                        const matches = cat.articles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));
                        if (matches.length === 0) return null;
                        return matches.map((article, idx) => (
                            <button key={`${cat.id}-${idx}`} onClick={() => openArticle(article)} className="w-full bg-white p-4 rounded-[16px] border border-gray-100 flex items-center gap-3 text-left">
                                <div className={`p-2 rounded-full ${cat.color} bg-opacity-20`}><FileText size={16} /></div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm">{article.title}</h4>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">{cat.title}</span>
                                </div>
                            </button>
                        ));
                    })}
                </motion.div>
             </div>
        ) 
        
        /* --- TELA 3: CATEGORIA ABERTA --- */
        : selectedCategory ? (
            <motion.div
                key="category-view"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            >
                <div className={`p-6 rounded-[32px] mb-6 ${selectedCategory.color.replace('text-', 'bg-').replace('100', '50')} border border-white/50 relative overflow-hidden`}>
                    <div className={`w-14 h-14 rounded-[20px] ${selectedCategory.color} flex items-center justify-center mb-4 shadow-sm`}>
                        <selectedCategory.icon size={28} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 mb-1">{selectedCategory.title}</h2>
                    <p className="text-sm font-medium opacity-70">{selectedCategory.subtitle}</p>
                    <selectedCategory.icon className="absolute -right-4 -bottom-4 opacity-10 w-32 h-32" />
                </div>

                <div className="space-y-3">
                    {selectedCategory.articles.map((article, idx) => (
                        <motion.button
                            key={idx}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                            className="w-full bg-white p-4 rounded-[20px] border border-gray-100 flex items-center justify-between group hover:border-[#8B4AFF]/30 transition-all shadow-sm"
                            onClick={() => openArticle(article)}
                        >
                            <div className="text-left">
                                <span className="font-bold text-gray-700 text-sm block">{article.title}</span>
                                {/* Badge Novo para artigos do Banco */}
                                {!article.isStatic && <span className="text-[9px] bg-[#8B4AFF] text-white px-1.5 py-0.5 rounded uppercase font-bold">Novo</span>}
                            </div>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-[#8B4AFF]" />
                        </motion.button>
                    ))}
                    {selectedCategory.articles.length === 0 && (
                        <p className="text-center text-gray-400 text-sm py-4">Nenhum artigo ainda.</p>
                    )}
                </div>
            </motion.div>
        ) 

        /* --- TELA 4: HOME (GRID) --- */
        : (
            <motion.div key="home-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
                
                {/* Busca na Home */}
                <SearchBar search={search} setSearch={setSearch} />

                {/* Hero Cards */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <HeroCard 
                        title="Almanaque" subtitle="Descubra raças." icon={Dna} colorFrom="#8B4AFF" colorTo="#8a84e2" 
                        onClick={() => { touch(); navigate('/wiki-breeds'); }} bgIcon={Dna} 
                    />
                    <HeroCard 
                        title="Gatos SRD" subtitle="Especiais e únicos." icon={Cat} colorFrom="#FF9F43" colorTo="#ffb673" 
                        onClick={() => { touch(); navigate('/wiki-srd'); }} bgIcon={Heart} 
                    />
                </div>

                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { touch(); navigate('/wiki-vaccines'); }} 
                    className="w-full bg-[#E0F8E8] border border-green-200 p-4 rounded-[24px] mb-8 flex items-center justify-between relative overflow-hidden group shadow-sm"
                >
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-green-600 shadow-sm"><Syringe size={24} /></div>
                        <div className="text-left"><h3 className="font-black text-gray-800 text-sm uppercase tracking-wide">Protocolo de Vacinação</h3><p className="text-xs text-green-700 font-medium">Quando e quais vacinas dar?</p></div>
                    </div>
                    <div className="bg-white/50 p-2 rounded-full"><ChevronRight size={20} className="text-green-600"/></div>
                    <div className="absolute -right-6 -bottom-8 opacity-10"><Shield size={100} className="text-green-600"/></div>
                </motion.button>

                <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2"><BookOpen size={20} className="text-[#8B4AFF]" /> Biblioteca</h3>

                <div className="grid grid-cols-2 gap-3">
                    {categories.map((cat, idx) => (
                        <motion.button
                            key={cat.id}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => openCategory(cat)}
                            className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex flex-col items-center text-center gap-3 hover:shadow-md transition-shadow group"
                        >
                            <div className={`w-12 h-12 rounded-[18px] ${cat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <cat.icon size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-sm text-gray-800">{cat.title}</h4>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">{cat.articles.length} Artigos</span>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---
function SearchBar({ search, setSearch }) {
    const isSearching = search.length > 0;
    return (
        <div className="bg-white p-3 rounded-[20px] shadow-sm flex items-center gap-3 mb-6 border border-gray-100 sticky top-20 z-20">
            <Search size={20} className="text-gray-300" />
            <input 
                type="text" placeholder="O que você quer aprender?" 
                className="flex-1 outline-none text-sm font-bold text-gray-700 placeholder-gray-300 bg-transparent"
                value={search} onChange={(e) => setSearch(e.target.value)}
            />
            {isSearching && <button onClick={() => setSearch('')}><X size={16} className="text-gray-400" /></button>}
        </div>
    )
}

function HeroCard({ title, subtitle, icon: Icon, colorFrom, colorTo, onClick, bgIcon: BgIcon }) {
    return (
        <motion.button 
            whileTap={{ scale: 0.96 }} onClick={onClick} 
            className="col-span-1 p-4 rounded-[24px] text-white relative overflow-hidden h-40 flex flex-col justify-between shadow-lg"
            style={{ background: `linear-gradient(to bottom right, ${colorFrom}, ${colorTo})` }}
        >
            <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"><Icon size={20} /></div>
            <div className="relative z-10 text-left"><h3 className="font-black text-lg leading-tight">{title}</h3><p className="text-[10px] opacity-80 mt-1">{subtitle}</p></div>
            <BgIcon size={80} className="absolute -right-4 -bottom-4 opacity-20 rotate-[-12deg]" />
        </motion.button>
    )
}
