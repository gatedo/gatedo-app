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
        return this.prisma.pet.findMany();
    }
    async findOne(id) {
        return this.prisma.pet.findUnique({ where: { id } });
    }
    async remove(id) {
        return this.prisma.pet.delete({ where: { id } });
    }
    async update(id, files, body) {
        const dataToUpdate = { ...body };
        if (dataToUpdate.isMemorial === 'true')
            dataToUpdate.isMemorial = true;
        if (dataToUpdate.isMemorial === 'false')
            dataToUpdate.isMemorial = false;
        if (dataToUpdate.neutered === 'true')
            dataToUpdate.neutered = true;
        if (dataToUpdate.neutered === 'false')
            dataToUpdate.neutered = false;
        if (dataToUpdate.weight === "" || dataToUpdate.weight === "null") {
            delete dataToUpdate.weight;
        }
        else if (dataToUpdate.weight) {
            dataToUpdate.weight = parseFloat(dataToUpdate.weight);
        }
        if (dataToUpdate.age)
            dataToUpdate.age = parseInt(dataToUpdate.age);
        if (typeof body.personality === 'string') {
            try {
                dataToUpdate.personality = JSON.parse(body.personality);
            }
            catch (e) { }
        }
        if (files?.file?.[0]) {
            dataToUpdate.photoUrl = await this.cloudflare.uploadImage(files.file[0]);
        }
        if (files?.gallery && files.gallery.length > 0) {
            const newPhotos = await Promise.all(files.gallery.map(f => this.cloudflare.uploadImage(f)));
            const currentPet = await this.prisma.pet.findUnique({ where: { id } });
            const currentGallery = currentPet?.gallery || [];
            dataToUpdate.gallery = [...currentGallery, ...newPhotos];
        }
        delete dataToUpdate.file;
        delete dataToUpdate.gallery;
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
        const petData = {
            name: body.name,
            species: body.species || 'Gato',
            breed: body.breed,
            gender: body.gender,
            age: body.age ? parseInt(body.age) : null,
            weight: body.weight ? parseFloat(body.weight) : null,
            neutered: body.neutered === 'true',
            ownerId: body.ownerId,
            photoUrl: photoUrl,
            color: body.color
        };
        if (body.personality) {
            try {
                petData.personality = JSON.parse(body.personality);
            }
            catch (e) { }
        }
        return this.prisma.pet.create({
            data: petData
        });
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