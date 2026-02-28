import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Syringe, ShieldCheck, AlertCircle } from 'lucide-react';
import useSensory from '../hooks/useSensory';
import { catsData } from '../data/cats';

export default function CatAlmanac() {
  const { id } = useParams();
  const navigate = useNavigate();
  const touch = useSensory();
  const cat = catsData.find(c => c.id === Number(id)) || catsData[0];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="pb-32 pt-6 px-5"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => { touch(); navigate(-1); }} className="bg-white p-3 rounded-full shadow-sm text-gray-600">
            <ArrowLeft size={20} />
        </button>
        <div>
            <h2 className="text-xl font-black text-gray-800 leading-none">Almanaque</h2>
            <p className="text-xs text-gray-400 font-bold mt-1 uppercase">Saúde de {cat.name}</p>
        </div>
      </div>

      {/* Seção Vacinas */}
      <section className="mb-6">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3 ml-2">Vacinação</h3>
        <div className="space-y-3">
            {/* Card V4 - Vencida (Exemplo de Alerta) */}
            <HealthCard 
                title="V4 (Quádrupla)" 
                date="Venceu: 02/02/2026" 
                status="warning" 
                icon={Syringe}
            />
            {/* Card Raiva - OK */}
            <HealthCard 
                title="Antirrábica" 
                date="Próxima: 15/08/2026" 
                status="ok" 
                icon={ShieldCheck}
            />
        </div>
      </section>

      {/* Seção Vermífugos */}
      <section>
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3 ml-2">Vermífugos & Antipulgas</h3>
        <div className="space-y-3">
            <HealthCard 
                title="Bravecto" 
                date="Aplicado: 10/01/2026" 
                status="ok" 
                icon={ShieldCheck}
            />
        </div>
      </section>

    </motion.div>
  );
}

// Subcomponente Card de Saúde
const HealthCard = ({ title, date, status, icon: Icon }) => (
    <div className={`p-4 rounded-[24px] flex items-center gap-4 border ${
        status === 'warning' ? 'bg-orange-50 border-orange-100' : 'bg-white border-white shadow-soft'
    }`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            status === 'warning' ? 'bg-orange-100 text-orange-500' : 'bg-green-100 text-green-600'
        }`}>
            {status === 'warning' ? <AlertCircle size={24} /> : <Icon size={24} />}
        </div>
        <div className="flex-1">
            <h4 className={`font-bold text-base ${status === 'warning' ? 'text-orange-900' : 'text-gray-800'}`}>{title}</h4>
            <p className={`text-xs font-semibold ${status === 'warning' ? 'text-orange-600' : 'text-gray-400'}`}>{date}</p>
        </div>
        {status === 'ok' && <div className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-md">EM DIA</div>}
        {status === 'warning' && <div className="bg-orange-200 text-orange-800 text-[10px] font-black px-2 py-1 rounded-md">ATENÇÃO</div>}
    </div>
);