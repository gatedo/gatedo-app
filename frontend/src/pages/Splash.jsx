import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/welcome');
    }, 3800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: '#8B4AFF' }}>

      {/* Orb de fundo que pulsa */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.05, 0.15] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, white, transparent 70%)' }}
      />

      {/* Logo — entra gigante e encolhe */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ scale: 10, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          scale:   { duration: 1.1, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.4, ease: 'easeIn' },
        }}
      >
        <motion.img
          src="/assets/App_gatedo_logo.svg"
          alt="Gatedo"
          style={{ width: '150px' }}
        />
      </motion.div>

      {/* Texto aparece depois que o logo terminou de encolher */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 mt-6 font-black tracking-widest text-xs uppercase"
        style={{ color: '#ebfc66' }}
      >
        Carregando o Universo Felino...
      </motion.p>

      {/* Barra de progresso sutil */}
      <motion.div
        className="absolute bottom-16 z-10 rounded-full overflow-hidden"
        style={{ width: '120px', height: '3px', background: 'rgba(255,255,255,0.15)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          style={{ height: '100%', background: '#ebfc66', borderRadius: '9999px' }}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ delay: 1.5, duration: 2.1, ease: 'linear' }}
        />
      </motion.div>

    </div>
  );
}