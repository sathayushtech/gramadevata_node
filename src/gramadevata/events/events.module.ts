import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Block } from '../block/block.model';
import { Country } from '../../common/models/country.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Village } from '../villages/village.model';
import { Comment } from '../comments/comment.model';
import { Goshala } from '../goshalas/goshala.model';
import { Event } from './event.model';
import { Register as User } from '../auth/user.model';
import { NearbyHospital } from '../hospital/nearby-hospital.model';
import { Temple } from '../temple/temple.model';
import { TempleNearbyHotel } from './temple-nearby-hotel.model';
import { TempleNearbyRestaurant } from './temple-nearby-restaurant.model';
import { TempleTransport } from './temple-transport.model';
import { TourGuide } from './tour-guide.model';
import { TourOperator } from '../tourism/tour-operator.model';
import { EventCategory } from './event-category.model';
import { EventsByLocationController } from './events-by-location.controller';
import { EventService } from './event.service';
import { AddEventDetailsController } from './add-event-details.controller';
import { AddEventDetailsService } from './add-event-details.service';
import { AddEventDetails } from './add-event-details.model';
import { EventController } from './event.controller';
import { EventCategoryController } from './event-category.controller';
import { EventCategoryService } from './event-category.service';
import { EventMergeController } from './event-merge.controller';
import { EventPostController } from './event-post.controller';
import { EventStatusController } from './event-status.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Event,
      Temple,
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
      AddEventDetails,
      User,
      EventCategory,
    ]),
  ],
  controllers: [EventsByLocationController, AddEventDetailsController, EventController, EventCategoryController,
    EventMergeController,
    EventPostController,
    EventStatusController,
  ],
  providers: [EventService, AddEventDetailsService, EventCategoryService],
})
export class EventsModule {}
