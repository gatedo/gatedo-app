import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen, Palette, Plus, Edit, Trash2, X, Upload, Loader2,
  Cat, Search, RotateCcw, Eye, EyeOff, Brush, ExternalLink, Globe2
} from 'lucide-react';
import api from '../../services/api';
import { BREED_TYPE_OPTIONS } from '../../data/breeds';
import { SRD_COAT_OPTIONS } from '../../data/srdProfiles';
import { CONSERVATION_STATUS_OPTIONS } from '../../data/wildFelines';
import {
  archiveBreedContent,
  createBreedSlug,
  getAdminBreedCatalog,
  resetBreedContent,
  saveBreedContent,
} from '../../services/breedContentStore';
import {
  archiveSrdProfile,
  getAdminSrdProfiles,
  resetSrdProfile,
  saveSrdProfile,
} from '../../services/srdContentStore';
import {
  archiveWildFeline,
  getAdminWildFelines,
  resetWildFeline,
  saveWildFeline,
} from '../../services/wildFelineStore';

const tabs = [
  { id: 'wiki', label: 'Gatedopedia', icon: BookOpen, color: 'cyan' },
  { id: 'breeds', label: 'Racas', icon: Cat, color: 'violet' },
  { id: 'srd', label: 'SRD', icon: Brush, color: 'orange' },
  { id: 'wild', label: 'Selvagens', icon: Globe2, color: 'emerald' },
  { id: 'studio', label: 'Studio Assets', icon: Palette, color: 'orange' },
];

