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

@Module({
  imports: [SequelizeModule.forFeature([Village, Block, District, State, Country, AddVillageDetails, User])],
  controllers: [VillagesController, AddVillageDetailsController],
  providers: [VillagesService, AddVillageDetailsService],
})
export class VillagesModule {}
