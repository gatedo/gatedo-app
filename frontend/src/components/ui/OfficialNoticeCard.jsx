import React, { useState } from "react";
import { awardXP } from "@/services/gamification.service";

export default function OfficialNoticeCard({
  title,
  message,
  userId,
  xpReward = 3
}) {
  const [dismissed, setDismissed] = useState(false);

  const handleClose = async () => {
    try {
      await awardXP(userId, xpReward, "Leitura comunicado oficial");
    } catch (err) {
      console.warn("XP não aplicado:", err);
    }

    localStorage.setItem("officialNoticeSeen", "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="relative bg-[#111] border border-[#2b2b2b] rounded-xl p-4 mb-4 shadow-lg">

      {/* logo */}
      <img
        src="/assets/logo-gatedo-mini.png"
        className="absolute top-3 right-3 w-6 opacity-80"
      />

      <h3 className="text-white font-semibold text-lg mb-1">
        {title}
      </h3>

      <p className="text-gray-300 text-sm leading-relaxed">
        {message}
      </p>

      <button
        onClick={handleClose}
        className="mt-3 text-xs text-purple-400 hover:text-purple-200"
      >
        Entendi 👍 (+{xpReward} XP)
      </button>
    </div>
  );
}