import React from "react";
import { useNavigate } from "react-router-dom";
import CatIdentityCard from "./CatIdentityCard";

export default function ProfileCardSection({ cat, tutor }) {
  const navigate = useNavigate();

  if (!cat) return null;

  return (
    <div className="w-full max-w-lg mx-auto px-4 mb-4" style={{ height: '220px' }}>
      <CatIdentityCard
        cat={cat}
        tutor={tutor || cat.owner}
        onOpenVets={(currentCat) => navigate(`/gato/${currentCat.id}?tab=saude`)}
      />
    </div>
  );
}