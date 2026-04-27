import api from "@/services/api";

export async function awardXP(userId, amount, reason) {
  return api.post("/gamification/xp/add", {
    userId,
    amount,
    reason
  });
}