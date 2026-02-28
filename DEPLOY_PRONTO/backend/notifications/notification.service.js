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
exports.NotificationService = exports.POINTS = exports.LEVELS = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
exports.LEVELS = [
    { min: 0, max: 99, label: 'Gateiro Curioso', emoji: '🐾', color: '#9CA3AF' },
    { min: 100, max: 299, label: 'Gateiro Raiz', emoji: '😺', color: '#6158ca' },
    { min: 300, max: 599, label: 'Guardião Felino', emoji: '🛡️', color: '#0EA5E9' },
    { min: 600, max: 999, label: 'Especialista IA', emoji: '🤖', color: '#8B5CF6' },
    { min: 1000, max: 1999, label: 'Embaixador Gatedo', emoji: '👑', color: '#F59E0B' },
    { min: 2000, max: Infinity, label: 'Lenda Felina', emoji: '✨', color: '#EC4899' },
];
exports.POINTS = {
    IGENT_CONSULT: 10,
    VACCINE_REGISTERED: 5,
    MED_REGISTERED: 5,
    HEALTH_RECORD: 3,
    COMMUNITY_POST: 15,
    COMMUNITY_IGENT_TIP: 20,
    COMMUNITY_LIKE_GOT: 2,
    PROFILE_COMPLETE: 25,
    FIRST_CONSULT: 30,
    MEMORIAL_REGISTERED: 15,
};
let NotificationService = class NotificationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getNotifications(userId, limit = 30) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async create(data) {
        return this.prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                message: data.message,
                petId: data.petId || null,
                catName: data.catName || null,
                catBreed: data.catBreed || null,
                catPhotoUrl: data.catPhotoUrl || null,
                cta: data.cta || null,
                metadata: data.metadata || {},
                read: false,
            },
        });
    }
    async markAsRead(id) {
        return this.prisma.notification.update({
            where: { id },
            data: { read: true },
        });
    }
    async markAllAsRead(userId) {
        return this.prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });
    }
    async delete(id) {
        return this.prisma.notification.delete({ where: { id } });
    }
    async generateVaccineReminders() {
        const today = new Date();
        const in7days = new Date(today);
        in7days.setDate(today.getDate() + 7);
        const in30days = new Date(today);
        in30days.setDate(today.getDate() + 30);
        const dueSoon = await this.prisma.healthRecord.findMany({
            where: {
                type: 'VACCINE',
                nextDueDate: { gte: today, lte: in30days },
            },
            include: { pet: true },
        });
        const overdue = await this.prisma.healthRecord.findMany({
            where: {
                type: 'VACCINE',
                nextDueDate: { lt: today },
            },
            include: { pet: true },
        });
        for (const record of dueSoon) {
            const userId = record.pet?.ownerId;
            if (!userId)
                continue;
            const daysLeft = Math.ceil((new Date(record.nextDueDate).getTime() - today.getTime()) / 86400000);
            const existing = await this.prisma.notification.findFirst({
                where: { userId, type: 'VACCINE_DUE', petId: record.petId, read: false },
            });
            if (existing)
                continue;
            await this.create({
                userId,
                type: 'VACCINE_DUE',
                petId: record.petId,
                catName: record.pet.name,
                catBreed: record.pet.breed,
                catPhotoUrl: record.pet.photoUrl,
                message: `Vacina "${record.title}" de ${record.pet.name} vence em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}`,
                cta: 'Ver calendário',
                metadata: { recordId: record.id, daysLeft },
            });
        }
        for (const record of overdue) {
            const userId = record.pet?.ownerId;
            if (!userId)
                continue;
            const existing = await this.prisma.notification.findFirst({
                where: { userId, type: 'VACCINE_OVERDUE', petId: record.petId, read: false },
            });
            if (existing)
                continue;
            await this.create({
                userId,
                type: 'VACCINE_OVERDUE',
                petId: record.petId,
                catName: record.pet.name,
                catBreed: record.pet.breed,
                catPhotoUrl: record.pet.photoUrl,
                message: `⚠️ Vacina "${record.title}" de ${record.pet.name} está VENCIDA`,
                cta: 'Agendar agora',
                metadata: { recordId: record.id },
            });
        }
        return { dueSoon: dueSoon.length, overdue: overdue.length };
    }
    async addPoints(userId, action, context) {
        const points = exports.POINTS[action];
        if (!points)
            return;
        let gamif = await this.prisma.tutorPoints.findUnique({ where: { userId } });
        if (!gamif) {
            gamif = await this.prisma.tutorPoints.create({
                data: { userId, points: 0, totalEarned: 0 },
            });
        }
        const oldPoints = gamif.points;
        const newPoints = oldPoints + points;
        await this.prisma.tutorPoints.update({
            where: { userId },
            data: {
                points: newPoints,
                totalEarned: gamif.totalEarned + points,
                lastActionAt: new Date(),
            },
        });
        const oldLevel = exports.LEVELS.find(l => oldPoints >= l.min && oldPoints <= l.max);
        const newLevel = exports.LEVELS.find(l => newPoints >= l.min && newPoints <= l.max);
        if (oldLevel && newLevel && oldLevel.label !== newLevel.label) {
            await this.create({
                userId,
                type: 'GAMIFICATION',
                message: `${newLevel.emoji} Você subiu para ${newLevel.label}! Continue cuidando bem dos seus gatos.`,
                catName: context?.petName,
                catPhotoUrl: context?.catPhotoUrl,
                cta: 'Ver conquistas',
                metadata: { newLevel: newLevel.label, points: newPoints },
            });
        }
        return { points: newPoints, level: newLevel };
    }
    async getPoints(userId) {
        const gamif = await this.prisma.tutorPoints.findUnique({ where: { userId } });
        const pts = gamif?.points || 0;
        const level = exports.LEVELS.find(l => pts >= l.min && pts <= l.max) || exports.LEVELS[0];
        const levelIdx = exports.LEVELS.findIndex(l => l.label === level.label);
        const nextLevel = levelIdx < exports.LEVELS.length - 1 ? exports.LEVELS[levelIdx + 1] : null;
        const progressPct = nextLevel
            ? Math.round(((pts - level.min) / (nextLevel.min - level.min)) * 100)
            : 100;
        return {
            points: pts,
            totalEarned: gamif?.totalEarned || 0,
            level,
            nextLevel,
            progressPct,
        };
    }
    async sendPredictiveAlert(data) {
        return this.create({
            userId: data.userId,
            type: 'IGENT_PREDICTIVE',
            petId: data.livePetId,
            catName: data.livePetName,
            catBreed: data.livePetBreed,
            message: `🧠 IA Preditiva: ${data.deceasedPetNames.length} ${data.livePetBreed}(s) em seu histórico tiveram ${data.riskCondition}. Monitore ${data.livePetName} de perto.`,
            cta: 'Consultar iGentVet',
            metadata: {
                riskCondition: data.riskCondition,
                deceasedPets: data.deceasedPetNames,
                breed: data.livePetBreed,
            },
        });
    }
    async getStats(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                pets: {
                    include: {
                        healthRecords: true,
                        igentSessions: true,
                    },
                },
                posts: { select: { id: true } },
                studioCreations: { select: { id: true } },
            },
        });
        if (!user)
            return null;
        const allRecords = user.pets.flatMap((p) => p.healthRecords);
        const allSessions = user.pets.flatMap((p) => p.igentSessions);
        const now = new Date();
        const vaccines = allRecords.filter((r) => r.type === 'VACCINE');
        const overdueVaccines = vaccines.filter((r) => r.nextDueDate && new Date(r.nextDueDate) < now).length;
        const controlledMeds = allRecords.filter((r) => ['MEDICATION', 'MEDICINE'].includes(r.type) && r.isControlled).length;
        const nightConsult = allSessions.some((s) => {
            const h = new Date(s.date).getHours();
            return h >= 0 && h < 4;
        });
        const profileComplete = user.pets.some((p) => p.photoUrl && p.breed && p.weight && p.bio);
        const memorialRegistered = user.pets.some((p) => p.deathCause);
        const igentTipsShared = user.posts.filter((p) => p.type === 'IGENT_TIP').length;
        return {
            igentConsults: allSessions.length,
            vaccinesRegistered: vaccines.length,
            overdueVaccines,
            controlledMeds,
            nightConsult,
            profileComplete,
            memorialRegistered,
            totalCats: user.pets.length,
            posts: user.posts.length,
            igentTipsShared,
            studioCreations: user.studioCreations.length,
            healthStreak: 0,
            isFounder: user.plan === 'FOUNDER' || user.badges?.includes('FOUNDER'),
        };
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map