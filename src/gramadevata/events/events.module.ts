import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Block } from '../../common/models/block.model';
import { Country } from '../../common/models/country.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Village } from '../villages/village.model';
import { Comment } from '../comments/comment.model';
import { Goshala } from '../goshalas/goshala.model';
import { Event } from './event.model';
import { NearbyHospital } from './nearby-hospital.model';
import { TempleNearbyHotel } from './temple-nearby-hotel.model';
import { TempleNearbyRestaurant } from './temple-nearby-restaurant.model';
import { TempleTransport } from './temple-transport.model';
import { TourGuide } from './tour-guide.model';
import { TourOperator } from './tour-operator.model';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Event,
      Village,
      Block,
      District,
      State,
      Country,
      Comment,
      Goshala,
      NearbyHospital,
      TempleTransport,
      TempleNearbyHotel,
      TempleNearbyRestaurant,
      TourOperator,
      TourGuide,
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
