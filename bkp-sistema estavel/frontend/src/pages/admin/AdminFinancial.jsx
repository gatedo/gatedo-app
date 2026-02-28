import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Users, Crown } from 'lucide-react';
import api from '../../services/api'; // Import correto

export default function AdminFinancial() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ revenue: 0, founders: 0, potential: 0 });

  useEffect(() => {
    api.get('/users')
      .then(res => {
        const users = Array.isArray(res.data) ? res.data : []; // Proteção contra undefined
        const founders = users.filter(u => u.plan === 'FOUNDER').length;
        const total = users.length;
        
        setData({
            revenue: founders * 37.00,
            founders: founders,
            potential: total * 37.00
        });
      })
      .catch(err => console.error("Erro financeiro:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Calculando receitas...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
        <TrendingUp className="text-green-500"/> Financeiro
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Receita */}
        <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-6 rounded-[24px] text-white shadow-lg shadow-green-200 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-green-100 font-bold text-xs uppercase mb-1">Receita Confirmada</p>
            <h3 className="text-3xl font-black">R$ {data.revenue.toFixed(2)}</h3>
            <p className="text-xs mt-2 bg-white/20 inline-block px-2 py-1 rounded-lg">Baseado em {data.founders} Fundadores</p>
          </div>
          <DollarSign size={100} className="absolute -right-4 -bottom-6 opacity-20 rotate-[-15deg]" />
        </div>
        {/* ... outros cards (conforme código anterior) ... */}
      </div>
    </div>
  );
}