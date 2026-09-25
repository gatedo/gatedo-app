import React from 'react';
import { Camera, QrCode } from 'lucide-react';

// "RG" do gato — mesmo card usado no cadastro completo (AddCat.jsx) e no
// selo compartilhável do tour de boas-vindas (Onboarding.jsx). Extraído pra
// um componente só pra manter a identidade visual igual nos dois lugares.
export default function OfficialRgCard({
  name,
  breed,
  avatarPreview,
  generatedId,
  petId,
  ageLabel,
  weight,
  actions,
}) {
  const profileUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/gato/${petId || generatedId || 'preview'}`
      : `https://app.gatedo.com/gato/${petId || generatedId || 'preview'}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(profileUrl)}&bgcolor=ffffff&color=1f2333&margin=1&format=png&ecc=H`;

  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      <div className="overflow-hidden rounded-[26px] bg-white shadow-[0_24px_60px_rgba(80,70,176,0.18)]">
        <div
          className="relative h-24 overflow-hidden px-5 pt-4"
          style={{ background: 'linear-gradient(135deg, #B36AF5 0%, #8B4AFF 100%)' }}
        >
          {avatarPreview && (
            <img
              src={avatarPreview}
              alt=""
              className="pointer-events-none absolute -right-6 -top-10 h-44 w-44 rounded-full object-cover opacity-[0.16] blur-[1px] saturate-75"
            />
          )}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(139,74,255,0.12), rgba(80,70,176,0.24))' }}
          />
          <div className="relative flex items-center justify-between">
            <img src="/assets/logo_gatedo_amarelo.webp" alt="Gatedo" className="h-6 w-auto object-contain" />
            <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-white/90">
              <QrCode size={11} />
              RG Oficial
            </div>
          </div>
        </div>

        <div className="relative px-5 pb-4 pt-11 text-center">
          <div className="absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-4 border-white bg-white shadow-xl">
            {avatarPreview ? (
              <img src={avatarPreview} className="h-full w-full object-cover" alt={name || 'Gato'} />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#F4F3FF]">
                <Camera size={28} className="text-[#8B4AFF]" />
              </div>
            )}
          </div>

          <h3 className="text-xl font-black uppercase leading-none text-gray-800">{name || 'Seu gatinho'}</h3>
          <p className="mt-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-gray-300">ID #{generatedId || 'GATEDO'}</p>

          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">Idade</p>
              <p className="mt-1 text-xs font-black text-gray-800">{ageLabel || '-'}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">Raca</p>
              <p className="mt-1 text-xs font-black text-gray-800">{breed || 'SRD'}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">Peso</p>
              <p className="mt-1 text-xs font-black text-gray-800">{weight || '-'}</p>
            </div>
          </div>

          <div className="mx-auto mt-4 h-24 w-24 rounded-xl bg-white p-1 shadow-sm">
            <img src={qrUrl} alt="QR Code" className="h-full w-full" />
          </div>
          <p className="mt-2 text-[8px] font-black uppercase tracking-[0.18em] text-gray-300">Escaneie para compartilhar</p>

          {actions && <div className="mt-5">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
