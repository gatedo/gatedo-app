import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, PawPrint, Upload, Sparkles, Image as ImageIcon, Wand2, Clock3, Bell, Check
} from 'lucide-react';
import api from '../../services/api';

const C = {
  dark: '#0f0a1e',
  card: '#1a1030',
  purple: '#8B4AFF',
  accent: '#ebfc66',
};

const STYLE_PRESETS = {
  sticker: ['Fofo', 'Minimal', 'Emoji', 'Recorte branco'],
  portrait: ['Pixar', 'Aquarela', 'Editorial', 'Anime'],
  id: ['Documento premium', 'Ficha clean', 'Crachá neon', 'Card social'],
  'mind-reader': ['Sarcástico', 'Fofo', 'Dramático', 'Caótico'],
  'tutor-cat': ['Cinemático', 'Mágico', 'Lifestyle', 'Divertido'],
  dance: ['Trend viral', 'Loop curto', 'Stage neon', 'Disco cat'],
};

export default function StudioModuleShell({
  moduleKey = 'portrait',
  title,
  subtitle,
  gradient = 'linear-gradient(135deg, #8B4AFF 0%, #ec4899 100%)',
  cost = 8,
  xpReward = 4,
  outputLabel = 'Imagem',
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { studioTool, selectedPet } = location.state || {};

  const [selectedPreset, setSelectedPreset] = useState(STYLE_PRESETS[moduleKey]?.[0] || 'Default');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultReady, setResultReady] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState('');
  const [resultUrl, setResultUrl] = useState('');

  const presets = useMemo(() => STYLE_PRESETS[moduleKey] || ['Default'], [moduleKey]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setSelectedFileUrl(URL.createObjectURL(file));
  };

  const uploadInput = async () => {
    if (!selectedFile) throw new Error('Selecione uma imagem');

    const fd = new FormData();
    fd.append('file', selectedFile);

    const res = await api.post('/media/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data?.url;
  };

  const handleGenerate = async () => {
    if (!selectedPet?.id) {
      alert('Selecione um gato primeiro no Studio');
      return;
    }

    if (!selectedFile) {
      alert('Envie uma imagem primeiro');
      return;
    }

    setIsGenerating(true);
    setResultReady(false);
    setResultUrl('');

    try {
      const originalPhotoUrl = await uploadInput();

      const res = await api.post('/studio/generate', {
        moduleKey,
        petId: selectedPet.id,
        originalPhotoUrl,
        preset: selectedPreset,
        prompt,
      });

      const generatedUrl = res.data?.creation?.resultUrl;
      if (!generatedUrl) {
        throw new Error('A IA não retornou imagem');
      }

      setResultUrl(generatedUrl);
      setResultReady(true);
      window.dispatchEvent(new CustomEvent('gatedo:xp-updated'));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || err?.message || 'Erro ao gerar');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen text-white px-5 py-6 pb-28" style={{ background: C.dark }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <button
            onClick={() => navigate('/studio')}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <ArrowLeft size={17} />
          </button>

          <div className="px-4 py-2 rounded-full border border-white/10 text-sm font-black"
               style={{ background: 'rgba(255,255,255,0.06)' }}>
            {title}
          </div>

          <div className="px-3 py-2 rounded-full border border-white/10 text-[10px] font-black"
               style={{ background: 'rgba(255,255,255,0.06)' }}>
            {studioTool?.cost || cost} pts
          </div>
        </div>

        <div className="rounded-[30px] overflow-hidden border border-white/10 mb-5" style={{ background: C.card }}>
          <div className="p-6" style={{ background: gradient }}>
            <p className="text-[10px] uppercase tracking-[3px] text-white/65 font-black mb-2">Módulo criativo</p>
            <h1 className="text-2xl font-black mb-1">{title}</h1>
            <p className="text-sm text-white/75 max-w-xl">{subtitle}</p>
          </div>

          <div className="p-5 grid md:grid-cols-[1.2fr_0.8fr] gap-4">
            <div className="space-y-4">
              <div className="rounded-[24px] p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-[9px] uppercase tracking-[3px] text-white/35 font-black mb-2">Perfil vinculado</p>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                    {selectedPet?.photoUrl ? (
                      <img src={selectedPet.photoUrl} alt={selectedPet.name} className="w-full h-full object-cover" />
                    ) : (
                      <PawPrint size={22} className="text-white/30" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black">{selectedPet?.name || 'Nenhum gato selecionado'}</p>
                    <p className="text-[11px] text-white/45">
                      {selectedPet?.breed || 'Volte ao Studio para escolher o perfil correto'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-[9px] uppercase tracking-[3px] text-white/35 font-black mb-3">Preset</p>
                <div className="flex flex-wrap gap-2">
                  {presets.map((preset) => {
                    const active = preset === selectedPreset;
                    return (
                      <button
                        key={preset}
                        onClick={() => setSelectedPreset(preset)}
                        className="px-3 py-2 rounded-full text-[11px] font-black transition-all"
                        style={{
                          background: active ? C.accent : 'rgba(255,255,255,0.06)',
                          color: active ? '#1a1a00' : 'rgba(255,255,255,0.7)',
                          border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[24px] p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-[9px] uppercase tracking-[3px] text-white/35 font-black mb-2">Direção criativa</p>
                <textarea
                  rows={5}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Descreva mood, estilo, humor ou cenário..."
                  className="w-full rounded-[18px] p-4 bg-white/5 border border-white/10 text-sm outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[24px] p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-[9px] uppercase tracking-[3px] text-white/35 font-black mb-1">Custo</p>
                  <p className="text-lg font-black">{studioTool?.cost || cost} pts</p>
                </div>
                <div className="rounded-[24px] p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-[9px] uppercase tracking-[3px] text-white/35 font-black mb-1">Recompensa</p>
                  <p className="text-lg font-black">+{studioTool?.xpReward || xpReward} XP</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="rounded-[24px] p-4 border border-dashed border-white/10 min-h-[250px] flex flex-col items-center justify-center text-center cursor-pointer"
                   style={{ background: 'rgba(255,255,255,0.03)' }}>
                {!selectedFileUrl ? (
                  <>
                    <Upload size={22} className="text-white/40 mb-3" />
                    <p className="text-sm font-black">Enviar foto base</p>
                    <p className="text-[11px] text-white/45 mt-2">
                      Selecione a imagem do gato para gerar o resultado.
                    </p>
                  </>
                ) : (
                  <img src={selectedFileUrl} alt="preview" className="w-full h-[220px] object-cover rounded-[18px]" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>

              <div className="rounded-[24px] p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-[9px] uppercase tracking-[3px] text-white/35 font-black mb-3">Saída esperada</p>
                <div className="flex items-center gap-2 text-sm font-black text-white/80">
                  <ImageIcon size={16} />
                  {outputLabel}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedPet || !selectedFile}
                className="w-full py-4 rounded-[20px] font-black text-sm uppercase tracking-wider disabled:opacity-40"
                style={{ background: gradient }}
              >
                {isGenerating ? 'Gerando...' : 'Gerar com IA'}
              </button>

              {resultReady && resultUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[24px] p-4 border border-white/10"
                  style={{ background: 'rgba(223,255,64,0.06)' }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Check size={16} color={C.accent} className="mt-0.5" />
                    <div>
                      <p className="text-sm font-black text-white">Criação concluída</p>
                      <p className="text-[11px] text-white/55 mt-1">
                        Asset salvo no Studio. Agora você já pode usar no Comunigato.
                      </p>
                    </div>
                  </div>

                  <img src={resultUrl} alt="resultado" className="w-full rounded-[18px] object-cover" />
                </motion.div>
              )}

              {!selectedPet && (
                <div className="rounded-[24px] p-4 border border-white/10" style={{ background: 'rgba(245,158,11,0.08)' }}>
                  <div className="flex items-start gap-3">
                    <Clock3 size={16} className="text-amber-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-black text-white">Selecione um gato no Studio</p>
                      <p className="text-[11px] text-white/55 mt-1">
                        A geração final deve sempre estar ligada ao pet ativo.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate('/alerts')}
                className="w-full py-3 rounded-[18px] border border-white/10 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <Bell size={14} />
                Ver novidades e lançamentos
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="flex items-start gap-3">
            <Wand2 size={16} className="text-white/60 mt-0.5" />
            <div>
              <p className="text-sm font-black">Fluxo real do Studio ativado</p>
              <p className="text-[11px] text-white/55 mt-1">
                Agora este módulo já sobe mídia, chama IA, persiste em StudioCreation e dispara atualização de XP.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}