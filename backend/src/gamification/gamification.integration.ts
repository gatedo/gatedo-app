import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { XP_ACTIONS, getHealthRecordXp, WEIGHT_CHECKIN_TITLE_RE } from './xp.config';

// Nome de evento amigável por tipo de HealthRecord — sem isso, o RewardEvent
// gravava `HEALTH_RECORD_${type}` cru, e a tela de gamificação (sem esse
// código no mapa de labels) mostrava o texto interno direto pro usuário
// (ex.: "HEALTH_RECORD_EXAM"). Cada chave aqui precisa ter par em
// EVENT_META no frontend (Gamificationdrawer.jsx).
const HEALTH_RECORD_ACTION_MAP: Record<string, string> = {
  VACCINE: 'VACCINE_REGISTERED',
  VERMIFUGE: 'VERMIFUGE_REGISTERED',
  PARASITE: 'PARASITE_REGISTERED',
  MEDICATION: 'MEDICATION_REGISTERED',
  MEDICINE: 'MEDICATION_REGISTERED',
  CONSULTATION: 'CONSULTATION_REGISTERED',
  IACONSULT: 'CONSULTATION_REGISTERED',
  SURGERY: 'SURGERY_REGISTERED',
  EXAM: 'EXAM_REGISTERED',
};

@Injectable()
export class GamificationIntegration {

constructor(
private prisma: PrismaService,
private notifService: NotificationService,
) {}

async credit(data: {
userId: string
petId?: string
action: string
catXp?: number
tutorXp?: number
points?: number
}) {

const tutor = await this.creditTutor(
data.userId,
data.tutorXp ?? 0,
data.points ?? 0,
data.action
)

const cat = data.petId
? await this.creditCat(
data.petId,
data.catXp ?? 0,
data.action
)
: null

return { tutor, cat }

}

private async creditTutor(
userId: string,
xpGain: number,
pointsGain: number,
action: string
) {

if (!xpGain && !pointsGain) return null

const user = await this.prisma.user.findUnique({
where: { id: userId },
select: {
xpt: true,
gatedoPoints: true,
},
})

const updatedUser = await this.prisma.user.update({
where: { id: userId },
data: {
xpt: (user?.xpt ?? 0) + xpGain,
gatedoPoints:
(user?.gatedoPoints ?? 0) + pointsGain,
},
})

await this.prisma.rewardEvent.create({
data: {
userId,
action,
xptDelta: xpGain,
gptsDelta: pointsGain,
},
})

await this.notifService.create({
userId,
type: 'GAMIFICATION',
message: `⚡ +${xpGain} XPT`,
})

return updatedUser

}

private async creditCat(
petId: string,
xpGain: number,
action: string
) {

if (!xpGain) return null

const pet = await this.prisma.pet.findUnique({
where: { id: petId },
select: {
xpg: true,
ownerId: true,
name: true
},
})

if (!pet) return null

const updatedPet = await this.prisma.pet.update({
where: { id: petId },
data: {
xpg: (pet?.xpg ?? 0) + xpGain,
},
})

await this.prisma.rewardEvent.create({
data: {
userId: pet.ownerId,
petId,
action,
xpgDelta: xpGain,
},
})

return updatedPet

}

//////////////////////////////////////////////////////
//////////// COMPATIBILITY WRAPPERS ///////////////////
//////////////////////////////////////////////////////

async onHealthRecord(
userId: string,
petId: string,
type: string,
title?: string,
) {

const xp = getHealthRecordXp(type, title)
const isWeightCheckin = type === 'EXAM' && WEIGHT_CHECKIN_TITLE_RE.test(title || '')
const action = isWeightCheckin ? 'WEIGHT_LOG' : (HEALTH_RECORD_ACTION_MAP[type] || `HEALTH_RECORD_${type}`)

await this.credit({
userId,
petId,
action,
tutorXp: xp.tutorXp,
catXp: xp.catXp,
})

}

async onIgentConsult(
userId: string,
petId: string,
first: boolean
) {

// Uso do app (perguntar à IA), não dado clínico — XP zero por configuração.
const xp = XP_ACTIONS.IGENT_CONSULT

await this.credit({
userId,
petId,
action: 'IGENT_CONSULT',
tutorXp: xp.tutorXp,
catXp: xp.catXp
})

}

async onStudioCreation(data: {
  userId: string
  petId: string
  toolSlug: string
  publishToFeed?: boolean
}) {
  // Uso do app (geração de arte via IA), não dado clínico — XP zero por configuração.
  const xp = XP_ACTIONS.STUDIO_CREATION

  await this.credit({
    userId: data.userId,
    petId: data.petId,
    action: 'STUDIO_CREATION',
    tutorXp: xp.tutorXp,
    catXp: xp.catXp,
  });
}

async onDiaryEntry(
userId: string,
petId: string,
) {

const xp = XP_ACTIONS.DIARY_ENTRY

await this.credit({
userId,
petId,
action: 'DIARY_ENTRY',
tutorXp: xp.tutorXp,
catXp: xp.catXp,
})

}

async onProfileComplete(
userId: string,
petId: string,
) {

const xp = XP_ACTIONS.PROFILE_COMPLETE

await this.credit({
userId,
petId,
action: 'PROFILE_COMPLETE',
tutorXp: xp.tutorXp,
catXp: xp.catXp,
})

}

async onProtocolDayComplete(
userId: string,
petId: string,
) {

const xp = XP_ACTIONS.PROTOCOL_DAY_COMPLETE

await this.credit({
userId,
petId,
action: 'PROTOCOL_DAY_COMPLETE',
tutorXp: xp.tutorXp,
catXp: xp.catXp,
})

}

async spendPoints(
userId: string,
amount: number
) {

await this.prisma.user.update({
where: { id: userId },
data: {
gatedoPoints: {
decrement: amount
}
}
})

await this.prisma.rewardEvent.create({
data: {
userId,
action: 'POINTS_SPENT',
gptsDelta: -amount
}
})

}

async refundPoints(
userId: string,
amount: number
) {

await this.prisma.user.update({
where: { id: userId },
data: {
gatedoPoints: {
increment: amount
}
}
})

await this.prisma.rewardEvent.create({
data: {
userId,
action: 'POINTS_REFUND',
gptsDelta: amount
}
})

}

}