const articleCategories = ['Saúde', 'Comportamento', 'Raças', 'Curiosidades', 'Nutrição', 'Higiene', 'Ambiente'];

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState('wiki');
  const [articles, setArticles] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [srdProfiles, setSrdProfiles] = useState([]);
  const [wildFelines, setWildFelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [breedQuery, setBreedQuery] = useState('');
  const [breedType, setBreedType] = useState('all');
  const [srdQuery, setSrdQuery] = useState('');
  const [srdCoat, setSrdCoat] = useState('all');
  const [wildQuery, setWildQuery] = useState('');
  const [wildStatus, setWildStatus] = useState('all');

  useEffect(() => { fetchContent(); }, [activeTab]);

  async function fetchContent() {
    setLoading(true);
    try {
      if (activeTab === 'wiki') {
        const res = await api.get('/articles');
        setArticles(res.data);
      }

      if (activeTab === 'breeds') {
        setBreeds(getAdminBreedCatalog());
      }

      if (activeTab === 'srd') {
        setSrdProfiles(getAdminSrdProfiles());
      }

      if (activeTab === 'wild') {
        setWildFelines(getAdminWildFelines());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const filteredBreeds = useMemo(() => {
    const query = breedQuery.trim().toLowerCase();

    return breeds.filter((breed) => {
      const matchesType = breedType === 'all' || breed.type === breedType;
      const matchesQuery = !query ||
        breed.name.toLowerCase().includes(query) ||
        breed.id.toLowerCase().includes(query) ||
        breed.tags.some((tag) => tag.toLowerCase().includes(query));

      return matchesType && matchesQuery && !breed.archived;
    });
  }, [breedQuery, breedType, breeds]);

  const filteredSrdProfiles = useMemo(() => {
    const query = srdQuery.trim().toLowerCase();

    return srdProfiles.filter((profile) => {
      const matchesCoat = srdCoat === 'all' || profile.coat === srdCoat;
      const matchesQuery = !query ||
        profile.name.toLowerCase().includes(query) ||
        profile.id.toLowerCase().includes(query) ||
        profile.pattern.toLowerCase().includes(query) ||
        profile.traits.some((trait) => trait.toLowerCase().includes(query));

      return matchesCoat && matchesQuery && !profile.archived;
    });
  }, [srdCoat, srdProfiles, srdQuery]);

  const filteredWildFelines = useMemo(() => {
    const query = wildQuery.trim().toLowerCase();

    return wildFelines.filter((item) => {
      const matchesStatus = wildStatus === 'all' || item.status === wildStatus;
      const matchesQuery = !query ||
        item.name.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.scientificName.toLowerCase().includes(query) ||
        item.countries.toLowerCase().includes(query);

      return matchesStatus && matchesQuery && !item.archived;
    });
  }, [wildFelines, wildQuery, wildStatus]);

  const handleArticleDelete = async (id) => {
    if (!window.confirm('Apagar artigo?')) return;
    try {
      await api.delete(`/articles/${id}`);
      fetchContent();
    } catch (error) {
      alert('Erro ao deletar.');
    }
  };

  const handleBreedArchive = (id) => {
    if (!window.confirm('Ocultar esta raca da Gatedopedia?')) return;
    archiveBreedContent(id);
    fetchContent();
  };

  const handleSrdArchive = (id) => {
    if (!window.confirm('Ocultar este perfil SRD da Gatedopedia?')) return;
    archiveSrdProfile(id);
    fetchContent();
  };

  const handleWildArchive = (id) => {
    if (!window.confirm('Ocultar esta especie da Gatedopedia?')) return;
    archiveWildFeline(id);
    fetchContent();
  };

  const activeMeta = tabs.find((tab) => tab.id === activeTab) || tabs[0];
  const ActiveIcon = activeMeta.icon;

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <ActiveIcon className={activeTab === 'wiki' ? 'text-cyan-500' : activeTab === 'breeds' ? 'text-[#8B4AFF]' : activeTab === 'wild' ? 'text-emerald-600' : 'text-orange-500'} />
            Gestao de Conteudo
          </h2>
          <p className="text-sm text-gray-400 font-bold mt-1">Edite artigos, perfis de racas e materiais do ecossistema Gatedo.</p>
        </div>

        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                  isActive ? 'bg-[#8B4AFF]/10 text-[#8B4AFF]' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'wiki' && (
        <ContentFrame
          title={`Artigos (${articles.length})`}
          actionLabel="Novo artigo"
          onAction={() => { setEditingItem(null); setModalOpen(true); }}
        >
          {loading ? <LoadingState /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {articles.map((item) => (
                <ArticleCard
                  key={item.id}
                  item={item}
                  onEdit={() => { setEditingItem(item); setModalOpen(true); }}
                  onDelete={() => handleArticleDelete(item.id)}
                />
              ))}
            </div>
          )}
        </ContentFrame>
      )}

      {activeTab === 'breeds' && (
        <ContentFrame
          title={`Racas (${filteredBreeds.length}/${breeds.filter((breed) => !breed.archived).length})`}
          actionLabel="Nova raca"
          onAction={() => { setEditingItem(null); setModalOpen(true); }}
        >
          <div className="p-6 border-b border-gray-100 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <Search size={18} className="text-gray-300" />
              <input
                value={breedQuery}
                onChange={(event) => setBreedQuery(event.target.value)}
                placeholder="Buscar por nome, slug ou tag..."
                className="bg-transparent outline-none text-sm font-bold text-gray-700 placeholder-gray-300 flex-1"
              />
            </div>

            <select
              value={breedType}
              onChange={(event) => setBreedType(event.target.value)}
              className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-600 outline-none"
            >
              <option value="all">Todas as pelagens</option>
              {BREED_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {loading ? <LoadingState /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
              {filteredBreeds.map((breed) => (
                <BreedCard
                  key={breed.id}
                  breed={breed}
                  onEdit={() => { setEditingItem(breed); setModalOpen(true); }}
                  onArchive={() => handleBreedArchive(breed.id)}
                  onReset={() => { resetBreedContent(breed.id); fetchContent(); }}
                  onPreview={() => window.open(`/wiki/breeds/${breed.id}`, '_blank', 'noopener,noreferrer')}
                />
              ))}
            </div>
          )}
        </ContentFrame>
      )}

      {activeTab === 'srd' && (
        <ContentFrame
          title={`SRD (${filteredSrdProfiles.length}/${srdProfiles.filter((profile) => !profile.archived).length})`}
          actionLabel="Novo perfil SRD"
          onAction={() => { setEditingItem(null); setModalOpen(true); }}
        >
          <div className="p-6 border-b border-gray-100 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <Search size={18} className="text-gray-300" />
              <input
                value={srdQuery}
                onChange={(event) => setSrdQuery(event.target.value)}
                placeholder="Buscar por nome, slug, pelagem ou caracteristica..."
                className="bg-transparent outline-none text-sm font-bold text-gray-700 placeholder-gray-300 flex-1"
              />
            </div>

            <select
              value={srdCoat}
              onChange={(event) => setSrdCoat(event.target.value)}
              className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-600 outline-none"
            >
              <option value="all">Todas as pelagens</option>
              {SRD_COAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {loading ? <LoadingState /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
              {filteredSrdProfiles.map((profile) => (
                <SrdCard
                  key={profile.id}
                  profile={profile}
                  onEdit={() => { setEditingItem(profile); setModalOpen(true); }}
                  onArchive={() => handleSrdArchive(profile.id)}
                  onReset={() => { resetSrdProfile(profile.id); fetchContent(); }}
                  onPreview={() => window.open(`/wiki-srd/${profile.id}`, '_blank', 'noopener,noreferrer')}
                />
              ))}
            </div>
          )}
        </ContentFrame>
      )}

      {activeTab === 'wild' && (
        <ContentFrame
          title={`Felinos selvagens (${filteredWildFelines.length}/${wildFelines.filter((item) => !item.archived).length})`}
          actionLabel="Nova especie"
          onAction={() => { setEditingItem(null); setModalOpen(true); }}
        >
          <div className="p-6 border-b border-gray-100 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <Search size={18} className="text-gray-300" />
              <input
                value={wildQuery}
                onChange={(event) => setWildQuery(event.target.value)}
                placeholder="Buscar por especie, slug, nome cientifico ou pais..."
                className="bg-transparent outline-none text-sm font-bold text-gray-700 placeholder-gray-300 flex-1"
              />
            </div>

            <select
              value={wildStatus}
              onChange={(event) => setWildStatus(event.target.value)}
              className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-600 outline-none"
            >
              <option value="all">Todos os riscos</option>
              {CONSERVATION_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.value} - {option.label}</option>
              ))}
            </select>
          </div>

          {loading ? <LoadingState /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
              {filteredWildFelines.map((item) => (
                <WildFelineCard
                  key={item.id}
                  item={item}
                  onEdit={() => { setEditingItem(item); setModalOpen(true); }}
                  onArchive={() => handleWildArchive(item.id)}
                  onReset={() => { resetWildFeline(item.id); fetchContent(); }}
                  onPreview={() => window.open(`/wiki-wild-felines/${item.id}`, '_blank', 'noopener,noreferrer')}
                />
              ))}
            </div>
          )}
        </ContentFrame>
      )}

      {activeTab === 'studio' && (
        <ContentFrame title="Studio Assets" actionLabel="Novo asset" onAction={() => alert('Modulo de assets ainda nao foi conectado.')}>
          <div className="p-10 text-center">
            <Palette size={42} className="mx-auto text-orange-300 mb-3" />
            <p className="font-black text-gray-700">Assets do Studio</p>
            <p className="text-sm text-gray-400 font-bold mt-1">A estrutura esta preservada para a proxima etapa.</p>
          </div>
        </ContentFrame>
      )}

      {isModalOpen && activeTab === 'wiki' && (
        <ArticleModal
          item={editingItem}
          onClose={() => setModalOpen(false)}
          onSave={() => { fetchContent(); setModalOpen(false); }}
        />
      )}

      {isModalOpen && activeTab === 'breeds' && (
        <BreedModal
          item={editingItem}
          onClose={() => setModalOpen(false)}
          onSave={() => { fetchContent(); setModalOpen(false); }}
        />
      )}

      {isModalOpen && activeTab === 'srd' && (
        <SrdModal
          item={editingItem}
          onClose={() => setModalOpen(false)}
          onSave={() => { fetchContent(); setModalOpen(false); }}
        />
      )}

      {isModalOpen && activeTab === 'wild' && (
        <WildFelineModal
          item={editingItem}
          onClose={() => setModalOpen(false)}
          onSave={() => { fetchContent(); setModalOpen(false); }}
        />
      )}
    </div>
  );
}

