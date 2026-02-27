import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BloodBankController } from './blood-bank.controller';
import { BloodBankService } from './blood-bank.service';
import { BloodBank } from './blood-bank.model';
import { AddMoreBloodBank } from './add-more-blood-bank.model';
import { Village } from '../villages/village.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      BloodBank,
      AddMoreBloodBank,
      Village,
      Block,
      District,
      State,
      Country,
    ]),
  ],
  controllers: [BloodBankController],
  providers: [BloodBankService],
})
export class BloodBankModule {}
