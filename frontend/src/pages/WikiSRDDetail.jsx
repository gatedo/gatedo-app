import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Info, Palette, Sparkles, ShieldCheck } from 'lucide-react';
import useSensory from '../hooks/useSensory';
import { SRD_COAT_OPTIONS } from '../data/srdProfiles';
import { getSrdProfileById } from '../services/srdContentStore';

const fallbackProfile = {
  name: 'Perfil SRD',
  coat: 'mista',
  pattern: 'A revisar',
  colorClass: 'bg-gray-700 text-white',
  desc: 'Este perfil SRD ainda esta em revisao editorial.',
  traits: ['Unico'],
  care: 'Registre historico, peso, comportamento e pelagem no perfil para acompanhar melhor este gato.',
  img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80',
};

export default function WikiSRDDetail() {
  const navigate = useNavigate();
  const touch = useSensory();
  const { id } = useParams();
  const profile = useMemo(() => getSrdProfileById(id) || fallbackProfile, [id]);
  const coatLabel = SRD_COAT_OPTIONS.find((option) => option.value === profile.coat)?.label || profile.coat;

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] pb-32 font-sans relative">
      <div className="relative h-80">
        <img src={profile.img} alt={profile.name} className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--gatedo-light-bg)] via-transparent to-black/30" />

        <button
          onClick={() => { touch(); navigate(-1); }}
          className="absolute top-6 left-5 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 z-20"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="absolute bottom-0 left-0 w-full px-5 pb-8 pt-20 bg-gradient-to-t from-[var(--gatedo-light-bg)] to-transparent">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider mb-2 inline-block ${profile.colorClass}`}>
              SRD · {profile.pattern}
            </span>
            <h1 className="text-4xl font-black text-gray-800 leading-none mb-1">{profile.name}</h1>
            <p className="text-sm font-medium text-gray-500">{coatLabel}</p>
          </motion.div>
        </div>
      </div>

      <div className="px-5 space-y-6 -mt-2 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          <InfoCard icon={Palette} label="Padrao" value={profile.pattern} color="text-orange-500" bg="bg-orange-50" />
          <InfoCard icon={Sparkles} label="Pelagem" value={coatLabel} color="text-purple-500" bg="bg-purple-50" />
        </div>

        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-800 text-lg mb-3 flex items-center gap-2">
            <Info size={20} className="text-[#FF9F43]" /> Sobre este perfil
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">{profile.desc}</p>
          <div className="flex gap-2 mt-4 flex-wrap">
            {profile.traits.map((trait) => (
              <span key={trait} className="text-[10px] font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                #{trait}
              </span>
            ))}
          </div>
        </div>

        {profile.care && (
          <div className="bg-orange-50 p-5 rounded-[24px] border border-orange-100">
            <h3 className="font-black text-orange-800 text-lg mb-3 flex items-center gap-2">
              <ShieldCheck size={20} /> Cuidados
            </h3>
            <p className="text-sm text-orange-800/80 leading-relaxed font-medium">{profile.care}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className={`flex flex-col items-center justify-center p-4 rounded-[20px] ${bg}`}>
      <Icon size={20} className={`${color} mb-1`} />
      <span className="text-[10px] font-bold text-gray-400 uppercase">{label}</span>
      <span className="text-xs font-black text-gray-700 text-center leading-tight">{value}</span>
    </div>
  );
}