function ContentFrame({ title, actionLabel, onAction, children }) {
  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-gray-50/50">
        <h3 className="font-bold text-lg text-gray-700">{title}</h3>
        <button
          onClick={onAction}
          className="bg-[#8B4AFF] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#5046b0]"
        >
          <Plus size={18} /> {actionLabel}
        </button>
      </div>
      {children}
    </div>
  );
}

function LoadingState() {
  return <div className="p-10 text-center text-gray-400">Carregando...</div>;
}

function ArticleCard({ item, onEdit, onDelete }) {
  return (
    <div className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all">
      <div className="h-32 w-full bg-gray-100 relative">
        <img src={item.imageUrl || 'https://placehold.co/600x400?text=Sem+Imagem'} alt={item.title} className="w-full h-full object-cover object-top" />
        <CardActions onEdit={onEdit} onDelete={onDelete} />
        <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm">{item.category}</span>
      </div>
      <div className="p-4">
        <h4 className="font-bold text-gray-800 line-clamp-1">{item.title}</h4>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.content}</p>
      </div>
    </div>
  );
}

function BreedCard({ breed, onEdit, onArchive, onReset, onPreview }) {
  const typeLabel = BREED_TYPE_OPTIONS.find((option) => option.value === breed.type)?.shortLabel || breed.type;

  return (
    <div className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all">
      <div className="h-40 w-full bg-gray-100 relative">
        <img src={breed.img || 'https://placehold.co/600x400?text=Raca'} alt={breed.name} className="w-full h-full object-cover object-top" />
        <CardActions onEdit={onEdit} onDelete={onArchive} onPreview={breed.published ? onPreview : null} />
        <span className="absolute bottom-2 left-2 bg-black/55 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm">{typeLabel}</span>
        <span className={`absolute top-2 left-2 text-[10px] font-black px-2 py-1 rounded-md backdrop-blur-sm flex items-center gap-1 ${
          breed.published ? 'bg-green-100/90 text-green-700' : 'bg-gray-100/90 text-gray-500'
        }`}>
          {breed.published ? <Eye size={12} /> : <EyeOff size={12} />}
          {breed.published ? 'Publicado' : 'Rascunho'}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-black text-gray-800 line-clamp-1">{breed.name}</h4>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">{breed.id}</p>
          </div>
          <button onClick={onReset} title="Restaurar padrao" className="p-2 text-gray-300 hover:text-[#8B4AFF] hover:bg-[#8B4AFF]/10 rounded-lg">
            <RotateCcw size={15} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{breed.desc}</p>
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {breed.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-full">{tag}</span>
          ))}
        </div>
        {breed.published && (
          <button onClick={onPreview} className="mt-4 w-full bg-[#8B4AFF]/10 text-[#8B4AFF] text-xs font-black py-2 rounded-xl flex items-center justify-center gap-2">
            <ExternalLink size={14} /> Ver pagina
          </button>
        )}
      </div>
    </div>
  );
}

