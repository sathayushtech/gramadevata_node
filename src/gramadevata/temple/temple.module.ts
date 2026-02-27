import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Temple } from './temple.model';
import { AddTempleDetails } from './add-temple-details.model';
import { Register as User } from '../auth/user.model';
import { TempleCategory } from './temple-category.model';
import { TempleMainCategory } from './temple-main-category.model';
import { TemplePriority } from './temple-priority.model';
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
    ]),
  ],
  controllers: [AddTempleDetailsController, TempleListController, VisitTempleController],
  providers: [AddTempleDetailsService, TempleListService, VisitTempleService],
})
export class TempleModule {}
