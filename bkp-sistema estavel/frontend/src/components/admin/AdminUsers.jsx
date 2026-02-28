import React, { useState } from 'react';
import { 
  Users, Search, Crown, Shield, Star, 
  MoreHorizontal, CheckCircle, Mail 
} from 'lucide-react';

// DADOS MOCKADOS (Simulando o Banco)
const MOCK_USERS = [
  { id: 1, name: "Ana Clara", email: "ana@gmail.com", plan: "FREE", badges: [], pets: 2, joined: "10/02/2026" },
  { id: 2, name: "Diego Tavares", email: "diego@gatedo.com", plan: "FOUNDER", badges: ["FOUNDER"], pets: 1, joined: "05/02/2026" },
];

export default function AdminUsers() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState("");

  // AÇÃO: Promover a Fundador
  const toggleFounder = (id) => {
    setUsers(users.map(user => {
      if (user.id === id) {
        const isFounder = user.plan === 'FOUNDER';
        return {
          ...user,
          plan: isFounder ? 'FREE' : 'FOUNDER',
          badges: isFounder 
            ? user.badges.filter(b => b !== 'FOUNDER') // Remove selo
            : [...user.badges, 'FOUNDER'] // Adiciona selo
        };
      }
      return user;
    }));
    // Aqui chamaria o backend: api.patch(`/users/${id}`, { plan: 'FOUNDER', badges: ... })
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <Users className="text-[#6158ca]" /> Gestão de Tutores
          </h2>
          <p className="text-sm text-gray-400">Gerencie planos e selos da comunidade.</p>
        </div>
        <div className="bg-white p-2 rounded-xl border border-gray-200 flex items-center gap-2 shadow-sm">
          <Search size={18} className="text-gray-400" />
          <input 
            placeholder="Buscar tutor..." 
            className="outline-none text-sm font-bold text-gray-700"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">Tutor</th>
              <th className="px-6 py-4">Plano Atual</th>
              <th className="px-6 py-4">Selos (Badges)</th>
              <th className="px-6 py-4">Gatos</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800">{user.name}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Mail size={10}/> {user.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                    user.plan === 'FOUNDER' 
                      ? 'bg-purple-100 text-purple-700 border-purple-200' 
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                    {user.plan}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {user.badges.includes("FOUNDER") && (
                      <div className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-yellow-200 flex items-center gap-1" title="Membro Fundador">
                        <Crown size={12} /> FUNDADOR
                      </div>
                    )}
                    {user.badges.length === 0 && <span className="text-gray-300 text-xs">-</span>}
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-gray-600">{user.pets} Gatos</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => toggleFounder(user.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                      user.plan === 'FOUNDER'
                        ? 'border-red-100 text-red-500 hover:bg-red-50'
                        : 'bg-[#6158ca] text-white border-[#6158ca] hover:brightness-110 shadow-lg shadow-indigo-100'
                    }`}
                  >
                    {user.plan === 'FOUNDER' ? 'Remover Founder' : '👑 Tornar Fundador'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}