import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET })],
  controllers: [ArticlesController],
  providers: [ArticlesService, PrismaService, JwtAuthGuard],
})
export class ArticlesModule {}
