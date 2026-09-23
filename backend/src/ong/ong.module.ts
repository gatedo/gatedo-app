import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OngController } from './ong.controller';
import { OngService } from './ong.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'CHAVE_SUPER_SECRETA_GATEDO',
    }),
  ],
  controllers: [OngController],
  providers: [OngService, JwtAuthGuard],
})
export class OngModule {}
