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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamificationController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let GamificationController = class GamificationController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMyGamification(req) {
        const userId = req.user?.id || req.user?.sub;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { xp: true, badges: true, level: true },
        });
        if (!user)
            return { xp: 0, badges: [], streak: 0, stats: {} };
        const tutorPoints = await this.prisma.tutorPoints.findUnique({
            where: { userId },
            select: { points: true, totalEarned: true, lastActionAt: true },
        });
        const diaryDates = await this.prisma.diaryEntry.findMany({
            where: { pet: { ownerId: userId } },
            select: { date: true },
            orderBy: { date: 'desc' },
            take: 60,
        });
        const uniqueDays = [...new Set(diaryDates.map(d => d.date.toDateString()))]
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        let streak = 0;
        let expected = new Date();
        expected.setHours(0, 0, 0, 0);
        for (const ds of uniqueDays) {
            const d = new Date(ds);
            const diff = Math.round((expected.getTime() - d.getTime()) / 86400000);
            if (diff <= 1) {
                streak++;
                expected = d;
            }
            else
                break;
        }
        const [consultCount, studioCount, petCount] = await Promise.all([
            this.prisma.igentSession.count({ where: { pet: { ownerId: userId } } }),
            this.prisma.studioCreation.count({ where: { userId } }),
            this.prisma.pet.count({ where: { ownerId: userId } }),
        ]);
        return {
            xp: user.xp,
            level: user.level,
            badges: user.badges,
            streak,
            stats: {
                consultCount,
                studioCount,
                petCount,
                diaryCount: diaryDates.length,
                points: tutorPoints?.points ?? 0,
                totalEarned: tutorPoints?.totalEarned ?? 0,
            },
        };
    }
    async updateGamification(req, body) {
        const userId = req.user?.id || req.user?.sub;
        const updateData = {};
        if (body.xp !== undefined)
            updateData.xp = body.xp;
        if (body.badges !== undefined)
            updateData.badges = body.badges;
        if (body.xp !== undefined) {
            const LEVELS = [
                { rank: 1, min: 0, max: 149 },
                { rank: 2, min: 150, max: 399 },
                { rank: 3, min: 400, max: 799 },
                { rank: 4, min: 800, max: 1499 },
                { rank: 5, min: 1500, max: 2999 },
                { rank: 6, min: 3000, max: 999999 },
            ];
            const level = LEVELS.find(l => body.xp >= l.min && body.xp <= l.max)?.rank ?? 1;
            updateData.level = level;
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { xp: true, level: true, badges: true },
        });
        if (body.xp !== undefined) {
            await this.prisma.tutorPoints.upsert({
                where: { userId },
                update: { points: body.xp, lastActionAt: new Date() },
                create: { userId, points: body.xp, totalEarned: body.xp },
            });
        }
        return updated;
    }
};
exports.GamificationController = GamificationController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GamificationController.prototype, "getMyGamification", null);
__decorate([
    (0, common_1.Patch)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GamificationController.prototype, "updateGamification", null);
exports.GamificationController = GamificationController = __decorate([
    (0, common_1.Controller)('gamification'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GamificationController);
//# sourceMappingURL=gamification.controller.js.map