import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Goshala } from './goshala.model';
import { NearbyVeterinaryHospital } from '../hospital/nearby-veterinary-hospital.model';
import { AddGoshalaDetails } from './add-ghoshala.model';
import { AddGoshalaDetailsController } from './add-goshala-details.controller';
import { AddGoshalaDetailsService } from './add-goshala-details.service';
import { Register as User } from '../auth/user.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Goshala,
      NearbyVeterinaryHospital,
      AddGoshalaDetails,
      User,
    ]),
  ],
  controllers: [AddGoshalaDetailsController],
  providers: [AddGoshalaDetailsService],
})
export class GoshalasModule {}
