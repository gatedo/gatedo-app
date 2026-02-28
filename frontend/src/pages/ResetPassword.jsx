import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function ResetPassword() {
  const navigate              = useNavigate();
  const [searchParams]        = useSearchParams();
  const token                 = searchParams.get('token');

  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [done,        setDone]        = useState(false);
  const [error,       setError]       = useState('');

  // Força de senha
  const strength = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8)           score++;
    if (/[A-Z]/.test(password))         score++;
    if (/[0-9]/.test(password))         score++;
    if (/[^A-Za-z0-9]/.test(password))  score++;
    return score;
  })();

  const strengthLabel = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'][strength];
  const strengthColor = ['', '#EF4444', '#F97316', '#F59E0B', '#16A34A'][strength];

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!token)            { setError('Link inválido. Solicite um novo.'); return; }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirm)  { setError('As senhas não conferem.'); return; }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Link inválido ou expirado. Solicite um novo.');
    } finally {
      setLoading(false);
    }
  }

  // Token ausente — link quebrado
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#9D8FFF] via-[#7865da] to-[#5e42c0]
                      flex items-center justify-center p-4">
        <div className="bg-white rounded-[28px] p-8 max-w-sm w-full text-center shadow-2xl">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-gray-800 mb-2">Link inválido</h2>
          <p className="text-sm text-gray-500 mb-6">
            Este link de redefinição é inválido ou já foi utilizado.
          </p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full bg-gradient-to-br from-[#9D8FFF] via-[#7865da] to-[#5e42c0]
                       text-white h-12 rounded-xl font-black text-sm uppercase tracking-wide"
          >
            Solicitar Novo Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#9D8FFF] via-[#7865da] to-[#5e42c0]
                    relative overflow-hidden flex items-center justify-center p-4">

      <img src="/assets/logo-fundo1.svg" alt=""
        className="absolute bottom-[-20%] left-[-40%] w-[150%] max-w-none pointer-events-none z-0" />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-[#f4f3ffef] backdrop-blur-sm w-full max-w-sm rounded-[35px] shadow-2xl
                   relative pt-16 pb-8 px-6 mt-10 z-10"
      >
        {/* Ícone flutuante */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 bg-[#ebfc66] rounded-full flex items-center justify-center
                          shadow-lg border-4 border-white">
            <img src="/assets/icone-login.png" alt="" className="w-16 h-16 object-contain" />
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── SUCESSO ──────────────────────────────────────────────── */}
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center
                              mx-auto mb-4 border border-green-100">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h2 className="text-xl font-black text-gray-800 mb-2">Senha redefinida!</h2>
              <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">
                Sua nova senha foi salva com sucesso. Faça login para continuar.
              </p>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-br from-[#9D8FFF] via-[#7865da] to-[#5e42c0]
                           text-white h-12 rounded-xl font-black shadow-lg text-sm uppercase tracking-wide"
              >
                Fazer Login →
              </motion.button>
            </motion.div>

          ) : (
            /* ── FORMULÁRIO ──────────────────────────────────────────── */
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-center mb-6">
                <img src="/logo-login.png" alt="Gatedo" className="h-8 mx-auto mb-2" />
                <h1 className="text-lg font-black text-gray-800 mb-1">Nova senha</h1>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  Escolha uma senha segura
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Campo senha */}
                <div className="bg-white rounded-xl px-4 py-3 border border-gray-100
                                focus-within:border-[#6158ca] transition-colors flex items-center gap-3">
                  <Lock size={18} className="text-gray-400 flex-shrink-0" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Nova senha"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="bg-transparent w-full outline-none text-sm font-bold
                               text-gray-700 placeholder:font-normal"
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="text-gray-400 hover:text-[#6158ca] transition-colors flex-shrink-0">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Barra de força */}
                {password && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{ background: i <= strength ? strengthColor : '#E5E7EB' }} />
                      ))}
                    </div>
                    <p className="text-[10px] font-bold" style={{ color: strengthColor }}>
                      Força: {strengthLabel}
                    </p>
                  </motion.div>
                )}

                {/* Confirmar senha */}
                <div className="bg-white rounded-xl px-4 py-3 border border-gray-100
                                focus-within:border-[#6158ca] transition-colors flex items-center gap-3">
                  <Lock size={18} className="text-gray-400 flex-shrink-0" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirmar nova senha"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="bg-transparent w-full outline-none text-sm font-bold
                               text-gray-700 placeholder:font-normal"
                  />
                  <button type="button" onClick={() => setShowConfirm(s => !s)}
                    className="text-gray-400 hover:text-[#6158ca] transition-colors flex-shrink-0">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Match indicator */}
                {confirm && (
                  <p className={`text-[10px] font-bold ${password === confirm ? 'text-green-500' : 'text-red-400'}`}>
                    {password === confirm ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
                  </p>
                )}

                {error && (
                  <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded-lg">
                    {error}
                  </p>
                )}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-br from-[#9D8FFF] via-[#7865da] to-[#5e42c0]
                             text-white h-12 rounded-xl font-black shadow-lg flex items-center
                             justify-center gap-2 uppercase text-sm tracking-wide disabled:opacity-70"
                >
                  {loading ? 'Salvando...' : 'Salvar Nova Senha'}
                </motion.button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}