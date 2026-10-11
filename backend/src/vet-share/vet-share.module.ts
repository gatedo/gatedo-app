import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DocumentsModule } from '../documents/documents.module';
import { PrismaService } from '../prisma/prisma.service';
import { VetShareController } from './vet-share.controller';
import { VetShareService } from './vet-share.service';

@Module({
  imports: [AuthModule, DocumentsModule],
  controllers: [VetShareController],
  providers: [VetShareService, PrismaService],
})
export class VetShareModule {}
