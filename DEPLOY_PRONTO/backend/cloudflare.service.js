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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudflareService = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
require("multer");
const sharp_1 = __importDefault(require("sharp"));
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
        try {
            const optimizedBuffer = await (0, sharp_1.default)(file.buffer)
                .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();
            const fileName = `${(0, uuid_1.v4)()}.webp`;
            await this.s3Client.send(new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: fileName,
                Body: optimizedBuffer,
                ContentType: 'image/webp',
            }));
            return `${this.publicUrl}/${fileName}`;
        }
        catch (error) {
            console.error('❌ Erro no upload:', error);
            throw new Error('Falha ao processar imagem');
        }
    }
};
exports.CloudflareService = CloudflareService;
exports.CloudflareService = CloudflareService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CloudflareService);
//# sourceMappingURL=cloudflare.service.js.map