function SrdCard({ profile, onEdit, onArchive, onReset, onPreview }) {
  const coatLabel = SRD_COAT_OPTIONS.find((option) => option.value === profile.coat)?.label || profile.coat;

  return (
    <div className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all">
      <div className="h-40 w-full bg-gray-100 relative">
        <img src={profile.img || 'https://placehold.co/600x400?text=SRD'} alt={profile.name} className="w-full h-full object-cover object-top" />
        <CardActions onEdit={onEdit} onDelete={onArchive} onPreview={profile.published ? onPreview : null} />
        <span className={`absolute bottom-2 left-2 text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm ${profile.colorClass}`}>{profile.pattern || coatLabel}</span>
        <span className={`absolute top-2 left-2 text-[10px] font-black px-2 py-1 rounded-md backdrop-blur-sm flex items-center gap-1 ${
          profile.published ? 'bg-green-100/90 text-green-700' : 'bg-gray-100/90 text-gray-500'
        }`}>
          {profile.published ? <Eye size={12} /> : <EyeOff size={12} />}
          {profile.published ? 'Publicado' : 'Rascunho'}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-black text-gray-800 line-clamp-1">{profile.name}</h4>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">{profile.id} · {coatLabel}</p>
          </div>
          <button onClick={onReset} title="Restaurar padrao" className="p-2 text-gray-300 hover:text-[#FF9F43] hover:bg-orange-50 rounded-lg">
            <RotateCcw size={15} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{profile.desc}</p>
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {profile.traits.slice(0, 3).map((trait) => (
            <span key={trait} className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-full">{trait}</span>
          ))}
        </div>
        {profile.published && (
          <button onClick={onPreview} className="mt-4 w-full bg-orange-50 text-[#FF9F43] text-xs font-black py-2 rounded-xl flex items-center justify-center gap-2">
            <ExternalLink size={14} /> Ver pagina
          </button>
        )}
      </div>
    </div>
  );
}

