import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static'; 
import { join } from 'path';

// Módulos
import { CloudflareModule } from './cloudflare.module';
import { MediaModule } from './media/media.module';
import { PetsModule } from './pets/pets.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ArticlesModule } from './articles/articles.module';
import { NotificationModule } from './notifications/notification.module';
import { TreatmentModule } from './treatment/treatment.module';

// Controllers
import { HealthController } from './health.controller';
import { HealthRecordController } from './controllers/health-record.controller';
import { DiaryController } from './controllers/diary.controller';
import { IgentController } from './igent/igent.controller';

// Services
import { PrismaService } from './prisma.service';
import { IgentService } from './igent/igent.service';
import { GamificationIntegration } from './notifications/gamification.integration'; // ← ADD
import { NotificationService } from './notifications/notification.service';           // ← ADD

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'), 
      exclude: ['/api/{*splat}'], 
    }),

    CloudflareModule,
    MediaModule,
    PetsModule,
    UsersModule,
    AuthModule,
    ArticlesModule,
    NotificationModule,
    TreatmentModule,
  ],
  controllers: [
    HealthController,
    HealthRecordController,
    DiaryController,
    IgentController,
  ],
  providers: [
    PrismaService,
    IgentService,
    NotificationService,        // ← ADD: necessário para GamificationIntegration
    GamificationIntegration,    // ← ADD: injetável em IgentController e HealthRecordController
  ],
})
export class AppModule {}