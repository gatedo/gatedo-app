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
exports.TreatmentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let TreatmentService = class TreatmentService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createSchedule(data) {
        const start = new Date(data.startDate);
        const end = data.endDate ? new Date(data.endDate) : null;
        const schedule = await this.prisma.treatmentSchedule.create({
            data: {
                petId: data.petId,
                userId: data.userId,
                title: data.title,
                notes: data.notes || null,
                intervalHours: data.intervalHours,
                startDate: start,
                endDate: end,
                active: true,
            },
        });
        const doses = this._generateDoses(schedule.id, start, end, data.intervalHours);
        if (doses.length > 0) {
            await this.prisma.treatmentDose.createMany({ data: doses });
        }
        return this.prisma.treatmentSchedule.findUnique({
            where: { id: schedule.id },
            include: { doses: { orderBy: { scheduledAt: 'asc' }, take: 10 } },
        });
    }
    _generateDoses(scheduleId, start, end, intervalHours) {
        const doses = [];
        const maxDate = end || new Date(start.getTime() + 30 * 86400000);
        const intervalMs = intervalHours * 3600000;
        let current = new Date(start);
        while (current <= maxDate && doses.length < 200) {
            doses.push({
                scheduleId,
                scheduledAt: new Date(current),
                takenAt: null,
                skipped: false,
            });
            current = new Date(current.getTime() + intervalMs);
        }
        return doses;
    }
    async getByPet(petId) {
        const schedules = await this.prisma.treatmentSchedule.findMany({
            where: { petId, active: true },
            include: {
                doses: {
                    orderBy: { scheduledAt: 'asc' },
                    where: { scheduledAt: { gte: new Date(Date.now() - 86400000) } },
                    take: 20,
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return schedules.map(s => this._enrich(s));
    }
    async takeDose(doseId, notes) {
        const dose = await this.prisma.treatmentDose.update({
            where: { id: doseId },
            data: { takenAt: new Date(), notes: notes || null },
            include: { schedule: { select: { title: true, petId: true, userId: true } } },
        });
        return dose;
    }
    async skipDose(doseId, notes) {
        return this.prisma.treatmentDose.update({
            where: { id: doseId },
            data: { skipped: true, notes: notes || null },
        });
    }
    async getDoseHistory(scheduleId) {
        return this.prisma.treatmentDose.findMany({
            where: { scheduleId },
            orderBy: { scheduledAt: 'desc' },
            take: 50,
        });
    }
    async deactivate(scheduleId) {
        return this.prisma.treatmentSchedule.update({
            where: { id: scheduleId },
            data: { active: false, endDate: new Date() },
        });
    }
    async getPendingDoses() {
        const now = new Date();
        const in15min = new Date(now.getTime() + 15 * 60000);
        return this.prisma.treatmentDose.findMany({
            where: {
                takenAt: null,
                skipped: false,
                scheduledAt: { gte: now, lte: in15min },
                schedule: { active: true },
            },
            include: {
                schedule: {
                    include: {
                        pet: { select: { name: true, photoUrl: true } },
                    },
                },
            },
        });
    }
    _enrich(schedule) {
        const now = new Date();
        const allDoses = schedule.doses || [];
        const nextDose = allDoses.find(d => !d.takenAt && !d.skipped && new Date(d.scheduledAt) >= now);
        const pastDoses = allDoses.filter(d => new Date(d.scheduledAt) < now);
        const takenCount = pastDoses.filter(d => d.takenAt).length;
        const adherencePct = pastDoses.length > 0
            ? Math.round((takenCount / pastDoses.length) * 100)
            : 100;
        const overdueCount = pastDoses.filter(d => !d.takenAt && !d.skipped).length;
        return {
            ...schedule,
            nextDose,
            adherencePct,
            overdueCount,
            takenCount,
            totalDoses: allDoses.length,
        };
    }
};
exports.TreatmentService = TreatmentService;
exports.TreatmentService = TreatmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TreatmentService);
//# sourceMappingURL=treatment.service.js.map