function WildFelineCard({ item, onEdit, onArchive, onReset, onPreview }) {
  const statusMeta = CONSERVATION_STATUS_OPTIONS.find((option) => option.value === item.status) || CONSERVATION_STATUS_OPTIONS.at(-1);

  return (
    <div className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all">
      <div className="h-40 w-full bg-gray-100 relative">
        <img src={item.img || 'https://placehold.co/600x400?text=Felino'} alt={item.name} className="w-full h-full object-cover object-top" />
        <CardActions onEdit={onEdit} onDelete={onArchive} onPreview={item.published ? onPreview : null} />
        <span className={`absolute bottom-2 left-2 text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm ${statusMeta.color}`}>{item.status}</span>
        <span className={`absolute top-2 left-2 text-[10px] font-black px-2 py-1 rounded-md backdrop-blur-sm flex items-center gap-1 ${
          item.published ? 'bg-green-100/90 text-green-700' : 'bg-gray-100/90 text-gray-500'
        }`}>
          {item.published ? <Eye size={12} /> : <EyeOff size={12} />}
          {item.published ? 'Publicado' : 'Rascunho'}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-black text-gray-800 line-clamp-1">{item.name}</h4>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5 italic">{item.scientificName}</p>
          </div>
          <button onClick={onReset} title="Restaurar padrao" className="p-2 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
            <RotateCcw size={15} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{item.desc}</p>
        <p className="text-[10px] text-gray-400 font-bold mt-2 line-clamp-1">{item.region}</p>
        {item.published && (
          <button onClick={onPreview} className="mt-4 w-full bg-emerald-50 text-emerald-700 text-xs font-black py-2 rounded-xl flex items-center justify-center gap-2">
            <ExternalLink size={14} /> Ver pagina
          </button>
        )}
      </div>
    </div>
  );
}

function CardActions({ onEdit, onDelete, onPreview }) {
  return (
    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {onPreview && <button onClick={onPreview} className="p-1.5 bg-white text-[#8B4AFF] rounded-lg shadow-sm"><ExternalLink size={14} /></button>}
      <button onClick={onEdit} className="p-1.5 bg-white text-blue-500 rounded-lg shadow-sm"><Edit size={14} /></button>
      <button onClick={onDelete} className="p-1.5 bg-white text-red-500 rounded-lg shadow-sm"><Trash2 size={14} /></button>
    </div>
  );
}

