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
import { TempleFestival } from './temple-festival.model';
import { Comment } from '../comments/comment.model';
import { Connect } from '../connect/connect.model';
import { TempleCategoryController } from './temple-category.controller';
import { TempleCategoryService } from './temple-category.service';
import { TempleMainCategoryController } from './temple-main-category.controller';
import { TempleMainCategoryService } from './temple-main-category.service';
import { TemplePriorityController } from './temple-priority.controller';
import { TemplePriorityService } from './temple-priority.service';
import { TempleFacilitiesController } from './temple-facilities.controller';
import { TempleFacilitiesService } from './temple-facilities.service';
import { TempleFestivalController } from './temple-festival.controller';
import { TempleFestivalService } from './temple-festival.service';
import { TempleNearbyHotelsController } from './temple-nearby-hotels.controller';
import { TempleNearbyHotelsService } from './temple-nearby-hotels.service';
import { TempleController } from './temple.controller';
import { TempleService } from './temple.service';
import { TempleTransportController } from './temple-transport.controller';
import { TempleTransportService } from './temple-transport.service';
import { TemplePoojaTimingController } from './temple-pooja-timing.controller';
import { TemplePoojaTimingService } from './temple-pooja-timing.service';
import { TemplePoojaTiming } from './pooja-timing.model';
import { PrayersAndBenefits } from './prayers-and-benefits.model';
import { ConfigModule } from '@nestjs/config';
import { SocialActivityController } from './social-activity.controller';
import { SocialActivityService } from './social-activity.service';
import { PrayersAndBenefitsController } from './prayers-and-benefits.controller';
import { PrayersAndBenefitsService } from './prayers-and-benefits.service';

@Module({
  imports: [
    ConfigModule,
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
      TempleFestival,
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
      Comment,
      Connect,
      TemplePoojaTiming,
      PrayersAndBenefits,
    ]),
  ],
  controllers: [
    AddTempleDetailsController,
    TempleListController,
    VisitTempleController,
    CityTemplesController,
    FavoriteTemplesController,
    GlobalTemplesController,
    TempleCategoryController,
    TempleMainCategoryController,
    TemplePriorityController,
    TempleFacilitiesController,
    TempleFestivalController,
    TempleNearbyHotelsController,
    TempleController,
    TempleTransportController,
    TemplePoojaTimingController,
    SocialActivityController,
    PrayersAndBenefitsController,
  ],
  providers: [
    AddTempleDetailsService,
    TempleListService,
    VisitTempleService,
    CityTemplesService,
    FavoriteTemplesService,
    GlobalTemplesService,
    TempleCategoryService,
    TempleMainCategoryService,
    TemplePriorityService,
    TempleFacilitiesService,
    TempleFestivalService,
    TempleNearbyHotelsService,
    TempleService,
    TempleTransportService,
    TemplePoojaTimingService,
    SocialActivityService,
    PrayersAndBenefitsService,
  ],
})
export class TempleModule {}
