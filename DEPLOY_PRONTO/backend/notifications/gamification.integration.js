"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamificationIntegration = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const notification_service_1 = require("../notifications/notification.service");
const CAT_XP = {
    IGENT_CONSULT: 10,
    VACCINE: 5,
    MEDICATION: 5,
    MEDICINE: 5,
    VERMIFUGE: 4,
    PARASITE: 4,
    EXAM: 3,
    SURGERY: 3,
    HEALTH_RECORD: 2,
    DIARY_ENTRY: 1,
};
const CAT_LEVELS = [
    { min: 0, level: 1, label: 'Filhote' },
    { min: 50, level: 2, label: 'Explorador' },
    { min: 150, level: 3, label: 'Aventureiro' },
    { min: 300, level: 4, label: 'Veterano' },
    { min: 500, level: 5, label: 'Lendário' },
];
function getCatLevel(xp) {
    for (let i = CAT_LEVELS.length - 1; i >= 0; i--)
        if (xp >= CAT_LEVELS[i].min)
            return CAT_LEVELS[i];
    return CAT_LEVELS[0];
}
const TUTOR_POINTS = {
    IGENT_CONSULT: 10,
    FIRST_CONSULT: 30,
    VACCINE_REGISTERED: 5,
    MED_REGISTERED: 5,
    HEALTH_RECORD: 3,
    COMMUNITY_POST: 15,
    COMMUNITY_IGENT_TIP: 20,
    PROFILE_COMPLETE: 25,
    MEMORIAL_REGISTERED: 15,
};
let GamificationIntegration = class GamificationIntegration {
    constructor(prisma, notifService) {
        this.prisma = prisma;
        this.notifService = notifService;
    }
    async credit(data) {
        const [tutorResult, catResult] = await Promise.all([
            this._creditTutor(data.userId, data.action),
            this._creditCat(data.petId, data.catXpAction || data.action),
        ]);
        return { tutor: tutorResult, cat: catResult };
    }
    async _creditTutor(userId, action) {
        const pts = TUTOR_POINTS[action];
        if (!pts)
            return null;
        const oneTimeActions = ['FIRST_CONSULT', 'PROFILE_COMPLETE', 'MEMORIAL_REGISTERED'];
        if (oneTimeActions.includes(action)) {
            const existing = await this.prisma.tutorPoints.findUnique({ where: { userId } });
            const alreadyEarned = existing?.[`earned_${action}`];
            if (alreadyEarned)
                return null;
        }
        return this.notifService.addPoints(userId, action);
    }
    async _creditCat(petId, action) {
        const xpGain = CAT_XP[action];
        if (!xpGain || !petId)
            return null;
        const pet = await this.prisma.pet.findUnique({
            where: { id: petId },
            select: { id: true, xp: true, level: true, name: true, ownerId: true },
        });
        if (!pet)
            return null;
        const oldXp = pet.xp || 0;
        const newXp = oldXp + xpGain;
        const oldLevel = getCatLevel(oldXp);
        const newLevel = getCatLevel(newXp);
        await this.prisma.pet.update({
            where: { id: petId },
            data: { xp: newXp, level: newLevel.level },
        });
        if (newLevel.level > oldLevel.level) {
            const user = await this.prisma.user.findFirst({
                where: { pets: { some: { id: petId } } },
                select: { id: true },
            });
            if (user) {
                await this.notifService.create({
                    userId: user.id,
                    type: 'GAMIFICATION',
                    petId,
                    catName: pet.name,
                    message: `🎉 ${pet.name} subiu para o nível ${newLevel.level} — ${newLevel.label}!`,
                    cta: 'Ver perfil',
                    metadata: { oldLevel: oldLevel.level, newLevel: newLevel.level, xp: newXp },
                });
            }
        }
        return { xp: newXp, level: newLevel.level, gained: xpGain, leveledUp: newLevel.level > oldLevel.level };
    }
    async onIgentConsult(userId, petId, isFirstEver) {
        await this.credit({ userId, petId, action: 'IGENT_CONSULT', catXpAction: 'IGENT_CONSULT' });
        if (isFirstEver) {
            await this._creditTutor(userId, 'FIRST_CONSULT');
        }
    }
    async onHealthRecord(userId, petId, recordType) {
        const typeUpper = recordType.toUpperCase();
        const tutorAction = ['VACCINE'].includes(typeUpper)
            ? 'VACCINE_REGISTERED'
            : ['MEDICATION', 'MEDICINE', 'VERMIFUGE', 'PARASITE'].includes(typeUpper)
                ? 'MED_REGISTERED'
                : 'HEALTH_RECORD';
        const catAction = (CAT_XP[typeUpper] !== undefined)
            ? typeUpper
            : 'HEALTH_RECORD';
        await this.credit({ userId, petId, action: tutorAction, catXpAction: catAction });
    }
    async onCommunityPost(userId, isIgentTip) {
        const action = isIgentTip ? 'COMMUNITY_IGENT_TIP' : 'COMMUNITY_POST';
        await this._creditTutor(userId, action);
    }
    async onProfileComplete(userId) {
        await this._creditTutor(userId, 'PROFILE_COMPLETE');
    }
    async onMemorialRegistered(userId) {
        await this._creditTutor(userId, 'MEMORIAL_REGISTERED');
    }
};
exports.GamificationIntegration = GamificationIntegration;
exports.GamificationIntegration = GamificationIntegration = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService])
], GamificationIntegration);
//# sourceMappingURL=gamification.integration.js.map