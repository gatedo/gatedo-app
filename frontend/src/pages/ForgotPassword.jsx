import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../services/api';

export default function ForgotPassword() {
  const navigate  = useNavigate();
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email) { setError('Preencha seu e-mail.'); return; }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#936cff] via-[#8b4dff] to-[#682adb] relative overflow-hidden flex items-center justify-center p-4">

      {/* Fundo decorativo */}
      <img
        src="/assets/logo-fundo1.svg"
        alt=""
        className="absolute bottom-[-20%] left-[-40%] w-[150%] max-w-none pointer-events-none z-0 opacity-100"
      />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-[#f4f3ffef] backdrop-blur-sm w-full max-w-sm rounded-[50px] shadow-2xl relative pt-16 pb-8 px-6 mt-10 z-10"
      >
        {/* Ícone flutuante */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 bg-[#f8f4ff83] rounded-full flex items-center justify-center shadow-lg ">
            <img src="/assets/Gatedo_logo.webp" alt="" className="w-32 h-32 object-contain" />
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── ESTADO: ENVIADO ─────────────────────────────────────── */}
          {sent ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h2 className="text-xl font-black text-gray-800 mb-2">Email enviado!</h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">
                Se <strong>{email}</strong> estiver cadastrado, você receberá as instruções
                em breve. Verifique também sua caixa de spam.
              </p>
              <p className="text-xs text-gray-400 mb-5">
                ⏱ O link expira em <strong>1 hora</strong>.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-br from-[#9D8FFF] via-[#7865da] to-[#5e42c0]
                           text-white h-12 rounded-xl font-black shadow-lg flex items-center
                           justify-center gap-2 text-sm uppercase tracking-wide"
              >
                <ArrowLeft size={16} /> Voltar para o Login
              </button>
            </motion.div>

          ) : (
            /* ── ESTADO: FORMULÁRIO ──────────────────────────────────── */
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-center mb-6">
                <img src="/assets/logo_gatedo_full.webp" alt="Gatedo" className="h-8 mx-auto mb-2" />
                <h1 className="text-lg font-black text-gray-800 mb-1">Esqueceu a senha?</h1>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  Enviaremos um link para redefinir
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-white rounded-xl px-4 py-3 border border-gray-100
                                focus-within:border-[#8B4AFF] transition-colors flex items-center gap-3">
                  <Mail size={18} className="text-gray-400" />
                  <input
                    type="email"
                    placeholder="Seu e-mail cadastrado"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="bg-transparent w-full outline-none text-sm font-bold
                               text-gray-700 placeholder:font-normal"
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded-lg">
                    {error}
                  </p>
                )}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-br from-[#936cff] via-[#8b4dff] to-[#682adb]
                             text-white h-12 rounded-full font-black shadow-lg flex items-center
                             justify-center gap-2 uppercase text-sm tracking-wide disabled:opacity-70"
                >
                  {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                </motion.button>
              </form>

              <div className="text-center mt-5">
                <button
                  onClick={() => navigate('/login')}
                  className="text-xs text-gray-400 hover:text-[#8B4AFF] flex items-center
                             gap-1.5 mx-auto transition-colors font-bold"
                >
                  <ArrowLeft size={13} /> Voltar para o Login
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}