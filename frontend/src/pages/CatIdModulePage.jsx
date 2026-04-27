import React from 'react';
import StudioModuleShell from '../components/studio/StudioModuleShell';

export default function CatIdModulePage() {
  return (
    <StudioModuleShell
      moduleKey="id"
      title="RG do Gato"
      subtitle="Documento visual do seu gato com visual premium, dados e layout compartilhável."
      gradient="linear-gradient(135deg, #0ea5e9 0%, #8B4AFF 100%)"
      cost={12}
      xpReward={18}
      outputLabel="Card de identidade"
    />
  );
}
