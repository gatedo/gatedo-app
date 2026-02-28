/**
 * SocialBioBanner.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Banner que aparece no CatProfile chamando o perfil social público do gato.
 *
 * USO — em CatProfile.jsx, logo após <ProfileHealthBar>:
 *   import SocialBioBanner from '../components/ProfileModules/SocialBioBanner';
 *   <SocialBioBanner cat={cat} navigate={navigate} />
 *
 * O banner lê do objeto `cat`:
 *   cat.name, cat.photoUrl, cat.id (para montar a rota /gato/:id)
 *   cat.breed, cat.socialStats (opcional — fallback para zeros)
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  QrCode, Users, Share2, ChevronRight,
  Sparkles, Globe, PawPrint,
} from 'lucide-react';

// ─── COR TEMA — derivada da raça, ou padrão ───────────────────────────────────
const BREED_COLORS = {
  'Persa':       '#A78BFA',
  'Siamês':      '#60A5FA',
  'Maine Coon':  '#F59E0B',
  'Ragdoll':     '#EC4899',
  'SRD':         '#34D399',
  'default':     '#6158ca',
};

function getThemeColor(cat) {
  if (cat?.themeColor) return cat.themeColor;
  return BREED_COLORS[cat?.breed] || BREED_COLORS.default;
}

export default function SocialBioBanner({ cat, navigate }) {
  const [pressed, setPressed] = useState(false);
  if (!cat) return null;

  const themeColor  = getThemeColor(cat);
  const followers   = cat.socialStats?.followers   ?? 0;
  const studioCount = cat.socialStats?.studioCreations ?? 0;
  const postCount   = cat.socialStats?.posts        ?? 0;

  const handleOpen = () => {
    setPressed(true);
    setTimeout(() => {
      setPressed(false);
      navigate(`/gato/${cat.id}`);
    }, 150);
  };

  return (
    <motion.div
      className="mx-0 mb-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <motion.button
        animate={{ scale: pressed ? 0.97 : 1 }}
        transition={{ duration: 0.12 }}
        onClick={handleOpen}
        className="w-full text-left relative overflow-hidden rounded-[26px] shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${themeColor}14 0%, ${themeColor}06 100%)`,
          border: `1.5px solid ${themeColor}25`,
        }}
      >
        {/* Glow background */}
        <div
          className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${themeColor}18 0%, transparent 70%)`,
            transform: 'translate(30%, -30%)',
          }}
        />

        <div className="relative z-10 flex items-center gap-4 px-4 py-4">

          {/* Foto do gato + anel tema */}
          <div className="relative flex-shrink-0">
            <div
              className="w-14 h-14 rounded-[18px] overflow-hidden"
              style={{
                border: `2.5px solid ${themeColor}60`,
                boxShadow: `0 4px 16px ${themeColor}40`,
              }}
            >
              <img
                src={cat.photoUrl || '/placeholder-cat.png'}
                alt={cat.name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Badge Globe */}
            <div
              className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white"
              style={{ background: themeColor }}
            >
              <Globe size={11} color="#fff" />
            </div>
          </div>

          {/* Info central */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                className="text-[8px] font-black uppercase tracking-widest"
                style={{ color: themeColor }}
              >
                Perfil Social
              </span>
              <span
                className="text-[7px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: `${themeColor}18`, color: themeColor }}
              >
                gatedo.com/gato/{cat.name?.toLowerCase()}
              </span>
            </div>

            <p className="text-sm font-black text-gray-800 leading-tight truncate">
              {cat.name}
              <span className="font-medium text-gray-400 ml-1.5 text-xs">
                {cat.breed}
              </span>
            </p>

            {/* Mini stats */}
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1">
                <Users size={10} style={{ color: themeColor }} />
                <span className="text-[10px] font-black text-gray-600">
                  {followers > 0 ? `${followers}` : '—'}
                </span>
                <span className="text-[9px] text-gray-400 font-medium">seguidores</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles size={10} style={{ color: themeColor }} />
                <span className="text-[10px] font-black text-gray-600">
                  {studioCount > 0 ? `${studioCount}` : '—'}
                </span>
                <span className="text-[9px] text-gray-400 font-medium">criações</span>
              </div>
            </div>
          </div>

          {/* Ações direita */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div
              className="w-9 h-9 rounded-[14px] flex items-center justify-center"
              style={{ background: `${themeColor}15` }}
            >
              <QrCode size={16} style={{ color: themeColor }} />
            </div>
            <ChevronRight size={14} className="text-gray-300" />
          </div>
        </div>

        {/* Bottom strip — CTA sutil */}
        <div
          className="flex items-center justify-between px-4 py-2 border-t"
          style={{ borderColor: `${themeColor}15`, background: `${themeColor}06` }}
        >
          <div className="flex items-center gap-1.5">
            <PawPrint size={10} style={{ color: themeColor }} />
            <span className="text-[9px] font-bold text-gray-400">
              Ver galeria, conquistas e histórico de saúde
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Share2 size={10} style={{ color: themeColor }} />
            <span className="text-[9px] font-black" style={{ color: themeColor }}>
              Compartilhar
            </span>
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}