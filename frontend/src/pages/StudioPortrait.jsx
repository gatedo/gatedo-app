import React, { useState, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Wand2,
  Download,
  Share2,
  Image as ImageIcon,
} from 'lucide-react'

import useSensory from "../hooks/useSensory";
import { catsData } from "../data/cats";

import { AuthContext } from "../context/AuthContext";
import { useGamification } from '../context/GamificationContext';

import api from "../services/api";


/*
CUSTOS DO MÓDULO
ajustável depois via config global
*/

const COST_POINTS = 8
const XP_GAIN = 4

const STYLES = [
  { id: 'pixar', label: '3D Disney' },
  { id: 'astronaut', label: 'Astronauta' },
  { id: 'royal', label: 'Realeza' },
  { id: 'cyber', label: 'Cyberpunk' },
  { id: 'ghibli', label: 'Anime' },
]

export default function StudioPortrait() {
  const navigate = useNavigate()
  const touch = useSensory()

  const { user } = useContext(AuthContext)
  const { points, debitPoints, addXP } =
    useContext(GamificationContext)

  const [step, setStep] = useState(1)
  const [selectedCat, setSelectedCat] = useState(null)
  const [selectedStyle, setSelectedStyle] = useState('pixar')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState(null)

  /*
  ========================
  CHECK SALDO
  ========================
  */

  const ensureBalance = () => {
    if (points < COST_POINTS) {
      navigate('/clube')
      return false
    }

    return true
  }

  /*
  ========================
  GERAR ARTE
  ========================
  */

  const handleGenerate = async () => {
    if (!selectedCat) return

    if (!ensureBalance()) return

    touch('success')

    try {
      setIsGenerating(true)

      /*
      FUTURO:
      endpoint real IA
      */

      const fakeResult =
        'https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=600&q=80'

      await new Promise((r) => setTimeout(r, 2200))

      /*
      debita moedas
      */

      debitPoints(COST_POINTS)

      /*
      adiciona XP
      */

      addXP(XP_GAIN)

      /*
      cria POST
      */

      await api.post('/posts', {
        userId: user.id,
        petId: selectedCat.id,
        type: 'portrait',
        content: `Retrato mágico estilo ${selectedStyle}`,
        imageUrl: fakeResult,
      })

      setResult(fakeResult)
      setStep(3)
    } catch (err) {
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  /*
  ========================
  RESET
  ========================
  */

  const reset = () => {
    setStep(1)
    setResult(null)
    setSelectedCat(null)
  }

  return (
    <div className="min-h-screen bg-[#13131f] pb-32 pt-6 px-5 text-white">

      {/* HEADER */}

      <div className="flex items-center justify-between mb-6">

        <button
          onClick={() => {
            touch()
            navigate(-1)
          }}
          className="bg-white/10 w-10 h-10 rounded-full flex items-center justify-center"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="text-center">

          <h1 className="text-lg font-black">
            Retrato Mágico
          </h1>

          <p className="text-xs text-[#ebfc66] mt-1">
            custo {COST_POINTS} moedas • +{XP_GAIN} XP
          </p>

        </div>

        <div className="w-10" />

      </div>

      <AnimatePresence mode="wait">

        {/* STEP 1 */}

        {step === 1 && (

          <motion.div
            key="step1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >

            <h2 className="text-2xl font-black mb-6 text-center">
              Quem será o modelo?
            </h2>

            <div className="grid grid-cols-2 gap-4">

              {catsData.map((cat) => (

                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCat(cat)
                    setStep(2)
                  }}
                  className="aspect-square rounded-[24px] overflow-hidden border border-white/10"
                >

                  <img
                    src={cat.image}
                    className="w-full h-full object-cover"
                  />

                </button>

              ))}

            </div>

          </motion.div>

        )}

        {/* STEP 2 */}

        {step === 2 && (

          <motion.div
            key="step2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >

            <div className="flex gap-3 overflow-x-auto pb-6">

              {STYLES.map((style) => (

                <button
                  key={style.id}
                  onClick={() =>
                    setSelectedStyle(style.id)
                  }
                  className={`px-4 py-2 rounded-full text-xs font-bold ${
                    selectedStyle === style.id
                      ? 'bg-[#ebfc66] text-black'
                      : 'bg-white/10'
                  }`}
                >

                  {style.label}

                </button>

              ))}

            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-4 rounded-2xl bg-[#8B4AFF] font-black"
            >

              {isGenerating
                ? 'Criando...'
                : 'Gerar Arte ✨'}

            </button>

          </motion.div>

        )}

        {/* STEP 3 */}

        {step === 3 && result && (

          <motion.div
            key="step3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >

            <img
              src={result}
              className="rounded-3xl mb-6"
            />

            <div className="grid grid-cols-2 gap-4">

              <button className="bg-[#ebfc66] text-black py-4 rounded-2xl font-black">

                <Download size={18} /> salvar

              </button>

              <button className="bg-white/10 py-4 rounded-2xl font-black">

                <Share2 size={18} /> compartilhar

              </button>

            </div>

            <button
              onClick={reset}
              className="mt-6 text-xs text-gray-400"
            >

              Criar outro

            </button>

          </motion.div>

        )}

      </AnimatePresence>

    </div>
  )
}