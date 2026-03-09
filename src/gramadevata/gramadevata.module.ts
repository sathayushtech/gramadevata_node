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
import { RestaurantModule } from './restaurant/restaurants.module';
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
import { GlobalSearchModule } from './global-search/global-search.module';
import { PoliceStationModule } from './police-station/police-station.module';
import { PujariModule } from './pujari/pujari.module';
import { MediaModule } from './media/media.module';
import { ProfileModule } from './profile/profile.module';

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
    GlobalSearchModule,
    PoliceStationModule,
    PujariModule,
    MediaModule,
    ProfileModule,
  ],
  controllers: [GramadevataController],
})
export class GramadevataModule {}
