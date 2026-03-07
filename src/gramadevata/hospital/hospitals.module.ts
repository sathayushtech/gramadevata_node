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
import { NearbyVeterinaryHospitalController } from './nearby-veterinary-hospital.controller';
import { NearbyVeterinaryHospitalService } from './nearby-veterinary-hospital.service';
import { VeterinaryHospitalMergeController } from './veterinary-hospital-merge.controller';
import { NearbyHospitalController } from './nearby-hospital.controller';
import { NearbyHospitalService } from './nearby-hospital.service';

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
  controllers: [
    AddMoreHospitalController,
    AddMoreVeterinaryHospitalController,
    NearbyVeterinaryHospitalController,
    VeterinaryHospitalMergeController,
    NearbyHospitalController,
  ],
  providers: [
    AddMoreHospitalService,
    AddMoreVeterinaryHospitalService,
    NearbyVeterinaryHospitalService,
    NearbyHospitalService,
  ],
})
export class HospitalsModule {}