function ArticleModal({ item, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    category: item?.category || 'Saúde',
    imageUrl: item?.imageUrl || '',
    content: item?.content || '',
  });
  const [uploading, setUploading] = useState(false);

  async function handleImageUpload(event) {
    const url = await uploadImage(event, setUploading);
    if (url) setFormData((prev) => ({ ...prev, imageUrl: url }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      item ? await api.patch(`/articles/${item.id}`, formData) : await api.post('/articles', formData);
      onSave();
    } catch (error) {
      alert('Erro ao salvar.');
    }
  }

  return (
    <ModalShell title={`${item ? 'Editar' : 'Novo'} Artigo`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Field label="Titulo">
          <input className="admin-input" value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} required />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Categoria">
            <select className="admin-input bg-white" value={formData.category} onChange={(event) => setFormData({ ...formData, category: event.target.value })}>
              {articleCategories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </Field>
          <UploadField uploading={uploading} hasImage={!!formData.imageUrl} onChange={handleImageUpload} />
        </div>

        <Field label="Conteudo">
          <textarea className="admin-input min-h-[150px]" value={formData.content} onChange={(event) => setFormData({ ...formData, content: event.target.value })} required />
        </Field>

        <ModalActions onClose={onClose} disabled={uploading} />
      </form>
    </ModalShell>
  );
}

function BreedModal({ item, onClose, onSave }) {
  const [formData, setFormData] = useState(() => ({
    id: item?.id || '',
    name: item?.name || '',
    type: item?.type || 'curta',
    img: item?.img || '',
    tagline: item?.tagline || '',
    desc: item?.desc || '',
    origin: item?.specs?.origin || '',
    life: item?.specs?.life || '',
    weight: item?.specs?.weight || '',
    tags: item?.tags?.join(', ') || '',
    order: item?.order || 999,
    published: item?.published !== false,
    energy: item?.stats?.energy ?? 50,
    affection: item?.stats?.affection ?? 50,
    intelligence: item?.stats?.intelligence ?? 50,
    shedding: item?.stats?.shedding ?? 50,
  }));
  const [uploading, setUploading] = useState(false);

  function updateField(field, value) {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && !item?.id) next.id = createBreedSlug(value);
      return next;
    });
  }

  async function handleImageUpload(event) {
    const url = await uploadImage(event, setUploading);
    if (url) updateField('img', url);
  }

  function handleSubmit(event) {
    event.preventDefault();
    saveBreedContent({
      id: formData.id,
      name: formData.name,
      type: formData.type,
      img: formData.img,
      tagline: formData.tagline,
      desc: formData.desc,
      specs: { origin: formData.origin, life: formData.life, weight: formData.weight },
      stats: {
        energy: formData.energy,
        affection: formData.affection,
        intelligence: formData.intelligence,
        shedding: formData.shedding,
      },
      tags: formData.tags,
      order: formData.order,
      published: formData.published,
      archived: false,
    });
    onSave();
  }

  return (
    <ModalShell title={`${item ? 'Editar' : 'Nova'} Raca`} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
              {formData.img ? <img src={formData.img} alt={formData.name} className="w-full h-full object-cover object-top" /> : null}
            </div>
            <div className="mt-3">
              <UploadField uploading={uploading} hasImage={!!formData.img} onChange={handleImageUpload} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nome da raca">
                <input className="admin-input" value={formData.name} onChange={(event) => updateField('name', event.target.value)} required />
              </Field>
              <Field label="Slug">
                <input className="admin-input" value={formData.id} onChange={(event) => updateField('id', createBreedSlug(event.target.value))} required />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Pelagem">
                <select className="admin-input bg-white" value={formData.type} onChange={(event) => updateField('type', event.target.value)}>
                  {BREED_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </Field>
              <Field label="Ordem">
                <input type="number" className="admin-input" value={formData.order} onChange={(event) => updateField('order', Number(event.target.value))} />
              </Field>
              <label className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mt-5">
                <input type="checkbox" checked={formData.published} onChange={(event) => updateField('published', event.target.checked)} />
                <span className="text-sm font-bold text-gray-600">Publicado</span>
              </label>
            </div>

            <Field label="Chamada">
              <input className="admin-input" value={formData.tagline} onChange={(event) => updateField('tagline', event.target.value)} />
            </Field>

            <Field label="Sobre a raca">
              <textarea className="admin-input min-h-[130px]" value={formData.desc} onChange={(event) => updateField('desc', event.target.value)} required />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Origem">
            <input className="admin-input" value={formData.origin} onChange={(event) => updateField('origin', event.target.value)} />
          </Field>
          <Field label="Expectativa de vida">
            <input className="admin-input" value={formData.life} onChange={(event) => updateField('life', event.target.value)} />
          </Field>
          <Field label="Peso">
            <input className="admin-input" value={formData.weight} onChange={(event) => updateField('weight', event.target.value)} />
          </Field>
        </div>

        <Field label="Tags separadas por virgula">
          <input className="admin-input" value={formData.tags} onChange={(event) => updateField('tags', event.target.value)} />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatInput label="Energia" value={formData.energy} onChange={(value) => updateField('energy', value)} />
          <StatInput label="Apego" value={formData.affection} onChange={(value) => updateField('affection', value)} />
          <StatInput label="Inteligencia" value={formData.intelligence} onChange={(value) => updateField('intelligence', value)} />
          <StatInput label="Queda de pelo" value={formData.shedding} onChange={(value) => updateField('shedding', value)} />
        </div>

        <ModalActions onClose={onClose} disabled={uploading} />
      </form>
    </ModalShell>
  );
}

