import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsModule } from '../events/events.module';
// CloudflareService NÃO precisa ser declarado aqui
// O @Global() do CloudflareModule já o injeta automaticamente

@Module({
  imports: [EventsModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    PrismaService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
