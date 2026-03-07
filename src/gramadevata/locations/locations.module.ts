import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Country } from '../../common/models/country.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Temple } from '../temple/temple.model';
import { Goshala } from '../goshalas/goshala.model';
import { Event } from '../events/event.model';
import { WelfareHomes } from '../welfare/welfare-homes.model';
import { TempleNearbyTourismPlace } from '../tourism/temple-nearby-tourism.model';
import { NearbyHospital } from '../hospital/nearby-hospital.model';
import { NearbyVeterinaryHospital } from '../hospital/nearby-veterinary-hospital.model';
import { BloodBank } from '../blood-bank/blood-bank.model';
import { TempleNearbyHotel } from '../events/temple-nearby-hotel.model';
import { TempleNearbyRestaurant } from '../events/temple-nearby-restaurant.model';
import { PoojaStore } from '../pooja-store/pooja-store.model';
import { TourOperator } from '../tourism/tour-operator.model';
import { Village } from '../villages/village.model';
import { CountryController } from './country.controller';
import { CountryService } from './country.service';
import { DistrictController } from './district.controller';
import { DistrictService } from './district.service';
import { StateController } from './state.controller';
import { StateService } from './state.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Village,
      Block,
      District,
      State,
      Country,
      BloodBank,
      Event,
      NearbyHospital,
      TempleNearbyHotel,
      TempleNearbyRestaurant,
      TempleNearbyTourismPlace,
      TourOperator,
      Goshala,
      NearbyVeterinaryHospital,
      Temple,
      PoojaStore,
      WelfareHomes,
    ]),
  ],
  controllers: [CountryController, DistrictController, StateController],
  providers: [CountryService, DistrictService, StateService],
})
export class LocationsModule {}
