import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Temple } from './temple.model';
import { AddTempleDetails } from './add-temple-details.model';
import { Register as User } from '../auth/user.model';
import { TempleCategory } from './temple-category.model';
import { TempleMainCategory } from './temple-main-category.model';
import { TemplePriority } from './temple-priority.model';
import { TempleFacilities } from './temple-facilities.model';
import { TourGuide } from '../events/tour-guide.model';
import { NearbyHospital } from '../hospital/nearby-hospital.model';
import { TempleNearbyHotel } from '../events/temple-nearby-hotel.model';
import { TempleNearbyRestaurant } from '../events/temple-nearby-restaurant.model';
import { SocialActivity } from './social-activity.model';
import { TempleNearbyTourismPlace } from '../tourism/temple-nearby-tourism.model';
import { TempleTransport } from '../events/temple-transport.model';
import { TourOperator } from '../tourism/tour-operator.model';
import { PoliceStation } from '../police-station/police-station.model';
import { FireStation } from '../fire-station/fire-station.model';
import { AmbulanceFacility } from '../ambulance/ambulance-facility.model';
import { BloodBank } from '../blood-bank/blood-bank.model';
import { WelfareHomes } from '../welfare/welfare-homes.model';
import { Village } from '../villages/village.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';
import { AddTempleDetailsController } from './add-temple-details.controller';
import { AddTempleDetailsService } from './add-temple-details.service';
import { TempleListController } from './temple-list.controller';
import { TempleListService } from './temple-list.service';
import { VisitTemple } from './visit-temple.model';
import { VisitTempleController } from './visit-temple.controller';
import { VisitTempleService } from './visit-temple.service';
import { Goshala } from '../goshalas/goshala.model';
import { Event } from '../events/event.model';
import { CityTemplesController } from './citytemples.controller';
import { CityTemplesService } from './citytemples.service';
import { FavoriteTemplesController } from './favorite-temples.controller';
import { FavoriteTemplesService } from './favorite-temples.service';
import { FavoriteTemple } from './favorite-temple.model';
import { GlobalTemplesController } from './global-temples.controller';
import { GlobalTemplesService } from './global-temples.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Temple,
      AddTempleDetails,
      VisitTemple,
      Event,
      Goshala,
      User,
      TempleCategory,
      TemplePriority,
      Village,
      Block,
      District,
      State,
      Country,
      TempleMainCategory,
      TempleFacilities,
      TourGuide,
      NearbyHospital,
      TempleNearbyHotel,
      TempleNearbyRestaurant,
      SocialActivity,
      TempleNearbyTourismPlace,
      TempleTransport,
      TourOperator,
      PoliceStation,
      FireStation,
      AmbulanceFacility,
      BloodBank,
      WelfareHomes,
      FavoriteTemple,
    ]),
  ],
  controllers: [AddTempleDetailsController, TempleListController, VisitTempleController, CityTemplesController, FavoriteTemplesController,
    GlobalTemplesController
  ],
  providers: [AddTempleDetailsService, TempleListService, VisitTempleService, CityTemplesService, FavoriteTemplesService,
    GlobalTemplesService
  ],
})
export class TempleModule {}
