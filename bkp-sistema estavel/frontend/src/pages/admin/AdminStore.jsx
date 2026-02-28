import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Plus, Link, ExternalLink, Trash2, Edit, 
  Video, Image as ImageIcon, CheckCircle, Save, X, Star 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export default function AdminStore() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
      name: '', price: '', category: 'Saúde', partner: 'Amazon',
      link: '', images: '', videoReview: '', badge: '', description: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
        const response = await api.get('/products');
        setProducts(response.data);
    } catch (err) {
        console.error("Erro ao carregar loja:", err);
    }
  };

  const handleOpenModal = (product = null) => {
      if (product) {
          setEditingId(product.id);
          setFormData({
              ...product,
              images: product.images.join(', '), 
          });
      } else {
          setEditingId(null);
          setFormData({
              name: '', price: '', category: 'Saúde', partner: 'Amazon',
              link: '', images: '', videoReview: '', badge: '', description: ''
          });
      }
      setShowModal(true);
  };

  const handleSave = async (e) => {
      e.preventDefault();
      setLoading(true);
      
      const payload = {
          ...formData,
          images: formData.images.split(',').map(url => url.trim()).filter(url => url !== ''),
      };

      try {
          if (editingId) {
              const response = await api.put(`/products/${editingId}`, payload);
              setProducts(products.map(p => p.id === editingId ? response.data : p));
          } else {
              const response = await api.post('/products', payload);
              setProducts([response.data, ...products]);
          }
          setShowModal(false);
          alert("Produto salvo com sucesso!");
      } catch (err) {
          console.error(err);
          alert("Erro ao salvar produto no banco.");
      } finally {
          setLoading(false);
      }
  };

  const handleDelete = async (id) => {
      if(window.confirm("Remover este produto permanentemente?")) {
          try {
              await api.delete(`/products/${id}`);
              setProducts(products.filter(p => p.id !== id));
          } catch (err) {
              alert("Erro ao excluir.");
          }
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <ShoppingBag className="text-[#6158ca]" /> Gestão da Loja
            </h2>
            <p className="text-sm text-gray-400">Publique seus achadinhos e links de afiliado.</p>
        </div>
        <button 
            onClick={() => handleOpenModal()} 
            className="bg-[#6158ca] text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:brightness-110 shadow-lg shadow-indigo-200 transition-transform active:scale-95"
        >
            <Plus size={18} /> Novo Produto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(prod => (
            <div key={prod.id} className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex flex-col gap-3 group hover:shadow-md transition-all relative overflow-hidden">
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-gray-500 z-10 shadow-sm">
                    {prod.category}
                </div>
                
                <div className="h-40 bg-gray-50 rounded-[18px] overflow-hidden relative">
                    {prod.images?.[0] ? (
                        <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover mix-blend-multiply p-2" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200 font-bold uppercase text-[9px]">Sem imagem</div>
                    )}
                    {prod.videoReview && (
                        <div className="absolute bottom-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg">
                            <Video size={12} fill="currentColor" />
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-[#6158ca] bg-purple-50 px-2 py-0.5 rounded mb-1 inline-block">{prod.partner}</span>
                    </div>
                    <h3 className="font-bold text-gray-800 leading-tight line-clamp-1">{prod.name}</h3>
                    <p className="text-sm font-black text-gray-600 mt-1">{prod.price}</p>
                </div>

                <div className="mt-auto flex gap-2 pt-2 border-t border-gray-50">
                    <button onClick={() => handleOpenModal(prod)} className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-100">
                        <Edit size={14} /> Editar
                    </button>
                    <button onClick={() => handleDelete(prod.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100">
                        <Trash2 size={16}/>
                    </button>
                    <a href={prod.link} target="_blank" rel="noreferrer" className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:text-[#6158ca] hover:bg-gray-100">
                        <ExternalLink size={16}/>
                    </a>
                </div>
            </div>
        ))}
      </div>

      <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-[3000] flex items-end justify-center backdrop-blur-sm">
            <motion.div 
                initial={{ y: "100%" }} 
                animate={{ y: 0 }} 
                exit={{ y: "100%" }}
                className="bg-white rounded-t-[45px] w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden"
            >
                <div className="p-8 pb-4 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h3 className="font-black text-2xl text-gray-800 uppercase tracking-tighter">
                        {editingId ? 'Editar Produto' : 'Novo Produto'}
                    </h3>
                    <button onClick={() => setShowModal(false)} className="bg-gray-100 p-2 rounded-full text-gray-400 hover:text-red-500 transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-8 pb-40 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Nome do Produto</label>
                            <input required className="w-full bg-gray-50 rounded-2xl p-4 font-bold text-gray-700 outline-none border border-transparent focus:border-[#6158ca] transition-all" 
                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Fonte Inox" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Preço (Visual)</label>
                            <input className="w-full bg-gray-50 rounded-2xl p-4 font-bold text-gray-700 outline-none border border-transparent focus:border-[#6158ca] transition-all" 
                                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="R$ 0,00" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Parceiro (Loja)</label>
                            <select className="w-full bg-gray-50 rounded-2xl p-4 font-bold text-gray-700 outline-none cursor-pointer" 
                                value={formData.partner} onChange={e => setFormData({...formData, partner: e.target.value})}>
                                <option>Amazon</option><option>Shopee</option><option>Mercado Livre</option><option>Gatedo</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Categoria</label>
                            <select className="w-full bg-gray-50 rounded-2xl p-4 font-bold text-gray-700 outline-none cursor-pointer" 
                                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                <option>Saúde</option><option>Diversão</option><option>Higiene</option><option>Conforto</option><option>Alimentação</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block flex items-center gap-1">Link de Afiliado</label>
                        <input required className="w-full bg-gray-50 rounded-2xl p-4 text-xs font-mono text-blue-600 outline-none border border-transparent focus:border-[#6158ca] transition-all" 
                            value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} placeholder="https://..." />
                    </div>

                    <div className="bg-gray-50 p-6 rounded-[35px] border border-gray-100 space-y-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><ImageIcon size={14}/> Mídia do Produto</h4>
                        <div>
                            <label className="text-[9px] font-bold text-gray-400 mb-1 block">URLs das Imagens (separadas por vírgula)</label>
                            <textarea className="w-full bg-white rounded-2xl p-4 text-xs font-mono text-gray-600 outline-none border border-gray-200 focus:border-[#6158ca]" rows="3"
                                value={formData.images} onChange={e => setFormData({...formData, images: e.target.value})} placeholder="https://imagem1.jpg, https://imagem2.jpg" />
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-gray-400 mb-1 block">URL do Vídeo (YouTube Embed)</label>
                            <input className="w-full bg-white rounded-2xl p-4 text-xs text-gray-600 outline-none border border-gray-200 focus:border-[#6158ca]" 
                                value={formData.videoReview} onChange={e => setFormData({...formData, videoReview: e.target.value})} placeholder="https://www.youtube.com/embed/..." />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Selo (Badge)</label>
                            <input className="w-full bg-gray-50 rounded-2xl p-4 font-bold text-gray-700 outline-none border border-transparent focus:border-[#6158ca]" 
                                value={formData.badge} onChange={e => setFormData({...formData, badge: e.target.value})} placeholder="Ex: Top 1, Oferta" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Descrição Curta</label>
                            <input className="w-full bg-gray-50 rounded-2xl p-4 font-bold text-gray-700 outline-none border border-transparent focus:border-[#6158ca]" 
                                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Resumo do item..." />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="submit" disabled={loading} className="w-full py-5 bg-[#6158ca] text-white rounded-[28px] font-black uppercase tracking-widest shadow-xl shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                            {loading ? <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"/> : <><Save size={18} /> Salvar Produto</>}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
}