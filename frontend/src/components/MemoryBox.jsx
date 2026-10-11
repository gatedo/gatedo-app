import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, EyeOff, ChevronRight } from 'lucide-react';

const prefKey = (userId) => `gatedo_memory_box_visible_${userId || 'anon'}`;

function readVisible(userId) {
  try { return localStorage.getItem(prefKey(userId)) === '1'; } catch { return false; }
}

function lifeSpan(cat) {
  const year = (v) => {
    if (!v) return null;
    const m = String(v).match(/^(\d{4})/);
    return m ? m[1] : null;
  };
  const born = year(cat.birthDate);
  const gone = year(cat.deathDate);
  if (born && gone) return `${born} – ${gone}`;
  if (gone) return `até ${gone}`;
  return null;
}

// Gatos que já partiram. É conteúdo emocional, então começa fechado: o tutor
// decide se quer as memórias visíveis aqui (preferência guardada no aparelho).
export default function MemoryBox({ cats = [], userId, onOpen }) {
  const [visible, setVisible] = useState(() => readVisible(userId));

  useEffect(() => { setVisible(readVisible(userId)); }, [userId]);

  if (!cats.length) return null;

  const toggle = () => {
    const next = !visible;
    setVisible(next);
    try { localStorage.setItem(prefKey(userId), next ? '1' : '0'); } catch { /* sem storage */ }
  };

  return (
    <section className="rounded-[30px] overflow-hidden border border-[#E9E3FF]" style={{ background: 'linear-gradient(180deg,#FBFAFF 0%,#F4F1FF 100%)' }}>
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
          <Heart size={18} className="text-rose-300" fill="#fecdd3" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-black text-[#2D2657]">Caixinha de memórias</p>
          <p className="text-[10px] font-bold text-gray-400">
            {cats.length} {cats.length === 1 ? 'gatinho que segue no coração' : 'gatinhos que seguem no coração'}
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={visible}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white text-[10px] font-black uppercase tracking-wider text-[#6D28D9] shadow-sm flex-shrink-0"
        >
          {visible ? <EyeOff size={13} /> : <Eye size={13} />}
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {visible ? (
          <motion.div
            key="memories"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3 px-4 pb-4">
              {cats.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onOpen?.(cat)}
                  className="text-left bg-white rounded-[24px] p-3 shadow-sm border border-white active:scale-[0.98] transition-transform"
                >
                  <div className="aspect-square rounded-[18px] overflow-hidden bg-[#F4F3FF]">
                    {cat.photoUrl ? (
                      <img src={cat.photoUrl} alt={cat.name} className="w-full h-full object-cover" style={{ filter: 'grayscale(0.35) sepia(0.15)' }} loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🐾</div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-2.5 px-0.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-black text-gray-800 truncate">{cat.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 truncate">{lifeSpan(cat) || cat.breed || 'Em memória'}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <p key="hint" className="px-5 pb-4 -mt-1 text-[12px] leading-relaxed text-gray-400">
            As memórias ficam guardadas aqui e não aparecem no iGentVet nem nas listas do dia a dia. Toque em <b>Mostrar</b> quando quiser revê-las.
          </p>
        )}
      </AnimatePresence>
    </section>
  );
}
