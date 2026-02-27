import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Accommodation } from './accommodation.model';
import { Register as User } from '../auth/user.model';
import { Event } from '../events/event.model';
import { TempleNearbyTourismPlace } from '../tourism/temple-nearby-tourism.model';
import { Temple } from '../temple/temple.model';
import { Village } from '../villages/village.model';
import { AccommodationsController } from './accommodations.controller';
import { AccommodationsService } from './accommodations.service';

@Module({
  imports: [SequelizeModule.forFeature([Accommodation, User, Event, TempleNearbyTourismPlace, Temple, Village])],
  controllers: [AccommodationsController],
  providers: [AccommodationsService],
})
export class AccommodationsModule {}
