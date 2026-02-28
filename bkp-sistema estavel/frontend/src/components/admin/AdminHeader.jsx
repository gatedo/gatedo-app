import React from 'react';
import { Search, Menu } from 'lucide-react';

export default function AdminHeader({ title, onMenuClick, searchTerm, setSearchTerm }) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        
        <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Botão Hamburguer (Só Mobile) */}
            <button onClick={onMenuClick} className="lg:hidden p-2 bg-white rounded-lg shadow-sm text-gray-600">
                <Menu size={24} />
            </button>
            
            <div>
                <h1 className="text-2xl font-black text-gray-800 capitalize">{title === 'dashboard' ? 'Visão Geral' : title}</h1>
                <p className="text-sm text-gray-500 hidden md:block">Administração Gatedo</p>
            </div>
        </div>

        {/* Barra de Busca */}
        <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 w-full md:w-80 transition-all focus-within:ring-2 ring-[#6158ca]/20">
                <Search size={20} className="text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Buscar..." 
                    className="bg-transparent outline-none text-sm w-full font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
    </header>
  );
}