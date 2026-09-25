import React, { useEffect, useState } from 'react';
import useSensory from '../hooks/useSensory';

const C = { purple: '#8B4AFF' };

const SUGGESTED_CHIP = {
  parasite: '1m',
  vermifuge: '3m',
  vaccine: '1y',
};

const CHIPS = [
  { key: '1m', label: 'Em 1 mês', months: 1 },
  { key: '3m', label: 'Em 3 meses', months: 3 },
  { key: '1y', label: 'Em 1 ano', months: 12 },
  { key: 'custom', label: 'Escolher data' },
  { key: 'unknown', label: 'Não sei' },
];

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

// "Quando é a próxima?" — chips de sugestão pra vermífugo/antipulgas/vacina/
// medicação contínua. "Não sei" deliberadamente não cria lembrete nenhum.
export default function NextCareChips({ type, value, onChange }) {
  const touch = useSensory();
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const suggestion = SUGGESTED_CHIP[type];
    if (suggestion && !value) {
      setSelected(suggestion);
      onChange(addMonths(new Date(), CHIPS.find((c) => c.key === suggestion).months));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const pick = (chip) => {
    touch('light');
    setSelected(chip.key);
    if (chip.key === 'unknown') {
      onChange('');
    } else if (chip.key === 'custom') {
      // mantém o valor atual — o input de data abaixo assume o controle
    } else {
      onChange(addMonths(new Date(), chip.months));
    }
  };

  return (
    <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-50">
      <p className="text-[11px] font-black text-gray-700 mb-2.5">Quando é a próxima?</p>

      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => pick(chip)}
            className="px-3 py-1.5 rounded-full text-[11px] font-black border"
            style={
              selected === chip.key
                ? { background: C.purple, color: '#fff', borderColor: 'transparent' }
                : { background: '#fff', color: '#6b7280', borderColor: '#F3F4F6' }
            }
          >
            {chip.label}
          </button>
        ))}
      </div>

      {selected === 'custom' && (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 outline-none mb-2"
        />
      )}

      {selected === 'unknown' ? (
        <p className="text-[11px] font-bold text-gray-400 leading-relaxed">
          Tudo bem. Pergunte na próxima consulta e atualize aqui.
        </p>
      ) : (
        <p className="text-[10px] font-medium text-gray-400 leading-relaxed">
          Confira com o seu veterinário — depende do produto e do seu gato.
        </p>
      )}
    </div>
  );
}
