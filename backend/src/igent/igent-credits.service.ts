import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import {
  IGENT_DAILY_QUESTION_CAP,
  getUserEntitlements,
  addMonths,
  AI_CREDIT_PACK,
} from '../membership/membership.constants';

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

const AI_MONTHLY_BUDGET = Number(process.env.AI_MONTHLY_BUDGET || '0'); // USD, 0 = sem teto
const BUDGET_WARNING_RATIO = 0.8;

export type AskDecisionAllowed = { allowed: true; source: 'QUOTA' | 'PACK' };
export type AskDecisionBlocked = { allowed: false; reason: 'DAILY_CAP' | 'MONTHLY_LIMIT' | 'BUDGET_PAUSED' };
export type AskDecision = AskDecisionAllowed | AskDecisionBlocked;

export function isAskBlocked(decision: AskDecision): decision is AskDecisionBlocked {
  return decision.allowed === false;
}

export type IgentCreditsStatus = {
  tier: string;
  questionLimit: number | null;
  questionUsed: number;
  questionRemaining: number | null;
  examLimit: number | null;
  examUsed: number;
  examRemaining: number | null;
  packBalance: number;
  dailyCap: number;
  dailyUsed: number;
  dailyRemaining: number;
  resetsAt: string | null;
  blocked: boolean;
  // Compat com o formato antigo (usado em telas que só mostram "perguntas").
  limit: number | null;
  used: number;
  remaining: number | null;
};

function startOfTodayBrasilia(): Date {
  const nowBrasilia = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const start = new Date(Date.UTC(nowBrasilia.getUTCFullYear(), nowBrasilia.getUTCMonth(), nowBrasilia.getUTCDate()));
  return new Date(start.getTime() + 3 * 60 * 60 * 1000); // volta pra UTC real
}

// Ciclo mensal ancorado no dia do cadastro (free) ou no dia em que a
// assinatura começou (Clube/fundador — Subscription.startedAt já existe e
// já é atualizado a cada renovação real, ver applyMembershipGrantToUser).
function monthlyCycleWindow(anchorDate: Date, now = new Date()): { start: Date; nextReset: Date } {
  const day = Math.min(anchorDate.getUTCDate(), 28);
  let start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day));
  if (start.getTime() > now.getTime()) {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, day));
  }
  const nextReset = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, day));
  return { start, nextReset };
}

