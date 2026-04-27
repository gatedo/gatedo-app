import React, { useState } from 'react';
import { CheckCircle2, Megaphone } from 'lucide-react';

const OfficialNoticeCard = ({
  notice,
  onConfirm,
  loading = false,
}) => {
  const [submitting, setSubmitting] = useState(false);

  const busy = loading || submitting;

  const handleConfirm = async () => {
    if (busy) return;

    try {
      setSubmitting(true);
      await onConfirm?.(notice);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="rounded-[26px] overflow-hidden border shadow-sm bg-white"
      style={{ borderColor: '#E9D5FF' }}
    >
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ background: 'linear-gradient(135deg, #8B4AFF10, #823fff08)' }}
      >
        <div
          className="w-11 h-11 rounded-[16px] flex items-center justify-center flex-shrink-0"
          style={{ background: '#F5F3FF' }}
        >
          <Megaphone size={20} style={{ color: '#823fff' }} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-gray-800 leading-tight">
              {notice.title}
            </h3>
            <span
              className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ background: '#e1ff00', color: '#4a2166' }}
            >
              Oficial
            </span>
          </div>
          <p className="text-[10px] text-gray-400 font-bold mt-1">
            Comunicado do GATEDO
          </p>
        </div>
      </div>

      <div className="px-4 py-4">
        <p className="text-sm text-gray-600 leading-relaxed font-medium">
          {notice.message}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <div
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full"
            style={{ background: '#EEFDF3', border: '1px solid #86EFAC' }}
          >
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span className="text-[11px] font-black text-emerald-700">
              +{notice.xpReward || 0} XP
            </span>
          </div>

          <button
            onClick={handleConfirm}
            disabled={busy}
            className="px-4 py-3 rounded-[18px] font-black text-sm shadow-sm"
            style={
              busy
                ? { background: '#F3F4F6', color: '#9CA3AF' }
                : { background: 'linear-gradient(135deg, #8B4AFF, #8B5CF6)', color: '#fff' }
            }
          >
            {busy ? 'Processando...' : 'Entendi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfficialNoticeCard;