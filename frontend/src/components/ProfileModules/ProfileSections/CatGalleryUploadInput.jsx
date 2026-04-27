import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { isImageFile, normalizeUploadFile } from '../../../utils/imageUpload';

export default function CatGalleryUploadInput({ onSelect }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(isImageFile).map(normalizeUploadFile);

    if (imageFiles.length) {
      onSelect?.(imageFiles);
    }

    e.target.value = '';
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChange}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="hidden"
        aria-hidden="true"
      >
        <Upload size={14} />
      </button>
    </>
  );
}