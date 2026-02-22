import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Block } from '../../common/models/block.model';
import { Country } from '../../common/models/country.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Village } from './village.model';
import { VillagesController } from './villages.controller';
import { VillagesService } from './villages.service';

@Module({
  imports: [SequelizeModule.forFeature([Village, Block, District, State, Country])],
  controllers: [VillagesController],
  providers: [VillagesService],
})
export class VillagesModule {}