@Injectable()
export class IgentCreditsService {
  private readonly logger = new Logger(IgentCreditsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  private async getResetAnchor(userId: string): Promise<Date> {
    const sub = await this.prisma.subscription.findUnique({ where: { userId }, select: { startedAt: true } });
    if (sub?.startedAt) return new Date(sub.startedAt);
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } });
    return user?.createdAt ? new Date(user.createdAt) : new Date();
  }

  async getPackBalance(userId: string): Promise<number> {
    const packs = await this.prisma.aiCreditPack.findMany({
      where: { userId, status: 'ACTIVE', expiresAt: { gt: new Date() } },
      select: { credits: true, creditsUsed: true },
    });
    return packs.reduce((sum, p) => sum + Math.max(0, p.credits - p.creditsUsed), 0);
  }

  // Pacote avulso comprado por alguém que ainda não tinha conta — o webhook
  // da Kiwify grava em PendingAiCreditPack por e-mail; isso aplica pro
  // usuário assim que ele se cadastra ou loga com esse e-mail, espelhando
  // EntitlementsService#promotePending (mesmo padrão, tabela diferente).
  // Validade conta a partir da COMPRA (createdAt), não de quando a pessoa
  // resolveu criar a conta — é o que ela pagou.
  async promotePendingAiCreditPacks(userId: string, email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const pending = await this.prisma.pendingAiCreditPack.findMany({
      where: { email: normalizedEmail },
    });
    if (pending.length === 0) return;

    await Promise.all(
      pending.map((p) =>
        this.prisma.aiCreditPack.create({
          data: {
            userId,
            credits: p.credits,
            externalId: p.externalId,
            purchasedAt: p.createdAt,
            expiresAt: addMonths(p.createdAt, AI_CREDIT_PACK.validityMonths),
          },
        }),
      ),
    );

    await this.prisma.pendingAiCreditPack.deleteMany({ where: { email: normalizedEmail } });
    this.logger.log(`${pending.length} pacote(s) de IA pendente(s) promovido(s) para ${normalizedEmail}`);
  }

  async getStatus(userId: string): Promise<IgentCreditsStatus> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, badges: true, role: true },
    });

    const entitlements = getUserEntitlements(user || {});
    const questionLimit = entitlements.igentMonthlyQuestions;
    const examLimit = entitlements.igentMonthlyExamExplanations;

    const anchor = await this.getResetAnchor(userId);
    const { start, nextReset } = monthlyCycleWindow(anchor);

    const [questionUsed, examUsed, dailyUsed, packBalance] = await Promise.all([
      this.prisma.igentUsageLog.count({ where: { userId, action: 'QUESTION', createdAt: { gte: start } } }),
      this.prisma.igentUsageLog.count({ where: { userId, action: 'EXAM_EXPLANATION', createdAt: { gte: start } } }),
      this.prisma.igentUsageLog.count({ where: { userId, action: { in: ['QUESTION', 'EXAM_EXPLANATION'] }, createdAt: { gte: startOfTodayBrasilia() } } }),
      this.getPackBalance(userId),
    ]);

    const questionRemaining = questionLimit === null ? null : Math.max(0, questionLimit - questionUsed);
    const examRemaining = examLimit === null ? null : Math.max(0, examLimit - examUsed);
    const dailyRemaining = Math.max(0, IGENT_DAILY_QUESTION_CAP - dailyUsed);

    const quotaExhausted = questionRemaining !== null && questionRemaining <= 0;
    const blocked = (quotaExhausted && packBalance <= 0) || dailyRemaining <= 0;

    return {
      tier: entitlements.tier,
      questionLimit,
      questionUsed,
      questionRemaining,
      examLimit,
      examUsed,
      examRemaining,
      packBalance,
      dailyCap: IGENT_DAILY_QUESTION_CAP,
      dailyUsed,
      dailyRemaining,
      resetsAt: nextReset.toISOString(),
      blocked,
      limit: questionLimit,
      used: questionUsed,
      remaining: questionRemaining,
    };
  }

  /**
   * Decide se uma pergunta/explicação pode passar, e de onde ela sai
   * (cota do mês primeiro, pacote avulso depois). Chamar ANTES de acionar
   * o modelo de IA — o controller só gasta tokens de verdade se liberado.
   */
  async canAsk(userId: string, kind: 'QUESTION' | 'EXAM_EXPLANATION'): Promise<AskDecision> {
    const status = await this.getStatus(userId);

    if (status.dailyRemaining <= 0) return { allowed: false, reason: 'DAILY_CAP' };

    if (kind === 'EXAM_EXPLANATION') {
      if (status.examRemaining === null || status.examRemaining > 0) return { allowed: true, source: 'QUOTA' };
      return { allowed: false, reason: 'MONTHLY_LIMIT' };
    }

    if (status.questionRemaining === null || status.questionRemaining > 0) {
      // Plano free pausa sozinho quando o teto global de gasto estoura —
      // Clube/pacote seguem funcionando (ver checkBudget).
      if (status.tier === 'free') {
        const budget = await this.checkBudget();
        if (budget.paused) return { allowed: false, reason: 'BUDGET_PAUSED' };
      }
      return { allowed: true, source: 'QUOTA' };
    }

    if (status.packBalance > 0) return { allowed: true, source: 'PACK' };

    return { allowed: false, reason: 'MONTHLY_LIMIT' };
  }

  private async consumePackCredit(userId: string) {
    const pack = await this.prisma.aiCreditPack.findFirst({
      where: { userId, status: 'ACTIVE', expiresAt: { gt: new Date() } },
      orderBy: { purchasedAt: 'asc' },
    });
    if (!pack) return;
    await this.prisma.aiCreditPack.update({
      where: { id: pack.id },
      data: { creditsUsed: { increment: 1 } },
    });
  }

  async logUsage(params: {
    userId: string;
    petId?: string | null;
    kind?: 'QUESTION' | 'EXAM_EXPLANATION';
    source?: 'QUOTA' | 'PACK';
    provider?: string | null;
    model?: string | null;
    tokensUsed?: number | null;
    tokensIn?: number | null;
    tokensOut?: number | null;
  }) {
    const rate = params.provider ? COST_PER_1K_TOKENS[params.provider] : undefined;
    const costEstimate =
      rate && params.tokensUsed ? (params.tokensUsed / 1000) * rate : null;

    await this.prisma.igentUsageLog.create({
      data: {
        userId: params.userId,
        petId: params.petId || null,
        action: params.kind || 'QUESTION',
        source: params.source || 'QUOTA',
        provider: params.provider || null,
        model: params.model || null,
        tokensUsed: params.tokensUsed ?? null,
        tokensIn: params.tokensIn ?? null,
        tokensOut: params.tokensOut ?? null,
        costEstimate,
      },
    });

    if (params.source === 'PACK') {
      await this.consumePackCredit(params.userId);
    }
  }

  // ── Teto global de gasto mensal ──────────────────────────────────────────
  async getMonthlySpend(): Promise<number> {
    if (!AI_MONTHLY_BUDGET) return 0;
    const start = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
    const result = await this.prisma.igentUsageLog.aggregate({
      where: { createdAt: { gte: start } },
      _sum: { costEstimate: true },
    });
    return result._sum.costEstimate || 0;
  }

  async checkBudget(): Promise<{ spend: number; budget: number; ratio: number; paused: boolean }> {
    if (!AI_MONTHLY_BUDGET) return { spend: 0, budget: 0, ratio: 0, paused: false };

    const spend = await this.getMonthlySpend();
    const ratio = spend / AI_MONTHLY_BUDGET;
    const paused = ratio >= 1;

    if (ratio >= BUDGET_WARNING_RATIO) {
      await this.maybeWarnAdmin(spend, ratio, paused);
    }

    return { spend, budget: AI_MONTHLY_BUDGET, ratio, paused };
  }

  // Manda o aviso de 80% (e o de 100%) só uma vez por mês — marca em
  // AppSettings pra não floodar o e-mail do admin a cada pergunta.
  private async maybeWarnAdmin(spend: number, ratio: number, paused: boolean) {
    const monthKey = `${new Date().getUTCFullYear()}-${new Date().getUTCMonth() + 1}`;
    const flagKey = paused ? `AI_BUDGET_100_WARNED_${monthKey}` : `AI_BUDGET_80_WARNED_${monthKey}`;

    const existing = await this.prisma.appSettings.findUnique({ where: { key: flagKey } });
    if (existing) return;

    await this.prisma.appSettings.upsert({
      where: { key: flagKey },
      update: { value: 'true' },
      create: { key: flagKey, value: 'true' },
    });

    const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.EMAIL_FROM;
    if (!adminEmail) return;

    this.email
      .sendAiBudgetAlert(adminEmail, { spend, budget: AI_MONTHLY_BUDGET, ratio, paused })
      .catch((err) => this.logger.warn(`Falha ao enviar alerta de orçamento de IA: ${err?.message}`));
  }
}