function SrdModal({ item, onClose, onSave }) {
  const [formData, setFormData] = useState(() => ({
    id: item?.id || '',
    name: item?.name || '',
    coat: item?.coat || 'curta',
    pattern: item?.pattern || '',
    colorClass: item?.colorClass || 'bg-gray-700 text-white',
    img: item?.img || '',
    desc: item?.desc || '',
    traits: item?.traits?.join(', ') || '',
    care: item?.care || '',
    order: item?.order || 999,
    published: item?.published !== false,
  }));
  const [uploading, setUploading] = useState(false);

  function updateField(field, value) {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && !item?.id) next.id = createBreedSlug(value);
      return next;
    });
  }

  async function handleImageUpload(event) {
    const url = await uploadImage(event, setUploading);
    if (url) updateField('img', url);
  }

  function handleSubmit(event) {
    event.preventDefault();
    saveSrdProfile({
      id: formData.id,
      name: formData.name,
      coat: formData.coat,
      pattern: formData.pattern,
      colorClass: formData.colorClass,
      img: formData.img,
      desc: formData.desc,
      traits: formData.traits,
      care: formData.care,
      order: formData.order,
      published: formData.published,
      archived: false,
    });
    onSave();
  }

  return (
    <ModalShell title={`${item ? 'Editar' : 'Novo'} Perfil SRD`} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
              {formData.img ? <img src={formData.img} alt={formData.name} className="w-full h-full object-cover object-top" /> : null}
            </div>
            <div className="mt-3">
              <UploadField uploading={uploading} hasImage={!!formData.img} onChange={handleImageUpload} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nome do perfil">
                <input className="admin-input" value={formData.name} onChange={(event) => updateField('name', event.target.value)} required />
              </Field>
              <Field label="Slug">
                <input className="admin-input" value={formData.id} onChange={(event) => updateField('id', createBreedSlug(event.target.value))} required />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Tipo de pelagem">
                <select className="admin-input bg-white" value={formData.coat} onChange={(event) => updateField('coat', event.target.value)}>
                  {SRD_COAT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </Field>
              <Field label="Ordem">
                <input type="number" className="admin-input" value={formData.order} onChange={(event) => updateField('order', Number(event.target.value))} />
              </Field>
              <label className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mt-5">
                <input type="checkbox" checked={formData.published} onChange={(event) => updateField('published', event.target.checked)} />
                <span className="text-sm font-bold text-gray-600">Publicado</span>
              </label>
            </div>

            <Field label="Padrao visual">
              <input className="admin-input" placeholder="Ex: preto e branco, rajado, colorpoint..." value={formData.pattern} onChange={(event) => updateField('pattern', event.target.value)} required />
            </Field>

            <Field label="Classe de cor do selo">
              <input className="admin-input" placeholder="Ex: bg-orange-500 text-white" value={formData.colorClass} onChange={(event) => updateField('colorClass', event.target.value)} />
            </Field>

            <Field label="Descricao">
              <textarea className="admin-input min-h-[120px]" value={formData.desc} onChange={(event) => updateField('desc', event.target.value)} required />
            </Field>
          </div>
        </div>

        <Field label="Caracteristicas separadas por virgula">
          <input className="admin-input" value={formData.traits} onChange={(event) => updateField('traits', event.target.value)} />
        </Field>

        <Field label="Cuidados e observacoes">
          <textarea className="admin-input min-h-[90px]" value={formData.care} onChange={(event) => updateField('care', event.target.value)} />
        </Field>

        <ModalActions onClose={onClose} disabled={uploading} />
      </form>
    </ModalShell>
  );
}

function WildFelineModal({ item, onClose, onSave }) {
  const [formData, setFormData] = useState(() => ({
    id: item?.id || '',
    name: item?.name || '',
    scientificName: item?.scientificName || '',
    region: item?.region || '',
    countries: item?.countries || '',
    habitat: item?.habitat || '',
    status: item?.status || 'DD',
    population: item?.population || '',
    trend: item?.trend || '',
    weight: item?.weight || '',
    length: item?.length || '',
    diet: item?.diet || '',
    threats: item?.threats || '',
    conservation: item?.conservation || '',
    desc: item?.desc || '',
    facts: item?.facts?.join(', ') || '',
    img: item?.img || '',
    order: item?.order || 999,
    published: item?.published !== false,
  }));
  const [uploading, setUploading] = useState(false);

  function updateField(field, value) {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && !item?.id) next.id = createBreedSlug(value);
      return next;
    });
  }

  async function handleImageUpload(event) {
    const url = await uploadImage(event, setUploading);
    if (url) updateField('img', url);
  }

  function handleSubmit(event) {
    event.preventDefault();
    saveWildFeline({ ...formData, archived: false });
    onSave();
  }

  return (
    <ModalShell title={`${item ? 'Editar' : 'Nova'} Especie de Felino`} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
              {formData.img ? <img src={formData.img} alt={formData.name} className="w-full h-full object-cover object-top" /> : null}
            </div>
            <div className="mt-3">
              <UploadField uploading={uploading} hasImage={!!formData.img} onChange={handleImageUpload} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nome popular">
                <input className="admin-input" value={formData.name} onChange={(event) => updateField('name', event.target.value)} required />
              </Field>
              <Field label="Slug">
                <input className="admin-input" value={formData.id} onChange={(event) => updateField('id', createBreedSlug(event.target.value))} required />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Nome cientifico">
                <input className="admin-input" value={formData.scientificName} onChange={(event) => updateField('scientificName', event.target.value)} />
              </Field>
              <Field label="Risco IUCN">
                <select className="admin-input bg-white" value={formData.status} onChange={(event) => updateField('status', event.target.value)}>
                  {CONSERVATION_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.value} - {option.label}</option>)}
                </select>
              </Field>
              <Field label="Ordem">
                <input type="number" className="admin-input" value={formData.order} onChange={(event) => updateField('order', Number(event.target.value))} />
              </Field>
            </div>

            <label className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
              <input type="checkbox" checked={formData.published} onChange={(event) => updateField('published', event.target.checked)} />
              <span className="text-sm font-bold text-gray-600">Publicado</span>
            </label>

            <Field label="Descricao">
              <textarea className="admin-input min-h-[120px]" value={formData.desc} onChange={(event) => updateField('desc', event.target.value)} required />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Regiao de origem/ocorrencia">
            <input className="admin-input" value={formData.region} onChange={(event) => updateField('region', event.target.value)} />
          </Field>
          <Field label="Paises">
            <input className="admin-input" value={formData.countries} onChange={(event) => updateField('countries', event.target.value)} />
          </Field>
          <Field label="Peso">
            <input className="admin-input" value={formData.weight} onChange={(event) => updateField('weight', event.target.value)} />
          </Field>
          <Field label="Tamanho">
            <input className="admin-input" value={formData.length} onChange={(event) => updateField('length', event.target.value)} />
          </Field>
          <Field label="Populacao estimada">
            <input className="admin-input" value={formData.population} onChange={(event) => updateField('population', event.target.value)} />
          </Field>
          <Field label="Tendencia">
            <input className="admin-input" value={formData.trend} onChange={(event) => updateField('trend', event.target.value)} />
          </Field>
        </div>

        <Field label="Habitat">
          <textarea className="admin-input min-h-[80px]" value={formData.habitat} onChange={(event) => updateField('habitat', event.target.value)} />
        </Field>
        <Field label="Dieta">
          <textarea className="admin-input min-h-[80px]" value={formData.diet} onChange={(event) => updateField('diet', event.target.value)} />
        </Field>
        <Field label="Ameacas">
          <textarea className="admin-input min-h-[90px]" value={formData.threats} onChange={(event) => updateField('threats', event.target.value)} />
        </Field>
        <Field label="Conservacao">
          <textarea className="admin-input min-h-[90px]" value={formData.conservation} onChange={(event) => updateField('conservation', event.target.value)} />
        </Field>
        <Field label="Fatos separados por virgula">
          <input className="admin-input" value={formData.facts} onChange={(event) => updateField('facts', event.target.value)} />
        </Field>

        <ModalActions onClose={onClose} disabled={uploading} />
      </form>
    </ModalShell>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-gray-500 mb-1">{label}</span>
      {children}
    </label>
  );
}

