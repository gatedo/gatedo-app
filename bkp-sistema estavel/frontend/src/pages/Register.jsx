import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../services/api';
// Se você usar Contexto para login, pode importar aqui, mas faremos direto para garantir
import { AuthContext } from '../context/AuthContext'; 

export default function Register() {
  const navigate = useNavigate();
  const { signIn } = useContext(AuthContext); // Usamos para atualizar o estado global se existir

  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    
    // 1. Validação
    if (formData.password !== formData.confirmPassword) {
      alert("As senhas não conferem!");
      return;
    }

    setLoading(true);

    try {
      // 2. Cria o usuário no Backend
      await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      // 3. Login Automático (O Pulo do Gato)
      // Tenta usar a função do contexto se disponível, ou faz manual
      if (signIn) {
          await signIn(formData.email, formData.password);
      } else {
          // Fallback manual se o contexto falhar
          const loginRes = await api.post('/auth/login', {
            email: formData.email,
            password: formData.password
          });
          localStorage.setItem('gatedo_token', loginRes.data.token);
          localStorage.setItem('gatedo_user', JSON.stringify(loginRes.data.user));
      }

      // 4. Sucesso!
      navigate('/home'); 

    } catch (error) {
      console.error("Erro no cadastro:", error);
      const msg = error.response?.data?.message || "Erro ao criar conta. Verifique os dados.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#6158ca] relative overflow-hidden flex items-center justify-center p-4">
      
      {/* Background Decorativo */}
      <img 
        src="/logo-fundo1.svg" 
        alt="Decor" 
        className="absolute bottom-[-20%] left-[-40%] w-[150%] max-w-none pointer-events-none z-0" 
      />

      {/* CARD PRINCIPAL */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/95 backdrop-blur-sm w-full max-w-sm rounded-[35px] shadow-2xl relative pt-16 pb-8 px-6 mt-10"
      >
        
        {/* ÍCONE FLUTUANTE */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
            <div className="w-24 h-24 bg-[#ebfc66] rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                <img src="/icone-login.png" alt="Icone" className="w-16 h-16 object-contain" />
            </div>
        </div>

        <div className="text-center mb-6">
            <img src="/logo-login.png" alt="Gatedo" className="h-8 mx-auto mb-2" />
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Crie sua conta Fundador</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3">
            
            {/* Nome */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 focus-within:border-[#6158ca] transition-colors flex items-center gap-3">
                <User size={18} className="text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Seu Nome Completo"
                    className="bg-transparent w-full outline-none text-sm font-bold text-gray-700 placeholder:font-normal"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                />
            </div>

            {/* Email */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 focus-within:border-[#6158ca] transition-colors flex items-center gap-3">
                <Mail size={18} className="text-gray-400" />
                <input 
                    type="email" 
                    placeholder="Seu melhor e-mail"
                    className="bg-transparent w-full outline-none text-sm font-bold text-gray-700 placeholder:font-normal"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    required
                />
            </div>

            {/* WhatsApp */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 focus-within:border-[#6158ca] transition-colors flex items-center gap-3">
                <Phone size={18} className="text-gray-400" />
                <input 
                    type="tel" 
                    placeholder="WhatsApp / Celular"
                    className="bg-transparent w-full outline-none text-sm font-bold text-gray-700 placeholder:font-normal"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    required
                />
            </div>

            {/* Senha */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 focus-within:border-[#6158ca] transition-colors flex items-center gap-3">
                <Lock size={18} className="text-gray-400" />
                <input 
                    type="password" 
                    placeholder="Crie uma Senha"
                    className="bg-transparent w-full outline-none text-sm font-bold text-gray-700 placeholder:font-normal"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    required
                />
            </div>

            {/* Confirmar Senha (NOVO) */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 focus-within:border-[#6158ca] transition-colors flex items-center gap-3">
                <CheckCircle size={18} className="text-gray-400" />
                <input 
                    type="password" 
                    placeholder="Confirme a Senha"
                    className="bg-transparent w-full outline-none text-sm font-bold text-gray-700 placeholder:font-normal"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                />
            </div>

            <motion.button 
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-[#6158ca] text-white h-12 rounded-xl font-black shadow-lg shadow-[#6158ca]/30 mt-4 flex items-center justify-center gap-2 uppercase text-sm tracking-wide disabled:opacity-70"
            >
                {loading ? "Criando conta..." : <>Finalizar Cadastro <ArrowRight size={16} /></>}
            </motion.button>

        </form>

        <div className="text-center mt-6">
            <p className="text-xs text-gray-400">
                Já é um fundador? <button onClick={() => navigate('/login')} className="text-[#6158ca] font-bold hover:underline">ENTRAR</button>
            </p>
        </div>

      </motion.div>
    </div>
  );
}