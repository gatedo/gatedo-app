import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    // Simula carregamento e vai para o Onboarding
    const timer = setTimeout(() => {
      navigate('/welcome');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="h-screen w-full bg-[#6158ca] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Círculos decorativos de fundo */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute w-96 h-96 bg-white rounded-full opacity-10 blur-3xl"
      />

      {/* Logo Animado */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative z-10 flex flex-col items-center"
      >
        <img src="/logo-full.png" alt="Gatedo" className="w-48 mb-4 brightness-0 invert" /> 
        {/* Obs: Assumindo que logo-full é transparente. Se não, use uma versão branca ou texto */}
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-[#ebfc66] font-black tracking-widest text-xs uppercase"
        >
          Carregando o Universo Felino...
        </motion.p>
      </motion.div>
    </div>
  );
}