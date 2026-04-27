import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  CheckCircle,
  Star,
  Play,
  Pause,
  Shield,
  Zap,
  Crown,
  Loader,
  AlertTriangle,
} from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const PLAN_BADGE = {
  vip: {
    icon: Crown,
    label: 'Acesso VIP Exclusivo',
    color: '#8B4AFF',
    bg: 'rgba(97,88,202,0.08)',
    border: 'rgba(97,88,202,0.2)',
  },
  founder: {
    icon: Star,
    label: 'Fundador Vitalício',
    color: '#f59e0b',
    bg: '#FFFBEB',
    border: '#FDE68A',
  },
  purchase: {
    icon: Crown,
    label: 'Compra aprovada',
    color: '#8B4AFF',
    bg: 'rgba(97,88,202,0.08)',
    border: 'rgba(97,88,202,0.2)',
  },
  free: {
    icon: null,
    label: 'Ativação por convite',
    color: '#9CA3AF',
    bg: 'transparent',
    border: 'transparent',
  },
};

const OnboardingPopup = ({ name, type, phase, onClose }) => {
  const [step, setStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const isFounder = type === 'founder';

  const toggleAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/assets/sounds/manifesto.mp3');
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  useEffect(() => {
    return () => audioRef.current?.pause();
  }, []);

  const ctaBg = isFounder
    ? 'linear-gradient(135deg,#f59e0b,#d97706)'
    : '#8B4AFF';

  const ctaShadow = isFounder
    ? '0 8px 24px rgba(245,158,11,0.3)'
    : '0 8px 24px rgba(97,88,202,0.3)';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#8B4AFF] backdrop-blur-md"
    >
      <motion.div
        initial={{ y: 50, scale: 0.9, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 50, scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl min-h-[520px] flex flex-col"
      >
        <div className="flex gap-1.5 px-8 pt-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all duration-500"
              style={{ background: step >= i ? '#8B4AFF' : '#F3F4F6' }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="p-8 pt-6 flex-1 flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 bg-[#f8f4ff83] rounded-full flex items-center justify-center shadow-lg">
                <img
                  src="/assets/App_gatedo_logo1.webp"
                  className="w-24 h-24 object-contain"
                  alt="Logo"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>

              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4 border"
                style={{
                  background: isFounder ? '#FFFBEB' : 'rgba(97,88,202,0.08)',
                  borderColor: isFounder ? '#FDE68A' : 'rgba(97,88,202,0.2)',
                }}
              >
                {isFounder ? (
                  <Star size={10} color="#f59e0b" fill="#f59e0b" />
                ) : (
                  <Crown size={10} color="#8B4AFF" fill="#8B4AFF" />
                )}
                <span
                  className="text-[9px] font-black uppercase tracking-widest"
                  style={{ color: isFounder ? '#f59e0b' : '#8B4AFF' }}
                >
                  {isFounder ? `Fundador · Fase ${phase}` : 'Acesso VIP'}
                </span>
              </div>

              <h2 className="text-2xl font-black text-gray-800 mb-2 tracking-tight">
                Oi, {name || 'Tutor'}! 🐾
              </h2>

              <p className="text-gray-500 text-sm font-medium leading-relaxed mb-6">
                {isFounder
                  ? 'Você acaba de entrar para o grupo que está ajudando a definir o futuro do cuidado felino.'
                  : 'Seu acesso especial ao Gatedo está pronto para ser ativado.'}
              </p>

              <button
                onClick={toggleAudio}
                className="w-full py-4 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all duration-300 mb-auto"
                style={{
                  background: isPlaying ? '#8B4AFF' : '#F9FAFB',
                  borderColor: isPlaying ? '#8B4AFF' : '#F3F4F6',
                  color: isPlaying ? 'white' : '#8B4AFF',
                  boxShadow: isPlaying ? '0 8px 24px rgba(97,88,202,0.3)' : 'none',
                }}
              >
                {isPlaying ? (
                  <Pause size={16} fill="currentColor" />
                ) : (
                  <Play size={16} fill="currentColor" className="ml-1" />
                )}
                <span className="text-[10px] font-black uppercase tracking-[2px]">
                  {isPlaying ? 'Ouvindo Manifesto...' : 'Ouvir Propósito'}
                </span>
              </button>

              <button
                onClick={() => setStep(2)}
                className="w-full text-white py-5 rounded-2xl font-black mt-6 flex items-center justify-center gap-2 group active:scale-95 transition-transform"
                style={{ background: ctaBg, boxShadow: ctaShadow }}
              >
                CONTINUAR{' '}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="s2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="p-8 pt-6 flex-1 flex flex-col"
            >
              <h2 className="text-xl font-black text-gray-800 mb-1 italic text-center">
                Seu Selo {isFounder ? 'Fundador' : 'VIP'}:
              </h2>

              <p
                className="text-[9px] font-black text-center uppercase tracking-widest mb-6"
                style={{ color: isFounder ? '#f59e0b' : '#8B4AFF' }}
              >
                {isFounder ? `Fase ${phase} · Vitalício` : 'Convite especial'}
              </p>

              <div className="space-y-3 mb-auto">
                {[
                  {
                    icon: isFounder ? Crown : Star,
                    t: isFounder ? 'Plano Vitalício' : 'Badge Exclusiva',
                    d: isFounder ? 'Pague uma vez, acesse para sempre.' : 'Exibida no seu perfil.',
                  },
                  { icon: Zap, t: 'IA Premium', d: 'Consultas avançadas no iGent Vet.' },
                  { icon: Shield, t: 'Acesso Early', d: 'Recursos antes do público geral.' },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.07 }}
                    className="flex gap-4 p-4 bg-gray-50 rounded-[22px] border border-gray-100 items-center"
                  >
                    <div
                      className="p-2.5 rounded-xl bg-white shadow-sm shrink-0"
                      style={{ color: isFounder ? '#f59e0b' : '#8B4AFF' }}
                    >
                      <item.icon size={18} />
                    </div>

                    <div>
                      <p className="text-[11px] font-black text-gray-800 uppercase tracking-tight">
                        {item.t}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold">{item.d}</p>
                    </div>

                    <CheckCircle size={13} color="#10B981" className="ml-auto shrink-0" />
                  </motion.div>
                ))}
              </div>

              <button
                onClick={() => setStep(3)}
                className="w-full text-white py-5 rounded-2xl font-black mt-8 active:scale-95 transition-transform"
                style={{ background: ctaBg }}
              >
                PRÓXIMO PASSO
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="s3"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="p-8 pt-6 flex-1 flex flex-col items-center justify-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                style={{ background: '#F0FDF4' }}
              >
                <CheckCircle size={40} color="#22C55E" />
              </motion.div>

              <h2 className="text-2xl font-black text-gray-800 mb-3 italic">Tudo Pronto!</h2>
              <p className="text-gray-500 text-sm font-medium mb-10 leading-relaxed px-4">
                Agora finalize seu cadastro para ativar seu acesso.
              </p>

              <button
                onClick={onClose}
                className="w-full text-white py-5 rounded-2xl font-black uppercase tracking-[2px] active:scale-95 transition-transform"
                style={{ background: ctaBg, boxShadow: ctaShadow }}
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

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useContext(AuthContext);

  const query = new URLSearchParams(location.search);
  const token = query.get('token') || '';
  const queryType = (query.get('type') || 'free').toLowerCase();
  const queryPhase = Number(query.get('phase') || 1);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [inviteError, setInviteError] = useState('');
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    let cancelled = false;

    async function validateInvite() {
      const specialQueryFlow = queryType === 'vip' || queryType === 'founder';

      if (!token && specialQueryFlow) {
        setInviteError('Link de convite incompleto. Solicite um novo link.');
        return;
      }

      if (!token) {
        setInviteError('Cadastro disponível apenas para convites válidos ou compras aprovadas.');
        return;
      }

      setValidating(true);
      setInviteError('');
      setFormError('');

      try {
        const response = await api.get('/auth/validate-token', {
          params: { token },
        });

        if (cancelled) return;

        const data = response.data;
        setInviteInfo(data);

        setFormData((prev) => ({
          ...prev,
          name: prev.name || data.name || '',
          email: data.email || prev.email || '',
        }));

        setShowOnboarding(true);
      } catch (err) {
        if (cancelled) return;
        setInviteError(
          err?.response?.data?.message ||
            'Não foi possível validar este link. Solicite um novo convite.',
        );
      } finally {
        if (!cancelled) setValidating(false);
      }
    }

    validateInvite();

    return () => {
      cancelled = true;
    };
  }, [token, queryType]);

  const actualKind =
    inviteInfo?.kind || (queryType === 'vip' || queryType === 'founder' ? queryType : 'free');

  const actualPhase = inviteInfo?.phase || queryPhase || 1;
  const isFounder = actualKind === 'founder';
  const badge = PLAN_BADGE[actualKind] || PLAN_BADGE.free;
  const emailLocked = !!inviteInfo?.email;
  const blocked = !!inviteError;

  function goToLandingPage() {
    window.location.href = 'https://gatedo.com';
  }

  async function handleRegister(e) {
    e.preventDefault();

    if (blocked) return;

    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Preencha seu nome completo.');
      return;
    }

    if (!formData.email.trim()) {
      setFormError('Preencha seu e-mail.');
      return;
    }

    if (!formData.phone.trim()) {
      setFormError('Preencha seu WhatsApp.');
      return;
    }

    if (!formData.password.trim()) {
      setFormError('Crie uma senha.');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Sua senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('As senhas não conferem.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        token: token || undefined,
        origin: actualKind,
      });

      if (signIn) {
        await signIn(formData.email, formData.password);
        await new Promise((r) => setTimeout(r, 300));
      }

      if (isFounder) {
        navigate(
          `/welcome-founder?name=${encodeURIComponent(formData.name)}&phase=${actualPhase}`,
        );
      } else {
        navigate('/home');
      }
    } catch (err) {
      setFormError(
        err?.response?.data?.message || 'Erro ao criar conta. Tente novamente.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (validating) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#936cff,#8b4dff,#682adb)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader size={28} color="white" className="animate-spin" />
          <p className="text-white text-xs font-black uppercase tracking-widest opacity-70">
            Validando convite...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 font-sans"
      style={{ background: 'linear-gradient(135deg,#936cff,#8b4dff,#682adb)' }}
    >
      <img
        src="/assets/logo-fundo1.svg"
        alt=""
        className="absolute bottom-[-15%] left-[-35%] w-[140%] max-w-none opacity-100 pointer-events-none z-0 rotate-12"
        onError={(e) => (e.currentTarget.style.display = 'none')}
      />

      <AnimatePresence>
        {showOnboarding && !blocked && (
          <OnboardingPopup
            name={formData.name}
            type={actualKind}
            phase={actualPhase}
            onClose={() => setShowOnboarding(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-sm rounded-[40px] shadow-2xl relative pt-16 pb-10 px-8 mt-12 z-10"
        style={{ background: 'rgba(244,243,255,0.94)', backdropFilter: 'blur(16px)' }}
      >
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 bg-[#f8f4ff83] rounded-full flex items-center justify-center shadow-lg">
            <img
              src="/assets/App_gatedo_logo1.webp"
              alt=""
              className="w-32 h-32 object-contain"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
        </div>

        <div className="text-center mb-7">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Crie sua conta</h1>

          {badge.icon ? (
            <div
              className="mt-2 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full w-fit mx-auto border"
              style={{ background: badge.bg, borderColor: badge.border }}
            >
              <badge.icon size={11} style={{ color: badge.color, fill: badge.color }} />
              <span
                className="text-[9px] font-black uppercase tracking-[2px]"
                style={{ color: badge.color }}
              >
                {badge.label}
                {isFounder ? ` · Fase ${actualPhase}` : ''}
              </span>
            </div>
          ) : (
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[2px] mt-1">
              Ativação por convite ou compra aprovada
            </p>
          )}
        </div>

        {blocked && (
          <div className="mb-5 rounded-[24px] border border-[#f4b0b0] bg-[#fff3f3] px-4 py-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-[#ffd6d6] shrink-0">
                <AlertTriangle size={16} className="text-[#e24a4a]" />
              </div>

              <div className="flex-1">
                <p className="text-[#d93535] text-[15px] font-black leading-tight">
                  Convite indisponível
                </p>
                <p className="text-[#c45858] text-sm mt-1 leading-relaxed">
                  {inviteError}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="h-11 rounded-[30px] border border-[#e4d8ff] bg-white text-[#7a54f7] font-extrabold text-sm"
              >
                Fazer login
              </button>

              <button
                type="button"
                onClick={goToLandingPage}
                className="h-11 rounded-[30px] bg-gradient-to-br from-[#936cff] via-[#8b4dff] to-[#682adb] text-white font-extrabold text-sm"
              >
                Ir para o site
              </button>
            </div>
          </div>
        )}

        {formError && !blocked && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-xs font-black text-red-700 uppercase tracking-wide mb-1">
              Verifique os dados
            </p>
            <p className="text-sm font-semibold text-red-600">{formError}</p>
          </div>
        )}

        <form
          onSubmit={handleRegister}
          className={`space-y-4 transition-opacity duration-300 ${
            blocked ? 'opacity-50 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="space-y-3">
            {[
              {
                id: 'name',
                icon: User,
                placeholder: 'Seu Nome Completo',
                type: 'text',
                readOnly: false,
              },
              {
                id: 'email',
                icon: Mail,
                placeholder: 'Seu melhor e-mail',
                type: 'email',
                readOnly: emailLocked,
              },
              {
                id: 'phone',
                icon: Phone,
                placeholder: 'Seu WhatsApp',
                type: 'tel',
                readOnly: false,
              },
              {
                id: 'password',
                icon: Lock,
                placeholder: 'Crie uma senha forte',
                type: 'password',
                readOnly: false,
              },
              {
                id: 'confirmPassword',
                icon: CheckCircle,
                placeholder: 'Confirme sua senha',
                type: 'password',
                readOnly: false,
              },
            ].map((field) => (
              <div
                key={field.id}
                className="group bg-white rounded-2xl px-5 py-3 border border-gray-100 focus-within:border-[#8B4AFF] flex items-center gap-4 transition-all duration-300"
              >
                <field.icon
                  size={17}
                  className="text-gray-300 group-focus-within:text-[#8B4AFF] transition-colors shrink-0"
                />
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  required
                  readOnly={field.readOnly}
                  disabled={blocked || loading}
                  className={`bg-white w-full outline-none text-sm font-bold text-gray-700 placeholder:font-normal placeholder:text-gray-300 ${
                    field.readOnly ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  value={formData[field.id]}
                  onChange={(e) =>
                    setFormData({ ...formData, [field.id]: e.target.value })
                  }
                />
              </div>
            ))}
          </div>

          {emailLocked && (
            <p className="text-[10px] text-gray-500 font-bold -mt-1 px-1">
              Este convite está vinculado ao e-mail informado na compra/convite.
            </p>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || blocked}
            className={`w-full h-12 rounded-[40px] font-bold shadow-lg flex items-center justify-center gap-2 uppercase text-sm tracking-wide transition-all ${
              loading || blocked ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            style={{
              background:
                loading || blocked
                  ? '#dbcffb'
                  : isFounder
                    ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                    : 'linear-gradient(135deg,#936cff,#8b4dff,#682adb)',
              color: loading || blocked ? '#7b6ca8' : '#fff',
              boxShadow:
                loading || blocked
                  ? 'none'
                  : isFounder
                    ? '0 8px 24px rgba(245,158,11,0.35)'
                    : '0 8px 24px rgba(97,88,202,0.35)',
            }}
          >
            {loading ? (
              <>
                <Loader size={16} className="animate-spin" />
                Processando...
              </>
            ) : (
              <>
                Finalizar Cadastro <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>

        <div className="text-center mt-7">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Já faz parte?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-[#7865da] font-bold hover:underline"
            >
              FAZER LOGIN
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
