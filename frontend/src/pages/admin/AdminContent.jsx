import React, { useState, useEffect } from 'react';
import { BookOpen, Palette, Plus, Edit, Trash2, X, Upload, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState('wiki');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => { fetchContent(); }, [activeTab]);

  async function fetchContent() {
    setLoading(true);
    try {
      if (activeTab === 'wiki') {
        const res = await api.get('/articles');
        setArticles(res.data);
      } else { setArticles([]); }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  const handleDelete = async (id) => {
    if(!window.confirm("Apagar artigo?")) return;
    try { await api.delete(`/articles/${id}`); fetchContent(); } catch (e) { alert("Erro ao deletar"); }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                {activeTab === 'wiki' ? <BookOpen className="text-cyan-500"/> : <Palette className="text-orange-500"/>}
                Gestão de Conteúdo
            </h2>
            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex">
                <button onClick={() => setActiveTab('wiki')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'wiki' ? 'bg-cyan-100 text-cyan-700' : 'text-gray-400'}`}>GatedoPédia</button>
                <button onClick={() => setActiveTab('studio')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'studio' ? 'bg-orange-100 text-orange-700' : 'text-gray-400'}`}>Studio Assets</button>
            </div>
        </div>

        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-lg text-gray-700">{activeTab === 'wiki' ? `Artigos (${articles.length})` : 'Assets'}</h3>
                <button onClick={() => { setEditingItem(null); setModalOpen(true); }} className="bg-[#8B4AFF] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#5046b0]">
                    <Plus size={18} /> Novo
                </button>
            </div>

            {loading ? <div className="p-10 text-center text-gray-400">Carregando...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {articles.map(item => (
                        <div key={item.id} className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                            <div className="h-32 w-full bg-gray-100 relative">
                                <img src={item.imageUrl || "https://placehold.co/600x400?text=Sem+Imagem"} className="w-full h-full object-cover" />
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingItem(item); setModalOpen(true); }} className="p-1.5 bg-white text-blue-500 rounded-lg shadow-sm"><Edit size={14}/></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-white text-red-500 rounded-lg shadow-sm"><Trash2 size={14}/></button>
                                </div>
                                <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm">{item.category}</span>
                            </div>
                            <div className="p-4">
                                <h4 className="font-bold text-gray-800 line-clamp-1">{item.title}</h4>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {isModalOpen && <ArticleModal activeTab={activeTab} item={editingItem} onClose={() => setModalOpen(false)} onSave={() => { fetchContent(); setModalOpen(false); }} />}
    </div>
  );
}

function ArticleModal({ activeTab, item, onClose, onSave }) {
    const [formData, setFormData] = useState({
        title: item?.title || '', category: item?.category || 'Saúde', imageUrl: item?.imageUrl || '', content: item?.content || ''
    });
    const [uploading, setUploading] = useState(false);

    async function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validação no Frontend antes de enviar
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert("Formato inválido! Use JPG, PNG ou WebP.");
            return;
        }

        setUploading(true);
        const data = new FormData();
        data.append('file', file); // O nome 'file' tem que bater com o backend

        try {
            const response = await api.post('/media/upload', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({ ...prev, imageUrl: response.data.url }));
        } catch (error) {
            console.error("Erro upload:", error);
            alert("Erro ao subir imagem. Verifique se o backend está rodando e aceita uploads.");
        } finally {
            setUploading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            if (activeTab === 'wiki') {
                item ? await api.patch(`/articles/${item.id}`, formData) : await api.post('/articles', formData);
            }
            onSave();
        } catch (error) { alert("Erro ao salvar."); }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg">{item ? 'Editar' : 'Novo'} Artigo</h3>
                    <button onClick={onClose}><X size={20} className="text-gray-400"/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Título</label><input className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required /></div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Categoria</label>
                            <select className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                <option>Saúde</option><option>Comportamento</option><option>Raças</option><option>Curiosidades</option><option>Nutrição</option><option>Higiene</option><option>Ambiente</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Capa (JPG, PNG, WebP)</label>
                            <div className="relative">
                                <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} className="hidden" id="upload-cover" />
                                <label htmlFor="upload-cover" className={`w-full border border-dashed border-gray-300 rounded-xl p-2.5 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 ${uploading ? 'opacity-50' : ''}`}>
                                    {uploading ? <Loader2 size={18} className="animate-spin text-[#8B4AFF]" /> : formData.imageUrl ? <span className="text-xs font-bold text-green-600">Imagem OK!</span> : <><Upload size={16} className="text-gray-400" /><span className="text-xs text-gray-500">Upload</span></>}
                                </label>
                            </div>
                        </div>
                    </div>

                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Conteúdo</label><textarea className="w-full border border-gray-200 rounded-xl p-3 text-sm min-h-[150px]" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required /></div>
                    
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl">Cancelar</button>
                        <button type="submit" disabled={uploading} className="flex-1 py-3 font-bold text-white bg-[#8B4AFF] rounded-xl hover:brightness-110 disabled:opacity-70">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    )
}