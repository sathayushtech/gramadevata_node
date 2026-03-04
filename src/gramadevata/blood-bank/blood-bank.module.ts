import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { BloodBankController } from './blood-bank.controller';
import { BloodBankService } from './blood-bank.service';
import { AddMoreBloodBankController } from './add-more-blood-bank.controller';
import { AddMoreBloodBankService } from './add-more-blood-bank.service';
import { BloodBank } from './blood-bank.model';
import { AddMoreBloodBank } from './add-more-blood-bank.model';
import { Register } from '../auth/user.model';
import { Village } from '../villages/village.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';

@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forFeature([
      BloodBank,
      AddMoreBloodBank,
      Register,
      Village,
      Block,
      District,
      State,
      Country,
    ]),
  ],
  controllers: [BloodBankController, AddMoreBloodBankController],
  providers: [BloodBankService, AddMoreBloodBankService],
})
export class BloodBankModule {}
