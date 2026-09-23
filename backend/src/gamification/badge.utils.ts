import { PrismaService } from '../prisma/prisma.service';
import { normalizeBadges } from '../membership/membership.constants';

// Selo dado ao concluir o tour de boas-vindas (cadastrar o gato + primeira
// pesagem). Precisa existir também em TUTOR_BADGE_META no frontend para
// renderizar com visual próprio em vez do chip cinza genérico.
export const ONBOARDING_TOUR_BADGE = 'PRIMEIRA_JORNADA';

// Único ponto que escreve um selo de conquista em User.badges[] — antes desse
// helper, cada selo era um "ler, empurrar se não tem, gravar" copiado inline
// em auth.service.ts e gamification.service.ts. Selos de plano continuam
// aplicados via applyMembershipGrantToUser (fluxo de compra); este helper é
// para selos de conquista/jornada, fora do fluxo de pagamento.
export async function awardUserBadge(prisma: PrismaService, userId: string, badgeCode: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { badges: true } });
  if (!user) return { awarded: false };

  const current = normalizeBadges(user.badges);
  if (current.includes(badgeCode)) return { awarded: false, alreadyHad: true };

  await prisma.user.update({
    where: { id: userId },
    data: { badges: [...current, badgeCode] },
  });

  return { awarded: true };
}
