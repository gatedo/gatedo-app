import React, { useState } from 'react';
import {
  Copy, Share2, MessageCircle, Heart, Check,
  QrCode, X, Crown, Loader, RefreshCw,
  ExternalLink, ChevronDown, Plus, Info, Mail, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

let QRCodeLib = null;
try {
  QRCodeLib = require('react-qr-code');
} catch {
  QRCodeLib = null;
}

function QRDisplay({ value }) {
  if (QRCodeLib) {
    const QRCode = QRCodeLib.default || QRCodeLib;
    return <QRCode value={value} size={190} fgColor="#6158ca" bgColor="#ebfc66" />;
  }
  return (
    <div
      className="w-48 h-48 flex flex-col items-center justify-center gap-3 rounded-2xl"
      style={{ background: 'rgba(97,88,202,0.1)' }}
    >
      <QrCode size={40} color="#6158ca" />
      <p className="text-[9px] font-black text-[#6158ca] text-center uppercase tracking-wide px-4">
        npm install react-qr-code
      </p>
    </div>
  );
}

const PHASES = [
  { n: 1, price: 'R$47', label: 'Early Bird' },
  { n: 2, price: 'R$67', label: 'Fundador' },
  { n: 3, price: 'R$97', label: 'Final' },
];

const BASE_URL =
  typeof window !== 'undefined'
    ? `${window.location.origin}/register`
    : 'https://app.gatedo.com/register';

export default function AdminInviteModal({ open, onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('vip');
  const [phase, setPhase] = useState(1);
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHist, setShowHist] = useState(false);
  const [error, setError] = useState('');

  const isFounder = type === 'founder';

  const buildLink = (tok = token) => {
    if (!tok) return '';
    const p = new URLSearchParams({ token: tok, type });
    if (isFounder) p.set('phase', String(phase));
    return `${BASE_URL}?${p.toString()}`;
  };

  const currentLink = buildLink();

  const handleGenerate = async () => {
    setError('');

    if (isFounder && !email.trim()) {
      setError('Convite fundador manual exige e-mail.');
      return;
    }

    if (!isFounder && !name.trim() && !email.trim()) {
      setError('Preencha ao menos nome ou e-mail do convidado VIP.');
      return;
    }

    setLoading(true);
    setToken('');

    try {
      const { data } = await api.post('/admin/invite/generate', {
        type,
        name: name.trim() || undefined,
        email: email.trim().toLowerCase() || undefined,
        phase: isFounder ? phase : undefined,
        expiresInDays: isFounder ? 365 : 90,
      });

      setToken(data.token);
      setHistory(h => [
        {
          token: data.token,
          name: name.trim() || (isFounder ? `Fundador Fase ${phase}` : email.trim()),
          email: email.trim(),
          type,
          phase,
        },
        ...h.slice(0, 9),
      ]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Falha ao gerar convite.');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(''), 2200);
  };

  const getMessage = () =>
    isFounder
      ? `🌟 Seu acesso Fundador Gatedo está pronto.\n\nAtive por este link:\n${currentLink}`
      : `Fala! 👋\n\nSeu acesso VIP ao Gatedo está liberado.\n\nAtive aqui:\n${currentLink}`;

  const handleClose = () => {
    setToken('');
    setName('');
    setEmail('');
    setError('');
    setShowQR(false);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[150]"
            style={{ background: 'rgba(10,8,30,0.75)', backdropFilter: 'blur(8px)' }}
          />

          <div className="fixed inset-0 z-[151] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              className="bg-white shadow-2xl overflow-hidden w-full pointer-events-auto"
              style={{ maxWidth: 500, maxHeight: '90vh', borderRadius: 28 }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>

              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <div className="p-2.5 rounded-2xl" style={{ background: 'rgba(97,88,202,0.1)' }}>
                  <Share2 size={17} color="#6158ca" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-gray-800 italic">Gerador de Convites 🐾</h3>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sem token local fake</p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <X size={14} color="#6B7280" />
                </button>
              </div>

              <div className="overflow-y-auto px-6 pb-8 space-y-4 pt-5" style={{ maxHeight: 'calc(92vh - 80px)' }}>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setType('vip')}
                    className="p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all"
                    style={{
                      borderColor: type === 'vip' ? '#6158ca' : '#F3F4F6',
                      background: type === 'vip' ? 'rgba(97,88,202,0.05)' : 'white',
                    }}
                  >
                    <Heart size={18} color={type === 'vip' ? '#6158ca' : '#D1D5DB'} fill={type === 'vip' ? '#6158ca' : 'none'} />
                    <p className="text-[10px] font-black text-gray-800 uppercase">VIP</p>
                    <p className="text-[8px] text-gray-400">Manual · 90 dias</p>
                  </button>

                  <button
                    onClick={() => setType('founder')}
                    className="p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all"
                    style={{
                      borderColor: type === 'founder' ? '#f59e0b' : '#F3F4F6',
                      background: type === 'founder' ? '#FFFBEB' : 'white',
                    }}
                  >
                    <Crown size={18} color={type === 'founder' ? '#f59e0b' : '#D1D5DB'} fill={type === 'founder' ? '#f59e0b' : 'none'} />
                    <p className="text-[10px] font-black text-gray-800 uppercase">Fundador</p>
                    <p className="text-[8px] text-gray-400">Manual excepcional</p>
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <User size={16} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={isFounder ? 'Nome do comprador (opcional)' : 'Nome do convidado'}
                    className="bg-transparent w-full outline-none text-sm font-bold text-gray-700"
                  />
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <Mail size={16} className="text-gray-400 shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={isFounder ? 'E-mail do fundador (obrigatório)' : 'E-mail do convidado (opcional)'}
                    className="bg-transparent w-full outline-none text-sm font-bold text-gray-700"
                  />
                </div>

                <AnimatePresence>
                  {isFounder && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-100 mb-3">
                        <Info size={13} color="#f59e0b" className="shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                          Use fundador manual só para exceção. Venda normal continua via Kiwify + webhook.
                        </p>
                      </div>

                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Fase do lote</p>
                      <div className="grid grid-cols-3 gap-2">
                        {PHASES.map(f => (
                          <button
                            key={f.n}
                            onClick={() => setPhase(f.n)}
                            className="py-2.5 rounded-xl border-2 text-center transition-all"
                            style={{
                              borderColor: phase === f.n ? '#f59e0b' : '#F3F4F6',
                              background: phase === f.n ? '#FFFBEB' : 'white',
                            }}
                          >
                            <p className="text-[8px] font-black text-gray-400 uppercase">Fase {f.n}</p>
                            <p className="text-sm font-black text-amber-500">{f.price}</p>
                            <p className="text-[8px] text-gray-400">{f.label}</p>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-xs font-black text-red-700">{error}</p>
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #6158ca, #8B5CF6)',
                    color: 'white',
                    boxShadow: '0 6px 20px rgba(97,88,202,0.3)',
                  }}
                >
                  {loading
                    ? <><Loader size={14} className="animate-spin" /> Gerando...</>
                    : token
                      ? <><RefreshCw size={14} /> Gerar Novo</>
                      : <><Plus size={14} /> Gerar Convite</>
                  }
                </motion.button>

                <AnimatePresence>
                  {token && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-[20px] overflow-hidden"
                      style={{ background: '#0F0F1A' }}
                    >
                      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <p className="text-[9px] font-black text-green-400 uppercase tracking-widest">Token ativo</p>
                        <span className="ml-auto text-[8px] text-gray-500 font-mono truncate max-w-[120px]">{token}</span>
                      </div>

                      <p className="text-[#ebfc66] text-[9px] px-4 pb-3 break-all opacity-70 leading-relaxed font-mono">
                        {currentLink}
                      </p>

                      <div className="grid grid-cols-4 gap-1.5 px-4 pb-4">
                        {[
                          { key: 'link', icon: Copy, label: 'Copiar', action: () => copy(currentLink, 'link') },
                          { key: 'wa', icon: MessageCircle, label: 'Whats', action: () => window.open(`https://wa.me/?text=${encodeURIComponent(getMessage())}`, '_blank') },
                          { key: 'test', icon: ExternalLink, label: 'Testar', action: () => window.open(currentLink, '_blank') },
                          { key: 'qr', icon: QrCode, label: 'QR', action: () => setShowQR(true) },
                        ].map(item => (
                          <button
                            key={item.key}
                            onClick={item.action}
                            className="flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all bg-white/5"
                          >
                            <item.icon size={13} color="rgba(255,255,255,0.65)" />
                            <span className="text-[7px] font-black uppercase text-white/40">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {history.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowHist(s => !s)}
                      className="flex items-center gap-2 w-full text-[9px] font-black text-gray-400 uppercase tracking-widest py-1"
                    >
                      <span>{history.length} link(s) nesta sessão</span>
                      <ChevronDown size={10} className={`ml-auto transition-transform ${showHist ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showHist && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-2 space-y-2"
                          style={{ overflow: 'hidden' }}
                        >
                          {history.map((h, i) => (
                            <div key={i} className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-2xl border border-gray-100">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-gray-700 truncate">{h.name || h.email || 'Convite'}</p>
                                <p className="text-[8px] text-gray-400 font-mono truncate">{h.token}</p>
                              </div>
                              <button
                                onClick={() => copy(buildLink(h.token), `h${i}`)}
                                className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0"
                              >
                                {copied === `h${i}`
                                  ? <Check size={9} color="#4ade80" />
                                  : <Copy size={9} color="#9CA3AF" />
                                }
                              </button>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <AnimatePresence>
            {showQR && token && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-6"
                style={{ background: 'rgba(97,88,202,0.96)', backdropFilter: 'blur(16px)' }}
              >
                <motion.div
                  initial={{ scale: 0.88 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  className="bg-white rounded-[40px] p-8 flex flex-col items-center shadow-2xl relative max-w-xs w-full"
                >
                  <button
                    onClick={() => setShowQR(false)}
                    className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                  >
                    <X size={13} color="#6B7280" />
                  </button>

                  <div className="p-5 rounded-3xl mb-4" style={{ background: '#ebfc66' }}>
                    <QRDisplay value={currentLink} />
                  </div>

                  <p className="font-black text-gray-800 italic text-sm">
                    {isFounder ? `Fundador Fase ${phase}` : name || email || 'VIP'}
                  </p>

                  <button
                    onClick={() => copy(currentLink, 'qr')}
                    className="mt-4 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-white flex items-center gap-2"
                    style={{ background: '#6158ca' }}
                  >
                    {copied === 'qr'
                      ? <><Check size={12} /> Copiado!</>
                      : <><Copy size={12} /> Copiar Link</>
                    }
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}