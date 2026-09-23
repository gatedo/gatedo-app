import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { PartyPopper, Syringe, Bug, ShieldCheck, ArrowRight } from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';

const C = { purple: '#8B4AFF', purpleDark: '#4B40C6', bg: '#F4F3FF', green: '#10B981' };

const TYPE_META = {
  VACCINE: { label: 'Vacina', icon: Syringe },
  VERMIFUGE: { label: 'Vermífugo', icon: Bug },
  PARASITE: { label: 'Antipulgas', icon: ShieldCheck },
};

// Primeiro uso de quem adotou via transferência — pula o cadastro do gato
// (já veio pronto) e cai direto na carteira preenchida.
export default function AdocaoBoasVindas() {
  const { petId } = useParams();
  const navigate = useNavigate();
  const touch = useSensory();
  const [pet, setPet] = useState(undefined);

  useEffect(() => {
    api.get(`/pets/${petId}`).then((r) => setPet(r.data)).catch(() => setPet(null));
  }, [petId]);

  if (pet === undefined) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
      <p className="text-[12px] font-medium text-gray-400">Carregando...</p>
    </div>;
  }
  if (!pet) {
    navigate('/home', { replace: true });
    return null;
  }

  const records = (pet.healthRecords || []).filter((r) => TYPE_META[r.type]);

  return (
    <div className="min-h-screen pb-16" style={{ background: C.bg }}>
      <div className="px-5 pt-12 pb-6 text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: `${C.green}18` }}>
          <PartyPopper size={28} style={{ color: C.green }} />
        </motion.div>
        <h1 className="text-xl font-black text-gray-900">Bem-vindo(a), {pet.name} chegou!</h1>
        <p className="text-[12px] font-medium text-gray-500 mt-1">A ficha e a carteira dele já vieram prontas — dá uma olhada.</p>
      </div>

      <div className="px-5">
        <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0" style={{ border: `2px solid ${C.purple}25` }}>
              {pet.photoUrl
                ? <img src={pet.photoUrl} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full flex items-center justify-center text-2xl" style={{ background: `${C.purple}10` }}>🐱</div>}
            </div>
            <div>
              <p className="text-[15px] font-black text-gray-900">{pet.name}</p>
              <p className="text-[11px] font-bold text-gray-400">{pet.breed || 'SRD'}</p>
            </div>
          </div>

          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-2">Carteira</p>
          {records.length === 0 ? (
            <p className="text-[12px] font-medium text-gray-400">Nenhum preventivo registrado ainda.</p>
          ) : (
            <div className="space-y-1.5">
              {records.map((r) => {
                const meta = TYPE_META[r.type];
                const Icon = meta.icon;
                return (
                  <div key={r.id} className="flex items-center gap-2.5 py-1.5">
                    <Icon size={14} style={{ color: C.purple }} className="shrink-0" />
                    <span className="text-[12px] font-bold text-gray-700 flex-1">{r.title}</span>
                    <span className="text-[10px] font-bold text-gray-400">{new Date(r.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={() => { touch(); navigate(`/cat/${pet.id}`, { state: { restoreTab: 'SAUDE' } }); }}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white text-sm"
          style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
        >
          Ver perfil completo de {pet.name} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
