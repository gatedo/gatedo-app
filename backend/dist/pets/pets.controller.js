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
exports.PetsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const prisma_service_1 = require("../prisma.service");
const cloudflare_service_1 = require("../cloudflare.service");
require("multer");
let PetsController = class PetsController {
    constructor(prisma, cloudflare) {
        this.prisma = prisma;
        this.cloudflare = cloudflare;
    }
    async findAll() {
        return this.prisma.pet.findMany({
            include: { owner: true }
        });
    }
    async findOne(id) {
        return this.prisma.pet.findUnique({
            where: { id },
            include: { documents: true, healthRecords: true }
        });
    }
    async getSocialProfile(id) {
        const pet = await this.prisma.pet.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true, name: true, photoUrl: true, xp: true, badges: true,
                        studioCreations: { select: { id: true } },
                    },
                },
                healthRecords: {
                    orderBy: { date: 'desc' }, take: 6,
                    select: { id: true, type: true, title: true, date: true, veterinarian: true, clinic: true },
                },
                igentSessions: {
                    orderBy: { date: 'desc' }, take: 3,
                    select: { id: true, symptomLabel: true, date: true, severity: true, resolvedAt: true },
                },
            },
        });
        if (!pet)
            return null;
        const HEALTH_ICON = {
            VACCINE: '💉', VERMIFUGE: '💊', PARASITE: '🛡️', MEDICATION: '💊',
            MEDICINE: '💊', EXAM: '🔬', SURGERY: '🏥', CONSULTATION: '🩺', IACONSULT: '🧠',
        };
        const HEALTH_COLOR = {
            VACCINE: '#10B981', VERMIFUGE: '#F59E0B', PARASITE: '#F97316', MEDICATION: '#60A5FA',
            MEDICINE: '#60A5FA', EXAM: '#8B5CF6', SURGERY: '#0EA5E9', CONSULTATION: '#34D399', IACONSULT: '#6158ca',
        };
        const healthTimeline = [
            ...pet.healthRecords.map(r => ({
                date: r.date, event: r.title, type: r.type.toLowerCase(),
                icon: HEALTH_ICON[r.type] ?? '📋', color: HEALTH_COLOR[r.type] ?? '#9CA3AF',
                detail: [r.veterinarian, r.clinic].filter(Boolean).join(' · '),
            })),
            ...pet.igentSessions.map(s => ({
                date: s.date, event: `iGentVet: ${s.symptomLabel}`, type: 'igent',
                icon: '🧠', color: '#6158ca',
                detail: s.resolvedAt ? 'Resolvido' : 'Em acompanhamento',
            })),
        ]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 8)
            .map(item => ({
            ...item,
            date: new Date(item.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        }));
        return {
            id: pet.id,
            slug: pet.name.toLowerCase().replace(/\s+/g, '-'),
            name: pet.name,
            breed: pet.breed,
            themeColor: pet.themeColor,
            photo: pet.photoUrl,
            gallery: pet.gallery ?? [],
            gender: pet.gender,
            neutered: pet.neutered,
            bio: pet.bio,
            personality: pet.personality ?? [],
            birthDate: pet.birthDate,
            tutor: {
                name: pet.owner.name,
                firstName: pet.owner.name?.split(' ')[0] ?? 'Tutor',
                avatar: pet.owner.photoUrl,
                xp: pet.owner.xp,
                badges: pet.owner.badges,
            },
            stats: {
                followers: 0,
                posts: 0,
                healthDays: pet.healthRecords.length,
                consultCount: pet.igentSessions.length,
                studioCreations: pet.owner.studioCreations.length,
            },
            healthTimeline,
            achievements: pet.owner.badges,
        };
    }
    async remove(id) {
        return this.prisma.pet.delete({ where: { id } });
    }
    async update(id, files, body) {
        const dataToUpdate = { ...body };
        const booleanFields = ['isMemorial', 'neutered', 'isArchived', 'showInHome', 'streetAccess', 'hasAwards', 'isDateEstimated', 'riskAreaAccess'];
        booleanFields.forEach(field => {
            if (dataToUpdate[field] === 'true')
                dataToUpdate[field] = true;
            if (dataToUpdate[field] === 'false')
                dataToUpdate[field] = false;
        });
        if (dataToUpdate.weight)
            dataToUpdate.weight = parseFloat(dataToUpdate.weight);
        if (dataToUpdate.ageYears)
            dataToUpdate.ageYears = parseInt(dataToUpdate.ageYears);
        if (dataToUpdate.ageMonths)
            dataToUpdate.ageMonths = parseInt(dataToUpdate.ageMonths);
        if (typeof body.personality === 'string') {
            try {
                dataToUpdate.personality = JSON.parse(body.personality);
            }
            catch (e) {
                dataToUpdate.personality = [];
            }
        }
        if (typeof body.foodType === 'string') {
            try {
                dataToUpdate.foodType = JSON.parse(body.foodType);
            }
            catch (e) {
                dataToUpdate.foodType = [];
            }
        }
        if (files?.file?.[0]) {
            dataToUpdate.photoUrl = await this.cloudflare.uploadImage(files.file[0]);
        }
        if (files?.pedigree?.[0]) {
            dataToUpdate.pedigreeUrl = await this.cloudflare.uploadImage(files.pedigree[0]);
        }
        if (files?.gallery && files.gallery.length > 0) {
            const newPhotos = await Promise.all(files.gallery.map(f => this.cloudflare.uploadImage(f)));
            const currentPet = await this.prisma.pet.findUnique({ where: { id } });
            const currentGallery = currentPet?.gallery || [];
            dataToUpdate.gallery = [...currentGallery, ...newPhotos];
        }
        delete dataToUpdate.file;
        delete dataToUpdate.pedigree;
        return this.prisma.pet.update({
            where: { id },
            data: dataToUpdate,
        });
    }
    async create(files, body) {
        let photoUrl = null;
        if (files?.file?.[0]) {
            photoUrl = await this.cloudflare.uploadImage(files.file[0]);
        }
        const petData = { ...body, photoUrl };
        const booleanFields = [
            'neutered', 'isDateEstimated', 'streetAccess',
            'riskAreaAccess', 'hasAwards', 'isMemorial', 'isArchived', 'showInHome',
        ];
        booleanFields.forEach(field => {
            if (petData[field] === 'true')
                petData[field] = true;
            if (petData[field] === 'false')
                petData[field] = false;
        });
        petData.weight = (petData.weight && parseFloat(petData.weight) !== 0) ? parseFloat(petData.weight) : null;
        petData.ageYears = petData.ageYears ? parseInt(petData.ageYears) : null;
        petData.ageMonths = petData.ageMonths ? parseInt(petData.ageMonths) : null;
        if (petData.birthDate && petData.birthDate !== '') {
            petData.birthDate = new Date(petData.birthDate + 'T00:00:00.000Z');
        }
        else {
            petData.birthDate = null;
        }
        petData.skillSocial = body.skillSocial || "80";
        petData.skillCuriosity = body.skillCuriosity || "90";
        petData.skillEnergy = body.skillEnergy || "75";
        if (Array.isArray(body.personality)) {
            petData.personality = body.personality;
        }
        else if (typeof body.personality === 'string') {
            try {
                petData.personality = JSON.parse(body.personality);
            }
            catch {
                petData.personality = [];
            }
        }
        else {
            petData.personality = [];
        }
        if (Array.isArray(body.foodType)) {
            petData.foodType = body.foodType;
        }
        else if (typeof body.foodType === 'string') {
            try {
                petData.foodType = JSON.parse(body.foodType);
            }
            catch {
                petData.foodType = [];
            }
        }
        else {
            petData.foodType = [];
        }
        const unknownFields = ['catType', 'avatarPreview', 'avatarFile', 'file'];
        unknownFields.forEach(f => delete petData[f]);
        const optionalStrings = [
            'nicknames', 'microchip', 'neuterIntention', 'healthSummary',
            'foodBrand', 'foodFreq', 'activityLevel', 'socialOtherPets',
            'behaviorIssues', 'traumaHistory', 'habitat', 'housingType',
            'adoptionStory', 'awardsDetail', 'deathCause', 'themeColor',
        ];
        optionalStrings.forEach(f => {
            if (petData[f] === '')
                petData[f] = null;
        });
        return this.prisma.pet.create({ data: petData });
    }
};
exports.PetsController = PetsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PetsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PetsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/social-profile'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PetsController.prototype, "getSocialProfile", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PetsController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'file', maxCount: 1 },
        { name: 'gallery', maxCount: 6 },
        { name: 'pedigree', maxCount: 1 },
    ])),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFiles)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PetsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([{ name: 'file', maxCount: 1 }])),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PetsController.prototype, "create", null);
exports.PetsController = PetsController = __decorate([
    (0, common_1.Controller)('pets'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cloudflare_service_1.CloudflareService])
], PetsController);
//# sourceMappingURL=pets.controller.js.map