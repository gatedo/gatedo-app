import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PrismaModule } from './prisma/prisma.module';
import { join } from 'path';

// Módulos
import { CloudflareModule } from './cloudflare/cloudflare.module';
import { MediaModule } from './media/media.module';
import { DocumentsModule } from './documents/documents.module';
import { PetsModule } from './pets/pets.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ArticlesModule } from './articles/articles.module';
import { NotificationModule } from './notifications/notification.module';
import { TreatmentModule } from './treatment/treatment.module';
import { SocialModule } from './social/social.module';
import { NoticesModule } from './notices/notices.module';
import { GamificationModule } from './gamification/gamification.module';
import { StudioModule } from './studio/studio.module';
import { MemorialModule } from './memorial/memorial.module';
import { AdminIntelligenceModule } from './admin-intelligence/admin-intelligence.module';
import { AdminKnowledgeModule } from './admin-knowledge/admin-knowledge.module';
import { EmailModule } from './email/email.module';
import { ContentModule } from './content/content.module';
import { EntitlementsModule } from './entitlements/entitlements.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { OffersModule } from './offers/offers.module';
import { AdminContentModule } from './admin-content/admin-content.module';
import { OngModule } from './ong/ong.module';
import { SettingsModule } from './settings/settings.module';
import { EventsModule } from './events/events.module';
import { PushModule } from './push/push.module';
import { RemindersModule } from './reminders/reminders.module';
import { FeedbackModule } from './feedback/feedback.module';
import { ClubeModule } from './clube/clube.module';

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
import { IgentCreditsService } from './igent/igent-credits.service';
import { GamificationIntegration } from './gamification/gamification.integration';
import { NotificationService } from './notifications/notification.service';
import { ProspectsModule } from './prospects/prospects.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
      exclude: ['/api/{*splat}'],
    }),
    PrismaModule,
    CloudflareModule,
    MediaModule,
    DocumentsModule,
    PetsModule,
    UsersModule,
    AuthModule,
    ArticlesModule,
    NotificationModule,
    TreatmentModule,
    SocialModule,
    NoticesModule,
    GamificationModule,
    StudioModule,
    MemorialModule,
    ProspectsModule,
    AdminIntelligenceModule,
    AdminKnowledgeModule,
    EmailModule,
    ContentModule,
    EntitlementsModule,
    AnalyticsModule,
    OffersModule,
    AdminContentModule,
    OngModule,
    SettingsModule,
    EventsModule,
    PushModule,
    RemindersModule,
    FeedbackModule,
    ClubeModule,
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
    IgentCreditsService,
    NotificationService,
    GamificationIntegration,
  ],
})
export class AppModule {}
