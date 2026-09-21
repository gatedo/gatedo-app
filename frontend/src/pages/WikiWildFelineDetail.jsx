import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Globe2, MapPin, ShieldAlert, Utensils, AlertTriangle, Leaf, Ruler, Weight, Info } from 'lucide-react';
import useSensory from '../hooks/useSensory';
import { CONSERVATION_STATUS_OPTIONS } from '../data/wildFelines';
import { getWildFelineById } from '../services/wildFelineStore';

const fallbackItem = {
  name: 'Felino selvagem',
  scientificName: 'A revisar',
  region: 'A revisar',
  countries: 'A revisar',
  habitat: 'A revisar',
  status: 'DD',
  population: 'A revisar',
  trend: 'A revisar',
  weight: 'A revisar',
  length: 'A revisar',
  diet: 'A revisar',
  threats: 'A revisar',
  conservation: 'A revisar',
  desc: 'Esta especie ainda esta em revisao editorial.',
  facts: ['Gatedopedia'],
  img: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=1000&q=80',
};

export default function WikiWildFelineDetail() {
  const navigate = useNavigate();
  const touch = useSensory();
  const { id } = useParams();
  const item = useMemo(() => getWildFelineById(id) || fallbackItem, [id]);
  const statusMeta = CONSERVATION_STATUS_OPTIONS.find((option) => option.value === item.status) || CONSERVATION_STATUS_OPTIONS.at(-1);

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] pb-32 font-sans relative">
      <div className="relative h-80">
        <img src={item.img} alt={item.name} className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--gatedo-light-bg)] via-transparent to-black/35" />
        <button onClick={() => { touch(); navigate(-1); }} className="absolute top-6 left-5 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 z-20">
          <ArrowLeft size={20} />
        </button>
        <div className="absolute bottom-0 left-0 w-full px-5 pb-8 pt-20 bg-gradient-to-t from-[var(--gatedo-light-bg)] to-transparent">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider mb-2 inline-block ${statusMeta.color}`}>
              {item.status} · {statusMeta.label}
            </span>
            <h1 className="text-4xl font-black text-gray-800 leading-none mb-1">{item.name}</h1>
            <p className="text-sm font-medium text-gray-500 italic">{item.scientificName}</p>
          </motion.div>
        </div>
      </div>

      <div className="px-5 space-y-6 -mt-2 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          <Spec icon={Globe2} label="Regiao" value={item.region} color="text-emerald-600" bg="bg-emerald-50" />
          <Spec icon={ShieldAlert} label="Risco" value={statusMeta.label} color="text-orange-600" bg="bg-orange-50" />
          <Spec icon={Weight} label="Peso" value={item.weight} color="text-blue-600" bg="bg-blue-50" />
          <Spec icon={Ruler} label="Tamanho" value={item.length} color="text-purple-600" bg="bg-purple-50" />
        </div>

        <Section icon={Info} title="Sobre" text={item.desc} />
        <Section icon={MapPin} title="Paises de origem e ocorrencia" text={item.countries} />
        <Section icon={Leaf} title="Habitat" text={item.habitat} />
        <Section icon={Utensils} title="Dieta" text={item.diet} />
        <Section icon={AlertTriangle} title="Ameacas" text={item.threats} tone="orange" />
        <Section icon={ShieldAlert} title="Conservacao" text={`${item.conservation}\n\nPopulacao: ${item.population}\nTendencia: ${item.trend}`} tone="green" />

        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-800 text-lg mb-3">Fatos importantes</h3>
          <div className="flex gap-2 flex-wrap">
            {item.facts.map((fact) => (
              <span key={fact} className="text-[10px] font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">#{fact}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Spec({ icon: Icon, label, value, color, bg }) {
  return (
    <div className={`p-4 rounded-[20px] ${bg}`}>
      <Icon size={18} className={`${color} mb-1`} />
      <span className="text-[10px] font-bold text-gray-400 uppercase block">{label}</span>
      <span className="text-xs font-black text-gray-700 leading-tight line-clamp-2">{value}</span>
    </div>
  );
}

function Section({ icon: Icon, title, text, tone = 'default' }) {
  const styles = tone === 'orange'
    ? 'bg-orange-50 border-orange-100 text-orange-800'
    : tone === 'green'
      ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
      : 'bg-white border-gray-100 text-gray-700';
  return (
    <div className={`p-5 rounded-[24px] shadow-sm border ${styles}`}>
      <h3 className="font-black text-lg mb-3 flex items-center gap-2">
        <Icon size={20} /> {title}
      </h3>
      <p className="text-sm leading-relaxed font-medium whitespace-pre-line">{text}</p>
    </div>
  );
}
