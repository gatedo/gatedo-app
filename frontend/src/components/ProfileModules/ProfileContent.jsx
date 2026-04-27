import React, { useRef, useEffect, useMemo, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import BioModule from './ProfileSections/BioModule';
import EvoNutrition from './ProfileSections/EvoNutrition';
import BehaviorModule from './ProfileSections/BehaviorModule';
import HealthModule from './ProfileSections/HealthModule';
import ImmunizationModule from './ProfileSections/ImmunizationModule';
import DocumentModule from './ProfileSections/DocumentModule';
import api from "../../services/api";

function ProfileContent({ activeTab, cat, touch, refreshCat, navigate }) {
  const pedigreeFrontInputRef = useRef(null);
  const pedigreeBackInputRef = useRef(null);
  const [mountedTabs, setMountedTabs] = useState(() => ({ [activeTab]: true }));

  useEffect(() => {
    setMountedTabs((prev) => (prev[activeTab] ? prev : { ...prev, [activeTab]: true }));
  }, [activeTab]);

  if (!cat) return null;

  const handlePedigreeFrontUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('pedigree', file);

    try {
      touch?.();
      await api.patch(`/pets/${cat.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      refreshCat?.();
    } catch (error) {
      console.error('Erro no upload frente:', error);
    } finally {
      event.target.value = '';
    }
  };

  const handlePedigreeBackUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('pedigreeBack', file);

    try {
      touch?.();
      await api.patch(`/pets/${cat.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      refreshCat?.();
    } catch (error) {
      console.error('Erro no upload verso:', error);
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 pb-24">
      <input
        type="file"
        ref={pedigreeFrontInputRef}
        className="hidden"
        onChange={handlePedigreeFrontUpload}
        accept="image/*,application/pdf"
      />

      <input
        type="file"
        ref={pedigreeBackInputRef}
        className="hidden"
        onChange={handlePedigreeBackUpload}
        accept="image/*,application/pdf"
      />

      <div className="relative min-h-[220px]">
        {mountedTabs.BIO && (
          <motion.div
            initial={false}
            animate={{ opacity: activeTab === 'BIO' ? 1 : 0, y: activeTab === 'BIO' ? 0 : 6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{ display: activeTab === 'BIO' ? 'block' : 'none', willChange: 'transform, opacity' }}
          >
            <BioModule
              cat={cat}
              refreshCat={refreshCat}
              navigate={navigate}
            />
          </motion.div>
        )}

        {mountedTabs.EVOLUCAO && (
          <motion.div
            initial={false}
            animate={{ opacity: activeTab === 'EVOLUCAO' ? 1 : 0, y: activeTab === 'EVOLUCAO' ? 0 : 6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{ display: activeTab === 'EVOLUCAO' ? 'block' : 'none', willChange: 'transform, opacity' }}
          >
            <EvoNutrition
              cat={cat}
              touch={touch}
            />
          </motion.div>
        )}

        {mountedTabs.COMPORTAMENTO && (
          <motion.div
            initial={false}
            animate={{ opacity: activeTab === 'COMPORTAMENTO' ? 1 : 0, y: activeTab === 'COMPORTAMENTO' ? 0 : 6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{ display: activeTab === 'COMPORTAMENTO' ? 'block' : 'none', willChange: 'transform, opacity' }}
          >
            <BehaviorModule cat={cat} />
          </motion.div>
        )}

        {mountedTabs.SAUDE && (
          <motion.div
            initial={false}
            animate={{ opacity: activeTab === 'SAUDE' ? 1 : 0, y: activeTab === 'SAUDE' ? 0 : 6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{ display: activeTab === 'SAUDE' ? 'block' : 'none', willChange: 'transform, opacity' }}
          >
            <HealthModule cat={cat} />
          </motion.div>
        )}

        {mountedTabs.IMUNIZANTES && (
          <motion.div
            initial={false}
            animate={{ opacity: activeTab === 'IMUNIZANTES' ? 1 : 0, y: activeTab === 'IMUNIZANTES' ? 0 : 6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{ display: activeTab === 'IMUNIZANTES' ? 'block' : 'none', willChange: 'transform, opacity' }}
          >
            <ImmunizationModule cat={cat} />
          </motion.div>
        )}

        {mountedTabs.DOCUMENTOS && (
          <motion.div
            initial={false}
            animate={{ opacity: activeTab === 'DOCUMENTOS' ? 1 : 0, y: activeTab === 'DOCUMENTOS' ? 0 : 6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{ display: activeTab === 'DOCUMENTOS' ? 'block' : 'none', willChange: 'transform, opacity' }}
          >
            <DocumentModule
              cat={cat}
              touch={touch}
              onUploadPedigree={() => pedigreeFrontInputRef.current?.click()}
              onUploadPedigreeBack={() => pedigreeBackInputRef.current?.click()}
              onDeleteDoc={(id) => console.log('Deletar:', id)}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default memo(ProfileContent);
