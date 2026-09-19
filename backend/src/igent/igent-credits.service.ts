import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getUserEntitlements } from '../membership/membership.constants';

/**
 * Custo estimado por token, em USD, para medir gasto real do iGentVet.
 * Configurável via env sem precisar mexer em código quando o preço
 * do provider mudar. Valores default aproximam o blended rate do
 * gpt-4o-mini / gemini-2.5-flash em uso hoje.
 */
const COST_PER_1K_TOKENS: Record<string, number> = {
  openai: Number(process.env.IGENT_OPENAI_COST_PER_1K_TOKENS || '0.00015'),
  gemini: Number(process.env.IGENT_GEMINI_COST_PER_1K_TOKENS || '0.000075'),
};

export type IgentCreditsStatus = {
  tier: string;
  limit: number | null;
  used: number;
  remaining: number | null;
  resetsAt: string | null;
  blocked: boolean;
};

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function startOfNextMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

@Injectable()
export class IgentCreditsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(userId: string): Promise<IgentCreditsStatus> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, badges: true, role: true },
    });

    const entitlements = getUserEntitlements(user || {});
    const limit = entitlements.igentMonthlyQuestions;

    const used = await this.prisma.igentUsageLog.count({
      where: {
        userId,
        action: 'QUESTION',
        createdAt: { gte: startOfCurrentMonth() },
      },
    });

    const remaining = limit === null ? null : Math.max(0, limit - used);

    return {
      tier: entitlements.tier,
      limit,
      used,
      remaining,
      resetsAt: limit === null ? null : startOfNextMonth().toISOString(),
      blocked: limit !== null && used >= limit,
    };
  }

  async logUsage(params: {
    userId: string;
    petId?: string | null;
    provider?: string | null;
    tokensUsed?: number | null;
  }) {
    const rate = params.provider ? COST_PER_1K_TOKENS[params.provider] : undefined;
    const costEstimate =
      rate && params.tokensUsed ? (params.tokensUsed / 1000) * rate : null;

    await this.prisma.igentUsageLog.create({
      data: {
        userId: params.userId,
        petId: params.petId || null,
        action: 'QUESTION',
        provider: params.provider || null,
        tokensUsed: params.tokensUsed ?? null,
        costEstimate,
      },
    });
  }
}
