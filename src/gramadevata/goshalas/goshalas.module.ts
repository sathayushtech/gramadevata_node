import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Goshala } from './goshala.model';
import { NearbyVeterinaryHospital } from '../hospital/nearby-veterinary-hospital.model';
import { AddGoshalaDetails } from './add-ghoshala.model';
import { AddGoshalaDetailsController } from './add-goshala-details.controller';
import { AddGoshalaDetailsService } from './add-goshala-details.service';
import { Register as User } from '../auth/user.model';
import { Comment } from '../comments/comment.model';
import { Village } from '../villages/village.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';
import { Temple } from '../temple/temple.model';
import { Event } from '../events/event.model';
import { GlobalGoshalasController } from './global-goshalas.controller';
import { GlobalGoshalasService } from './global-goshalas.service';
import { GoshalaController } from './goshala.controller';
import { GoshalaService } from './goshala.service';
import { GoshalasExtrasController } from './goshalas-extras.controller';
import { GoshalaCategoryController } from './goshala-category.controller';
import { GoshalaCategoryService } from './goshala-category.service';
import { GoshalaCategory } from './goshala-category.model';
import { GoshalasByLocationController } from './goshalas-by-location.controller';
import { GoshalasByLocationService } from './goshalas-by-location.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Goshala,
      NearbyVeterinaryHospital,
      AddGoshalaDetails,
      User,
      Comment,
      Village,
      Block,
      District,
      State,
      Country,
      Temple,
      Event,
      GoshalaCategory
    ]),
  ],
  controllers: [AddGoshalaDetailsController, GlobalGoshalasController, GoshalaController, 
    GoshalasExtrasController,
    GoshalaCategoryController,
    GoshalasByLocationController,
  ],
  providers: [AddGoshalaDetailsService, GlobalGoshalasService, GoshalaService, GoshalaCategoryService,
    GoshalasByLocationService,
  ],
})
export class GoshalasModule {}
