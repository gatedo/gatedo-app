import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Plus, Palette, BookOpen, GraduationCap, 
  ShoppingBag, ChevronUp, X, LayoutDashboard, Users, 
  PawPrint, FileText, DollarSign, Eye, Handshake, Store 
} from 'lucide-react';
import Header from '../components/Header';
import QuickActions from '../components/QuickActions';
import CatCard from '../components/CatCard'; 
import useSensory from '../hooks/useSensory';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const IMG_PEDIA = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=500&q=80";
const IMG_STUDIO = "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=500&q=80";

export default function Home() {
  const navigate = useNavigate();
  const touch = useSensory();
  const { user } = useContext(AuthContext);
  
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // VERIFICAÇÃO DE ADMIN (Ajuste para o seu e-mail)
  const isAdmin = user?.email === 'diegobocktavares@gmail.com' || user?.role === 'ADMIN';

  useEffect(() => {
    async function fetchCats() {
      try {
        setLoading(true);
        const response = await api.get('/pets');
        const sorted = response.data.sort((a, b) => {
          const aMemo = a.isMemorial || a.isArchived ? 1 : 0;
          const bMemo = b.isMemorial || b.isArchived ? 1 : 0;
          if (aMemo !== bMemo) return aMemo - bMemo;
          const aUrgente = a.healthRecords?.some(r => r.type === 'MEDICINE') ? 0 : 1;
          const bUrgente = b.healthRecords?.some(r => r.type === 'MEDICINE') ? 0 : 1;
          if (aUrgente !== bUrgente) return aUrgente - bUrgente;
          return 0;
        });
        setCats(sorted);
      } catch (error) {
        console.error("Erro ao carregar gatos:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCats();
  }, []);

  const handleCatClick = (pet) => {
    touch();
    navigate(`/cat/${pet.id}`); 
  };

  const springAnim = { type: "spring", stiffness: 300, damping: 20 };

  // ROTAS DO PRINT
  const adminRoutes = [
    { label: 'Geral', icon: LayoutDashboard, path: '/admin' },
    { label: 'Users', icon: Users, path: '/admin/users' },
    { label: 'Cats', icon: PawPrint, path: '/admin/cats' },
    { label: 'Conteúdo', icon: FileText, path: '/admin/content' },
    { label: 'Financeiro', icon: DollarSign, path: '/admin/financial' },
    { label: 'Overview', icon: Eye, path: '/admin/overview' },
    { label: 'Partners', icon: Handshake, path: '/admin/partners' },
    { label: 'Loja', icon: Store, path: '/admin/store' },
  ];

return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32 bg-[#F8F9FE] min-h-screen font-sans">
      <Header />
      
      <div className="px-5 space-y-8">
        {/* CARDS PRINCIPAIS */}
        <div className="grid grid-cols-2 gap-4">
            <motion.div whileHover={{ scale: 1.02 }} onClick={() => navigate('/wiki')} className="relative overflow-hidden rounded-[28px] h-48 p-5 bg-gradient-to-br from-blue-600 to-cyan-400 shadow-xl cursor-pointer">
                <img src={IMG_PEDIA} className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity grayscale" alt="Wiki" />
                <div className="relative z-20 h-full flex flex-col justify-between">
                    <div className="bg-cyan-500/20 w-12 h-12 rounded-2xl flex items-center justify-center text-white backdrop-blur-md"><BookOpen size={22} /></div>
                    <h3 className="text-white font-black text-xl leading-none">Gatedo<br/><span className="text-cyan-200">Pédia</span></h3>
                </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} onClick={() => navigate('/studio')} className="relative overflow-hidden rounded-[28px] h-48 p-5 bg-gradient-to-br from-[#6158ca] to-orange-500 shadow-xl cursor-pointer">
                <img src={IMG_STUDIO} className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity grayscale" alt="Studio" />
                <div className="relative z-20 h-full flex flex-col justify-between">
                    <div className="bg-[#ebfc66]/20 w-12 h-12 rounded-2xl flex items-center justify-center text-[#ebfc66] backdrop-blur-md"><Palette size={22} /></div>
                    <h3 className="text-white font-black text-xl leading-none">Gatedo<br/><span className="text-[#ebfc66]">Studio</span></h3>
                </div>
            </motion.div>
        </div>

        {/* SEÇÃO MEU GATEDO */}
        <section className="mt-10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase leading-none">Meus Gatos</h2>
              <p className="text-[10px] font-black text-[#6158ca] uppercase tracking-widest mt-1">Sua Família Felina</p>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => { touch(); navigate('/cats'); }}
                className="bg-[#ebfc66] text-[#6158ca] px-4 py-2.5 rounded-full flex items-center justify-center shadow-sm"
              >
                <span className="text-[10px] font-black uppercase tracking-widest">Caixinha de Gatos</span>
              </motion.button>
        
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => { touch(); navigate('/cats'); }}
                className="w-10 h-10 bg-[#6158ca] rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-100"
              >
                <Plus size={20} strokeWidth={3} />
              </motion.button>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-10 animate-pulse bg-gray-100 rounded-[28px] border-2 border-dashed border-gray-200 text-gray-300 font-black text-xs uppercase tracking-widest">
                Carregando sua família...
              </div>
            ) : (
              <>
                {cats.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-[24px] border-dashed border-2 border-gray-200">
                      <p className="text-gray-400 font-bold text-sm mb-2">Sua casa está vazia!</p>
                      <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest">Adicione seu primeiro gatinho</p>
                  </div>
                ) : (
                  cats.map((cat) => (
                    <motion.div key={cat.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} transition={springAnim}>
                        <CatCard pet={cat} onClick={() => handleCatClick(cat)} />
                    </motion.div>
                  ))
                )}
              </>
            )}
    
            <motion.button 
              whileHover={{ scale: 1.01 }} 
              whileTap={{ scale: 0.98 }} 
              transition={springAnim} 
              onClick={() => { touch(); navigate('/cat-new'); }} 
              className="w-full py-5 rounded-[28px] border-[3px] border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-300 font-bold bg-gray-50/20 hover:border-[#6158ca] hover:text-[#6158ca] hover:bg-white transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-200 border border-gray-50 group-hover:text-[#6158ca] group-hover:border-[#6158ca] transition-colors"><Plus size={20} /></div>
              <span className="text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-2">Adicionar Novo Gato</span>
            </motion.button>
          </div>
        </section>
    
        {/* BANNER LOJA */}
        <motion.div whileTap={{ scale: 0.98 }} onClick={() => { touch(); navigate('/store'); }} className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[28px] p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer active:scale-95 transition-all">
          <div className="relative z-10 flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg mb-1 flex items-center gap-2 uppercase tracking-tight">Gatedo Shop <ShoppingBag size={18} className="text-[#ebfc66]"/></h3>
                <p className="text-xs text-purple-100 max-w-[200px] font-bold opacity-80 uppercase tracking-widest">Acessórios & Mimos</p>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/20"><Sparkles size={20} className="text-[#ebfc66]" /></div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        </motion.div>
    
        <section><h3 className="text-xl font-black text-gray-800 tracking-tight mb-4 ml-1">Universo Gatedo</h3><QuickActions /></section>
        <div className="h-4" />
      </div>

      {/* 🛠️ GATILHO ADMIN MINIMALISTA */}
      {isAdmin && (
        <>
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[100] w-24 flex justify-center">
            <motion.button
              onClick={() => { touch(); setIsAdminOpen(true); }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="bg-[#ebfc66] text-[#6158ca] px-4 py-1.5 rounded-t-2xl shadow-lg border-x border-t border-white/50 flex flex-col items-center group active:scale-95"
            >
              <ChevronUp size={16} strokeWidth={4} className="group-hover:-translate-y-1 transition-transform" />
            </motion.button>
          </div>

          <AnimatePresence>
            {isAdminOpen && (
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-x-0 bottom-0 z-[200] bg-[#ebfc66] rounded-t-[40px] shadow-[0_-15px_40px_rgba(0,0,0,0.15)] p-8 max-h-[70vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-black text-[#6158ca] uppercase tracking-tighter">Gatedo Admin</h2>
                    <p className="text-[10px] font-black text-[#6158ca]/50 uppercase tracking-widest">Painel de Controle</p>
                  </div>
                  <button onClick={() => setIsAdminOpen(false)} className="p-2 bg-[#6158ca]/10 rounded-full text-[#6158ca]"><X size={20}/></button>
                </div>

                <div className="grid grid-cols-4 gap-3 pb-8">
                  {adminRoutes.map((route) => (
                    <button 
                      key={route.path}
                      onClick={() => { touch(); navigate(route.path); setIsAdminOpen(false); }}
                      className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm active:scale-95 border border-[#6158ca]/5"
                    >
                      <route.icon size={18} className="text-[#6158ca]" />
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