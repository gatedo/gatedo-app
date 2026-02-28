import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useContext(AuthContext);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    
    if (!email) { setError("Preencha seu e-mail."); return; }
    if (!password) { setError("Preencha sua senha."); return; }

    setLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.success) {
        navigate('/home'); 
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Erro ao conectar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#9D8FFF] via-[#7865da] to-[#5e42c0] relative overflow-hidden flex items-center justify-center p-4">
      
      {/* Background Decorativo */}
      <img 
        src="/logo-fundo1.svg" 
        alt="Decor" 
        className="absolute bottom-[-20%] left-[-40%] w-[150%] max-w-none pointer-events-none z-0" 
      />

      {/* Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-[#f4f3ffef] backdrop-blur-sm w-full max-w-sm rounded-[35px] shadow-2xl relative pt-16 pb-8 px-6 mt-10"
      >
        
        {/* Ícone Flutuante */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
            <div className="w-24 h-24 bg-[#ebfc66] rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                <img src="/icone-login.png" alt="Icone" className="w-16 h-16 object-contain" />
            </div>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
            <img src="/logo-login.png" alt="Gatedo" className="h-8 mx-auto mb-2" />
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Bem-vindo de volta</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
            
            <div className="bg-white rounded-xl px-4 py-3 border border-gray-100 focus-within:border-[#6158ca] transition-colors flex items-center gap-3">
                <Mail size={18} className="text-gray-400" />
                <input 
                    type="email" 
                    placeholder="nome@seuemail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="bg-transparent w-full outline-none text-sm font-bold text-gray-700 placeholder:font-normal"
                />
            </div>

            <div className="bg-white rounded-xl px-4 py-3 border border-gray-100 focus-within:border-[#6158ca] transition-colors flex items-center gap-3">
                <Lock size={18} className="text-gray-400" />
                <input 
                    type="password" 
                    placeholder="Sua senha"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="bg-transparent w-full outline-none text-sm font-bold text-gray-700 placeholder:font-normal"
                />
            </div>

            {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded-lg">{error}</p>}

            <div className="text-right">
                <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs text-gray-400 hover:text-[#6158ca] font-bold transition-colors">Esqueceu a senha?</button>
            </div>

            <motion.button 
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-br from-[#9D8FFF] via-[#7865da] to-[#5e42c0]  text-white h-12 rounded-xl font-black shadow-lg shadow-[#6158ca]/30 flex items-center justify-center gap-2 uppercase text-sm tracking-wide disabled:opacity-70"
            >
                {loading ? "ENTRANDO..." : <>ENTRAR <ArrowRight size={16} /></>}
            </motion.button>
        </form>

        <div className="text-center mt-6">
            <p className="text-xs text-gray-400">
                Ainda não tem conta? <button onClick={() => navigate('/register')} className="text-[#6158ca] font-bold hover:underline">CADASTRE-SE</button>
            </p>
        </div>

      </motion.div>
    </div>
  );
}