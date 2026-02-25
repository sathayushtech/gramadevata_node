import { Module } from '@nestjs/common';
import { GramadevataController } from './gramadevata.controller';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { VillagesModule } from './villages/villages.module';
import { AccommodationsModule } from './accommodations/accommodations.module';
import { EventsModule } from './events/events.module';
import { WelfareModule } from './welfare/welfare.module';
import { AddMoreHospitalsModule } from './hospital/add-more-hospitals.module';
import { GoshalasModule } from './goshalas/goshalas.module';

@Module({
  imports: [AuthModule, 
    CommentsModule, 
    EventsModule, 
    VillagesModule, 
    AccommodationsModule, 
    WelfareModule, 
    AddMoreHospitalsModule,
    GoshalasModule],
  controllers: [GramadevataController],
})
export class GramadevataModule {}
