import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Crown, Edit, Phone, Save, X, MapPin, Cat, Mail, Filter, SortAsc, Copy 
} from 'lucide-react';
import api from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  
  // Novo Estado de Ordenação
  const [sortBy, setSortBy] = useState("name"); // name, city, pets

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    try {
      const response = await api.get('/users');
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (e) => {
    e.preventDefault();
    try {
        // Envia apenas os dados necessários
        const payload = {
            name: editingUser.name,
            email: editingUser.email,
            phone: editingUser.phone,
            city: editingUser.city, // Agora o backend aceita!
            plan: editingUser.plan,
            badges: editingUser.badges
        };
        await api.patch(`/users/${editingUser.id}`, payload);
        
        // Atualiza localmente
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...payload } : u));
        setEditingUser(null);
        alert("Salvo com sucesso!");
    } catch (error) {
        alert("Erro ao salvar (Verifique se rodou o prisma migrate): " + error.message);
    }
  };

  const copyId = (id) => {
      navigator.clipboard.writeText(id);
      alert("ID copiado: " + id);
  };

  // Lógica de Filtro e Ordenação
  const processedUsers = users
    .filter(u => 
        (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.city && u.city.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
        if (sortBy === 'name') return (a.name || "").localeCompare(b.name || "");
        if (sortBy === 'city') return (a.city || "").localeCompare(b.city || "");
        if (sortBy === 'pets') return (b.pets?.length || 0) - (a.pets?.length || 0); // Mais gatos primeiro
        return 0;
    });

  return (
    <div className="space-y-6 relative">
      {/* Header e Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <Users className="text-[#6158ca]" /> Gestão de Tutores
          </h2>
          <p className="text-sm text-gray-400">Gerencie a comunidade Gatedo.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
             {/* Seletor de Ordem */}
            <div className="bg-white p-2 rounded-xl border border-gray-200 flex items-center gap-2 shadow-sm">
                <SortAsc size={18} className="text-gray-400" />
                <select 
                    value={sortBy} 
                    onChange={e => setSortBy(e.target.value)}
                    className="outline-none text-xs font-bold text-gray-700 bg-transparent"
                >
                    <option value="name">Nome (A-Z)</option>
                    <option value="city">Cidade</option>
                    <option value="pets">Nº Gatos</option>
                </select>
            </div>

            {/* Busca */}
            <div className="bg-white p-2 rounded-xl border border-gray-200 flex items-center gap-2 shadow-sm flex-1">
                <Search size={18} className="text-gray-400" />
                <input 
                    placeholder="Buscar nome, email ou cidade..." 
                    className="outline-none text-sm font-bold text-gray-700 w-full"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">ID Único</th>
              <th className="px-6 py-4">Tutor</th>
              <th className="px-6 py-4">Cidade</th>
              <th className="px-6 py-4">Plano</th>
              <th className="px-6 py-4">Gatos</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {processedUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                {/* ID ÚNICO VISÍVEL */}
                <td className="px-6 py-4">
                    <button onClick={() => copyId(user.id)} className="flex items-center gap-1 text-[10px] font-mono bg-gray-100 px-2 py-1 rounded text-gray-500 hover:bg-gray-200" title="Clique para copiar">
                        <Copy size={10} /> {user.id.slice(0, 8)}...
                    </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800">{user.name}</span>
                    <span className="text-xs text-gray-400">{user.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500 font-medium text-xs">
                    {user.city || "-"}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                    user.plan === 'FOUNDER' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                    {user.plan || 'FREE'}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-gray-600">
                    {user.pets ? user.pets.length : 0}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                      <button onClick={() => window.open(`https://wa.me/55${user.phone?.replace(/\D/g, '')}`, '_blank')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
                          <Phone size={14} />
                      </button>
                      <button onClick={() => setEditingUser(user)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                          <Edit size={14} />
                      </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* O MODAL CONTINUA O MESMO QUE JÁ TE PASSEI, NÃO PRECISA MUDAR */}
      {/* ... (Copie o código do Modal da resposta anterior se precisar, mas ele já está lá) */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                    <h3 className="font-black text-xl text-gray-800 flex items-center gap-2">
                        <Edit className="text-[#6158ca]" /> Editar Tutor
                    </h3>
                    <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <X size={24}/>
                    </button>
                </div>
                {/* FORMULÁRIO IGUAL AO ANTERIOR */}
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-gray-500">Nome</label><input value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full bg-gray-50 border rounded-xl p-3 text-sm"/></div>
                        <div><label className="text-xs font-bold text-gray-500">Cidade</label><input value={editingUser.city || ''} onChange={e => setEditingUser({...editingUser, city: e.target.value})} className="w-full bg-gray-50 border rounded-xl p-3 text-sm"/></div>
                        <div><label className="text-xs font-bold text-gray-500">Telefone</label><input value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} className="w-full bg-gray-50 border rounded-xl p-3 text-sm"/></div>
                        <div>
                             <label className="text-xs font-bold text-gray-500">Plano</label>
                             <select value={editingUser.plan || 'FREE'} onChange={e => setEditingUser({...editingUser, plan: e.target.value})} className="w-full bg-gray-50 border rounded-xl p-3 text-sm">
                                <option value="FREE">Free</option><option value="FOUNDER">Founder</option>
                             </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 rounded-lg text-gray-500">Cancelar</button>
                        <button type="submit" className="bg-[#6158ca] text-white px-6 py-2 rounded-lg font-bold">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}