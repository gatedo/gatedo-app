import React, { useState, useEffect } from 'react';
import { Cat, Search, Copy, Filter } from 'lucide-react';
import api from '../../services/api';

export default function AdminCats() {
  const [pets, setPets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all"); // all, name, breed

  useEffect(() => {
    api.get('/pets').then(res => setPets(res.data || [])).catch(console.error);
  }, []);

  const copyId = (id) => {
      navigator.clipboard.writeText(id);
      alert("ID do Gato copiado!");
  };

  const filteredPets = pets.filter(pet => {
      const term = searchTerm.toLowerCase();
      if (!term) return true;
      if (filterBy === 'name') return pet.name.toLowerCase().includes(term);
      if (filterBy === 'breed') return (pet.breed || "").toLowerCase().includes(term);
      // Busca geral
      return pet.name.toLowerCase().includes(term) || 
             (pet.breed || "").toLowerCase().includes(term) ||
             pet.id.includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <Cat className="text-[#6158ca]" /> Gestão de Gatos
        </h2>
        
        <div className="flex gap-2 w-full md:w-auto">
            <div className="bg-white p-2 rounded-xl border border-gray-200 flex items-center gap-2">
                <Filter size={18} className="text-gray-400" />
                <select value={filterBy} onChange={e => setFilterBy(e.target.value)} className="bg-transparent text-xs font-bold outline-none">
                    <option value="all">Tudo</option>
                    <option value="name">Nome</option>
                    <option value="breed">Raça</option>
                </select>
            </div>
            <div className="bg-white p-2 rounded-xl border border-gray-200 flex items-center gap-2 flex-1">
                <Search size={18} className="text-gray-400" />
                <input 
                    placeholder="Buscar gatinho..." 
                    className="outline-none text-sm font-bold w-full"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b border-gray-100">
                <tr>
                    <th className="p-4">ID (Carteirinha)</th>
                    <th className="p-4">Gato</th>
                    <th className="p-4">Raça</th>
                    <th className="p-4">Idade</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {filteredPets.map(pet => (
                    <tr key={pet.id} className="hover:bg-gray-50">
                        <td className="p-4">
                            <button onClick={() => copyId(pet.id)} className="flex items-center gap-1 text-[10px] font-mono bg-gray-100 px-2 py-1 rounded text-gray-500 hover:bg-gray-200">
                                <Copy size={10} /> {pet.id.slice(0, 8)}...
                            </button>
                        </td>
                        <td className="p-4 font-bold text-gray-700">{pet.name}</td>
                        <td className="p-4 text-gray-500">{pet.breed || "SRD"}</td>
                        <td className="p-4 text-gray-500">{pet.age ? `${pet.age} anos` : "-"}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}