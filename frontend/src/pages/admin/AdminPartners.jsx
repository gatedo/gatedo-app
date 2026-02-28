import React, { useState } from 'react';
import { 
  HeartHandshake, Search, Edit, Trash2, X, Save, Phone, MapPin, 
  CheckCircle, Shield, Star, Mail, Crown
} from 'lucide-react';

const MOCK_VETS = [
    { id: 1, name: "Dr. Ricardo Silva", clinic: "Gatos & Cia", status: "APPROVED", isPremium: true, phone: "1199999999", email: "ricardo@vet.com", address: "Rua A, 123" },
    { id: 2, name: "Clínica VetLife", clinic: "VetLife 24h", status: "PENDING", isPremium: false, phone: "1188888888", email: "contato@vet.com", address: "Av B, 500" },
];

export default function AdminPartners() {
  const [vets, setVets] = useState(MOCK_VETS || []);
  const [editingVet, setEditingVet] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVets = (vets || []).filter(v => 
    (v.name && v.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (v.clinic && v.clinic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSave = (e) => {
      e.preventDefault();
      setVets(vets.map(v => v.id === editingVet.id ? editingVet : v));
      setEditingVet(null);
  };

  const handleDelete = (id) => {
      if(window.confirm("Remover este parceiro?")) {
          setVets(vets.filter(v => v.id !== id));
      }
  };

  return (
    <div className="space-y-6 relative">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <HeartHandshake className="text-pink-500"/> Parceiros (Vets)
            </h2>
            <div className="bg-white p-2 rounded-xl border border-gray-200 flex items-center gap-2 shadow-sm">
                <Search size={18} className="text-gray-400" />
                <input 
                    placeholder="Buscar..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="outline-none text-sm font-bold text-gray-700"
                />
            </div>
        </div>

        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[800px]">
                    <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100 uppercase text-xs">
                        <tr>
                            <th className="p-4">Profissional / Clínica</th>
                            <th className="p-4">Contato</th>
                            <th className="p-4">Plano</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredVets.map(vet => (
                            <tr key={vet.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center font-black text-pink-600">
                                            {vet.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800">{vet.name}</div>
                                            <div className="text-xs text-gray-500">{vet.clinic}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="flex items-center gap-1 text-gray-600 text-xs font-bold"><Phone size={10}/> {vet.phone}</span>
                                        <span className="flex items-center gap-1 text-gray-400 text-xs"><Mail size={10}/> {vet.email}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black border flex items-center gap-1 w-fit ${vet.isPremium ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                                        {vet.isPremium ? <Crown size={10}/> : null}
                                        {vet.isPremium ? 'PREMIUM' : 'BÁSICO'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black border flex items-center gap-1 w-fit ${vet.status === 'APPROVED' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                                        {vet.status === 'APPROVED' ? <CheckCircle size={10}/> : <Shield size={10}/>}
                                        {vet.status === 'APPROVED' ? 'VERIFICADO' : 'PENDENTE'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => setEditingVet(vet)} 
                                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(vet.id)}
                                            className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* MODAL DE EDIÇÃO */}
        {editingVet && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-lg text-gray-800">Editar Parceiro</h3>
                        <button onClick={() => setEditingVet(null)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Nome</label>
                            <input 
                                value={editingVet.name} 
                                onChange={e => setEditingVet({...editingVet, name: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-bold text-gray-700 outline-none focus:border-[#6158ca]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Clínica</label>
                            <input 
                                value={editingVet.clinic} 
                                onChange={e => setEditingVet({...editingVet, clinic: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-bold text-gray-700 outline-none focus:border-[#6158ca]"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Status</label>
                                <select 
                                    value={editingVet.status} 
                                    onChange={e => setEditingVet({...editingVet, status: e.target.value})}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-bold text-gray-700 outline-none focus:border-[#6158ca]"
                                >
                                    <option value="PENDING">Pendente</option>
                                    <option value="APPROVED">Verificado ✅</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Plano</label>
                                <select 
                                    value={editingVet.isPremium} 
                                    onChange={e => setEditingVet({...editingVet, isPremium: e.target.value === 'true'})}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-bold text-gray-700 outline-none focus:border-[#6158ca]"
                                >
                                    <option value="false">Básico</option>
                                    <option value="true">Premium 👑</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="pt-2 flex justify-end gap-2">
                            <button type="button" onClick={() => setEditingVet(null)} className="px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100">Cancelar</button>
                            <button type="submit" className="bg-[#6158ca] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 shadow-lg shadow-indigo-200">
                                <Save size={18} /> Salvar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}