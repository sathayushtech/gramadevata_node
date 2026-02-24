import { Module } from '@nestjs/common';
import { GramadevataController } from './gramadevata.controller';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { VillagesModule } from './villages/villages.module';
import { AccommodationsModule } from './accommodations/accommodations.module';
import { EventsModule } from './events/events.module';
import { WelfareModule } from './welfare/welfare.module';

@Module({
  imports: [AuthModule, CommentsModule, EventsModule, VillagesModule, AccommodationsModule, WelfareModule],
  controllers: [GramadevataController],
})
export class GramadevataModule {}
