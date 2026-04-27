import React, { useEffect, useState } from 'react';
import { Users, Cat, DollarSign, TrendingUp, Activity, Loader2, Target } from 'lucide-react';
import api from '../../services/api';

export default function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPets: 0,
    revenue: 0,
    foundersCount: 0
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, petsRes] = await Promise.all([
          api.get('/users'),
          api.get('/pets', { params: { scope: 'admin' } })
        ]);

        const users = usersRes.data || [];
        const pets = petsRes.data || [];

        // Filtra apenas quem entrou pelo fluxo de Fundador
        const founders = users.filter(u => u.plan === 'FOUNDER_EARLY').length;
        
        // Receita estimada (ajuste conforme o valor médio das fases)
        const revenue = founders * 47.00; 

        setStats({
          totalUsers: users.length,
          totalPets: pets.length,
          revenue: revenue,
          foundersCount: founders
        });
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Definição das Fases de 50 usuários cada
  const phases = [
    { name: 'Fase 1 (R$ 47)', goal: 100, color: 'bg-cyan-500' },
    { name: 'Fase 2 (R$ 67)', goal: 100, color: 'bg-orange-500' },
    { name: 'Fase 3 (R$ 97)', goal: 200, color: 'bg-purple-500' },
  ];

  if (loading) return <div className="flex h-64 items-center justify-center text-gray-400"><Loader2 className="animate-spin" /> Carregando métricas...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-gray-800 italic">Dashboard de Lançamento 🚀</h2>
            <p className="text-sm text-gray-400 font-bold uppercase">Acompanhamento de Metas e Fundadores</p>
          </div>
      </div>

      {/* MONITOR DE FASES (50/50/50) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {phases.map((phase, index) => {
          const start = index === 0 ? 0 : index === 1 ? 100 : 200;
          const currentProgress = Math.min(Math.max(stats.foundersCount - start, 0), phase.goal);
          const percentage = (currentProgress / phase.goal) * 100;

          return (
            <div key={index} className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{phase.name}</p>
                    <h4 className="text-2xl font-black text-gray-800">{currentProgress}<span className="text-gray-300 text-lg">/{phase.goal}</span></h4>
                </div>
                <Target size={20} className="text-gray-200" />
              </div>
              
              <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100">
                <div 
                  className={`${phase.color} h-full transition-all duration-1000 ease-out`} 
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              <div className="mt-3 flex justify-between items-center">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${percentage === 100 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {percentage === 100 ? 'META CONCLUÍDA' : `${phase.goal - currentProgress} VAGAS`}
                </span>
                <span className="text-[10px] font-bold text-gray-300 italic">{Math.round(percentage)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* CARDS DE MÉTRICAS GERAIS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Tutores" value={stats.totalUsers} icon={Users} color="indigo" />
        <StatCard label="Total Gatos" value={stats.totalPets} icon={Cat} color="pink" />
        <StatCard label="Faturamento" value={`R$ ${stats.revenue.toLocaleString()}`} icon={DollarSign} color="green" />
        <StatCard label="Fundadores" value={stats.foundersCount} icon={StarIcon} color="orange" />
      </div>
    </div>
  );
}

function StarIcon() { return <div className="text-orange-500 font-black text-xl">⭐</div>; }

function StatCard({ label, value, icon: Icon, color }) {
    const colors = {
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        pink: "bg-pink-50 text-pink-600 border-pink-100",
        green: "bg-green-50 text-green-600 border-green-100",
        orange: "bg-orange-50 text-orange-600 border-orange-100",
    };
    const iconNode = Icon ? React.createElement(Icon, { size: 18 }) : null;
    return (
        <div className="bg-white p-5 rounded-[22px] border border-gray-100 flex items-center justify-between shadow-sm">
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide">{label}</p>
              <h3 className="text-2xl font-black text-gray-800 mt-0.5">{value}</h3>
           </div>
           <div className={`p-3 rounded-xl border ${colors[color]}`}>
              {iconNode}
           </div>
        </div>
    );
}
