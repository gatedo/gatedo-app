import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Users, Crown, ArrowUpRight } from 'lucide-react';
import api from '../../services/api';

export default function AdminFinancial() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ revenue: 0, founders: 0, potential: 0 });

  useEffect(() => {
    api.get('/users').then(res => {
        const users = res.data || [];
        const founders = users.filter(u => u.plan === 'FOUNDER').length;
        const total = users.length;
        
        setData({
            revenue: founders * 37.00,
            founders: founders,
            potential: total * 37.00 // Se todos fossem founders
        });
        setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
        <TrendingUp className="text-green-500"/> Financeiro
      </h2>

      {/* Cards Visuais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Receita Real */}
        <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-6 rounded-[24px] text-white shadow-lg shadow-green-200 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-green-100 font-bold text-xs uppercase mb-1">Receita Confirmada</p>
            <h3 className="text-3xl font-black">R$ {data.revenue.toFixed(2)}</h3>
            <p className="text-xs mt-2 bg-white/20 inline-block px-2 py-1 rounded-lg">Baseado em {data.founders} Fundadores</p>
          </div>
          <DollarSign size={100} className="absolute -right-4 -bottom-6 opacity-20 rotate-[-15deg]" />
        </div>

        {/* Potencial (Gamificação para você) */}
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
          <p className="text-gray-400 font-bold text-xs uppercase mb-1">Potencial de Receita</p>
          <h3 className="text-3xl font-black text-gray-800">R$ {data.potential.toFixed(2)}</h3>
          <p className="text-xs text-gray-400 mt-2">Se todos os usuários atuais assinassem.</p>
        </div>

        {/* Meta */}
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-bold text-xs uppercase mb-1">Meta Fundadores</p>
              <h3 className="text-3xl font-black text-gray-800">{data.founders} <span className="text-sm text-gray-400">/ 1000</span></h3>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full text-yellow-600"><Crown size={24}/></div>
          </div>
          <div className="mt-4 w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div className="bg-yellow-400 h-full rounded-full transition-all duration-1000" style={{ width: `${(data.founders / 1000) * 100}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}