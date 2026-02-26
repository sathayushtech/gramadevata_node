import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Block } from '../../common/models/block.model';
import { Country } from '../../common/models/country.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Village } from './village.model';
import { Register as User } from '../auth/user.model';
import { AddVillageDetails } from './add-village-details.model';
import { VillagesController } from './villages.controller';
import { VillagesService } from './villages.service';
import { AddVillageDetailsController } from './add-village-details.controller';
import { AddVillageDetailsService } from './add-village-details.service';
import { Geographic } from './village-geographic.model';
import { VillageGeographicController } from './geographic/village-geographic.controller';
import { VillageGeographicService } from './geographic/village-geographic.service';
import { VillageFamousPersonality } from './village-famous-personality.model';
import { VillageFamousPersonalitiesController } from './famous-personalities/village-famous-personalities.controller';
import { VillageFamousPersonalitiesService } from './famous-personalities/village-famous-personalities.service';
import { VillageDevelopmentFacility } from './village-development-facility.model';
import { VillageDevelopmentFacilitiesController } from './development-facilities/village-development-facilities.controller';
import { VillageDevelopmentFacilitiesService } from './development-facilities/village-development-facilities.service';
import { Connect } from '../connect/connect.model';
import { Temple } from '../temple/temple.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Village,
      Block,
      District,
      State,
      Country,
      AddVillageDetails,
      User,
      Geographic,
      VillageFamousPersonality,
      VillageDevelopmentFacility,
      Connect,
      Temple,
    ]),
  ],
  controllers: [
    VillagesController,
    AddVillageDetailsController,
    VillageGeographicController,
    VillageFamousPersonalitiesController,
    VillageDevelopmentFacilitiesController,
  ],
  providers: [
    VillagesService,
    AddVillageDetailsService,
    VillageGeographicService,
    VillageFamousPersonalitiesService,
    VillageDevelopmentFacilitiesService,
  ],
})
export class VillagesModule {}
