import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminKnowledgeController } from './admin-knowledge.controller';
import { AdminKnowledgeService } from './admin-knowledge.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminKnowledgeController],
  providers: [AdminKnowledgeService],
  exports: [AdminKnowledgeService],
})
export class AdminKnowledgeModule {}

