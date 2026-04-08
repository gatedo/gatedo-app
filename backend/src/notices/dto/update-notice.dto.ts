export class UpdateNoticeDto {
  title?: string;
  message?: string;
  xpReward?: number;
  active?: boolean;
  priority?: number;
  expiresAt?: string | null;
}