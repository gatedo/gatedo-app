import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminContentController } from './admin-content.controller';
import { AdminContentService } from './admin-content.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'CHAVE_SUPER_SECRETA_GATEDO',
    }),
  ],
  controllers: [AdminContentController],
  providers: [AdminContentService, JwtAuthGuard],
})
export class AdminContentModule {}
