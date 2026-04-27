import React from 'react';
import { motion } from 'framer-motion';
import { Megaphone, CheckCircle } from 'lucide-react';

function getNoticeTheme(type) {
  switch (type) {
    case 'WARNING':
      return {
        border: '#FCD34D',
        bg: '#FFFBEB',
        soft: '#FEF3C7',
        badgeBg: '#F59E0B',
        badgeText: '#FFFFFF',
        text: '#92400E',
        button: 'linear-gradient(135deg, #F59E0B, #D97706)',
      };
    case 'EVENT':
      return {
        border: '#86EFAC',
        bg: '#F0FDF4',
        soft: '#DCFCE7',
        badgeBg: '#16A34A',
        badgeText: '#FFFFFF',
        text: '#166534',
        button: 'linear-gradient(135deg, #22C55E, #16A34A)',
      };
    case 'UPDATE':
      return {
        border: '#C4B5FD',
        bg: '#F5F3FF',
        soft: '#EDE9FE',
        badgeBg: '#8B4AFF',
        badgeText: '#FFFFFF',
        text: '#6D28D9',
        button: 'linear-gradient(135deg, #8B4AFF, #8B5CF6)',
      };
    case 'INFO':
    default:
      return {
        border: '#BFDBFE',
        bg: '#EFF6FF',
        soft: '#DBEAFE',
        badgeBg: '#2563EB',
        badgeText: '#FFFFFF',
        text: '#1D4ED8',
        button: 'linear-gradient(135deg, #3B82F6, #2563EB)',
      };
  }
}

function safeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function NoticeCard({ notice, onConfirm, loading = false }) {
  const theme = getNoticeTheme(notice.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[26px] overflow-hidden border shadow-sm bg-white"
      style={{ borderColor: theme.border }}
    >
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ background: theme.bg }}
      >
        <div
          className="w-11 h-11 rounded-[16px] flex items-center justify-center flex-shrink-0"
          style={{ background: theme.soft }}
        >
          <Megaphone size={20} style={{ color: theme.text }} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-gray-800 leading-tight">
              {notice.title}
            </h3>

            <span
              className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ background: theme.badgeBg, color: theme.badgeText }}
            >
              {notice.type || 'INFO'}
            </span>

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
        {safeText(notice.imageUrl) ? (
          <div className="mb-4 rounded-[20px] overflow-hidden border border-gray-100 bg-gray-50">
            <img
              src={notice.imageUrl}
              alt={notice.title}
              className="w-full max-h-[280px] object-cover"
            />
          </div>
        ) : null}

        <p className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-line">
          {notice.content || notice.message || ''}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <div
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full"
            style={{ background: '#EEFDF3', border: '1px solid #86EFAC' }}
          >
            <CheckCircle size={14} className="text-emerald-600" />
            <span className="text-[11px] font-black text-emerald-700">
              +{Number(notice.xpReward || 0)} XP
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!loading) onConfirm?.(notice);
            }}
            disabled={loading}
            className="px-4 py-3 rounded-[18px] font-black text-sm shadow-sm transition-all"
            style={
              loading
                ? { background: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed' }
                : { background: theme.button, color: '#fff' }
            }
          >
            {loading ? 'Processando...' : 'Entendi'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function OfficialNoticesStack({
  notices = [],
  loading = false,
  rewardingNoticeId = null,
  onConfirm,
  onNoticeRead,
}) {
  if (!notices.length) return null;

  const resolvedHandler = onNoticeRead || onConfirm;

  return (
    <div className="space-y-3">
      {notices.map((notice) => {
        const isLoading =
          rewardingNoticeId != null
            ? rewardingNoticeId === notice.id
            : !!loading;

        return (
          <NoticeCard
            key={notice.id}
            notice={notice}
            loading={isLoading}
            onConfirm={resolvedHandler}
          />
        );
      })}
    </div>
  );
}