function StatInput({ label, value, onChange }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-gray-500">{label}</span>
        <span className="text-xs font-black text-[#8B4AFF]">{value}%</span>
      </div>
      <input type="range" min="0" max="100" value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-[#8B4AFF]" />
    </div>
  );
}

function UploadField({ uploading, hasImage, onChange }) {
  const inputId = useMemo(() => `upload-${Math.random().toString(36).slice(2)}`, []);

  return (
    <Field label="Capa (JPG, PNG, WebP)">
      <input type="file" accept="image/png, image/jpeg, image/webp" onChange={onChange} className="hidden" id={inputId} />
      <label htmlFor={inputId} className={`w-full border border-dashed border-gray-300 rounded-xl p-2.5 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 ${uploading ? 'opacity-50' : ''}`}>
        {uploading ? <Loader2 size={18} className="animate-spin text-[#8B4AFF]" /> : hasImage ? <span className="text-xs font-bold text-green-600">Imagem OK</span> : <><Upload size={16} className="text-gray-400" /><span className="text-xs text-gray-500">Upload</span></>}
      </label>
    </Field>
  );
}

function ModalShell({ title, onClose, wide = false, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl w-full ${wide ? 'max-w-5xl' : 'max-w-lg'} max-h-[92vh] overflow-y-auto shadow-2xl`}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onClose, disabled }) {
  return (
    <div className="pt-4 flex gap-3">
      <button type="button" onClick={onClose} className="flex-1 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl">Cancelar</button>
      <button type="submit" disabled={disabled} className="flex-1 py-3 font-bold text-white bg-[#8B4AFF] rounded-xl hover:brightness-110 disabled:opacity-70">Salvar</button>
    </div>
  );
}

async function uploadImage(event, setUploading) {
  const file = event.target.files?.[0];
  if (!file) return null;

  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    alert('Formato invalido. Use JPG, PNG ou WebP.');
    return null;
  }

  setUploading(true);
  const data = new FormData();
  data.append('file', file);

  try {
    const response = await api.post('/media/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.url;
  } catch (error) {
    console.error('Erro upload:', error);
    alert('Erro ao subir imagem. Verifique se o backend esta rodando e aceita uploads.');
    return null;
  } finally {
    setUploading(false);
    event.target.value = '';
  }
}
