import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

// ─── Ícone de Compartilhar do iOS (SVG nativo) ────────────────────────────────
const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    className="inline-block mx-0.5 -mt-0.5">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

export default function PWAInstallBanner() {
  const { installPrompt, handleInstallClick, showIOSBanner, dismissIOSBanner } = usePWAInstall();

  return (
    <AnimatePresence>

      {/* ── ANDROID / CHROME — botão direto ──────────────────────────────── */}
      {installPrompt && (
        <motion.div
          key="android-banner"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="fixed left-4 right-4 z-[999] flex items-center gap-3 bg-white rounded-[22px] px-4 py-3.5 shadow-2xl border border-gray-100"
          style={{ bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' }}
        >
          <img src="/assets/Gatedo_logo.webp" alt="Gatedo" className="w-10 h-10 rounded-2xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-black text-gray-800 text-sm leading-none">Instalar o Gatedo</p>
            <p className="text-[11px] text-gray-400 font-bold mt-0.5">Acesso rápido, funciona offline</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[14px] font-black text-[11px] text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #8B4AFF, #6B30E0)' }}
          >
            <Download size={13} /> Instalar
          </motion.button>
        </motion.div>
      )}

      {/* ── iOS / SAFARI — instrução manual ──────────────────────────────── */}
      {showIOSBanner && (
        <motion.div
          key="ios-banner"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="fixed left-4 right-4 z-[999] bg-white rounded-[22px] shadow-2xl border border-gray-100 overflow-hidden"
          style={{ bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Faixa topo roxa */}
          <div className="px-4 pt-3 pb-2 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #8B4AFF15, #8B4AFF08)' }}>
            <div className="flex items-center gap-2">
              <img src="/assets/Gatedo_logo.webp" alt="Gatedo" className="w-8 h-8 rounded-xl flex-shrink-0" />
              <div>
                <p className="font-black text-gray-800 text-sm leading-none">Instalar o Gatedo</p>
                <p className="text-[10px] text-[#8B4AFF] font-bold">Adicionar à Tela de Início</p>
              </div>
            </div>
            <button onClick={dismissIOSBanner}
              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <X size={13} className="text-gray-400" />
            </button>
          </div>

          {/* Passos */}
          <div className="px-4 pb-4 pt-2 space-y-2">
            {[
              { step: '1', text: <>Toque em <strong>Compartilhar</strong> <ShareIcon /> na barra do Safari</> },
              { step: '2', text: <><strong>Role para baixo</strong> e toque em <strong>"Adicionar à Tela de Início"</strong></> },
              { step: '3', text: <>Toque em <strong>"Adicionar"</strong> no canto superior direito</> },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-black text-[11px] text-white"
                  style={{ background: '#8B4AFF' }}>
                  {step}
                </div>
                <p className="text-[12px] text-gray-600 leading-snug">{text}</p>
              </div>
            ))}
          </div>

          {/* Seta apontando para baixo → barra do Safari */}
          <div className="flex justify-center pb-2">
            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
              <span>↓ barra do Safari</span>
            </div>
          </div>
        </motion.div>
      )}

    </AnimatePresence>
  );
}