export interface RewardEventPayload {
  userId: string;
  petId?: string | null;
  action: string;
  gptsDelta: number;
  xptDelta: number;
  xpgDelta: number;
  badgeGranted?: string | null;
  metadata?: Record<string, any>;
}