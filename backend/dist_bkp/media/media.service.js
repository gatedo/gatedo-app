"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const crypto_1 = require("crypto");
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE = 8 * 1024 * 1024;
let MediaService = class MediaService {
    constructor() {
        this.s3 = new client_s3_1.S3Client({
            region: 'auto',
            endpoint: process.env.R2_ENDPOINT,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
            },
        });
    }
    async presign(input) {
        const { mimeType, sizeBytes } = input;
        if (!ALLOWED_MIME.has(mimeType)) {
            throw new common_1.BadRequestException('Tipo de arquivo não permitido.');
        }
        if (!sizeBytes || sizeBytes > MAX_SIZE) {
            throw new common_1.BadRequestException('Arquivo muito grande.');
        }
        const mediaId = (0, crypto_1.randomUUID)();
        const ext = mimeType === 'image/jpeg' ? 'jpg' :
            mimeType === 'image/png' ? 'png' : 'webp';
        const storageKey = `uploads/${new Date().toISOString().slice(0, 10)}/${mediaId}.${ext}`;
        const cmd = new client_s3_1.PutObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: storageKey,
            ContentType: mimeType,
        });
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3, cmd, { expiresIn: 60 });
        return {
            mediaId,
            storageKey,
            uploadUrl,
            expiresIn: 60,
        };
    }
    async confirm(mediaId) {
        if (!mediaId)
            throw new common_1.BadRequestException('mediaId obrigatório');
        return { ok: true, mediaId };
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = __decorate([
    (0, common_1.Injectable)()
], MediaService);
//# sourceMappingURL=media.service.js.map