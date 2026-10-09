// Aviso fixo de link de indicação (afiliado). Sempre visível — nada de
// tooltip ou clique para revelar.
import React from 'react';
import { AFFILIATE_DISCLOSURE, AFFILIATE_INFO_URL } from '../../utils/productRules';

export default function AffiliateDisclosure({ className = '' }) {
  return (
    <p className={`text-[12px] leading-snug text-gray-400 font-medium ${className}`}>
      {AFFILIATE_DISCLOSURE}{' '}
      <a href={AFFILIATE_INFO_URL} target="_blank" rel="noreferrer" className="underline text-gray-500">
        Saiba mais
      </a>
    </p>
  );
}
