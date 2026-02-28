import React from 'react';
import { Stethoscope } from 'lucide-react';

export default function ProfileHealthBar({ cat }) {
  return (
    <div className="w-full max-w-lg mx-auto mb-8 bg-white rounded-[28px] p-4 shadow-sm border border-gray-50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner">
          <Stethoscope size={20} />
        </div>
        <div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1 leading-none">Status de Saúde iGent</p>
          <p className="text-xs font-black text-gray-700 uppercase leading-none">
            Em dia • <span className="text-emerald-500">Saudável</span>
          </p>
        </div>
      </div>
      <div className="bg-indigo-50 px-3 py-2 rounded-xl text-center border border-indigo-100">
        <p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-0.5">Peso Atual</p>
        <p className="text-xs font-black text-indigo-600">{cat?.weight || '0'} kg</p>
      </div>
    </div>
  );
}