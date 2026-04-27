import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Sparkles,
  Download,
  Share2,
  PawPrint,
  Zap,
  Check,
} from 'lucide-react'

import useSensory from '../hooks/useSensory'
import api from '../services/api'
import { useGamification } from '../context/GamificationContext'

const C = {
  purple: '#8B4AFF',
  accent: '#DFFF40',
  accentDim: '#ebfc66',
  dark: '#13131f',
  card: '#1a1030',
}

const DEFAULT_STICKERS = [
  { id: 'cute', label: 'Fofo 😻' },
  { id: 'king', label: 'Rei 👑' },
  { id: 'sleep', label: 'Dorminhoco 😴' },
  { id: 'hunter', label: 'Caçador 🐾' },
  { id: 'love', label: 'Apaixonado ❤️' },
]

function CoinChip({ amount }) {
  return (
    <div
      className="flex items-center gap-1 rounded-full px-2.5 py-1"
      style={{ background: 'rgba(223,255,64,0.12)', border: '1px solid rgba(223,255,64,0.25)' }}
    >
      <PawPrint size={11} color={C.accentDim} fill={C.accentDim} />
      <span className="text-[10px] font-black" style={{ color: C.accentDim }}>
        {amount} pts
      </span>
    </div>
  )
}

function XPChip({ amount }) {
  return (
    <div
      className="flex items-center gap-1 rounded-full px-2.5 py-1"
      style={{ background: 'rgba(139,74,255,0.16)', border: '1px solid rgba(139,74,255,0.25)' }}
    >
      <Zap size={11} color={C.purple} fill={C.purple} />
      <span className="text-[10px] font-black" style={{ color: '#cbb1ff' }}>
        {amount} XP
      </span>
    </div>
  )
}

export default function StudioSticker() {
  const navigate = useNavigate()
  const location = useLocation()
  const touch = useSensory()

  const { points, xp, spendPoints, earnXP, incrementStat } = useGamification()

  const studioTool = location.state?.studioTool || null
  const selectedPetFromStudio = location.state?.selectedPet || null

  const COST_POINTS = studioTool?.cost ?? 3
  const XP_GAIN = studioTool?.xpReward ?? 2

  const [step, setStep] = useState(1)
  const [selectedPet] = useState(selectedPetFromStudio)
  const [selectedSticker, setSelectedSticker] = useState('cute')
  const [isGenerating, setIsGenerating] = useState(false)
  const [publishToFeed, setPublishToFeed] = useState(true)
  const [result, setResult] = useState(null)

  const stickers = useMemo(() => DEFAULT_STICKERS, [])

  const ensureRequirements = () => {
    if (!selectedPet?.id) {
      navigate('/studio')
      return false
    }

    if (points < COST_POINTS) {
      navigate('/clube?from=studio&reason=points')
      return false
    }

    return true
  }

  const handleGenerate = async () => {
    if (!ensureRequirements()) return

    touch('success')

    try {
      setIsGenerating(true)

      const spent = spendPoints(COST_POINTS)

      if (!spent) {
        navigate('/clube?from=studio&reason=points')
        return
      }

      const fakeSticker =
        'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=800&q=80'

      await new Promise((r) => setTimeout(r, 1400))

      earnXP(XP_GAIN, 'Studio Sticker')
      incrementStat('studioCount', 1)

      if (publishToFeed) {
        await api.post('/posts', {
          petId: selectedPet.id,
          type: 'sticker',
          content: `Sticker ${selectedSticker} criado no Studio`,
          imageUrl: fakeSticker,
        })
      }

      setResult(fakeSticker)
      setStep(3)
    } catch (err) {
      console.error('Erro ao gerar sticker:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const reset = () => {
    setStep(1)
    setResult(null)
  }

  return (
    <div className="min-h-screen pb-32 pt-6 px-5 text-white" style={{ background: C.dark }}>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            touch()
            navigate(-1)
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <ArrowLeft size={18} />
        </button>

        <div className="text-center">
          <h1 className="text-lg font-black">Sticker Mágico</h1>
          <p className="text-[10px] font-black mt-1" style={{ color: C.accentDim }}>
            custo {COST_POINTS} moedas • +{XP_GAIN} XP
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CoinChip amount={points} />
          <XPChip amount={xp} />
        </div>
      </div>

      {/* PET VINCULADO */}
      <div
        className="mb-5 rounded-[22px] p-3 border"
        style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Perfil vinculado</p>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
            {selectedPet?.photoUrl ? (
              <img src={selectedPet.photoUrl} alt={selectedPet.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <PawPrint size={18} className="text-white/30" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="text-sm font-black text-white">{selectedPet?.name || 'Nenhum gato selecionado'}</p>
            <p className="text-[9px] text-white/35 font-bold">
              Essa criação será vinculada ao perfil deste gato
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-5"
          >
            <div
              className="rounded-[30px] p-5 border"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Escolha o pack</p>
                  <h2 className="text-xl font-black text-white">Qual sticker vamos criar?</h2>
                </div>
                <Sparkles size={18} color={C.accentDim} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {stickers.map((sticker) => {
                  const active = selectedSticker === sticker.id
                  return (
                    <button
                      key={sticker.id}
                      onClick={() => {
                        touch()
                        setSelectedSticker(sticker.id)
                      }}
                      className="rounded-[20px] p-4 text-left border transition-all"
                      style={{
                        background: active ? `${C.purple}18` : 'rgba(255,255,255,0.04)',
                        borderColor: active ? `${C.purple}60` : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <p className="text-sm font-black text-white">{sticker.label}</p>
                      <p className="text-[9px] text-white/35 font-bold mt-1">Pack rápido para feed e perfil</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div
              className="rounded-[24px] p-4 border"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <button
                onClick={() => setPublishToFeed((v) => !v)}
                className="w-full flex items-center justify-between"
              >
                <div className="text-left">
                  <p className="text-[10px] font-black text-white">Publicar no Comunigato</p>
                  <p className="text-[9px] text-white/35 font-bold">
                    Também aparece no perfil social do gato
                  </p>
                </div>

                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center border"
                  style={{
                    background: publishToFeed ? `${C.accentDim}20` : 'rgba(255,255,255,0.05)',
                    borderColor: publishToFeed ? `${C.accentDim}60` : 'rgba(255,255,255,0.08)',
                  }}
                >
                  {publishToFeed && <Check size={15} color={C.accentDim} />}
                </div>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <CoinChip amount={points} />
              <XPChip amount={xp} />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedPet?.id}
              className="w-full py-4 rounded-[24px] font-black text-base flex items-center justify-center gap-2 transition-all"
              style={{
                background: !selectedPet?.id ? 'rgba(255,255,255,0.08)' : C.purple,
                color: !selectedPet?.id ? 'rgba(255,255,255,0.3)' : 'white',
              }}
            >
              <Sparkles size={18} />
              {isGenerating ? 'Gerando sticker...' : 'Criar Sticker ✨'}
            </button>
          </motion.div>
        )}

        {step === 3 && result && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="space-y-5"
          >
            <div
              className="rounded-[32px] overflow-hidden border"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <img src={result} alt="Sticker gerado" className="w-full aspect-square object-cover" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="bg-[#ebfc66] text-[#13131f] py-4 rounded-[20px] font-black flex items-center justify-center gap-2">
                <Download size={18} />
                Salvar
              </button>

              <button className="bg-white/10 text-white py-4 rounded-[20px] font-black flex items-center justify-center gap-2">
                <Share2 size={18} />
                Compartilhar
              </button>
            </div>

            <button onClick={reset} className="w-full text-center text-xs font-black text-white/40 py-2">
              Criar outro
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}