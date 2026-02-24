import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { Block } from '../../common/models/block.model';
import { Country } from '../../common/models/country.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Village } from '../villages/village.model';
import { Register } from '../auth/user.model';
import { WelfareHomesCategory } from './welfare-homes-category.model';
import { WelfareHomesCategoryController } from './welfare-homes-category.controller';
import { WelfareHomesCategoryService } from './welfare-homes-category.service';
import { WelfareHomes } from './welfare-homes.model';
import { WelfareHomesController, WelfareHomesExtraController } from './welfare-homes.controller';
import { WelfareHomesService } from './welfare-homes.service';

@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forFeature([
      WelfareHomesCategory,
      WelfareHomes,
      Village,
      Block,
      District,
      State,
      Country,
      Register,
    ]),
  ],
  controllers: [WelfareHomesCategoryController, WelfareHomesController, WelfareHomesExtraController],
  providers: [WelfareHomesCategoryService, WelfareHomesService],
})
export class WelfareModule {}
