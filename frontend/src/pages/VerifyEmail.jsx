/**
 * VerifyEmail.jsx
 * Página chamada quando o usuário clica no link do email de verificação.
 * Rota: /verify-email?token=xxx
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function VerifyEmail() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const token          = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Link inválido.'); return; }

    api.get(`/auth/verify-email?token=${token}`)
      .then(r => {
        setStatus('success');
        setMessage(r.data?.message || 'Email verificado!');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Link inválido ou já utilizado.');
      });
  }, [token]);

  const config = {
    loading: {
      icon: <Loader2 size={40} className="text-[#6158ca] animate-spin" />,
      bg: '#F4F3FF', border: '#DDD6FE',
      title: 'Verificando...', btn: null,
    },
    success: {
      icon: <CheckCircle size={40} className="text-green-500" />,
      bg: '#F0FDF4', border: '#86EFAC',
      title: '✓ Email verificado!',
      btn: { label: 'Ir para o App →', href: '/home' },
    },
    error: {
      icon: <AlertCircle size={40} className="text-red-400" />,
      bg: '#FFF5F5', border: '#FCA5A5',
      title: 'Link inválido',
      btn: { label: 'Solicitar novo link', href: '/forgot-password' },
    },
  }[status];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#9D8FFF] via-[#7865da] to-[#5e42c0]
                    flex items-center justify-center p-4">
      <img src="/assets/logo-fundo1.svg" alt=""
        className="absolute bottom-[-20%] left-[-40%] w-[150%] opacity-100 pointer-events-none" />

      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="bg-[#f4f3ffef] backdrop-blur-sm w-full max-w-sm rounded-[35px] shadow-2xl
                   p-10 text-center relative z-10"
      >
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 bg-[#ebfc66] rounded-full flex items-center justify-center shadow-lg border-4 border-white">
            <img src="/assets/icone-login.png" alt="" className="w-16 h-16 object-contain" />
          </div>
        </div>

        <div className="mt-4 mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto border-2"
            style={{ background: config.bg, borderColor: config.border }}>
            {config.icon}
          </div>
        </div>

        <h2 className="text-xl font-black text-gray-800 mb-2">{config.title}</h2>
        <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">{message}</p>

        {status === 'success' && (
          <div className="bg-[#F4F3FF] rounded-2xl p-3 mb-6">
            <p className="text-xs font-black text-[#6158ca]">🎉 +50 XP adicionados à sua conta!</p>
          </div>
        )}

        {config.btn && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(config.btn.href)}
            className="w-full bg-gradient-to-br from-[#9D8FFF] via-[#7865da] to-[#5e42c0]
                       text-white h-12 rounded-xl font-black shadow-lg text-sm uppercase tracking-wide"
          >
            {config.btn.label}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}