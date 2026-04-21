import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

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
type: string
) {

await this.credit({
userId,
petId,
action: 'HEALTH_RECORD',
tutorXp: 5,
catXp: 3
})

}

async onIgentConsult(
userId: string,
petId: string,
first: boolean
) {

await this.credit({
userId,
petId,
action: 'IGENT_CONSULT',
tutorXp: first ? 30 : 10,
catXp: 10
})

}

async onStudioCreation(data: {
  userId: string
  petId: string
  toolSlug: string
  publishToFeed?: boolean
}) {
  await this.credit({
    userId: data.userId,
    petId: data.petId,
    action: 'STUDIO_CREATION',
    tutorXp: 8,
    catXp: 6,
  });
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