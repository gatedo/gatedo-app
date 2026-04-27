import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, LogIn, Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  function handleGoToLandingPage() {
    window.location.href = 'https://gatedo.com';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#936cff] via-[#8b4dff] to-[#682adb] relative overflow-hidden flex items-center justify-center p-4">
      <img
        src="/logo-fundo1.svg"
        alt="Decor"
        className="absolute bottom-[-20%] left-[-40%] w-[150%] max-w-none pointer-events-none z-0"
      />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-[#f4f3ffef] backdrop-blur-sm w-full max-w-sm rounded-[35px] shadow-2xl relative pt-16 pb-8 px-6 mt-10"
      >
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 bg-[#f8f4ff83] rounded-full flex items-center justify-center shadow-lg">
            <img src="/assets/App_gatedo_logo1.webp" alt="Gatedo" className="w-32 h-32 object-contain" />
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
          </div>

          <h1 className="text-[#22223b] text-[34px] leading-none font-black mb-2">Oops...</h1>
          <p className="text-[#22223b] text-lg font-extrabold mb-2">Essa página não foi encontrada</p>
          <p className="text-gray-500 text-sm leading-relaxed">
            O link pode estar inválido, expirado ou essa área não existe mais.
          </p>
        </div>

        <div className="bg-white/80 border border-[#ece7ff] rounded-2xl p-4 mb-5 text-center">
          <p className="text-xs uppercase tracking-[2px] font-black text-[#8B4AFF] mb-2">
            GATEDO
          </p>
          <p className="text-sm text-gray-600">
            Volte para o login, retorne à página anterior ou conheça a experiência oficial.
          </p>
        </div>

        <div className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => navigate('/login')}
            className="w-full bg-gradient-to-br from-[#936cff] via-[#8b4dff] to-[#682adb] text-white h-12 rounded-[40px] font-black shadow-lg shadow-[#8B4AFF]/30 flex items-center justify-center gap-2 uppercase text-sm tracking-wide"
          >
            <LogIn size={16} />
            Ir para login
          </motion.button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="h-11 rounded-[30px] border border-[#d9d0ff] bg-white text-[#6b4df7] font-extrabold text-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>

            <button
              type="button"
              onClick={handleGoToLandingPage}
              className="h-11 rounded-[30px] border border-[#d9d0ff] bg-white text-[#6b4df7] font-extrabold text-sm flex items-center justify-center gap-2"
            >
              <Home size={16} />
              Site
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}