import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PushController } from './push.controller';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'CHAVE_SUPER_SECRETA_GATEDO',
    }),
  ],
  controllers: [PushController],
  providers: [PushService, JwtAuthGuard],
  exports: [PushService],
})
export class PushModule {}
