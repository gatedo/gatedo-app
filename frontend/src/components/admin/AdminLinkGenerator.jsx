import React, { useState } from 'react';
import {
  Copy,
  Share2,
  MessageCircle,
  Heart,
  Check,
  QrCode,
  X,
  Crown,
  ChevronDown,
  Loader,
  RefreshCw,
  ExternalLink,
  Mail,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import api from '../../services/api';

const PHASES = [
  { n: 1, price: 'R$47', label: 'Early Bird' },
  { n: 2, price: 'R$67', label: 'Fundador' },
  { n: 3, price: 'R$97', label: 'Acesso Final' },
];

const BASE_URL =
  typeof window !== 'undefined'
    ? `${window.location.origin}/register`
    : 'https://app.gatedo.com/register';

function QRCodeDisplay({ value }) {
  return <QRCode value={value} size={180} fgColor="#8B4AFF" bgColor="#ebfc66" />;
}

const MotionButton = motion.button;
const MotionDiv = motion.div;

export default function AdminLinkGenerator() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('vip');
  const [phase, setPhase] = useState(1);
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');

  const isFounder = type === 'founder';

  const buildLink = (currentToken = token, currentType = type, currentPhase = phase) => {
    if (!currentToken) return '— gere um token primeiro —';
    const params = new URLSearchParams({ token: currentToken, type: currentType });
    if (currentType === 'founder') params.set('phase', String(currentPhase));
    return `${BASE_URL}?${params.toString()}`;
  };

  const currentLink = buildLink();

  const handleGenerate = async () => {
    setError('');
    setLoading(true);
    setToken('');

    try {
      if (isFounder && !email.trim()) {
        throw new Error('Para fundador manual, informe o e-mail.');
      }

      if (!isFounder && !name.trim() && !email.trim()) {
        throw new Error('Preencha nome ou e-mail do VIP.');
      }

      const response = await api.post('/admin/invite/generate', {
        type,
        name: name.trim() || undefined,
        email: email.trim().toLowerCase() || undefined,
        phase: isFounder ? phase : undefined,
        expiresInDays: isFounder ? 365 : 90,
      });

      const nextToken = response.data.token;

      setToken(nextToken);
      setHistory((current) => [
        {
          token: nextToken,
          name: name.trim(),
          email: email.trim(),
          type,
          phase,
          at: new Date().toISOString(),
        },
        ...current.slice(0, 9),
      ]);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Falha ao gerar link.');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    window.setTimeout(() => setCopied(''), 2200);
  };

  const getMessage = () => (
    isFounder
      ? `Ola!\n\nSeu acesso Fundador Gatedo esta liberado.\n\n${currentLink}`
      : `Fala!\n\nCriei um acesso VIP exclusivo para voce no Gatedo.\n\n${currentLink}`
  );

  const hasToken = Boolean(token);

  return (
    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm max-w-xl mx-auto mb-10 overflow-hidden">
      <div className="flex items-center gap-3 p-7 pb-5">
        <div className="p-3 rounded-2xl" style={{ background: 'rgba(97,88,202,0.1)' }}>
          <Share2 size={20} color="#8B4AFF" />
        </div>
        <div>
          <h3 className="text-lg font-black text-gray-800 italic">Gerador de Convites</h3>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Link real com QR funcional</p>
        </div>
      </div>

      <div className="px-7 pb-7 space-y-5">
        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 flex items-center gap-3">
          <User size={16} className="text-gray-400" />
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome do convidado"
            className="bg-transparent w-full outline-none font-bold text-sm text-gray-800"
          />
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 flex items-center gap-3">
          <Mail size={16} className="text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={isFounder ? 'E-mail do fundador (obrigatorio)' : 'E-mail do VIP (opcional)'}
            className="bg-transparent w-full outline-none font-bold text-sm text-gray-800"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setType('vip')}
            className="p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all"
            style={{
              borderColor: type === 'vip' ? '#8B4AFF' : '#F3F4F6',
              background: type === 'vip' ? 'rgba(97,88,202,0.05)' : 'white',
            }}
          >
            <Heart size={20} color={type === 'vip' ? '#8B4AFF' : '#D1D5DB'} fill={type === 'vip' ? '#8B4AFF' : 'none'} />
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-800 uppercase">Convite VIP</p>
              <p className="text-[9px] text-gray-400 font-medium">Gratuito · 90 dias</p>
            </div>
          </button>

          <button
            onClick={() => setType('founder')}
            className="p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all"
            style={{
              borderColor: type === 'founder' ? '#f59e0b' : '#F3F4F6',
              background: type === 'founder' ? '#FFFBEB' : 'white',
            }}
          >
            <Crown size={20} color={type === 'founder' ? '#f59e0b' : '#D1D5DB'} fill={type === 'founder' ? '#f59e0b' : 'none'} />
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-800 uppercase">Fundador</p>
              <p className="text-[9px] text-gray-400 font-medium">Manual excepcional</p>
            </div>
          </button>
        </div>

        <AnimatePresence>
          {isFounder && (
            <MotionDiv
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Fase</p>
              <div className="grid grid-cols-3 gap-2">
                {PHASES.map((item) => (
                  <button
                    key={item.n}
                    onClick={() => setPhase(item.n)}
                    className="py-3 rounded-2xl border-2 text-center transition-all"
                    style={{
                      borderColor: phase === item.n ? '#f59e0b' : '#F3F4F6',
                      background: phase === item.n ? '#FFFBEB' : 'white',
                    }}
                  >
                    <p className="text-[9px] font-black text-gray-500 uppercase">Fase {item.n}</p>
                    <p className="text-base font-black text-amber-500">{item.price}</p>
                    <p className="text-[8px] text-gray-400">{item.label}</p>
                  </button>
                ))}
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-xs font-black text-red-700">{error}</p>
          </div>
        )}

        <MotionButton
          whileTap={{ scale: 0.97 }}
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
          style={{
            background: 'linear-gradient(135deg, #8B4AFF, #8B5CF6)',
            color: 'white',
            boxShadow: '0 6px 20px rgba(97,88,202,0.35)',
          }}
        >
          {loading ? (
            <>
              <Loader size={15} className="animate-spin" /> Gerando...
            </>
          ) : hasToken ? (
            <>
              <RefreshCw size={15} /> Gerar Novo Link
            </>
          ) : (
            'Gerar Link com Token'
          )}
        </MotionButton>

        <AnimatePresence>
          {hasToken && (
            <MotionDiv
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-[22px] overflow-hidden"
              style={{ background: '#0F0F1A' }}
            >
              <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <p className="text-[9px] font-black text-green-400 uppercase tracking-widest">Token ativo</p>
                <span className="ml-auto text-[9px] text-gray-600 font-mono">{token}</span>
              </div>

              <div className="px-5 pb-4">
                <code className="text-[#ebfc66] text-[10px] block break-all leading-relaxed opacity-80">
                  {currentLink}
                </code>
              </div>

              <div className="grid grid-cols-4 gap-2 px-5 pb-5">
                <button
                  onClick={() => copy(currentLink, 'link')}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                  style={{ background: copied === 'link' ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.08)' }}
                >
                  {copied === 'link' ? <Check size={15} color="#4ade80" /> : <Copy size={15} color="rgba(255,255,255,0.7)" />}
                  <span className="text-[8px] font-black text-white/50 uppercase">
                    {copied === 'link' ? 'Copiado' : 'Copiar'}
                  </span>
                </button>

                <button
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(getMessage())}`, '_blank')}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                  style={{ background: 'rgba(37,211,102,0.2)' }}
                >
                  <MessageCircle size={15} color="#25D366" />
                  <span className="text-[8px] font-black uppercase" style={{ color: '#25D366' }}>WhatsApp</span>
                </button>

                <button
                  onClick={() => window.open(currentLink, '_blank')}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <ExternalLink size={15} color="rgba(255,255,255,0.6)" />
                  <span className="text-[8px] font-black text-white/40 uppercase">Testar</span>
                </button>

                <button
                  onClick={() => setShowQR(true)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <QrCode size={15} color="rgba(255,255,255,0.6)" />
                  <span className="text-[8px] font-black text-white/40 uppercase">QR Code</span>
                </button>
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>

        {history.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory((current) => !current)}
              className="flex items-center gap-2 w-full text-[9px] font-black text-gray-400 uppercase tracking-widest py-1"
            >
              <span>{history.length} link(s) gerado(s) nesta sessao</span>
              <ChevronDown size={11} className={`ml-auto transition-transform ${showHistory ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showHistory && (
                <MotionDiv
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 space-y-2"
                  style={{ overflow: 'hidden' }}
                >
                  {history.map((item, index) => (
                    <div key={`${item.token}-${index}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-2 h-2 rounded-full shrink-0 bg-green-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-gray-700 truncate">
                          {item.name || item.email || 'Convite'}
                        </p>
                        <p className="text-[8px] text-gray-400 font-medium uppercase">
                          {item.type === 'vip' ? 'VIP' : `Fundador F${item.phase}`} · {item.token}
                        </p>
                      </div>
                      <button
                        onClick={() => copy(buildLink(item.token, item.type, item.phase), `hist_${index}`)}
                        className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0"
                      >
                        {copied === `hist_${index}` ? <Check size={10} color="#4ade80" /> : <Copy size={10} color="#9CA3AF" />}
                      </button>
                    </div>
                  ))}
                </MotionDiv>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showQR && hasToken && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-6"
            style={{ background: 'rgba(97,88,202,0.95)', backdropFilter: 'blur(16px)' }}
          >
            <MotionDiv
              initial={{ scale: 0.88 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="bg-white rounded-[40px] p-8 flex flex-col items-center shadow-2xl relative max-w-xs w-full"
            >
              <button
                onClick={() => setShowQR(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X size={14} color="#6B7280" />
              </button>

              <div className="p-5 rounded-3xl mb-5" style={{ background: '#ebfc66' }}>
                <QRCodeDisplay value={currentLink} />
              </div>

              <p className="font-black text-gray-800 italic text-sm mb-1">
                {name || email || (isFounder ? `Fundador F${phase}` : 'VIP')}
              </p>

              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                {type === 'vip' ? 'VIP' : `Fundador · Fase ${phase}`}
              </p>

              <button
                onClick={() => copy(currentLink, 'qr')}
                className="mt-5 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-white flex items-center gap-2"
                style={{ background: '#8B4AFF' }}
              >
                {copied === 'qr' ? (
                  <>
                    <Check size={13} /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={13} /> Copiar Link
                  </>
                )}
              </button>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}
