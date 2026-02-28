import React, { useEffect, useState } from 'react';
import { Users, Cat, DollarSign, TrendingUp, Activity, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPets: 0,
    revenue: 0,
    growth: 0
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // Busca dados reais do backend em paralelo
        const [usersRes, petsRes] = await Promise.all([
          api.get('/users'),
          api.get('/pets') // Assumindo que existe rota para listar todos os pets (ou use /cats)
        ]);

        const users = usersRes.data || [];
        const pets = petsRes.data || [];

        // Cálculo de Receita (Baseado no número de Fundadores)
        const foundersCount = users.filter(u => u.plan === 'FOUNDER').length;
        const revenue = foundersCount * 37.00; 

        setStats({
          totalUsers: users.length,
          totalPets: pets.length,
          revenue: revenue,
          growth: 12 // Mockado por enquanto (exigiria histórico de datas)
        });
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center text-gray-400"><Loader2 className="animate-spin" /> Carregando dados...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-gray-800">Visão Geral</h2>
            <p className="text-sm text-gray-400 font-bold">Bem-vindo ao painel do Gatedo.</p>
          </div>
          <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Sistema Online
          </span>
      </div>

      {/* Cards de Métricas Reais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Tutores" value={stats.totalUsers} icon={Users} color="indigo" />
        <StatCard label="Total Gatos" value={stats.totalPets} icon={Cat} color="pink" />
        <StatCard label="Receita Mensal" value={`R$ ${stats.revenue.toFixed(2)}`} icon={DollarSign} color="green" />
        <StatCard label="Crescimento" value={`+${stats.growth}%`} icon={TrendingUp} color="orange" />
      </div>

      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 h-64 flex items-center justify-center text-gray-300 font-bold flex-col gap-2">
          <Activity size={40} />
          <p>Gráfico de Atividade (Em breve)</p>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }) {
    const colors = {
        indigo: "bg-indigo-100 text-indigo-600",
        pink: "bg-pink-100 text-pink-600",
        green: "bg-green-100 text-green-600",
        orange: "bg-orange-100 text-orange-600",
    };
    return (
        <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 flex items-center justify-between transition-transform hover:scale-[1.02]">
           <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
              <h3 className="text-2xl font-black text-gray-800 mt-1">{value}</h3>
           </div>
           <div className={`p-3 rounded-xl ${colors[color]}`}>
              <Icon size={20} />
           </div>
        </div>
    )
}