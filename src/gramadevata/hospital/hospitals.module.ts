import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AddMoreHospitalController } from './add-more-hospital.controller';
import { AddMoreHospitalService } from './add-more-hospital.service';
import { AddMoreHospital } from './add-more-hospital.model';
import { NearbyVeterinaryHospital } from './nearby-veterinary-hospital.model';
import { NearbyHospital } from './nearby-hospital.model';
import { Register as User } from '../auth/user.model';
import { AddMoreVeterinaryHospitalController } from './add-more-veterinary-hospital.controller';
import { AddMoreVeterinaryHospitalService } from './add-more-veterinary-hospital.service';
import { AddMoreVeterinaryHospital } from './add-more-veterinary-hospital.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      AddMoreHospital,
      AddMoreVeterinaryHospital,
      NearbyHospital,
      NearbyVeterinaryHospital,
      User
    ]),
  ],
  controllers: [AddMoreHospitalController, AddMoreVeterinaryHospitalController],
  providers: [AddMoreHospitalService, AddMoreVeterinaryHospitalService],
})
export class HospitalsModule {}
