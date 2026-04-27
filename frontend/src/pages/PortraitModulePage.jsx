import React from 'react';
import StudioModuleShell from '../components/studio/StudioModuleShell';

export default function PortraitModulePage() {
  return (
    <StudioModuleShell
      moduleKey="portrait"
      title="Portrait"
      subtitle="Retratos artísticos, premium e estilizados com presets visuais já prontos."
      gradient="linear-gradient(135deg, #6366f1 0%, #8B4AFF 100%)"
      cost={8}
      xpReward={4}
      outputLabel="Retrato em alta"
    />
  );
}
