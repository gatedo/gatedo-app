import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Lock, Phone, ArrowRight, CheckCircle, 
  Star, Heart, Play, Pause, Shield, Zap, X 
} from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

// --- COMPONENTE DE ONBOARDING (MANIFESTO) ---
const OnboardingPopup = ({ name, type, onClose }) => {
  const [step, setStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio('/assets/sounds/manifesto.mp3'));

  const toggleAudio = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Browser bloqueou autoplay — silencioso, botão fica disponível
          setIsPlaying(false);
        });
    }
  };

  useEffect(() => {
    return () => audioRef.current.pause();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#6158ca] backdrop-blur-md"
    >
      <motion.div 
        initial={{ y: 50, scale: 0.9, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 50, scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl relative min-h-[520px] flex flex-col"
      >
        {/* Barra de progresso sutil no topo */}
        <div className="flex gap-1.5 px-8 pt-8">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-[#6158ca]' : 'bg-gray-100'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="s1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
              className="p-8 pt-6 flex-1 flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 bg-[#ebfc66] rounded-full flex items-center justify-center shadow-xl border-4 border-white mb-6 shrink-0 relative z-10">
                <img src="/assets/icone-login.png" className="w-14 h-14 object-contain" alt="Logo" />
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-2 italic tracking-tight">Fala, {name || 'Fundador'}! 🐾</h2>
              <p className="text-gray-500 text-sm font-medium leading-relaxed mb-6">
                {type === 'founder' 
                  ? 'Você acaba de entrar para o grupo que está definindo o futuro do cuidado felino.' 
                  : 'Você foi convidado para testar o Gatedo antes de todo mundo.'}
              </p>
              
              <button 
                onClick={toggleAudio}
                className={`w-full py-4 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all duration-300 ${
                  isPlaying ? 'bg-[#6158ca] border-[#6158ca] text-white shadow-lg shadow-[#6158ca]/30' : 'bg-gray-50 border-gray-100 text-[#6158ca]'
                }`}
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
                <span className="text-[10px] font-black uppercase tracking-[2px]">
                  {isPlaying ? 'Ouvindo Manifesto...' : 'Ouvir Propósito'}
                </span>
              </button>

              <button 
                onClick={() => setStep(2)}
                className="w-full bg-[#6158ca] text-white py-5 rounded-2xl font-black mt-auto shadow-xl shadow-[#6158ca]/20 flex items-center justify-center gap-2 group transition-transform active:scale-95"
              >
                CONTINUAR <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="s2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
              className="p-8 pt-6 flex-1 flex flex-col"
            >
              <h2 className="text-xl font-black text-gray-800 mb-6 italic text-center">Seu Selo {type === 'founder' ? 'Fundador' : 'VIP'}:</h2>
              <div className="space-y-4 mb-auto">
                {[
                  { icon: Star, t: "Badge Vitalícia", d: "Exibida com orgulho no seu perfil." },
                  { icon: Zap, t: "IA Premium", d: "Consultas ilimitadas no iGent Vet." },
                  { icon: Shield, t: "Acesso Early", d: "Teste novas funções antes de todos." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-[24px] border border-gray-100 items-center">
                    <div className="bg-white p-2.5 rounded-xl text-[#6158ca] shadow-sm flex-shrink-0"><item.icon size={20} /></div>
                    <div>
                      <p className="text-[11px] font-black text-gray-800 uppercase tracking-tight">{item.t}</p>
                      <p className="text-[10px] text-gray-400 font-bold leading-tight">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setStep(3)}
                className="w-full bg-[#6158ca] text-white py-5 rounded-2xl font-black mt-8 transition-transform active:scale-95"
              >
                PRÓXIMO PASSO
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="s3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              className="p-8 pt-6 flex-1 flex flex-col items-center justify-center text-center"
            >
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-3 italic">Tudo Pronto!</h2>
              <p className="text-gray-500 text-sm font-medium mb-10 leading-relaxed px-4">
                Agora finalize seu cadastro para resgatar seus prêmios e bônus de pontos iniciais.
              </p>
              <button 
                onClick={onClose}
                className="w-full bg-[#6158ca] text-white py-5 rounded-2xl font-black uppercase tracking-[2px] shadow-2xl shadow-[#6158ca]/40 active:scale-95 transition-transform"
              >
                VAMOS COMEÇAR!
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

// --- PÁGINA DE REGISTRO PRINCIPAL ---
export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useContext(AuthContext);

  const query = new URLSearchParams(location.search);
  const origin = query.get('type') || 'free'; 
  const vipName = query.get('name'); 

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    name: vipName || '', 
    email: '', 
    phone: '', 
    password: '', 
    confirmPassword: '' 
  });

  useEffect(() => {
    if (origin === 'vip' || origin === 'founder') {
      setShowOnboarding(true);
    }
  }, [origin]);

  async function handleRegister(e) {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert("As senhas não conferem!");
      return;
    }

    setLoading(true);
    try {
      // Envia os dados completos para o backend (que agora usa xp e emailVerified via bypass)
      await api.post('/auth/register', { 
        ...formData, 
        origin: origin 
      });

      // Tenta fazer o login automático
      if (signIn) {
        await signIn(formData.email, formData.password);
      }
      
      // Navegação baseada no tipo
      navigate(origin === 'founder' ? '/welcome-founder' : '/home');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#9D8FFF] via-[#7865da] to-[#5e42c0] relative overflow-hidden flex items-center justify-center p-4 font-sans">
      
      {/* LOGO ESTOURADO NO FUNDO (Restaurado) */}
      <img 
        src="/assets/logo-fundo1.svg" 
        alt="Decor" 
        className="absolute bottom-[-15%] left-[-35%] w-[140%] max-w-none opacity-100 pointer-events-none z-0 rotate-12" 
      />

      {/* POPUP DE ONBOARDING COM FRAMER MOTION */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingPopup 
            name={vipName} 
            type={origin} 
            onClose={() => setShowOnboarding(false)} 
          />
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-[#f4f3ffef] backdrop-blur-md w-full max-w-sm rounded-[40px] shadow-2xl relative pt-16 pb-10 px-8 mt-12 z-10"
      >
        {/* Ícone Superior Blindado (Amarelo Neon) */}
        <div className="absolute -top-14 left-1/2 -translate-x-1/2">
            <div className="w-28 h-28 bg-[#ebfc66] rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                <img src="/assets/icone-login.png" alt="Gatedo" className="w-20 h-20 object-contain" />
            </div>
        </div>

        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Crie sua conta</h1>
            {origin === 'founder' ? (
                <div className="mt-2 flex items-center justify-center gap-1.5 py-1 px-3 bg-amber-50 rounded-full w-fit mx-auto border border-amber-100">
                  <Star size={12} className="text-amber-500 fill-current" />
                  <span className="text-[9px] font-bold text-amber-600 uppercase tracking-[2px]">Acesso Fundador</span>
                </div>
            ) : (
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[2px] mt-1">
                  {origin === 'vip' ? 'Acesso VIP Exclusivo' : 'Comece sua jornada'}
                </p>
            )}
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-3">
              {[
                { id: 'name', icon: User, placeholder: 'Seu Nome Completo', type: 'text' },
                { id: 'email', icon: Mail, placeholder: 'Seu melhor e-mail', type: 'email' },
                { id: 'phone', icon: Phone, placeholder: 'Seu WhatsApp', type: 'tel' },
                { id: 'password', icon: Lock, placeholder: 'Crie uma senha forte', type: 'password' },
                { id: 'confirmPassword', icon: CheckCircle, placeholder: 'Confirme sua senha', type: 'password' },
              ].map((field) => (
                <div key={field.id} className="group bg-white rounded-2xl px-5 py-4 border border-gray-100 focus-within:border-[#6158ca] focus-within:bg-white flex items-center gap-4 transition-all duration-300">
                    <field.icon size={18} className="text-gray-300 group-focus-within:text-[#6158ca] transition-colors" />
                    <input 
                        type={field.type}
                        placeholder={field.placeholder}
                        className="bg-white w-full outline-none text-sm font-bold text-gray-700 placeholder:font-normal placeholder:text-gray-300"
                        value={formData[field.id]}
                        onChange={e => setFormData({...formData, [field.id]: e.target.value})}
                        required
                    />
                </div>
              ))}
            </div>

            <motion.button 
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-br from-[#9D8FFF] via-[#7865da] to-[#5e42c0]  text-white h-12 rounded-xl font-black shadow-lg shadow-[#6158ca]/30 flex items-center justify-center gap-2 uppercase text-sm tracking-wide disabled:opacity-70"
            >
                {loading ? "Processando..." : <>Finalizar Cadastro <ArrowRight size={18} /></>}
            </motion.button>
        </form>

        <div className="text-center mt-8">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Já faz parte? <button onClick={() => navigate('/login')} className="text-[#7865da] hover:underline font-bold">FAZER LOGIN</button>
            </p>
        </div>
      </motion.div>
    </div>
  );
}