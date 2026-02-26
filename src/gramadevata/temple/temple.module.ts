import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Temple } from './temple.model';
import { AddTempleDetails } from './add-temple-details.model';
import { Register as User } from '../auth/user.model';
import { AddTempleDetailsController } from './add-temple-details.controller';
import { AddTempleDetailsService } from './add-temple-details.service';
import { VisitTemple } from './visit-temple.model';
import { VisitTempleController } from './visit-temple.controller';
import { VisitTempleService } from './visit-temple.service';
import { Goshala } from '../goshalas/goshala.model';
import { Event } from '../events/event.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Temple,
      AddTempleDetails,
      VisitTemple,
      Event,
      Goshala,
      User,
    ]),
  ],
  controllers: [AddTempleDetailsController, VisitTempleController],
  providers: [AddTempleDetailsService, VisitTempleService],
})
export class TempleModule {}
