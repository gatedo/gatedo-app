import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, ChevronRight, Activity } from 'lucide-react';

export default function VetReportCard({ diagnosis }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-[30px] p-5 shadow-soft mb-4 border border-gray-100 overflow-hidden"
    >
      {/* Cabeçalho Visual */}
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-gatedo-vet p-2 rounded-full">
           <Activity size={18} className="text-green-700" />
        </div>
        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Análise iGent</span>
      </div>

      <p className="text-gray-700 text-sm leading-relaxed mb-6 font-medium">
        {diagnosis.summary}
      </p>

      {/* Barras de Probabilidade */}
      <div className="mb-6 space-y-4">
        <h4 className="text-xs font-bold text-gatedo-primary flex items-center gap-2">
            🔍 POSSÍVEIS CAUSAS
        </h4>
        {diagnosis.causes.map((cause, idx) => (
            <div key={idx}>
                <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                    <span>{cause.name}</span>
                    <span>{cause.percent}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${cause.percent}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`h-full rounded-full ${idx === 0 ? 'bg-gatedo-primary' : 'bg-gatedo-primary/40'}`}
                    />
                </div>
            </div>
        ))}
      </div>

      {/* Checklist de Cuidados */}
      <div className="bg-green-50 rounded-[20px] p-4">
        <h4 className="text-xs font-bold text-green-700 mb-3 flex items-center gap-2">
            💊 CUIDADOS IMEDIATOS
        </h4>
        <ul className="space-y-2">
            {diagnosis.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs font-medium text-green-800">
                    <CheckCircle size={14} className="mt-0.5 shrink-0" />
                    {step}
                </li>
            ))}
        </ul>
      </div>

      {/* Botão de Ação */}
      <button className="w-full mt-4 bg-gatedo-bg py-3 rounded-xl text-xs font-bold text-gray-500 flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
        Ver detalhes completos <ChevronRight size={14} />
      </button>
    </motion.div>
  );
}