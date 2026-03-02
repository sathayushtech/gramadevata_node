import { Module } from '@nestjs/common';
import { GramadevataController } from './gramadevata.controller';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { VillagesModule } from './villages/villages.module';
import { AccommodationsModule } from './accommodations/accommodations.module';
import { EventsModule } from './events/events.module';
import { WelfareModule } from './welfare/welfare.module';
import { HospitalsModule } from './hospital/hospitals.module';
import { GoshalasModule } from './goshalas/goshalas.module';
import { HotelModule } from './hotel/hotel.module';
import { PoojaStoreModule } from './pooja-store/pooja-store.module';
import { RestaurantModule } from './restaurant/pooja-store.module';
import { TempleModule } from './temple/temple.module';
import { TourismModule } from './tourism/tourism.module';
import { AmbulanceFacilityModule } from './ambulance/ambulance-facility.module';
import { BlocksModule } from './block/blocks.module';
import { BloodBankModule } from './blood-bank/blood-bank.module';
import { ChatModule } from './chat/chat.module';
import { ConnectModule } from './connect/connect.module';
import { LocationsModule } from './locations/locations.module';
import { AdminModule } from './admin/admin.module';
import { FireStationsModule } from './fire-station/fire-stations.module';

@Module({
  imports: [AuthModule, 
    CommentsModule, 
    EventsModule, 
    VillagesModule, 
    AccommodationsModule, 
    WelfareModule, 
    HospitalsModule,
    GoshalasModule,
    HotelModule,
    PoojaStoreModule,
    RestaurantModule,
    TempleModule,
    TourismModule,
    AmbulanceFacilityModule,
    BlocksModule,
    BloodBankModule,
    ChatModule,
    ConnectModule,
    LocationsModule,
    AdminModule,
    FireStationsModule,
  ],
  controllers: [GramadevataController],
})
export class GramadevataModule {}
