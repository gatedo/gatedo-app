// LEGADO:
// a edição oficial do perfil agora acontece via EditProfileModal dentro de CatProfile.
// manter este arquivo fora do fluxo principal até refatoração ou remoção definitiva.

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from "../services/api"; 
import { getDateOnly } from '../utils/catAge';

export default function CatEdit() { // Removi as props pet porque vamos buscar aqui
    const navigate = useNavigate();
    const { id } = useParams(); // Pega o ID da URL (ex: /edit/123)
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true); // Para o carregamento inicial

    const [formData, setFormData] = useState({
        name: '',
        nicknames: '',
        breed: 'SRD',
        gender: 'UNKNOWN',
        birthDate: '',
        deathDate: '',
        isDateEstimated: false,
        ageYears: '',
        ageMonths: '',
        city: '',
        microchip: '',
        traumaHistory: '',
        healthSummary: '',
        isArchived: false,
        isMemorial: false,
        themeColor: 'bg-[#FFF5E6]'
    });

    // BUSCA OS DADOS REAIS DO PET (Igualzinho ao CatProfile faz)
    useEffect(() => {
        const fetchPetData = async () => {
            try {
                const response = await api.get(`/pets/${id}`);
                const pet = response.data;
                
                if (pet) {
                    setFormData({
                        name: pet.name || '',
                        nicknames: pet.nicknames || '',
                        breed: pet.breed || 'SRD',
                        gender: pet.gender || 'UNKNOWN',
                        birthDate: getDateOnly(pet.birthDate),
                        deathDate: getDateOnly(pet.deathDate),
                        isDateEstimated: !!pet.isDateEstimated,
                        ageYears: pet.ageYears ?? '',
                        ageMonths: pet.ageMonths ?? '',
                        city: pet.city || '',
                        microchip: pet.microchip || '',
                        traumaHistory: pet.traumaHistory || '',
                        healthSummary: pet.healthSummary || '',
                        isArchived: !!pet.isArchived,
                        isMemorial: !!pet.isMemorial,
                        themeColor: pet.themeColor || 'bg-[#FFF5E6]'
                    });
                }
            } catch (error) {
                console.error("Erro ao carregar dados da tabela Pet:", error);
            } finally {
                setFetching(false);
            }
        };

        if (id) fetchPetData();
    }, [id]);

    const handleSave = async (e) => {
        if(e) e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                ageYears: formData.ageYears !== '' ? parseInt(formData.ageYears) : null,
                ageMonths: formData.ageMonths !== '' ? parseInt(formData.ageMonths) : null,
                // Formata datas para o Prisma (TIMESTAMP)
                birthDate: formData.birthDate || null,
                deathDate: formData.deathDate || null,
            };

            await api.put(`/pets/${id}`, payload);
            alert("Pet atualizado com sucesso!");
            navigate(`/profile/${id}`); // Volta para o perfil
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar na tabela.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-20 text-center font-black uppercase text-gray-400">Buscando na tabela Pet...</div>;

    return (
        <div className={`min-h-screen ${formData.themeColor} bg-opacity-10 p-6 font-sans text-left`}>
            
            {/* HEADER SIMPLES */}
            <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm">
                <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 rounded-full">⬅️</button>
                <h1 className="text-xs font-black uppercase">Editar Gatedo</h1>
                <button onClick={handleSave} className="p-2 bg-indigo-600 text-white rounded-full">✅</button>
            </div>

            <form onSubmit={handleSave} className="max-w-md mx-auto space-y-4">
                
                {/* IDENTIFICAÇÃO */}
                <div className="bg-white p-6 rounded-[24px] shadow-sm space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Nome e Apelidos</label>
                    <input className="w-full p-4 bg-gray-50 rounded-xl outline-none font-bold" 
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nome"/>
                    
                    <input className="w-full p-4 bg-gray-50 rounded-xl outline-none font-bold" 
                        value={formData.nicknames} onChange={e => setFormData({...formData, nicknames: e.target.value})} placeholder="Apelidos"/>
                </div>

                {/* MEMORIAL (Cravado no seu schema) */}
                <div className="bg-[#1a1a1a] p-6 rounded-[24px] shadow-xl text-white space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-indigo-400">Memorial & Vida</h3>
                    
                    <div>
                        <label className="text-[9px] uppercase opacity-50 block mb-1">Data da Partida</label>
                        <input type="date" className="w-full p-4 bg-white/5 rounded-xl border border-white/10 outline-none" 
                            value={formData.deathDate} onChange={e => setFormData({...formData, deathDate: e.target.value})} />
                    </div>

                    <div className="flex items-center justify-between p-2">
                        <span className="text-xs font-bold uppercase">Ativar Memorial</span>
                        <input type="checkbox" className="w-6 h-6" checked={formData.isMemorial} 
                            onChange={e => setFormData({...formData, isMemorial: e.target.checked})} />
                    </div>
                </div>

                {/* HISTÓRICO */}
                <div className="bg-white p-6 rounded-[24px] shadow-sm space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Saúde e Traumas</label>
                    <textarea placeholder="Relate traumas..." className="w-full p-4 bg-gray-50 rounded-xl min-h-[100px] outline-none" 
                        value={formData.traumaHistory} onChange={e => setFormData({...formData, traumaHistory: e.target.value})} />
                </div>

                <button type="submit" disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-full font-black uppercase shadow-lg">
                    {loading ? "Salvando..." : "Salvar Alterações"}
                </button>
            </form>
        </div>
    );
}
