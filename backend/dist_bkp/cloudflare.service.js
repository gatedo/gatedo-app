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
exports.CloudflareService = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
require("multer");
let CloudflareService = class CloudflareService {
    constructor() {
        this.bucketName = process.env.R2_BUCKET_NAME || 'gatedo-assets';
        this.publicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
        this.s3Client = new client_s3_1.S3Client({
            region: 'auto',
            endpoint: process.env.R2_ENDPOINT,
            forcePathStyle: true,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
            },
        });
    }
    async uploadImage(file) {
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${(0, uuid_1.v4)()}.${fileExtension}`;
        try {
            await this.s3Client.send(new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype,
            }));
            const finalUrl = `${this.publicUrl}/${fileName}`;
            console.log("✅ Upload feito! URL:", finalUrl);
            return finalUrl;
        }
        catch (error) {
            console.error('❌ Erro no upload R2:', error);
            throw new Error('Falha ao subir imagem');
        }
    }
};
exports.CloudflareService = CloudflareService;
exports.CloudflareService = CloudflareService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CloudflareService);
//# sourceMappingURL=cloudflare.service.js.map