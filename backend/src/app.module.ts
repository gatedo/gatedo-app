import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static'; 
import { PrismaModule } from './prisma/prisma.module';
import { join } from 'path';

// Módulos
import { CloudflareModule } from './cloudflare/cloudflare.module';
import { MediaModule } from './media/media.module';
import { PetsModule } from './pets/pets.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ArticlesModule } from './articles/articles.module';
import { NotificationModule } from './notifications/notification.module';
import { TreatmentModule } from './treatment/treatment.module';
import { SocialModule } from './social/social.module';

// Controllers
import { HealthController } from './health.controller';
import { HealthRecordController } from './controllers/health-record.controller';
import { DiaryController } from './controllers/diary.controller';
import { IgentController } from './igent/igent.controller';
import { KiwifyController } from './kiwify/kiwify.controller';
import { ProductsController } from './controllers/products.controller';


// Services
import { PrismaService } from './prisma/prisma.service';
import { IgentService } from './igent/igent.service';
import { GamificationIntegration } from './notifications/gamification.integration';
import { NotificationService } from './notifications/notification.service';
import { NoticesModule } from './notices/notices.module';
import { GamificationModule } from './gamification/gamification.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
      exclude: ['/api/{*splat}'],
    }),
    PrismaModule,
    CloudflareModule,
    MediaModule,
    PetsModule,
    UsersModule,
    AuthModule,
    ArticlesModule,
    NotificationModule,
    TreatmentModule,
    SocialModule,
    NoticesModule,
    GamificationModule,
  ],
  controllers: [
    HealthController,
    HealthRecordController,
    DiaryController,
    IgentController,
    KiwifyController,
    ProductsController,
  ],
  providers: [
    PrismaService,
    IgentService,
    NotificationService,
    GamificationIntegration,
  ],
})
export class AppModule {}